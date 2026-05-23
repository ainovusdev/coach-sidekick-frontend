import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryKeys } from '@/lib/query-client'
import { deleteAgentThread } from '@/services/agent-service'
import type { AgentThreadListResponse } from '@/types/agent'

/**
 * Delete an admin agent thread.
 * Optimistically removes the row from the sidebar list.
 */
export function useDeleteAgentThread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (threadId: string) => deleteAgentThread(threadId),

    onMutate: async (threadId: string) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.admin.agentThreads.all,
      })
      const previous = queryClient.getQueryData<AgentThreadListResponse>(
        queryKeys.admin.agentThreads.list(),
      )
      if (previous) {
        queryClient.setQueryData<AgentThreadListResponse>(
          queryKeys.admin.agentThreads.list(),
          {
            ...previous,
            threads: previous.threads.filter(t => t.id !== threadId),
          },
        )
      }
      return { previous }
    },

    onError: (error: unknown, _threadId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.admin.agentThreads.list(),
          context.previous,
        )
      }
      const msg =
        error instanceof Error ? error.message : 'Failed to delete thread'
      toast.error(msg)
    },

    onSuccess: (_data, threadId) => {
      // Also drop the cached detail so a stale render can't re-populate the list.
      queryClient.removeQueries({
        queryKey: queryKeys.admin.agentThreads.detail(threadId),
      })
      toast.success('Conversation deleted')
    },
  })
}
