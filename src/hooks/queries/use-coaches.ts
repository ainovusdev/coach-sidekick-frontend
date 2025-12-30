import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { CoachService, CoachListResponse } from '@/services/coach-service'

/**
 * Hook to fetch all coaches
 *
 * Features:
 * - Cached for 10 minutes
 * - Returns all coaches in the system (based on user permissions)
 *
 * @example
 * const { data, isLoading } = useCoaches()
 * const coaches = data?.coaches ?? []
 */
export function useCoaches(
  options?: Omit<UseQueryOptions<CoachListResponse>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: ['coaches'],
    queryFn: () => CoachService.listCoaches(),
    staleTime: 10 * 60 * 1000, // 10 minutes - coaches don't change often
    ...options,
  })
}
