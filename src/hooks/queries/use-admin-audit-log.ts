import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { adminService } from '@/services/admin-service'
import { queryKeys } from '@/lib/query-client'

export interface AuditLogParams {
  limit?: number
  resource_type?: string
  user_id?: string
  action?: string
  start_date?: string
  end_date?: string
}

/**
 * Fetch audit log entries
 * Cached for 1 minute to keep audit logs relatively fresh
 *
 * @param params - Filter parameters for audit logs
 * @param options - Additional React Query options
 * @returns Query result with audit log entries
 *
 * @example
 * ```tsx
 * const { data: auditLogs = [] } = useAuditLog({
 *   limit: 50,
 *   resource_type: 'user'
 * })
 * ```
 */
export function useAuditLog(
  params?: AuditLogParams,
  options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.admin.auditLog.list(params),
    queryFn: () => adminService.getAuditLog(params),
    staleTime: 1 * 60 * 1000, // 1 minute (audit logs should be fresh)
    ...options,
  })
}
