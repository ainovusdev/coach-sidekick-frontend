import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SessionService, SessionUpdateDto } from '@/services/session-service'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'

/**
 * Hook to update an existing session
 *
 * @example
 * const updateSession = useUpdateSession()
 * await updateSession.mutateAsync({
 *   sessionId: '123',
 *   data: { title: 'New Title', summary: 'Session summary...' }
 * })
 */
export function useUpdateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: string
      data: SessionUpdateDto
    }) => SessionService.updateSession(sessionId, data),

    onMutate: async ({ sessionId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.sessions.all })

      // The full-details query key used by useSessionDetails
      const fullDetailsKey = [
        ...queryKeys.sessions.detail(sessionId),
        'full-details',
      ]

      // Snapshot previous value
      const previousDetail = queryClient.getQueryData(fullDetailsKey)

      // Optimistically update the detail cache (must match useSessionDetails query key)
      queryClient.setQueryData(fullDetailsKey, (old: any) => {
        if (!old) return old
        return { ...old, session: { ...old.session, ...data } }
      })

      return { previousDetail, sessionId }
    },

    onError: (err, _variables, context) => {
      // Rollback on error
      if (context?.previousDetail && context?.sessionId) {
        const fullDetailsKey = [
          ...queryKeys.sessions.detail(context.sessionId),
          'full-details',
        ]
        queryClient.setQueryData(fullDetailsKey, context.previousDetail)
      }

      toast.error('Failed to update session', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSuccess: data => {
      toast.success('Session updated', {
        description: data.title || 'Changes saved successfully',
      })
    },

    onSettled: () => {
      // Invalidate all session queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all })
    },
  })
}

/**
 * Hook to delete a session
 *
 * @example
 * const deleteSession = useDeleteSession()
 * await deleteSession.mutateAsync('session-id-123')
 */
export function useDeleteSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => SessionService.deleteSession(sessionId),

    onSuccess: (_data, sessionId) => {
      // Invalidate all session queries
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all })
      // Remove the specific session from cache
      queryClient.removeQueries({
        queryKey: queryKeys.sessions.detail(sessionId),
      })

      toast.success('Session deleted', {
        description: 'The session has been removed',
      })
    },

    onError: err => {
      toast.error('Failed to delete session', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },
  })
}
