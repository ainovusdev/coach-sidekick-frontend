import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QuestionnaireService } from '@/services/questionnaire-service'
import { questionnaireKeys } from '@/hooks/queries/use-questionnaire'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'
import type { ScheduleSessionRequest } from '@/types/questionnaire'

export function useScheduleSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ScheduleSessionRequest) =>
      QuestionnaireService.scheduleSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionnaireKeys.upcoming })
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all })
      toast.success('Session scheduled successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to schedule session')
    },
  })
}

export function useSendQuestionnaire() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      clientId,
    }: {
      sessionId: string
      clientId: string
    }) => QuestionnaireService.sendQuestionnaire(sessionId, clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionnaireKeys.upcoming })
      toast.success('Questionnaire sent successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send questionnaire')
    },
  })
}

export function useStartSessionBot() {
  return useMutation({
    mutationFn: ({
      sessionId,
      meetingUrl,
      botName,
    }: {
      sessionId: string
      meetingUrl: string
      botName?: string
    }) => QuestionnaireService.startBot(sessionId, meetingUrl, botName),
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start bot')
    },
  })
}
