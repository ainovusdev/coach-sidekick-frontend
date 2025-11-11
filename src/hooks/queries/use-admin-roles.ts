import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { adminService } from '@/services/admin-service'
import { queryKeys } from '@/lib/query-client'

/**
 * Fetch available roles and their descriptions
 * Rarely changes, cached for 10 minutes
 *
 * @param options - Additional React Query options
 * @returns Query result with roles array and descriptions
 *
 * @example
 * ```tsx
 * const { data: availableRoles } = useAvailableRoles()
 * // availableRoles = { roles: ['admin', 'coach', ...], descriptions: {...} }
 * ```
 */
export function useAvailableRoles(
  options?: Omit<
    UseQueryOptions<
      { roles: string[]; descriptions: Record<string, string> },
      Error
    >,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: queryKeys.admin.roles.available(),
    queryFn: () => adminService.getAvailableRoles(),
    staleTime: 10 * 60 * 1000, // 10 minutes (roles rarely change)
    ...options,
  })
}

/**
 * Fetch roles for a specific user
 *
 * @param userId - The user ID to fetch roles for
 * @param options - Additional React Query options
 * @returns Query result with array of role strings
 *
 * @example
 * ```tsx
 * const { data: userRoles = [] } = useUserRoles(userId)
 * // userRoles = ['admin', 'coach']
 * ```
 */
export function useUserRoles(
  userId: string,
  options?: Omit<UseQueryOptions<string[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.admin.roles.user(userId),
    queryFn: () => adminService.getUserRoles(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}
