import { useMutation, useQueryClient } from '@tanstack/react-query'
import posthog from 'posthog-js'
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
      posthog.capture('session_updated', {
        session_id: data.id,
      })
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
