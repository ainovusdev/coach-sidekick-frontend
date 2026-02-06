'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  useCreateCommitment,
  useUpdateCommitment,
  useDiscardCommitment,
} from '@/hooks/mutations/use-commitment-mutations'
import { useQueryClient } from '@tanstack/react-query'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { useGoals } from '@/hooks/queries/use-goals'
import { useTargets } from '@/hooks/queries/use-targets'
import { useAuth } from '@/contexts/auth-context'
import { CommitmentService } from '@/services/commitment-service'
import { Commitment } from '@/types/commitment'
import {
  CommitmentPanel,
  PanelCommitment,
  PanelCommitmentGroup,
  groupCommitmentsBySession,
} from './commitment-panel'

interface QuickCommitmentProps {
  sessionId: string
  clientId: string
}

export function QuickCommitment({ sessionId, clientId }: QuickCommitmentProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const createCommitment = useCreateCommitment()
  const updateCommitment = useUpdateCommitment()
  const discardCommitment = useDiscardCommitment()
  const [isExtracting, setIsExtracting] = useState(false)

  // Optimistic draft overrides: confirmed drafts shown as active, rejected drafts hidden
  const [optimisticUpdates, setOptimisticUpdates] = useState<
    Record<string, { title: string; target_date?: string; status: string }>
  >({})
  const [optimisticRemovals, setOptimisticRemovals] = useState<Set<string>>(
    new Set(),
  )

  const handleExtract = async () => {
    setIsExtracting(true)
    try {
      const extracted = await CommitmentService.extractFromSession(sessionId)
      if (extracted.length === 0) toast.info('No commitments found yet')
      else {
        toast.success(`Found ${extracted.length} commitment(s)`)
        // Immediately refetch session commitments so drafts appear
        await queryClient.invalidateQueries({ queryKey: ['commitments'] })
      }
    } catch {
      toast.error('Failed to extract commitments')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleConfirmDraft = useCallback(
    async (
      id: string,
      data: { title: string; target_date?: string; target_ids?: string[] },
    ) => {
      // Optimistically show as active with edited data
      setOptimisticUpdates(prev => ({
        ...prev,
        [id]: {
          title: data.title,
          target_date: data.target_date,
          status: 'active',
        },
      }))
      try {
        await updateCommitment.mutateAsync({
          commitmentId: id,
          data: {
            title: data.title,
            target_date: data.target_date,
            status: 'active',
          },
        })
      } catch {
        // Revert on failure
        setOptimisticUpdates(prev => {
          const next = { ...prev }
          delete next[id]
          return next
        })
        toast.error('Failed to accept commitment')
      }
    },
    [updateCommitment],
  )

  const handleRejectDraft = useCallback(
    async (id: string) => {
      // Optimistically remove
      setOptimisticRemovals(prev => new Set(prev).add(id))
      try {
        await discardCommitment.mutateAsync(id)
      } catch {
        // Revert on failure
        setOptimisticRemovals(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        toast.error('Failed to discard commitment')
      }
    },
    [discardCommitment],
  )

  // Session commitments
  const { data: sessionData, isLoading: loadingSession } = useCommitments(
    {
      session_id: sessionId,
      client_id: clientId,
      include_drafts: true,
    },
    {
      refetchInterval: 30000,
    },
  )

  // Goals and targets for outcome linking
  const { data: goals = [] } = useGoals(clientId)
  const { data: allTargets = [] } = useTargets()
  const clientTargets = (allTargets as any[]).filter((t: any) =>
    (goals as any[]).some((g: any) => t.goal_ids?.includes(g.id)),
  )

  // All active commitments
  const [allActiveCommitments, setAllActiveCommitments] = useState<
    Commitment[]
  >([])
  const [loadingActive, setLoadingActive] = useState(false)

  // Past commitments (grouped)
  const [pastGroups, setPastGroups] = useState<PanelCommitmentGroup[]>([])
  const [loadingPast, setLoadingPast] = useState(false)

  // Fetch all active commitments
  useEffect(() => {
    const fetchActive = async (showLoading = false) => {
      try {
        if (showLoading) setLoadingActive(true)
        const response = await CommitmentService.listCommitments({
          client_id: clientId,
          status: 'active',
        })
        setAllActiveCommitments(response.commitments)
      } catch (error) {
        console.error('Failed to fetch active commitments:', error)
      } finally {
        if (showLoading) setLoadingActive(false)
      }
    }

    if (clientId) {
      fetchActive(true)
      const interval = setInterval(() => fetchActive(false), 30000)
      return () => clearInterval(interval)
    }
  }, [clientId])

  // Fetch past (completed/abandoned) commitments
  useEffect(() => {
    const fetchPast = async () => {
      try {
        setLoadingPast(true)
        const [completedRes, abandonedRes] = await Promise.all([
          CommitmentService.listCommitments({
            client_id: clientId,
            status: 'completed',
          }),
          CommitmentService.listCommitments({
            client_id: clientId,
            status: 'abandoned',
          }),
        ])
        const all = [...completedRes.commitments, ...abandonedRes.commitments]
        setPastGroups(groupCommitmentsBySession(all as PanelCommitment[]))
      } catch (error) {
        console.error('Failed to fetch past commitments:', error)
      } finally {
        setLoadingPast(false)
      }
    }

    if (clientId) fetchPast()
  }, [clientId])

  const sessionCommitments = [...(sessionData?.commitments ?? [])]
    .filter(c => !optimisticRemovals.has(c.id))
    .map(c =>
      optimisticUpdates[c.id] ? { ...c, ...optimisticUpdates[c.id] } : c,
    )
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )

  return (
    <CommitmentPanel
      variant="coach"
      sessionCommitments={sessionCommitments as PanelCommitment[]}
      loadingSession={loadingSession}
      activeCommitments={allActiveCommitments as PanelCommitment[]}
      loadingActive={loadingActive}
      pastGroups={pastGroups}
      loadingPast={loadingPast}
      targets={clientTargets.map((t: any) => ({
        id: t.id,
        title: t.title,
        goal_titles: t.goal_titles || [],
      }))}
      loadingTargets={false}
      onCreateCommitment={data => {
        createCommitment.mutate({
          client_id: clientId,
          session_id: sessionId,
          title: data.title,
          target_date: data.target_date,
          type: 'action',
          priority: 'medium',
          assigned_to_id: data.assigned_to_id,
          target_ids: data.target_ids,
        })
      }}
      isSaving={createCommitment.isPending}
      onToggleComplete={async commitment => {
        const newStatus =
          commitment.status === 'completed' ? 'active' : 'completed'
        await updateCommitment.mutateAsync({
          commitmentId: commitment.id,
          data: { status: newStatus },
        })
      }}
      onEditCommitment={async (id, data) => {
        await updateCommitment.mutateAsync({ commitmentId: id, data })
      }}
      onDeleteCommitment={async id => {
        await discardCommitment.mutateAsync(id)
      }}
      onExtract={handleExtract}
      isExtracting={isExtracting}
      onConfirmDraft={handleConfirmDraft}
      onRejectDraft={handleRejectDraft}
      currentUserId={user?.id}
    />
  )
}
