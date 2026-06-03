import { useQuery } from '@tanstack/react-query'
import { QuestionnaireService } from '@/services/questionnaire-service'
import type {
  ScheduledSession,
  QuestionnaireResponseView,
  ThrillFormStatusView,
} from '@/types/questionnaire'

export const questionnaireKeys = {
  upcoming: (clientId?: string) =>
    ['questionnaire', 'upcoming', clientId] as const,
  responses: (sessionId: string, clientId?: string) =>
    ['questionnaire', 'responses', sessionId, clientId] as const,
  thrillFormResponses: (sessionId: string, clientId?: string) =>
    ['questionnaire', 'thrill-form-responses', sessionId, clientId] as const,
  thrillForm: (sessionId: string, clientId?: string) =>
    ['questionnaire', 'thrill-form', sessionId, clientId] as const,
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

// Thrill Form status — includes the "sent but not yet completed" state that the
// raw responses list can't express (no response row exists until the client
// opens the form).
export function useThrillForm(
  sessionId: string | undefined,
  clientId?: string,
) {
  return useQuery<ThrillFormStatusView>({
    queryKey: questionnaireKeys.thrillForm(sessionId || '', clientId),
    queryFn: () => QuestionnaireService.getThrillForm(sessionId!, clientId),
    enabled: !!sessionId,
    staleTime: 60 * 1000,
  })
}
