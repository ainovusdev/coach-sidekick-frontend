import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { adminService, User } from '@/services/admin-service'
import { queryKeys } from '@/lib/query-client'

export interface AdminUsersParams {
  skip?: number
  limit?: number
  search?: string
  role_filter?: string
  include_deleted?: boolean
}

/**
 * Fetch list of users with optional filters
 * Cached for 5 minutes, automatically deduplicates requests
 *
 * @param params - Query parameters for filtering users
 * @param options - Additional React Query options
 * @returns Query result with users array
 *
 * @example
 * ```tsx
 * const { data: users = [], isLoading } = useAdminUsers({ limit: 100 })
 * ```
 */
export function useAdminUsers(
  params?: AdminUsersParams,
  options?: Omit<UseQueryOptions<User[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.admin.users.list(params),
    queryFn: () => adminService.getUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}
