import { useQuery } from '@tanstack/react-query'
import { SessionSharesService } from '@/services/session-shares-service'
import { queryKeys } from '@/lib/query-client'

export function useSessionShares(
  sessionId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: sessionId
      ? queryKeys.sessionShares.list(sessionId)
      : ['session-shares', 'disabled'],
    queryFn: () => SessionSharesService.list(sessionId as string),
    enabled: !!sessionId && (options?.enabled ?? true),
    staleTime: 60 * 1000,
  })
}

export function useCoachSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.coachSearch.query(query),
    queryFn: () => SessionSharesService.searchCoaches(query),
    enabled,
    staleTime: 30 * 1000,
  })
}
