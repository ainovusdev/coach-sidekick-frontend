import { useQuery } from '@tanstack/react-query'
import { QuestionnaireService } from '@/services/questionnaire-service'
import type {
  ScheduledSession,
  QuestionnaireResponseView,
} from '@/types/questionnaire'

export const questionnaireKeys = {
  upcoming: (clientId?: string) =>
    ['questionnaire', 'upcoming', clientId] as const,
  responses: (sessionId: string, clientId?: string) =>
    ['questionnaire', 'responses', sessionId, clientId] as const,
  thrillFormResponses: (sessionId: string, clientId?: string) =>
    ['questionnaire', 'thrill-form-responses', sessionId, clientId] as const,
}

export function useUpcomingSessions(clientId?: string) {
  return useQuery<ScheduledSession[]>({
    queryKey: questionnaireKeys.upcoming(clientId),
    queryFn: () => QuestionnaireService.getUpcomingSessions(clientId),
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function useQuestionnaireResponses(
  sessionId: string | undefined,
  clientId?: string,
) {
  return useQuery<QuestionnaireResponseView[]>({
    queryKey: questionnaireKeys.responses(sessionId || '', clientId),
    queryFn: () =>
      QuestionnaireService.getResponses(sessionId!, clientId, 'pre_session'),
    enabled: !!sessionId,
    staleTime: 60 * 1000, // 1 minute
  })
}

export function useThrillFormResponses(
  sessionId: string | undefined,
  clientId?: string,
) {
  return useQuery<QuestionnaireResponseView[]>({
    queryKey: questionnaireKeys.thrillFormResponses(sessionId || '', clientId),
    queryFn: () =>
      QuestionnaireService.getResponses(sessionId!, clientId, 'post_session'),
    enabled: !!sessionId,
    staleTime: 60 * 1000,
  })
}
