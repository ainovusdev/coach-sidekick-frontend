import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { deleteAgentThread, type AgentApiScope } from '@/services/agent-service'
import { agentThreadKeys } from '@/hooks/queries/use-agent-threads'
import type { AgentThreadListResponse } from '@/types/agent'

/**
 * Delete an agent thread on the given mount.
 * Optimistically removes the row from the (scope-keyed) sidebar list.
 */
export function useDeleteAgentThread(scope: AgentApiScope = 'admin') {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (threadId: string) => deleteAgentThread(threadId, scope),

    onMutate: async (threadId: string) => {
      await queryClient.cancelQueries({ queryKey: agentThreadKeys.all(scope) })
      const previous = queryClient.getQueryData<AgentThreadListResponse>(
        agentThreadKeys.list(scope),
      )
      if (previous) {
        queryClient.setQueryData<AgentThreadListResponse>(
          agentThreadKeys.list(scope),
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
        queryClient.setQueryData(agentThreadKeys.list(scope), context.previous)
      }
      const msg =
        error instanceof Error ? error.message : 'Failed to delete thread'
      toast.error(msg)
    },

    onSuccess: (_data, threadId) => {
      // Also drop the cached detail so a stale render can't re-populate the list.
      queryClient.removeQueries({
        queryKey: agentThreadKeys.detail(scope, threadId),
      })
      toast.success('Conversation deleted')
    },
  })
}
