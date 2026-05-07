import { useQuery } from '@tanstack/react-query'
import {
  CoachEvaluationsService,
  CoachEvaluation,
} from '@/services/coach-evaluations-service'
import { queryKeys } from '@/lib/query-client'

/**
 * List evaluations for a session. Owner/admin get all rows; non-owner
 * reviewers get only their own (server-side filter).
 */
export function useCoachEvaluations(
  sessionId: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery<CoachEvaluation[]>({
    queryKey: queryKeys.coachEvaluations.list(sessionId ?? ''),
    queryFn: () => CoachEvaluationsService.list(sessionId!),
    enabled: !!sessionId && (options?.enabled ?? true),
    staleTime: 30 * 1000,
  })
}
