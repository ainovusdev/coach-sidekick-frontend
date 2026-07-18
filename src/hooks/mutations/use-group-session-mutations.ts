import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import posthog from 'posthog-js'
import { invalidateQueries } from '@/lib/query-client'
import { GroupSessionService } from '@/services/group-session-service'
import { GroupSessionCreate } from '@/types/group-session'

export function useCreateGroupSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: GroupSessionCreate) =>
      GroupSessionService.createGroupSession(data),
    onSuccess: created => {
      posthog.capture('group_session_created', {
        group_session_id: created?.id,
        participant_count: created?.participant_count ?? null,
        session_type: created?.session_type ?? null,
        has_program: !!created?.program_id,
      })
      toast.success('Group session created')
      invalidateQueries.afterGroupSessionUpdate(queryClient)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create group session')
    },
  })
}
