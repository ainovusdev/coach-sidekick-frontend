import {
  useQuery,
  UseQueryOptions,
  keepPreviousData,
} from '@tanstack/react-query'
import { SessionService, SessionListResponse } from '@/services/session-service'
import { queryKeys } from '@/lib/query-client'
import { ApiClient } from '@/lib/api-client'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

/**
 * Hook to fetch sessions list with optional filters
 *
 * Features:
 * - Cached for 5 minutes
 * - Supports pagination and filtering
 * - Stale-while-revalidate strategy
 *
 * @param filters - Query parameters for filtering sessions
 * @param options - Additional react-query options
 *
 * @example
 * const { data, isLoading } = useSessions({ client_id: '123', status: 'completed' })
 * const sessions = data?.sessions ?? []
 */
export function useSessions(
  filters?: {
    page?: number
    per_page?: number
    client_id?: string
    coach_id?: string
    status?: string
    scope?: 'mine' | 'shared' | 'all'
  },
  options?: Omit<UseQueryOptions<SessionListResponse>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.sessions.list(filters),
    queryFn: () => SessionService.listSessions(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Hook to fetch session notes
 *
 * @param sessionId - The session ID
 * @param options - Additional react-query options
 *
 * @example
 * const { data: notes } = useSessionNotes(sessionId)
 */
export function useSessionNotes(
  sessionId: string | undefined,
  clientId?: string,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery({
    queryKey: queryKeys.sessions.notes(sessionId!, clientId),
    queryFn: async () => {
      const params = clientId ? `?client_id=${clientId}` : ''
      return await ApiClient.get(
        `${BACKEND_URL}/sessions/${sessionId}/notes${params}`,
      )
    },
    enabled: !!sessionId,
    staleTime: 3 * 60 * 1000, // 3 minutes (notes can be edited frequently)
    placeholderData: keepPreviousData,
    ...options,
  })
}
