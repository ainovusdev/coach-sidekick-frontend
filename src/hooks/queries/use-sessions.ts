import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { SessionService, SessionListResponse } from '@/services/session-service'
import { CoachingSession } from '@/types/meeting'
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
    status?: string
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
 * Hook to fetch a single session by ID
 *
 * @param sessionId - The session ID to fetch
 * @param options - Additional react-query options
 *
 * @example
 * const { data: session, isLoading } = useSession(sessionId)
 */
export function useSession(
  sessionId: string | undefined,
  options?: Omit<
    UseQueryOptions<CoachingSession>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  return useQuery({
    queryKey: queryKeys.sessions.detail(sessionId!),
    queryFn: () => SessionService.getSession(sessionId!),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Hook to fetch session by bot ID
 *
 * Useful for real-time meeting pages where you have botId but not sessionId
 *
 * @param botId - The bot ID
 * @param options - Additional react-query options
 *
 * @example
 * const { data: session } = useSessionByBotId(botId)
 */
export function useSessionByBotId(
  botId: string | undefined,
  options?: Omit<
    UseQueryOptions<CoachingSession>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  return useQuery({
    queryKey: [...queryKeys.bots.detail(botId!), 'session'],
    queryFn: () => SessionService.getSessionByBotId(botId!),
    enabled: !!botId,
    staleTime: 2 * 60 * 1000, // 2 minutes (more dynamic for active sessions)
    ...options,
  })
}

/**
 * Hook to fetch detailed session analysis
 *
 * This includes coaching analysis, insights, and metrics
 * Cached for longer since analysis rarely changes
 *
 * @param sessionId - The session ID
 * @param options - Additional react-query options
 *
 * @example
 * const { data: analysis } = useSessionAnalysis(sessionId)
 */
export function useSessionAnalysis(
  sessionId: string | undefined,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery({
    queryKey: queryKeys.sessions.analysis(sessionId!),
    queryFn: () => SessionService.getSessionDetails(sessionId!),
    enabled: !!sessionId,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - analysis rarely changes
    ...options,
  })
}

/**
 * Hook to fetch session transcript
 *
 * @param sessionId - The session ID
 * @param options - Additional react-query options
 *
 * @example
 * const { data: transcript } = useSessionTranscript(sessionId)
 */
export function useSessionTranscript(
  sessionId: string | undefined,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery({
    queryKey: queryKeys.sessions.transcript(sessionId!),
    queryFn: async () => {
      return await ApiClient.get(
        `${BACKEND_URL}/sessions/${sessionId}/transcript`,
      )
    },
    enabled: !!sessionId,
    staleTime: 10 * 60 * 1000, // 10 minutes
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
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery({
    queryKey: queryKeys.sessions.notes(sessionId!),
    queryFn: async () => {
      return await ApiClient.get(`${BACKEND_URL}/sessions/${sessionId}/notes`)
    },
    enabled: !!sessionId,
    staleTime: 3 * 60 * 1000, // 3 minutes (notes can be edited frequently)
    ...options,
  })
}
