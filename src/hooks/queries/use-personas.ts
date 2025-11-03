import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import {
  PersonaService,
  ClientPersona,
  PersonaUpdateHistory,
} from '@/services/persona-service'
import { queryKeys } from '@/lib/query-client'

/**
 * Hook to fetch client persona
 *
 * Persona is the AI-generated understanding of the client based on session transcripts
 * Cached for 10 minutes as it doesn't change frequently
 *
 * @param clientId - The client ID
 * @param options - Additional react-query options
 *
 * @example
 * const { data: persona } = useClientPersona(clientId)
 */
export function useClientPersona(
  clientId: string | undefined,
  options?: Omit<
    UseQueryOptions<ClientPersona | null>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  return useQuery({
    queryKey: queryKeys.personas.client(clientId!),
    queryFn: () => PersonaService.getClientPersona(clientId!),
    enabled: !!clientId,
    staleTime: 10 * 60 * 1000, // 10 minutes - personas don't change frequently
    ...options,
  })
}

/**
 * Hook to fetch persona update history
 *
 * Shows how the AI's understanding of the client evolved over time
 *
 * @param clientId - The client ID
 * @param limit - Number of history records to fetch (default 50)
 * @param options - Additional react-query options
 *
 * @example
 * const { data: history = [] } = usePersonaHistory(clientId, 20)
 */
export function usePersonaHistory(
  clientId: string | undefined,
  limit: number = 50,
  options?: Omit<
    UseQueryOptions<PersonaUpdateHistory[]>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  return useQuery({
    queryKey: [...queryKeys.personas.client(clientId!), 'history', limit],
    queryFn: () => PersonaService.getPersonaHistory(clientId!, limit),
    enabled: !!clientId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  })
}
