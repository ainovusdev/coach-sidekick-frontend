import { useQuery } from '@tanstack/react-query'
import { QuestionnaireService } from '@/services/questionnaire-service'
import type {
  ScheduledSession,
  QuestionnaireResponseView,
  ThrillFormStatusView,
  PreSessionPrep,
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
  clientPreSession: () => ['questionnaire', 'client-pre-session'] as const,
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

// Pre-session prep questions for the logged-in client's next session — powers
// the on-demand prep form on the client portal dashboard.
export function useClientPreSession() {
  return useQuery<PreSessionPrep>({
    queryKey: questionnaireKeys.clientPreSession(),
    queryFn: () => QuestionnaireService.getClientPreSession(),
    staleTime: 30 * 1000,
  })
}
