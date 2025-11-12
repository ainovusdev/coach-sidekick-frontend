import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/services/admin-service'
import { invalidateAdminQueries } from '@/lib/query-client'
import { toast } from 'sonner'

/**
 * Assign coach to admin mutation
 *
 * @example
 * ```tsx
 * const { mutate: assignCoach } = useAssignCoachToAdmin()
 *
 * assignCoach({
 *   coachUserId: 'coach-123',
 *   adminUserId: 'admin-456'
 * })
 * ```
 */
export function useAssignCoachToAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      coachUserId,
      adminUserId,
    }: {
      coachUserId: string
      adminUserId: string
    }) => adminService.assignCoachToAdmin(coachUserId, adminUserId),

    onSuccess: () => {
      toast.success('Coach assigned to admin successfully')
      invalidateAdminQueries.afterCoachAccessUpdate(queryClient)
    },

    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign coach')
    },
  })
}

/**
 * Remove coach from admin mutation
 *
 * @example
 * ```tsx
 * const { mutate: removeCoach } = useRemoveCoachFromAdmin()
 *
 * removeCoach({
 *   coachUserId: 'coach-123',
 *   adminUserId: 'admin-456'
 * })
 * ```
 */
export function useRemoveCoachFromAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      coachUserId,
      adminUserId,
    }: {
      coachUserId: string
      adminUserId: string
    }) => adminService.removeCoachFromAdmin(coachUserId, adminUserId),

    onSuccess: () => {
      toast.success('Coach removed from admin successfully')
      invalidateAdminQueries.afterCoachAccessUpdate(queryClient)
    },

    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove coach')
    },
  })
}
