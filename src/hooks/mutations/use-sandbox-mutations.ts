import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import posthog from 'posthog-js'
import { invalidateQueries } from '@/lib/query-client'
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
  SandboxUpdate,
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
