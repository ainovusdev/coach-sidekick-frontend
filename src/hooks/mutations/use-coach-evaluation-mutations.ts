import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  CoachEvaluation,
  CoachEvaluationCreatePayload,
  CoachEvaluationUpdatePayload,
  CoachEvaluationsService,
} from '@/services/coach-evaluations-service'
import { queryKeys } from '@/lib/query-client'

export function useCreateCoachEvaluation(sessionId: string) {
  const queryClient = useQueryClient()
  const key = queryKeys.coachEvaluations.list(sessionId)

  return useMutation({
    mutationFn: (payload: CoachEvaluationCreatePayload) =>
      CoachEvaluationsService.create(sessionId, payload),

    onSuccess: evaluation => {
      queryClient.setQueryData<CoachEvaluation[]>(key, old => {
        const others = (old ?? []).filter(e => e.id !== evaluation.id)
        return [evaluation, ...others]
      })
      toast.success('Evaluation submitted')
    },

    onError: err => {
      const message = err instanceof Error ? err.message : 'Please try again'
      toast.error('Failed to submit evaluation', { description: message })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

export function useUpdateCoachEvaluation(sessionId: string) {
  const queryClient = useQueryClient()
  const key = queryKeys.coachEvaluations.list(sessionId)

  return useMutation({
    mutationFn: ({
      evaluationId,
      payload,
    }: {
      evaluationId: string
      payload: CoachEvaluationUpdatePayload
    }) => CoachEvaluationsService.update(sessionId, evaluationId, payload),

    onSuccess: evaluation => {
      queryClient.setQueryData<CoachEvaluation[]>(key, old =>
        (old ?? []).map(e => (e.id === evaluation.id ? evaluation : e)),
      )
      toast.success('Evaluation updated')
    },

    onError: err => {
      toast.error('Failed to update evaluation', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

export function useDeleteCoachEvaluation(sessionId: string) {
  const queryClient = useQueryClient()
  const key = queryKeys.coachEvaluations.list(sessionId)

  return useMutation({
    mutationFn: (evaluationId: string) =>
      CoachEvaluationsService.delete(sessionId, evaluationId),

    onSuccess: (_data, evaluationId) => {
      queryClient.setQueryData<CoachEvaluation[]>(key, old =>
        (old ?? []).filter(e => e.id !== evaluationId),
      )
      toast.success('Evaluation deleted')
    },

    onError: err => {
      toast.error('Failed to delete evaluation', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
