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
