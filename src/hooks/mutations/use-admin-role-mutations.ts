import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/services/admin-service'
import { invalidateAdminQueries } from '@/lib/query-client'
import { toast } from 'sonner'

/**
 * Add single role to user mutation
 *
 * @example
 * ```tsx
 * const { mutate: addRole } = useAddRole()
 *
 * addRole({
 *   userId: '123',
 *   role: 'admin'
 * })
 * ```
 */
export function useAddRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminService.addRole(userId, role),

    onSuccess: () => {
      toast.success('Role added successfully')
      invalidateAdminQueries.afterRoleUpdate(queryClient)
    },

    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add role')
    },
  })
}

/**
 * Remove single role from user mutation
 *
 * @example
 * ```tsx
 * const { mutate: removeRole } = useRemoveRole()
 *
 * removeRole({
 *   userId: '123',
 *   role: 'coach'
 * })
 * ```
 */
export function useRemoveRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminService.removeRole(userId, role),

    onSuccess: () => {
      toast.success('Role removed successfully')
      invalidateAdminQueries.afterRoleUpdate(queryClient)
    },

    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove role')
    },
  })
}
