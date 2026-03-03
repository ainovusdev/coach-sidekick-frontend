import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { invalidateQueries } from '@/lib/query-client'
import { GroupSessionService } from '@/services/group-session-service'
import { GroupSessionCreate, GroupSessionUpdate } from '@/types/group-session'

export function useCreateGroupSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: GroupSessionCreate) =>
      GroupSessionService.createGroupSession(data),
    onSuccess: () => {
      toast.success('Group session created')
      invalidateQueries.afterGroupSessionUpdate(queryClient)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create group session')
    },
  })
}

export function useUpdateGroupSession(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: GroupSessionUpdate) =>
      GroupSessionService.updateGroupSession(sessionId, data),
    onSuccess: () => {
      toast.success('Group session updated')
      invalidateQueries.afterGroupSessionUpdate(queryClient, sessionId)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update group session')
    },
  })
}

export function useEndGroupSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) =>
      GroupSessionService.endGroupSession(sessionId),
    onSuccess: (_, sessionId) => {
      toast.success('Group session ended')
      invalidateQueries.afterGroupSessionUpdate(queryClient, sessionId)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to end group session')
    },
  })
}

export function useDeleteGroupSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) =>
      GroupSessionService.deleteGroupSession(sessionId),
    onSuccess: () => {
      toast.success('Group session deleted')
      invalidateQueries.afterGroupSessionUpdate(queryClient)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete group session')
    },
  })
}

export function useAddParticipant(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (clientId: string) =>
      GroupSessionService.addParticipant(sessionId, clientId),
    onSuccess: () => {
      toast.success('Participant added')
      invalidateQueries.afterGroupSessionUpdate(queryClient, sessionId)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add participant')
    },
  })
}

export function useRemoveParticipant(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (clientId: string) =>
      GroupSessionService.removeParticipant(sessionId, clientId),
    onSuccess: () => {
      toast.success('Participant removed')
      invalidateQueries.afterGroupSessionUpdate(queryClient, sessionId)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove participant')
    },
  })
}

export function useGenerateTokens(sessionId: string) {
  return useMutation({
    mutationFn: () => GroupSessionService.generateTokens(sessionId),
    onSuccess: () => {
      toast.success('Meeting tokens generated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate tokens')
    },
  })
}
