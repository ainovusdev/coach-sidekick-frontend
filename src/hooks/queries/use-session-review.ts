import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { SessionService } from '@/services/session-service'
import { queryKeys } from '@/lib/query-client'

export type SessionReviewResponse = Awaited<
  ReturnType<typeof SessionService.getSessionReview>
>

/**
 * Fetch the narrow "review" payload for a session — video URL + anchor +
 * transcript + a few flags. No summary, notes, or AI analysis.
 *
 * Backed by `GET /sessions/{id}/review`, gated via `can_view_session()`,
 * so accessible to owner/admin/share recipients/share-with-all-coaches.
 */
export function useSessionReview(
  sessionId: string | undefined,
  options?: Omit<
    UseQueryOptions<SessionReviewResponse>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  return useQuery({
    queryKey: queryKeys.sessions.review(sessionId!),
    queryFn: () => SessionService.getSessionReview(sessionId!),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}
