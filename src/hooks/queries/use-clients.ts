import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import {
  ClientService,
  ClientListResponse,
  SimpleClientListResponse,
} from '@/services/client-service'
import { SessionService, SessionListResponse } from '@/services/session-service'
import { Client } from '@/types/meeting'
import { queryKeys } from '@/lib/query-client'

/**
 * Hook to fetch lightweight client list for dropdowns and dashboard
 *
 * Features:
 * - Only fetches id, name, email - much faster than full list
 * - Cached for 5 minutes
 * - Use this for client selectors, dropdowns, and anywhere you just need basic client info
 *
 * @example
 * const { data, isLoading } = useClientsSimple()
 * const clients = data?.clients ?? []
 */
export function useClientsSimple(
  options?: Omit<
    UseQueryOptions<SimpleClientListResponse>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: queryKeys.clients.simple(),
    queryFn: () => ClientService.listClientsSimple(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Hook to fetch full clients list with all details
 *
 * Features:
 * - Includes session stats, invitation status, portal access, etc.
 * - Cached for 5 minutes
 * - Use only on dedicated clients page where all data is needed
 *
 * @example
 * const { data, isLoading, error } = useClients()
 * const clients = data?.clients ?? []
 */
export function useClients(
  options?: Omit<UseQueryOptions<ClientListResponse>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.clients.list(),
    queryFn: () => ClientService.listClients(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Hook to fetch a single client by ID
 *
 * Features:
 * - Cached for 5 minutes per client
 * - Auto-refetches when client ID changes
 * - Can be disabled when clientId is undefined
 *
 * @param clientId - The client ID to fetch
 * @param options - Additional react-query options
 *
 * @example
 * const { data: client, isLoading } = useClient(clientId)
 */
export function useClient(
  clientId: string | undefined,
  options?: Omit<UseQueryOptions<Client>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery({
    queryKey: queryKeys.clients.detail(clientId!),
    queryFn: () => ClientService.getClient(clientId!),
    enabled: !!clientId, // Only fetch if clientId exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Hook to fetch all sessions for a specific client
 *
 * Features:
 * - Cached for 5 minutes
 * - Supports pagination
 * - Automatically refetches when params change
 *
 * @param clientId - The client ID
 * @param params - Pagination parameters
 * @param options - Additional react-query options
 *
 * @example
 * const { data, isLoading } = useClientSessions(clientId, { page: 1, per_page: 10 })
 * const sessions = data?.sessions ?? []
 */
export function useClientSessions(
  clientId: string | undefined,
  params?: {
    page?: number
    per_page?: number
  },
  options?: Omit<
    UseQueryOptions<SessionListResponse>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  return useQuery({
    queryKey: [...queryKeys.clients.sessions(clientId!), params],
    queryFn: () => SessionService.getClientSessions(clientId!, params),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Hook to fetch client statistics
 *
 * This would be implemented when we have a stats endpoint
 * For now, it's a placeholder showing the pattern
 *
 * @param clientId - The client ID
 *
 * @example
 * const { data: stats } = useClientStats(clientId)
 */
export function useClientStats(
  clientId: string | undefined,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery({
    queryKey: queryKeys.clients.stats(clientId!),
    queryFn: async () => {
      // TODO: Implement stats endpoint or calculate from sessions
      // For now, return null
      return null
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}
