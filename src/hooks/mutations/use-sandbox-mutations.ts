import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import posthog from 'posthog-js'
import { invalidateQueries, queryKeys } from '@/lib/query-client'
import { SandboxService } from '@/services/sandbox-service'
import type {
  InvitationSendRequest,
  SandboxCreate,
  SandboxErrorDetail,
  SandboxGroupCreate,
  SandboxGroupMemberCreate,
  SandboxGroupUpdate,
  SandboxMemberCreate,
  SandboxMemberUpdate,
  SandboxOverview,
  SandboxUpdate,
  TimelineEventCreate,
  TimelineEventUpdate,
} from '@/types/sandbox'

type ApiErr = Error & { status?: number; detail?: Record<string, any> }

/** The structured `{ code, message, ... }` a sandbox 409 carries, if any. */
export function sandboxErrorDetail(error: unknown): SandboxErrorDetail | null {
  const e = error as ApiErr
  if (e && e.detail && typeof e.detail === 'object' && 'code' in e.detail) {
    return e.detail as SandboxErrorDetail
  }
  return null
}

function errorMessage(error: unknown, fallback: string): string {
  const e = error as ApiErr
  return (e && e.message) || fallback
}

export function useCreateSandbox() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SandboxCreate) => SandboxService.create(data),
    onSuccess: created => {
      posthog.capture('sandbox_created', {
        sandbox_id: created.sandbox.id,
        term_months: created.sandbox.term_months,
      })
      toast.success('Sandbox created')
      invalidateQueries.afterSandboxUpdate(queryClient)
    },
    onError: error =>
      toast.error(errorMessage(error, 'Could not create the sandbox')),
  })
}

export function useUpdateSandbox(sandboxId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SandboxUpdate) => SandboxService.update(sandboxId, data),
    onSuccess: () =>
      invalidateQueries.afterSandboxUpdate(queryClient, sandboxId),
    onError: error =>
      toast.error(errorMessage(error, 'Could not save the sandbox')),
  })
}

// ------------------------------------------------------------------ timeline

/** Every timeline mutation returns the fresh overview; put it straight in the cache. */
function useTimelineMutation<TVars>(
  sandboxId: string,
  mutationFn: (vars: TVars) => Promise<SandboxOverview>,
  successMessage: string | ((vars: TVars, overview: SandboxOverview) => string),
  fallbackError: string,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (overview, vars) => {
      queryClient.setQueryData(
        queryKeys.sandboxes.overview(sandboxId),
        overview,
      )
      invalidateQueries.afterSandboxUpdate(queryClient, sandboxId)
      const message =
        typeof successMessage === 'function'
          ? successMessage(vars, overview)
          : successMessage
      if (message) toast.success(message)
    },
    onError: error => {
      const detail = sandboxErrorDetail(error)
      toast.error(detail?.message || errorMessage(error, fallbackError))
    },
  })
}

export function useMoveEvent(sandboxId: string) {
  return useTimelineMutation(
    sandboxId,
    ({ eventId, data }: { eventId: string; data: TimelineEventUpdate }) =>
      SandboxService.moveEvent(sandboxId, eventId, data),
    ({ data }) =>
      data.shift_following
        ? 'Window moved, later check-ins shifted'
        : 'Window moved',
    'Could not move that window',
  )
}

export function useAddEvent(sandboxId: string) {
  return useTimelineMutation(
    sandboxId,
    (data: TimelineEventCreate) => SandboxService.addEvent(sandboxId, data),
    'Event added',
    'Could not add the event',
  )
}

export function useRemoveEvent(sandboxId: string) {
  return useTimelineMutation(
    sandboxId,
    ({ eventId, reason }: { eventId: string; reason: string }) =>
      SandboxService.removeEvent(sandboxId, eventId, reason),
    'Event removed. It stays on record and can be restored.',
    'Could not remove the event',
  )
}

export function useRestoreEvent(sandboxId: string) {
  return useTimelineMutation(
    sandboxId,
    (eventId: string) => SandboxService.restoreEvent(sandboxId, eventId),
    'Event restored',
    'Could not restore the event',
  )
}

export function useRegenerateTimeline(sandboxId: string) {
  return useTimelineMutation(
    sandboxId,
    (overwrite: boolean) =>
      SandboxService.regenerateTimeline(sandboxId, overwrite),
    'Timeline regenerated',
    'Could not regenerate the timeline',
  )
}

export function useAddMember(sandboxId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SandboxMemberCreate) =>
      SandboxService.addMember(sandboxId, data),
    onSuccess: member => {
      posthog.capture('sandbox_member_added', {
        sandbox_id: sandboxId,
        side: member.side,
      })
      invalidateQueries.afterSandboxUpdate(queryClient, sandboxId)
    },
    // 409 already_member is presented inline by the dialog; everything else toasts.
    onError: error => {
      if (!sandboxErrorDetail(error))
        toast.error(errorMessage(error, 'Could not add that person'))
    },
  })
}

