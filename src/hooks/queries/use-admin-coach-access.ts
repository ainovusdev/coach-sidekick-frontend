import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { adminService } from '@/services/admin-service'
import { queryKeys } from '@/lib/query-client'

/**
 * Fetch all coach access assignments
 *
 * @param options - Additional React Query options
 * @returns Query result with coach access list
 *
 * @example
 * ```tsx
 * const { data: coachAccessList = [] } = useCoachAccessList()
 * ```
 */
export function useCoachAccessList(
  options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.admin.coachAccess.list(),
    queryFn: () => adminService.getAllCoachAccess(),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Fetch users by role (for coach/admin selection)
 *
 * @param role - The role to filter users by
 * @param options - Additional React Query options
 * @returns Query result with users having the specified role
 *
 * @example
 * ```tsx
 * const { data: coaches = [] } = useUsersByRole('coach')
 * ```
 */
export function useUsersByRole(
  role: string,
  options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.admin.coachAccess.byRole(role),
    queryFn: () => adminService.getUsersByRole(role),
    enabled: !!role,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}
