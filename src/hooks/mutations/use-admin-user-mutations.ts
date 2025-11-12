import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService, User } from '@/services/admin-service'
import { invalidateAdminQueries, queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'

/**
 * Create new user mutation
 * Includes optimistic update to instantly show new user in UI
 *
 * @example
 * ```tsx
 * const { mutate: createUser, isPending } = useCreateUser()
 *
 * createUser({
 *   email: 'user@example.com',
 *   password: 'password',
 *   full_name: 'John Doe',
 *   roles: ['coach']
 * }, {
 *   onSuccess: () => {
 *     setDialogOpen(false)
 *   }
 * })
 * ```
 */
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      email: string
      password: string
      full_name?: string
      roles?: string[]
      is_active?: boolean
    }) => adminService.createUser(data),

    onSuccess: newUser => {
      toast.success('User created successfully')

      // Optimistically add to cache
      queryClient.setQueryData<User[]>(queryKeys.admin.users.list(), old =>
        old ? [...old, newUser] : [newUser],
      )

      // Invalidate to refetch and ensure consistency
      invalidateAdminQueries.afterUserUpdate(queryClient, newUser.id)
    },

    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create user')
    },
  })
}

/**
 * Update existing user mutation
 * Includes optimistic update to instantly reflect changes
 *
 * @example
 * ```tsx
 * const { mutate: updateUser } = useUpdateUser()
 *
 * updateUser({
 *   userId: '123',
 *   data: {
 *     full_name: 'John Smith',
 *     is_active: true
 *   }
 * })
 * ```
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string
      data: {
        email?: string
        full_name?: string
        is_active?: boolean
        password?: string
      }
    }) => adminService.updateUser(userId, data),

    onMutate: async ({ userId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.users.all })

      // Snapshot previous value
      const previousUsers = queryClient.getQueryData<User[]>(
        queryKeys.admin.users.list(),
      )

      // Optimistically update cache
      if (previousUsers) {
        queryClient.setQueryData<User[]>(
          queryKeys.admin.users.list(),
          old =>
            old?.map(user =>
              user.id === userId ? { ...user, ...data } : user,
            ) || [],
        )
      }

      return { previousUsers }
    },

    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(
          queryKeys.admin.users.list(),
          context.previousUsers,
        )
      }
      toast.error(error.response?.data?.message || 'Failed to update user')
    },

    onSuccess: (updatedUser, { userId }) => {
      toast.success('User updated successfully')
      invalidateAdminQueries.afterUserUpdate(queryClient, userId)
    },
  })
}

/**
 * Delete user mutation (soft delete)
 * Optimistically removes user from list
 *
 * @example
 * ```tsx
 * const { mutate: deleteUser } = useDeleteUser()
 *
 * deleteUser(userId)
 * ```
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),

    onMutate: async userId => {
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.users.all })

      const previousUsers = queryClient.getQueryData<User[]>(
        queryKeys.admin.users.list(),
      )

      // Optimistically remove from list
      if (previousUsers) {
        queryClient.setQueryData<User[]>(
          queryKeys.admin.users.list(),
          old => old?.filter(user => user.id !== userId) || [],
        )
      }

      return { previousUsers }
    },

    onError: (error: any, userId, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(
          queryKeys.admin.users.list(),
          context.previousUsers,
        )
      }
      toast.error(error.response?.data?.message || 'Failed to delete user')
    },

    onSuccess: () => {
      toast.success('User deleted successfully')
      invalidateAdminQueries.afterUserUpdate(queryClient)
    },
  })
}

/**
 * Restore soft-deleted user mutation
 *
 * @example
 * ```tsx
 * const { mutate: restoreUser } = useRestoreUser()
 *
 * restoreUser(userId)
 * ```
 */
export function useRestoreUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => adminService.restoreUser(userId),

    onSuccess: () => {
      toast.success('User restored successfully')
      invalidateAdminQueries.afterUserUpdate(queryClient)
    },

    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to restore user')
    },
  })
}

/**
 * Assign roles to user (replaces all roles)
 *
 * @example
 * ```tsx
 * const { mutate: assignRoles } = useAssignRoles()
 *
 * assignRoles({
 *   userId: '123',
 *   roles: ['admin', 'coach']
 * })
 * ```
 */
export function useAssignRoles() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) =>
      adminService.assignRoles(userId, roles),

    onSuccess: () => {
      toast.success('Roles assigned successfully')
      invalidateAdminQueries.afterRoleUpdate(queryClient)
    },

    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign roles')
    },
  })
}
