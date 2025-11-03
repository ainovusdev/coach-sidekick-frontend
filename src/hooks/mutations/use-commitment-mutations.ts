import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CommitmentService } from '@/services/commitment-service'
import {
  CommitmentCreate,
  CommitmentUpdate,
  CommitmentUpdateCreate,
} from '@/types/commitment'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'

/**
 * Hook to create a new commitment with optimistic updates
 *
 * @example
 * const createCommitment = useCreateCommitment()
 * await createCommitment.mutateAsync({
 *   client_id: '123',
 *   title: 'Exercise 3x per week',
 *   type: 'behavior_change'
 * })
 */
export function useCreateCommitment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CommitmentCreate) =>
      CommitmentService.createCommitment(data),

    onSuccess: data => {
      // Invalidate all commitment queries
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })

      toast.success('Commitment created', {
        description: data.title,
      })
    },

    onError: err => {
      toast.error('Failed to create commitment', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },
  })
}

/**
 * Hook to update an existing commitment
 *
 * @example
 * const updateCommitment = useUpdateCommitment()
 * await updateCommitment.mutateAsync({
 *   commitmentId: '123',
 *   data: { status: 'completed' }
 * })
 */
export function useUpdateCommitment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      commitmentId,
      data,
    }: {
      commitmentId: string
      data: CommitmentUpdate
    }) => CommitmentService.updateCommitment(commitmentId, data),

    onMutate: async ({ commitmentId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.commitments.all })

      // Snapshot previous value
      const previousDetail = queryClient.getQueryData(
        queryKeys.commitments.detail(commitmentId),
      )

      // Optimistically update
      queryClient.setQueryData(
        queryKeys.commitments.detail(commitmentId),
        (old: any) => {
          if (!old) return old
          return { ...old, ...data }
        },
      )

      return { previousDetail, commitmentId }
    },

    onError: (err, _variables, context) => {
      // Rollback on error
      if (context?.previousDetail && context?.commitmentId) {
        queryClient.setQueryData(
          queryKeys.commitments.detail(context.commitmentId),
          context.previousDetail,
        )
      }

      toast.error('Failed to update commitment', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSuccess: data => {
      toast.success('Commitment updated', {
        description: data.title,
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })
    },
  })
}

/**
 * Hook to confirm a draft commitment
 *
 * @example
 * const confirmCommitment = useConfirmCommitment()
 * await confirmCommitment.mutateAsync('commitment-id-123')
 */
export function useConfirmCommitment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commitmentId: string) =>
      CommitmentService.confirmCommitment(commitmentId),

    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })

      toast.success('Commitment confirmed', {
        description: data.title,
      })
    },

    onError: err => {
      toast.error('Failed to confirm commitment', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },
  })
}

/**
 * Hook to discard/delete a commitment
 *
 * @example
 * const discardCommitment = useDiscardCommitment()
 * await discardCommitment.mutateAsync('commitment-id-123')
 */
export function useDiscardCommitment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commitmentId: string) =>
      CommitmentService.discardCommitment(commitmentId),

    onMutate: async commitmentId => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.commitments.all })

      // Get commitment name for toast
      const commitmentData: any = queryClient.getQueryData(
        queryKeys.commitments.detail(commitmentId),
      )
      const commitmentTitle = commitmentData?.title || 'Commitment'

      // Snapshot previous value
      const previousList = queryClient.getQueryData(
        queryKeys.commitments.lists(),
      )

      // Optimistically remove from list
      queryClient.setQueryData(queryKeys.commitments.lists(), (old: any) => {
        if (!old || !Array.isArray(old.commitments)) return old
        return {
          ...old,
          commitments: old.commitments.filter(
            (c: any) => c.id !== commitmentId,
          ),
          total: old.total - 1,
        }
      })

      return { previousList, commitmentTitle, commitmentId }
    },

    onError: (err, _commitmentId, context) => {
      // Rollback on error
      if (context?.previousList) {
        queryClient.setQueryData(
          queryKeys.commitments.lists(),
          context.previousList,
        )
      }

      toast.error('Failed to delete commitment', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSuccess: (_data, _commitmentId, context) => {
      toast.success('Commitment deleted', {
        description: context?.commitmentTitle,
      })
    },

    onSettled: (_data, _error, commitmentId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })
      queryClient.removeQueries({
        queryKey: queryKeys.commitments.detail(commitmentId),
      })
    },
  })
}

/**
 * Hook to update commitment progress
 *
 * @example
 * const updateProgress = useUpdateCommitmentProgress()
 * await updateProgress.mutateAsync({
 *   commitmentId: '123',
 *   data: { progress_percentage: 75, notes: 'Great progress!' }
 * })
 */
export function useUpdateCommitmentProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      commitmentId,
      data,
    }: {
      commitmentId: string
      data: CommitmentUpdateCreate
    }) => CommitmentService.updateProgress(commitmentId, data),

    onSuccess: data => {
      // Invalidate all commitment queries
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })

      toast.success('Progress updated', {
        description: `${data.title} - ${data.progress_percentage}% complete`,
      })
    },

    onError: err => {
      toast.error('Failed to update progress', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },
  })
}

/**
 * Hook to bulk confirm draft commitments
 *
 * @example
 * const bulkConfirm = useBulkConfirmCommitments()
 * await bulkConfirm.mutateAsync(['id1', 'id2', 'id3'])
 */
export function useBulkConfirmCommitments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commitmentIds: string[]) =>
      CommitmentService.bulkConfirm(commitmentIds),

    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })

      toast.success(`${data.length} commitments confirmed`, {
        description: 'All selected commitments have been confirmed',
      })
    },

    onError: err => {
      toast.error('Failed to confirm commitments', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },
  })
}

/**
 * Hook to bulk discard draft commitments
 *
 * @example
 * const bulkDiscard = useBulkDiscardCommitments()
 * await bulkDiscard.mutateAsync(['id1', 'id2', 'id3'])
 */
export function useBulkDiscardCommitments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commitmentIds: string[]) =>
      CommitmentService.bulkDiscard(commitmentIds),

    onSuccess: (_data, commitmentIds) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })

      toast.success(`${commitmentIds.length} commitments discarded`, {
        description: 'Selected commitments have been removed',
      })
    },

    onError: err => {
      toast.error('Failed to discard commitments', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },
  })
}
