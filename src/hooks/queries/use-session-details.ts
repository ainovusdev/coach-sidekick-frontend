import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { SessionService } from '@/services/session-service'
import { queryKeys } from '@/lib/query-client'

/**
 * Hook to fetch comprehensive session details with aggressive caching
 *
 * Features:
 * - Cached for 24 hours (session details rarely change)
 * - Returns session, transcript, analyses, and summary
 * - Instant loading from cache on subsequent visits
 *
 * @param sessionId - The session ID
 * @param options - Additional react-query options
 *
 * @example
 * const { data, isLoading } = useSessionDetails(sessionId)
 * const session = data?.session
 * const transcript = data?.transcript ?? []
 */
export function useSessionDetails(
  sessionId: string | undefined,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery({
    queryKey: [...queryKeys.sessions.detail(sessionId!), 'full-details'],
    queryFn: () => SessionService.getSessionDetails(sessionId!),
    enabled: !!sessionId,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - session details rarely change
    gcTime: 7 * 24 * 60 * 60 * 1000, // Keep in cache for 7 days
    ...options,
  })
}
