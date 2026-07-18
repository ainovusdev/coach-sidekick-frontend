import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { TargetService } from '@/services/target-service'
import { Target } from '@/types/sprint'
import { queryKeys } from '@/lib/query-client'

/**
 * Hook to fetch targets list with optional filters
 *
 * @param filters - Filter parameters (goal_id, sprint_id, status)
 * @param options - Additional react-query options
 *
 * @example
 * const { data: targets = [] } = useTargets({ sprint_id: '123' })
 */
export function useTargets(
  filters?: {
    goal_id?: string
    sprint_id?: string
    client_id?: string
    status?: string
  },
  options?: Omit<UseQueryOptions<Target[]>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.targets.list(filters),
    queryFn: () => TargetService.listTargets(filters),
    staleTime: 3 * 60 * 1000, // 3 minutes
    ...options,
  })
}
