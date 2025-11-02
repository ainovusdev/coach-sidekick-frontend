import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { GoalService, Goal } from '@/services/goal-service'
import { queryKeys } from '@/lib/query-client'

/**
 * Hook to fetch goals for a specific client
 *
 * @param clientId - The client ID
 * @param options - Additional react-query options
 *
 * @example
 * const { data: goals = [] } = useGoals(clientId)
 */
export function useGoals(
  clientId: string | undefined,
  options?: Omit<UseQueryOptions<Goal[]>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery({
    queryKey: [...queryKeys.goals.all, 'client', clientId],
    queryFn: () => GoalService.listGoals(clientId!),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}
