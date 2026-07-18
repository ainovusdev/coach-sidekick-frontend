import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import {
  adminService,
  AdminClientListResponse,
  AdminClientStats,
} from '@/services/admin-service'
import { queryKeys } from '@/lib/query-client'

export interface AdminClientsParams {
  skip?: number
  limit?: number
  search?: string
  coach_id?: string
  program_id?: string
  tags?: string
}

/**
 * Fetch list of admin clients with optional filters
 * Cached for 5 minutes, automatically deduplicates requests
 *
 * @param params - Query parameters for filtering clients
 * @param options - Additional React Query options
 * @returns Query result with clients list
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useAdminClients({ limit: 50 })
 * const clients = data?.clients ?? []
 * ```
 */
export function useAdminClients(
  params?: AdminClientsParams,
  options?: Omit<
    UseQueryOptions<AdminClientListResponse, Error>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: queryKeys.admin.clients.list(params),
    queryFn: () => adminService.getAdminClients(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Fetch admin client statistics for dashboard
 *
 * @param options - Additional React Query options
 * @returns Query result with stats data
 *
 * @example
 * ```tsx
 * const { data: stats, isLoading } = useAdminClientStats()
 * ```
 */
export function useAdminClientStats(
  options?: Omit<
    UseQueryOptions<AdminClientStats, Error>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: queryKeys.admin.clients.stats(),
    queryFn: () => adminService.getAdminClientStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes for fresher stats
    ...options,
  })
}
