import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  adminService,
  AdminClientListResponse,
  AdminClientUpdate,
  BulkAssignCoachRequest,
  BulkAssignProgramRequest,
  CSVImportRequest,
} from '@/services/admin-service'
import { invalidateAdminQueries, queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'

/**
 * Update admin client mutation
 * Includes optimistic update to instantly reflect changes
 *
 * @example
 * ```tsx
 * const { mutate: updateClient } = useUpdateAdminClient()
 *
 * updateClient({
 *   clientId: '123',
 *   data: { name: 'New Name', coach_id: 'coach-uuid' }
 * })
 * ```
 */
export function useUpdateAdminClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      clientId,
      data,
    }: {
      clientId: string
      data: AdminClientUpdate
    }) => adminService.updateAdminClient(clientId, data),

    onMutate: async ({ clientId, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.clients.all })

      const previousData = queryClient.getQueryData<AdminClientListResponse>(
        queryKeys.admin.clients.list(),
      )

      if (previousData) {
        queryClient.setQueryData<AdminClientListResponse>(
          queryKeys.admin.clients.list(),
          old =>
            old
              ? {
                  ...old,
                  clients: old.clients.map(client =>
                    client.id === clientId ? { ...client, ...data } : client,
                  ),
                }
              : old,
        )
      }

      return { previousData }
    },

    onError: (error: any, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.admin.clients.list(),
          context.previousData,
        )
      }
      toast.error(error.response?.data?.detail || 'Failed to update client')
    },

    onSuccess: (updatedClient, { clientId }) => {
      toast.success('Client updated successfully')
      invalidateAdminQueries.afterAdminClientUpdate(queryClient, clientId)
    },
  })
}

/**
 * Delete admin client mutation
 * Optimistically removes client from list
 *
 * @example
 * ```tsx
 * const { mutate: deleteClient } = useDeleteAdminClient()
 *
 * deleteClient(clientId)
 * ```
 */
export function useDeleteAdminClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (clientId: string) => adminService.deleteAdminClient(clientId),

    onMutate: async clientId => {
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.clients.all })

      const previousData = queryClient.getQueryData<AdminClientListResponse>(
        queryKeys.admin.clients.list(),
      )

      if (previousData) {
        queryClient.setQueryData<AdminClientListResponse>(
          queryKeys.admin.clients.list(),
          old =>
            old
              ? {
                  ...old,
                  clients: old.clients.filter(client => client.id !== clientId),
                  total: old.total - 1,
                }
              : old,
        )
      }

      return { previousData }
    },

    onError: (error: any, clientId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.admin.clients.list(),
          context.previousData,
        )
      }
      toast.error(error.response?.data?.detail || 'Failed to delete client')
    },

    onSuccess: () => {
      toast.success('Client deleted successfully')
      invalidateAdminQueries.afterAdminClientUpdate(queryClient)
    },
  })
}

/**
 * Bulk assign clients to a coach
 *
 * @example
 * ```tsx
 * const { mutate: bulkAssignCoach } = useBulkAssignCoach()
 *
 * bulkAssignCoach({
 *   client_ids: ['id1', 'id2'],
 *   coach_id: 'coach-uuid'
 * })
 * ```
 */
export function useBulkAssignCoach() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkAssignCoachRequest) =>
      adminService.bulkAssignCoach(data),

    onSuccess: result => {
      if (result.success_count > 0) {
        toast.success(
          `Successfully assigned ${result.success_count} client(s) to coach`,
        )
      }
      if (result.failed_count > 0) {
        toast.error(`Failed to assign ${result.failed_count} client(s)`)
      }
      invalidateAdminQueries.afterAdminClientUpdate(queryClient)
    },

    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail || 'Failed to assign clients to coach',
      )
    },
  })
}

/**
 * Bulk add or remove clients from a program
 *
 * @example
 * ```tsx
 * const { mutate: bulkAssignProgram } = useBulkAssignProgram()
 *
 * bulkAssignProgram({
 *   client_ids: ['id1', 'id2'],
 *   program_id: 'program-uuid',
 *   action: 'add'
 * })
 * ```
 */
export function useBulkAssignProgram() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkAssignProgramRequest) =>
      adminService.bulkAssignProgram(data),

    onSuccess: (result, variables) => {
      const action = variables.action === 'add' ? 'added to' : 'removed from'
      if (result.success_count > 0) {
        toast.success(
          `Successfully ${action} sandbox: ${result.success_count} client(s)`,
        )
      }
      if (result.failed_count > 0) {
        toast.error(`Failed to update ${result.failed_count} client(s)`)
      }
      invalidateAdminQueries.afterAdminClientUpdate(queryClient)
    },

    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail || 'Failed to update sandbox membership',
      )
    },
  })
}

/**
 * Import clients from CSV data
 *
 * @example
 * ```tsx
 * const { mutate: importClients } = useImportClients()
 *
 * importClients({
 *   rows: parsedCSVRows,
 *   default_coach_id: 'coach-uuid'
 * })
 * ```
 */
export function useImportClients() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CSVImportRequest) => adminService.importClientsCSV(data),

    onSuccess: result => {
      if (result.success_count > 0) {
        toast.success(`Successfully imported ${result.success_count} client(s)`)
      }
      if (result.failed_count > 0) {
        toast.error(
          `Failed to import ${result.failed_count} client(s). Check errors for details.`,
        )
      }
      invalidateAdminQueries.afterAdminClientUpdate(queryClient)
    },

    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to import clients')
    },
  })
}

/**
 * Export clients to CSV
 * Returns a Blob that can be downloaded
 *
 * @example
 * ```tsx
 * const { mutate: exportClients } = useExportClients()
 *
 * exportClients({ coach_id: 'coach-uuid' }, {
 *   onSuccess: (blob) => {
 *     const url = URL.createObjectURL(blob)
 *     const a = document.createElement('a')
 *     a.href = url
 *     a.download = 'clients.csv'
 *     a.click()
 *   }
 * })
 * ```
 */
export function useExportClients() {
  return useMutation({
    mutationFn: (params?: {
      search?: string
      coach_id?: string
      program_id?: string
    }) => adminService.exportClientsCSV(params),

    onSuccess: blob => {
      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clients-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Clients exported successfully')
    },

    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to export clients')
    },
  })
}
