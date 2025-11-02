import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ClientService,
  ClientCreateDto,
  ClientUpdateDto,
} from '@/services/client-service'
import { queryKeys } from '@/lib/query-client'
import { Client } from '@/types/meeting'
import { toast } from 'sonner'

/**
 * Hook to create a new client with optimistic updates
 *
 * Features:
 * - Optimistic UI update (client appears immediately)
 * - Automatic rollback on error
 * - Cache invalidation on success
 * - Toast notifications
 *
 * @example
 * const createClient = useCreateClient()
 * await createClient.mutateAsync({ name: 'John Doe', notes: 'New client' })
 */
export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ClientCreateDto) => ClientService.createClient(data),

    onMutate: async newClient => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.clients.all })

      // Snapshot the previous value
      const previousClients = queryClient.getQueryData(queryKeys.clients.list())

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.clients.list(), (old: any) => {
        if (!old) return old
        return {
          ...old,
          clients: [
            {
              id: `temp-${Date.now()}`,
              ...newClient,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            ...old.clients,
          ],
          total: old.total + 1,
        }
      })

      // Return a context object with the snapshotted value
      return { previousClients }
    },

    onError: (err, _newClient, context) => {
      // Rollback to the previous value on error
      if (context?.previousClients) {
        queryClient.setQueryData(
          queryKeys.clients.list(),
          context.previousClients,
        )
      }

      toast.error('Failed to create client', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSuccess: data => {
      toast.success('Client created successfully', {
        description: `${data.name} has been added to your clients`,
      })
    },

    onSettled: () => {
      // Always refetch after error or success to ensure sync
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
  })
}

/**
 * Hook to update an existing client with optimistic updates
 *
 * @example
 * const updateClient = useUpdateClient()
 * await updateClient.mutateAsync({ clientId: '123', data: { name: 'New Name' } })
 */
export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      clientId,
      data,
    }: {
      clientId: string
      data: ClientUpdateDto
    }) => ClientService.updateClient(clientId, data),

    onMutate: async ({ clientId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.clients.all })

      // Snapshot the previous values
      const previousList = queryClient.getQueryData(queryKeys.clients.list())
      const previousDetail = queryClient.getQueryData(
        queryKeys.clients.detail(clientId),
      )

      // Optimistically update the list
      queryClient.setQueryData(queryKeys.clients.list(), (old: any) => {
        if (!old) return old
        return {
          ...old,
          clients: old.clients.map((client: Client) =>
            client.id === clientId
              ? { ...client, ...data, updated_at: new Date().toISOString() }
              : client,
          ),
        }
      })

      // Optimistically update the detail
      queryClient.setQueryData(
        queryKeys.clients.detail(clientId),
        (old: any) => {
          if (!old) return old
          return { ...old, ...data, updated_at: new Date().toISOString() }
        },
      )

      return { previousList, previousDetail, clientId }
    },

    onError: (err, _variables, context) => {
      // Rollback on error
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.clients.list(), context.previousList)
      }
      if (context?.previousDetail && context?.clientId) {
        queryClient.setQueryData(
          queryKeys.clients.detail(context.clientId),
          context.previousDetail,
        )
      }

      toast.error('Failed to update client', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSuccess: data => {
      toast.success('Client updated successfully', {
        description: `${data.name}'s information has been updated`,
      })
    },

    onSettled: (_data, _error, variables) => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.clients.detail(variables.clientId),
      })
    },
  })
}

/**
 * Hook to delete a client with optimistic updates
 *
 * @example
 * const deleteClient = useDeleteClient()
 * await deleteClient.mutateAsync('client-id-123')
 */
export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (clientId: string) => ClientService.deleteClient(clientId),

    onMutate: async clientId => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.clients.all })

      // Snapshot the previous value
      const previousClients = queryClient.getQueryData(queryKeys.clients.list())

      // Get client name for the toast
      const clientData: any = queryClient.getQueryData(
        queryKeys.clients.detail(clientId),
      )
      const clientName = clientData?.name || 'Client'

      // Optimistically remove from the list
      queryClient.setQueryData(queryKeys.clients.list(), (old: any) => {
        if (!old) return old
        return {
          ...old,
          clients: old.clients.filter(
            (client: Client) => client.id !== clientId,
          ),
          total: old.total - 1,
        }
      })

      return { previousClients, clientId, clientName }
    },

    onError: (err, _clientId, context) => {
      // Rollback on error
      if (context?.previousClients) {
        queryClient.setQueryData(
          queryKeys.clients.list(),
          context.previousClients,
        )
      }

      toast.error('Failed to delete client', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSuccess: (_data, _clientId, context) => {
      toast.success('Client deleted', {
        description: `${context?.clientName} has been removed`,
      })
    },

    onSettled: (_data, _error, clientId) => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      queryClient.removeQueries({
        queryKey: queryKeys.clients.detail(clientId),
      })
    },
  })
}
