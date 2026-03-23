'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  LiveMeetingService,
  ClientCommitment,
  LiveMeetingTarget,
  LiveMeetingSprint,
  PastCommitmentGroup as ServicePastGroup,
} from '@/services/live-meeting-service'
import {
  CommitmentPanel,
  PanelCommitment,
  PanelCommitmentGroup,
} from '@/components/commitments/commitment-panel'
import { CommitmentDetailPanel } from '@/components/commitments/commitment-detail-panel'
import { queryKeys } from '@/lib/query-client'

interface ClientCommitmentPanelProps {
  meetingToken: string
  guestToken: string | null
  clientId?: string
  refreshKey?: number
}

export function ClientCommitmentPanel({
  meetingToken,
  guestToken,
  clientId: clientIdProp,
  refreshKey,
}: ClientCommitmentPanelProps) {
  const queryClient = useQueryClient()
  const [commitments, setCommitments] = useState<ClientCommitment[]>([])
  const [pastGroups, setPastGroups] = useState<PanelCommitmentGroup[]>([])
  const [targets, setTargets] = useState<LiveMeetingTarget[]>([])
  const [sprints, setSprints] = useState<LiveMeetingSprint[]>([])
  const [clientIdFromCommitments, setClientIdFromCommitments] = useState<
    string | null
  >(null)
  const clientId = clientIdProp || clientIdFromCommitments
  const [isLoading, setIsLoading] = useState(false)
  const [loadingPast, setLoadingPast] = useState(false)
  const [loadingTargets, setLoadingTargets] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [detailCommitmentId, setDetailCommitmentId] = useState<string | null>(
    null,
  )

  const handleOpenFull = useCallback((commitment: PanelCommitment) => {
    if (!commitment.id) return
    setDetailCommitmentId(commitment.id)
  }, [])

  const handleExtract = async () => {
    if (!guestToken) return
    setIsExtracting(true)
    try {
      const extracted = await LiveMeetingService.extractCommitments(
        meetingToken,
        guestToken,
      )
      if (extracted.length === 0) toast.info('No commitments found yet')
      else {
        setCommitments(prev => [...extracted, ...prev])
        toast.success(`Found ${extracted.length} commitment(s)`)
      }
    } catch {
      toast.error('Failed to extract commitments')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleConfirmDraft = async (
    id: string,
    data: { title: string; target_date?: string; target_ids?: string[] },
  ) => {
    if (!guestToken) return
    // Optimistically update to active with edited data
    const prev = commitments
    setCommitments(cs =>
      cs.map(c =>
        c.id === id
          ? {
              ...c,
              title: data.title,
              target_date: data.target_date ?? c.target_date,
              status: 'active',
            }
          : c,
      ),
    )
    try {
      const updated = await LiveMeetingService.updateCommitment(
        meetingToken,
        guestToken,
        id,
        {
          title: data.title,
          target_date: data.target_date,
          target_ids: data.target_ids,
          status: 'active',
        },
      )
      setCommitments(cs => cs.map(c => (c.id === id ? updated : c)))
    } catch {
      setCommitments(prev)
      toast.error('Failed to accept commitment')
    }
  }

  const handleRejectDraft = async (id: string) => {
    if (!guestToken) return
    // Optimistically remove
    const prev = commitments
    setCommitments(cs => cs.filter(c => c.id !== id))
    try {
      await LiveMeetingService.deleteCommitment(meetingToken, guestToken, id)
    } catch {
      setCommitments(prev)
      toast.error('Failed to discard commitment')
    }
  }

  // Fetch session commitments with polling
  useEffect(() => {
    if (!guestToken) return

    const fetchCommitments = async (showLoading = false) => {
      if (showLoading) setIsLoading(true)
      try {
        const data = await LiveMeetingService.getCommitments(
          meetingToken,
          guestToken,
        )
        setCommitments(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Failed to fetch commitments:', err)
      } finally {
        if (showLoading) setIsLoading(false)
      }
    }

    fetchCommitments(true)
    const interval = setInterval(() => fetchCommitments(false), 30000)
    return () => clearInterval(interval)
  }, [meetingToken, guestToken, refreshKey])

  // Fetch past commitments
  useEffect(() => {
    if (!guestToken) return

    const fetchPast = async () => {
      setLoadingPast(true)
      try {
        const data = await LiveMeetingService.getPastCommitments(
          meetingToken,
          guestToken,
        )
        const groups: PanelCommitmentGroup[] = (
          Array.isArray(data) ? data : []
        ).map((g: ServicePastGroup) => ({
          date: g.session_date,
          commitments: (g.commitments || []).map(c => ({
            ...c,
            priority: c.priority || 'medium',
            progress_percentage: c.progress_percentage || 0,
          })) as PanelCommitment[],
        }))
        setPastGroups(groups)
      } catch (err) {
        console.error('Failed to fetch past commitments:', err)
      } finally {
        setLoadingPast(false)
      }
    }

    fetchPast()
  }, [meetingToken, guestToken, refreshKey])

  // Extract clientId from commitments as fallback for cache seeding
  useEffect(() => {
    if (clientIdProp) return // Already have it from props
    const firstWithClient = commitments.find(c => c.client_id)
    if (firstWithClient?.client_id) {
      setClientIdFromCommitments(firstWithClient.client_id)
    }
  }, [commitments, clientIdProp])

  // Fetch targets and sprints on mount, and seed TanStack Query cache
  useEffect(() => {
    if (!guestToken) return

    const fetchTargets = async () => {
      setLoadingTargets(true)
      try {
        const [targetData, sprintData] = await Promise.all([
          LiveMeetingService.getTargets(meetingToken, guestToken),
          LiveMeetingService.getSprints(meetingToken, guestToken).catch(
            () => [],
          ),
        ])
        setTargets(targetData)
        setSprints(sprintData)

        // Pre-seed TanStack Query cache so CommitmentDetailPanel's
        // useTargets/useSprints hooks find cached data instead of making 403 calls
        if (clientId) {
          queryClient.setQueryData(
            queryKeys.targets.list({ client_id: clientId }),
            targetData.map(t => ({
              id: t.id,
              title: t.title,
              description: t.description,
              status: t.status,
            })),
          )
          queryClient.setQueryData(
            queryKeys.sprints.list({ client_id: clientId }),
            sprintData.map(s => ({
              id: s.id,
              title: s.title,
              status: s.status,
              start_date: s.start_date,
              end_date: s.end_date,
              target_ids: s.target_ids,
            })),
          )
        }
      } catch (err) {
        console.error('Failed to fetch targets:', err)
      } finally {
        setLoadingTargets(false)
      }
    }

    fetchTargets()
  }, [meetingToken, guestToken, clientId, queryClient])

  return (
    <>
      <CommitmentPanel
        variant="client"
        sessionCommitments={commitments as PanelCommitment[]}
        loadingSession={isLoading}
        pastGroups={pastGroups}
        loadingPast={loadingPast}
        targets={targets.map(t => ({
          id: t.id,
          title: t.title,
          goal_titles: t.goal_titles,
        }))}
        loadingTargets={loadingTargets}
        sprints={sprints.map(s => ({
          id: s.id,
          title: s.title,
          status: s.status,
          target_ids: s.target_ids,
        }))}
        onCreateCommitment={async data => {
          if (!guestToken) return
          setIsSaving(true)
          try {
            const commitment = await LiveMeetingService.createCommitment(
              meetingToken,
              guestToken,
              {
                title: data.title,
                target_date: data.target_date,
                priority: 'medium',
                type: 'commitment',
                target_ids: data.target_ids,
              },
            )
            setCommitments(prev => [commitment, ...prev])
            toast.success('Commitment added')
          } catch (err) {
            toast.error('Failed to create commitment')
            console.error('Failed to create commitment:', err)
            throw err
          } finally {
            setIsSaving(false)
          }
        }}
        isSaving={isSaving}
        onExtract={handleExtract}
        isExtracting={isExtracting}
        onConfirmDraft={handleConfirmDraft}
        onRejectDraft={handleRejectDraft}
        onToggleComplete={async commitment => {
          if (!guestToken) return
          const newStatus =
            commitment.status === 'completed' ? 'active' : 'completed'
          const newProgress = newStatus === 'completed' ? 100 : 0
          try {
            const updated = await LiveMeetingService.updateCommitment(
              meetingToken,
              guestToken,
              commitment.id,
              { status: newStatus, progress_percentage: newProgress },
            )
            setCommitments(prev =>
              prev.map(c => (c.id === commitment.id ? updated : c)),
            )
          } catch (err) {
            toast.error('Failed to update commitment')
            console.error('Failed to update commitment:', err)
          }
        }}
        onEditCommitment={async (id, data) => {
          if (!guestToken) return
          try {
            const updated = await LiveMeetingService.updateCommitment(
              meetingToken,
              guestToken,
              id,
              data,
            )
            setCommitments(prev => prev.map(c => (c.id === id ? updated : c)))
          } catch (err) {
            toast.error('Failed to update commitment')
            console.error('Failed to update commitment:', err)
          }
        }}
        onDeleteCommitment={async id => {
          if (!guestToken) return
          try {
            await LiveMeetingService.deleteCommitment(
              meetingToken,
              guestToken,
              id,
            )
            setCommitments(prev => prev.filter(c => c.id !== id))
            toast.success('Commitment deleted')
          } catch (err) {
            toast.error('Failed to delete commitment')
            console.error('Failed to delete commitment:', err)
          }
        }}
        onOpenFull={handleOpenFull}
      />

      <CommitmentDetailPanel
        commitmentId={detailCommitmentId}
        clientId={clientId || undefined}
        onClose={() => setDetailCommitmentId(null)}
        onCommitmentUpdate={() => {
          // Refresh commitments list when detail panel makes changes
          if (guestToken) {
            LiveMeetingService.getCommitments(meetingToken, guestToken)
              .then(data => setCommitments(Array.isArray(data) ? data : []))
              .catch(() => {})
          }
        }}
        guestContext={guestToken ? { meetingToken, guestToken } : undefined}
      />
    </>
  )
}
