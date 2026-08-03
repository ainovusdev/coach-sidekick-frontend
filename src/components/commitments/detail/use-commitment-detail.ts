'use client'

/**
 * Shared data + mutation controller for the commitment detail UI.
 *
 * Extracted from commitment-detail-panel.tsx so the slide-over panel and the
 * full page at /commitments/[id] run the exact same logic instead of keeping
 * two copies. Behaviour is deliberately identical to the original panel.
 */

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryKeys } from '@/lib/query-client'
import { CommitmentService } from '@/services/commitment-service'
import { ClientCommitmentService } from '@/services/client-commitment-service'
import { LiveMeetingService } from '@/services/live-meeting-service'
import {
  useUpdateCommitment,
  useDiscardCommitment,
} from '@/hooks/mutations/use-commitment-mutations'
import {
  useClientUpdateCommitment,
  useClientDiscardCommitment,
} from '@/hooks/mutations/use-client-commitment-mutations'
import { useTargets } from '@/hooks/queries/use-targets'
import { useSprints } from '@/hooks/queries/use-sprints'

export interface GuestContext {
  meetingToken: string
  guestToken: string
}

export type CommitmentDetailMode = 'coach' | 'client' | 'guest'

export interface CommitmentCapabilities {
  canAttach: boolean
  canMilestones: boolean
  canActivity: boolean
  canLinkOutcomes: boolean
  /** Only the coach surface has a /commitments/[id] route to open. */
  canOpenInPage: boolean
  canSeeSiblings: boolean
}

export function resolveMode(
  guestContext?: GuestContext,
  clientMode?: boolean,
): CommitmentDetailMode {
  if (guestContext) return 'guest'
  if (clientMode) return 'client'
  return 'coach'
}

export function capabilitiesFor(
  mode: CommitmentDetailMode,
  hasSession: boolean,
): CommitmentCapabilities {
  return {
    // Guest mode has no authenticated API for these three.
    canAttach: mode !== 'guest',
    canMilestones: mode !== 'guest',
    canActivity: mode !== 'guest',
    // Client portal has no TargetService.
    canLinkOutcomes: mode !== 'client',
    canOpenInPage: mode === 'coach',
    canSeeSiblings: mode === 'coach' && hasSession,
  }
}

// Prevents temp/optimistic ids (e.g. "temp-…", "None") reaching the API.
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function useCommitment(
  commitmentId: string | null,
  guestContext?: GuestContext,
  clientMode?: boolean,
) {
  const isValidId = !!commitmentId && UUID_RE.test(commitmentId)
  return useQuery({
    queryKey: queryKeys.commitments.detail(commitmentId || ''),
    queryFn: () => {
      if (guestContext) {
        return LiveMeetingService.getCommitmentDetail(
          guestContext.meetingToken,
          guestContext.guestToken,
          commitmentId!,
        )
      }
      if (clientMode) {
        return ClientCommitmentService.getCommitment(commitmentId!)
      }
      return CommitmentService.getCommitment(commitmentId!)
    },
    enabled: isValidId,
    staleTime: 2 * 60 * 1000,
  })
}

interface UseCommitmentDetailArgs {
  commitmentId: string | null
  clientId?: string
  guestContext?: GuestContext
  clientMode?: boolean
  onCommitmentUpdate?: () => void
  /** Called after a successful delete — panel closes, page navigates away. */
  onDeleted?: () => void
}

export function useCommitmentDetail({
  commitmentId,
  clientId: clientIdProp,
  guestContext,
  clientMode,
  onCommitmentUpdate,
  onDeleted,
}: UseCommitmentDetailArgs) {
  const {
    data: commitment,
    isLoading,
    error,
  } = useCommitment(commitmentId, guestContext, clientMode)
  const resolvedClientId = clientIdProp || commitment?.client_id

  // Prefetch targets & sprints using the known clientId so they're cached
  // before the linked-outcomes section mounts. In guest mode fetching is
  // disabled — the cache is pre-seeded by ClientCommitmentPanel, and an
  // authenticated call here would 403.
  //
  // NOTE: the filter object shape must stay EXACTLY `{ client_id }`. Guest
  // pre-seeding writes that query key; a different shape is a different key
  // and guests start 403ing.
  const targetFilters = resolvedClientId
    ? { client_id: resolvedClientId }
    : undefined
  const guestQueryOpts = guestContext
    ? { enabled: false, staleTime: Infinity }
    : {}
  useTargets(targetFilters, guestQueryOpts)
  useSprints(
    resolvedClientId ? { client_id: resolvedClientId } : undefined,
    guestQueryOpts,
  )

  // Both variants are called unconditionally and then picked between —
  // never make these conditional, it would break hook order.
  const coachUpdateCommitment = useUpdateCommitment({ silent: true })
  const clientUpdateCommitment = useClientUpdateCommitment({ silent: true })
  const updateCommitment = clientMode
    ? clientUpdateCommitment
    : coachUpdateCommitment
  const coachDiscardCommitment = useDiscardCommitment()
  const clientDiscardCommitment = useClientDiscardCommitment()
  const discardCommitment = clientMode
    ? clientDiscardCommitment
    : coachDiscardCommitment

  const queryClient = useQueryClient()

  const handleFieldUpdate = useCallback(
    (field: string, value: any) => {
      if (!commitmentId) return

      const key = queryKeys.commitments.detail(commitmentId)
      // Snapshot before the optimistic write so a failure can roll back.
      const previous = queryClient.getQueryData(key)
      const rollback = () => {
        queryClient.setQueryData(key, previous)
        toast.error('Failed to update commitment')
      }

      queryClient.setQueryData(key, (old: any) => {
        if (!old) return old
        return { ...old, [field]: value }
      })

      if (guestContext) {
        LiveMeetingService.updateCommitment(
          guestContext.meetingToken,
          guestContext.guestToken,
          commitmentId,
          { [field]: value },
        )
          .then(() => onCommitmentUpdate?.())
          .catch(rollback)
      } else {
        updateCommitment.mutate(
          { commitmentId, data: { [field]: value } },
          {
            onSuccess: () => onCommitmentUpdate?.(),
            onError: rollback,
          },
        )
      }
    },
    [
      commitmentId,
      updateCommitment,
      queryClient,
      onCommitmentUpdate,
      guestContext,
    ],
  )

  const handleDelete = useCallback(() => {
    if (!commitmentId) return
    if (guestContext) {
      LiveMeetingService.deleteCommitment(
        guestContext.meetingToken,
        guestContext.guestToken,
        commitmentId,
      )
        .then(() => {
          onDeleted?.()
          onCommitmentUpdate?.()
        })
        .catch(() => toast.error('Failed to delete commitment'))
    } else {
      discardCommitment.mutate(commitmentId, {
        onSuccess: () => {
          onDeleted?.()
          onCommitmentUpdate?.()
        },
      })
    }
  }, [
    commitmentId,
    guestContext,
    discardCommitment,
    onDeleted,
    onCommitmentUpdate,
  ])

  const mode = resolveMode(guestContext, clientMode)

  return {
    commitment,
    isLoading,
    error,
    mode,
    capabilities: capabilitiesFor(mode, !!commitment?.session_id),
    handleFieldUpdate,
    handleDelete,
  }
}
