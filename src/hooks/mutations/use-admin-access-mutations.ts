import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/services/admin-service'
import { invalidateAdminQueries } from '@/lib/query-client'
import { toast } from 'sonner'

/**
 * Grant client access to user mutation
 *
 * @example
 * ```tsx
 * const { mutate: grantAccess } = useGrantClientAccess()
 *
 * grantAccess({
 *   client_id: 'client-123',
 *   user_id: 'user-456',
 *   access_level: 'full'
 * })
 * ```
 */
export function useGrantClientAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      client_id: string
      user_id: string
      access_level?: 'full' | 'readonly'
    }) => adminService.grantClientAccess(data),

    onSuccess: () => {
      toast.success('Access granted successfully')
      invalidateAdminQueries.afterAccessUpdate(queryClient)
    },

    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to grant access')
    },
  })
}

/**
 * Bulk assign clients to user mutation
 *
 * @example
 * ```tsx
 * const { mutate: bulkAssign } = useBulkAssignClients()
 *
 * bulkAssign({
 *   user_id: 'user-123',
 *   client_ids: ['client-1', 'client-2', 'client-3'],
 *   access_level: 'full'
 * })
 * ```
 */
export function useBulkAssignClients() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      user_id: string
      client_ids: string[]
      access_level?: 'full' | 'readonly'
    }) => adminService.bulkAssignClients(data),

    onSuccess: result => {
      toast.success(`${result.assigned_count} clients assigned successfully`)
      invalidateAdminQueries.afterAccessUpdate(queryClient)
    },

    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign clients')
    },
  })
}

/**
 * Revoke client access from user mutation
 *
 * @example
 * ```tsx
 * const { mutate: revokeAccess } = useRevokeClientAccess()
 *
 * revokeAccess({
 *   clientId: 'client-123',
 *   userId: 'user-456'
 * })
 * ```
 */
export function useRevokeClientAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clientId, userId }: { clientId: string; userId: string }) =>
      adminService.revokeClientAccess(clientId, userId),

    onSuccess: () => {
      toast.success('Access revoked successfully')
      invalidateAdminQueries.afterAccessUpdate(queryClient)
    },

    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to revoke access')
    },
  })
}
