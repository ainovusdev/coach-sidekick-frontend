import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-client'
import { getAgentThread, listAgentThreads } from '@/services/agent-service'
import type { AgentThreadDetail, AgentThreadListResponse } from '@/types/agent'

/**
 * List the current admin's saved Sidekick Agent threads.
 * Fed into the left-rail sidebar in /admin/agent.
 */
export function useAgentThreads(
  options?: Omit<
    UseQueryOptions<AgentThreadListResponse, Error>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: queryKeys.admin.agentThreads.list(),
    queryFn: listAgentThreads,
    // Refetched after each /stream completes (in agent-chat.tsx) so the
    // "last activity" sort stays current; we keep a short stale window so
    // tab-focus refetches don't thrash.
    staleTime: 30 * 1000,
    ...options,
  })
}

/**
 * Load one thread for hydration. Disabled until a threadId is set.
 */
export function useAgentThread(
  threadId: string | null,
  options?: Omit<
    UseQueryOptions<AgentThreadDetail, Error>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: queryKeys.admin.agentThreads.detail(threadId || ''),
    queryFn: () => getAgentThread(threadId as string),
    enabled: !!threadId,
    // The thread is only ever fully refreshed via the stream endpoint, so
    // this query mainly serves the initial hydration on URL nav / reload.
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}
