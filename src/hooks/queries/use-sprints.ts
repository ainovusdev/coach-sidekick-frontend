import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { SprintService } from '@/services/sprint-service'
import { Sprint, SprintDetail } from '@/types/sprint'
import { queryKeys } from '@/lib/query-client'

/**
 * Hook to fetch sprints list with optional filters
 *
 * @param filters - Filter parameters (client_id, status)
 * @param options - Additional react-query options
 *
 * @example
 * const { data: sprints = [] } = useSprints({ client_id: '123', status: 'active' })
 */
export function useSprints(
  filters?: {
    client_id?: string
    status?: string
  },
  options?: Omit<UseQueryOptions<Sprint[]>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.sprints.list(filters),
    queryFn: () => SprintService.listSprints(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Hook to fetch a single sprint by ID
 *
 * @param sprintId - The sprint ID to fetch
 * @param options - Additional react-query options
 *
 * @example
 * const { data: sprint } = useSprint(sprintId)
 */
export function useSprint(
  sprintId: string | undefined,
  options?: Omit<
    UseQueryOptions<SprintDetail>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  return useQuery({
    queryKey: queryKeys.sprints.detail(sprintId!),
    queryFn: () => SprintService.getSprint(sprintId!),
    enabled: !!sprintId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}
