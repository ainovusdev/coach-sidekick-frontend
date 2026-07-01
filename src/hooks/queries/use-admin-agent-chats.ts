import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import {
  adminService,
  type AgentChatGroupBy,
  type AdminAgentChatGroupsResponse,
  type AdminAgentChatThreadDetail,
} from '@/services/admin-service'
import { queryKeys } from '@/lib/query-client'

/**
 * Super-admin oversight: all agent chats grouped by coach / client / admin.
 * Read-only. Cached for 5 minutes.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useAdminAgentChatGroups('coach')
 * ```
 */
export function useAdminAgentChatGroups(
  groupBy: AgentChatGroupBy,
  options?: Omit<
    UseQueryOptions<AdminAgentChatGroupsResponse, Error>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: queryKeys.admin.agentChats.groups(groupBy),
    queryFn: () => adminService.getAgentChatGroups(groupBy),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Full message history for one thread, for the read-only viewer. Disabled until
 * a threadId is provided (e.g. when the viewer dialog opens).
 */
export function useAdminAgentChatThread(
  threadId: string | null,
  options?: Omit<
    UseQueryOptions<AdminAgentChatThreadDetail, Error>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: queryKeys.admin.agentChats.thread(threadId ?? ''),
    queryFn: () => adminService.getAgentChatThread(threadId as string),
    enabled: !!threadId,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}
