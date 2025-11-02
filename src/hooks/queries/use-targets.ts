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

/**
 * Hook to fetch a single target by ID
 *
 * @param targetId - The target ID to fetch
 * @param options - Additional react-query options
 *
 * @example
 * const { data: target } = useTarget(targetId)
 */
export function useTarget(
  targetId: string | undefined,
  options?: Omit<UseQueryOptions<Target>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery({
    queryKey: queryKeys.targets.detail(targetId!),
    queryFn: () => TargetService.getTarget(targetId!),
    enabled: !!targetId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    ...options,
  })
}

/**
 * Hook to fetch commitments linked to a target
 *
 * @param targetId - The target ID
 * @param options - Additional react-query options
 *
 * @example
 * const { data: commitments = [] } = useTargetCommitments(targetId)
 */
export function useTargetCommitments(
  targetId: string | undefined,
  options?: Omit<UseQueryOptions<any[]>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery({
    queryKey: [...queryKeys.targets.detail(targetId!), 'commitments'],
    queryFn: () => TargetService.getTargetCommitments(targetId!),
    enabled: !!targetId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    ...options,
  })
}
