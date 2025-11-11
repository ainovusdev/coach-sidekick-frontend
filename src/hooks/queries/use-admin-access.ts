import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { adminService, ClientAccessMatrix } from '@/services/admin-service'
import { queryKeys } from '@/lib/query-client'

export interface AccessMatrixParams {
  skip?: number
  limit?: number
}

/**
 * Fetch client access matrix (who has access to which clients)
 *
 * @param params - Pagination parameters
 * @param options - Additional React Query options
 * @returns Query result with access matrix
 *
 * @example
 * ```tsx
 * const { data: accessMatrix = [], isLoading } = useAccessMatrix({ limit: 100 })
 * ```
 */
export function useAccessMatrix(
  params?: AccessMatrixParams,
  options?: Omit<
    UseQueryOptions<ClientAccessMatrix[], Error>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: queryKeys.admin.access.matrix(params),
    queryFn: () => adminService.getAccessMatrix(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Fetch client access for a specific user
 *
 * @param userId - The user ID to fetch client access for
 * @param options - Additional React Query options
 * @returns Query result with user's client access list
 *
 * @example
 * ```tsx
 * const { data: clientAccess = [] } = useUserClientAccess(userId)
 * ```
 */
export function useUserClientAccess(
  userId: string,
  options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.admin.access.user(userId),
    queryFn: () => adminService.getUserClientAccess(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Fetch users with access to a specific client
 *
 * @param clientId - The client ID to fetch user access for
 * @param options - Additional React Query options
 * @returns Query result with users who have access to the client
 *
 * @example
 * ```tsx
 * const { data: userAccess = [] } = useClientUserAccess(clientId)
 * ```
 */
export function useClientUserAccess(
  clientId: string,
  options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.admin.access.client(clientId),
    queryFn: () => adminService.getClientUserAccess(clientId),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}