export function useUpdateMember(sandboxId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      memberId,
      data,
    }: {
      memberId: string
      data: SandboxMemberUpdate
    }) => SandboxService.updateMember(sandboxId, memberId, data),
    onSuccess: () =>
      invalidateQueries.afterSandboxUpdate(queryClient, sandboxId),
    onError: error => {
      const detail = sandboxErrorDetail(error)
      toast.error(
        detail?.message || errorMessage(error, 'Could not update roles'),
      )
    },
  })
}

export function useRemoveMember(sandboxId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId, force }: { memberId: string; force?: boolean }) =>
      SandboxService.removeMember(sandboxId, memberId, force),
    onSuccess: () => {
      toast.success('Removed from the sandbox')
      invalidateQueries.afterSandboxUpdate(queryClient, sandboxId)
    },
    onError: error => {
      const detail = sandboxErrorDetail(error)
      // member_in_groups is a decision the dialog presents; last AE is a hard stop.
      if (detail?.code === 'member_in_groups') return
      toast.error(
        detail?.message || errorMessage(error, 'Could not remove that person'),
      )
    },
  })
}

export function useCreateGroup(sandboxId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SandboxGroupCreate) =>
      SandboxService.createGroup(sandboxId, data),
    onSuccess: group => {
      posthog.capture('sandbox_group_created', {
        sandbox_id: sandboxId,
        is_complete: group.is_complete,
        coach_count: group.coaches.length,
        coachee_count: group.coachees.length,
      })
      toast.success(
        group.is_complete ? 'Group created' : 'Group saved as incomplete',
      )
      invalidateQueries.afterSandboxUpdate(queryClient, sandboxId)
    },
    onError: error =>
      toast.error(errorMessage(error, 'Could not create the group')),
  })
}

export function useUpdateGroup(sandboxId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      groupId,
      data,
    }: {
      groupId: string
      data: SandboxGroupUpdate
    }) => SandboxService.updateGroup(sandboxId, groupId, data),
    onSuccess: group => {
      toast.success(
        group.is_complete ? 'Group saved' : 'Group saved as incomplete',
      )
      invalidateQueries.afterSandboxUpdate(queryClient, sandboxId)
    },
    onError: error =>
      toast.error(errorMessage(error, 'Could not save the group')),
  })
}

export function useDeleteGroup(sandboxId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (groupId: string) =>
      SandboxService.deleteGroup(sandboxId, groupId),
    onSuccess: () => {
      toast.success('Group removed')
      invalidateQueries.afterSandboxUpdate(queryClient, sandboxId)
    },
    onError: error =>
      toast.error(errorMessage(error, 'Could not remove the group')),
  })
}

export function useAddGroupMember(sandboxId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      groupId,
      data,
    }: {
      groupId: string
      data: SandboxGroupMemberCreate
    }) => SandboxService.addGroupMember(sandboxId, groupId, data),
    onSuccess: () =>
      invalidateQueries.afterSandboxUpdate(queryClient, sandboxId),
    onError: error => {
      const detail = sandboxErrorDetail(error)
      toast.error(
        detail?.message || errorMessage(error, 'Could not add to the group'),
      )
    },
  })
}

export function useRemoveGroupMember(sandboxId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      groupId,
      groupMemberId,
    }: {
      groupId: string
      groupMemberId: string
    }) => SandboxService.removeGroupMember(sandboxId, groupId, groupMemberId),
    onSuccess: () =>
      invalidateQueries.afterSandboxUpdate(queryClient, sandboxId),
    onError: error =>
      toast.error(errorMessage(error, 'Could not remove from the group')),
  })
}

export function useSendInvitations(sandboxId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: InvitationSendRequest) =>
      SandboxService.sendInvitations(sandboxId, data),
    onSuccess: sent => {
      posthog.capture('sandbox_invitations_sent', {
        sandbox_id: sandboxId,
        count: sent.length,
      })
      toast.success(
        sent.length === 0
          ? 'Everyone already has a live invitation'
          : sent.length === 1
            ? 'Invitation sent'
            : `${sent.length} invitations sent`,
      )
      invalidateQueries.afterSandboxUpdate(queryClient, sandboxId)
    },
    onError: error =>
      toast.error(errorMessage(error, 'Could not send invitations')),
  })
}

export function useResendInvitation(sandboxId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (invitationId: string) =>
      SandboxService.resendInvitation(sandboxId, invitationId),
    onSuccess: () => {
      toast.success('Invitation resent with a fresh link')
      invalidateQueries.afterSandboxUpdate(queryClient, sandboxId)
    },
    onError: error =>
      toast.error(errorMessage(error, 'Could not resend the invitation')),
  })
}

export function useRevokeInvitation(sandboxId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (invitationId: string) =>
      SandboxService.revokeInvitation(sandboxId, invitationId),
    onSuccess: () => {
      toast.success('Invitation revoked')
      invalidateQueries.afterSandboxUpdate(queryClient, sandboxId)
    },
    onError: error =>
      toast.error(errorMessage(error, 'Could not revoke the invitation')),
  })
}
