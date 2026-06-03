import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

import {
  getAgentThread,
  listAgentThreads,
  type AgentApiScope,
} from '@/services/agent-service'
import type { AgentThreadDetail, AgentThreadListResponse } from '@/types/agent'

/**
 * Scope-keyed query keys so the admin / coach / client thread caches never
 * collide (the same hook serves all three agent mounts).
 */
export const agentThreadKeys = {
  all: (scope: AgentApiScope) => ['agent', scope, 'threads'] as const,
  list: (scope: AgentApiScope) => ['agent', scope, 'threads', 'list'] as const,
  detail: (scope: AgentApiScope, id: string) =>
    ['agent', scope, 'threads', 'detail', id] as const,
}

/**
 * List the current user's saved Sidekick Agent threads for a given mount.
 * Fed into the left-rail sidebar.
 */
export function useAgentThreads(
  scope: AgentApiScope = 'admin',
  options?: Omit<
    UseQueryOptions<AgentThreadListResponse, Error>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: agentThreadKeys.list(scope),
    queryFn: () => listAgentThreads(scope),
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
  scope: AgentApiScope = 'admin',
  options?: Omit<
    UseQueryOptions<AgentThreadDetail, Error>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: agentThreadKeys.detail(scope, threadId || ''),
    queryFn: () => getAgentThread(threadId as string, scope),
    enabled: !!threadId,
    // The thread is only ever fully refreshed via the stream endpoint, so
    // this query mainly serves the initial hydration on URL nav / reload.
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}
