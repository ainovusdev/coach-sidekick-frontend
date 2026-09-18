import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import posthog from 'posthog-js'
import { invalidateQueries } from '@/lib/query-client'
import { SandboxService } from '@/services/sandbox-service'
import { sandboxErrorDetail } from '@/hooks/mutations/use-sandbox-mutations'
import type {
  OutcomeCreate,
  OutcomeDecision,
  OutcomeUpdate,
} from '@/types/sandbox-outcomes'

function fail(error: unknown, fallback: string) {
  const detail = sandboxErrorDetail(error)
  const e = error as Error & { detail?: unknown }
  const message =
    detail?.message ||
    (typeof e?.detail === 'string' ? e.detail : '') ||
    e?.message ||
    fallback
  toast.error(message)
}

export function useCreateOutcome(sandboxId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: OutcomeCreate) =>
      SandboxService.createOutcome(sandboxId, data),
    onSuccess: (outcome, data) => {
      posthog.capture('sandbox_outcome_created', {
        sandbox_id: sandboxId,
        proposed: !!data.propose,
      })
      toast.success(data.propose ? 'Outcome proposed' : 'Draft saved')
      invalidateQueries.afterOutcomeChange(queryClient, sandboxId)
    },
    onError: error => fail(error, 'Could not save the outcome'),
  })
}

export function useUpdateOutcome(sandboxId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      outcomeId,
      data,
    }: {
      outcomeId: string
      data: OutcomeUpdate
    }) => SandboxService.updateOutcome(sandboxId, outcomeId, data),
    onSuccess: () => {
      toast.success('Outcome updated')
      invalidateQueries.afterOutcomeChange(queryClient, sandboxId)
    },
    onError: error => fail(error, 'Could not update the outcome'),
  })
}

export function useProposeOutcome(sandboxId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (outcomeId: string) =>
      SandboxService.proposeOutcome(sandboxId, outcomeId),
    onSuccess: () => {
      posthog.capture('sandbox_outcome_proposed', { sandbox_id: sandboxId })
      toast.success('Outcome proposed')
      invalidateQueries.afterOutcomeChange(queryClient, sandboxId)
    },
    onError: error => fail(error, 'Could not propose the outcome'),
  })
}

export function useDecideOutcome(sandboxId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      outcomeId,
      data,
    }: {
      outcomeId: string
      data: OutcomeDecision
    }) => SandboxService.decideOutcome(sandboxId, outcomeId, data),
    onSuccess: (_o, { data }) => {
      posthog.capture('sandbox_outcome_decided', {
        sandbox_id: sandboxId,
        decision: data.decision,
      })
      toast.success(data.decision === 'seal' ? 'Gold sealed' : 'Sent back')
      invalidateQueries.afterOutcomeChange(queryClient, sandboxId)
    },
    onError: error => fail(error, 'Could not record the decision'),
  })
}

export function useReopenOutcome(sandboxId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      outcomeId,
      reason,
    }: {
      outcomeId: string
      reason: string
    }) => SandboxService.reopenOutcome(sandboxId, outcomeId, reason),
    onSuccess: () => {
      toast.success('Outcome reopened')
      invalidateQueries.afterOutcomeChange(queryClient, sandboxId)
    },
    onError: error => fail(error, 'Could not reopen the outcome'),
  })
}

export function useDeleteOutcome(sandboxId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (outcomeId: string) =>
      SandboxService.deleteOutcome(sandboxId, outcomeId),
    onSuccess: () => {
      toast.success('Outcome removed')
      invalidateQueries.afterOutcomeChange(queryClient, sandboxId)
    },
    onError: error => fail(error, 'Could not remove the outcome'),
  })
}
