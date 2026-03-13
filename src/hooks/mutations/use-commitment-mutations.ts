import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CommitmentService } from '@/services/commitment-service'
import {
  CommitmentAttachment,
  CommitmentCreate,
  CommitmentUpdate,
  CommitmentUpdateCreate,
  MilestoneCreate,
} from '@/types/commitment'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'
import { nowUTC } from '@/lib/date-utils'

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

    onMutate: async newCommitment => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.commitments.all })

      // Create optimistic commitment with temporary ID
      const timestamp = nowUTC()
      const optimisticCommitment = {
        id: `temp-${Date.now()}`,
        ...newCommitment,
        status: 'active' as const,
        progress_percentage: 0,
        extracted_from_transcript: false,
        created_at: timestamp,
        updated_at: timestamp,
        is_coach_commitment: !!newCommitment.assigned_to_id,
      }

      // Get all commitment list queries and update them
      const allQueries = queryClient.getQueriesData<any>({
        queryKey: queryKeys.commitments.all,
      })

      // Store previous data for rollback
      const previousQueries = allQueries.map(([key, data]) => ({ key, data }))

      // Update each matching query
      allQueries.forEach(([queryKey, data]) => {
        if (data?.commitments && Array.isArray(data.commitments)) {
          queryClient.setQueryData(queryKey, {
            ...data,
            commitments: [optimisticCommitment, ...data.commitments],
            total: (data.total || 0) + 1,
          })
        }
      })

      return { optimisticCommitment, previousQueries }
    },

    onError: (err, _newCommitment, context) => {
      // Rollback on error - restore previous data
      if (context?.previousQueries) {
        context.previousQueries.forEach(({ key, data }) => {
          queryClient.setQueryData(key, data)
        })
      }

      toast.error('Failed to create commitment', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSuccess: data => {
      toast.success('Commitment created', {
        description: data.title,
      })
    },

    onSettled: () => {
      // Refetch to get the real data from server
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })
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
export function useUpdateCommitment(options?: { silent?: boolean }) {
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
      if (!options?.silent) {
        toast.success('Commitment updated', {
          description: data.title,
        })
      }
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

    onMutate: async ({ commitmentId, data }) => {
      const detailKey = queryKeys.commitments.detail(commitmentId)
      await queryClient.cancelQueries({ queryKey: detailKey })
      const previous = queryClient.getQueryData(detailKey)

      queryClient.setQueryData(detailKey, (old: any) => {
        if (!old) return old

        const optimisticUpdate = {
          id: `temp-${Date.now()}`,
          commitment_id: commitmentId,
          updated_by_id: 'current-user',
          progress_percentage: data.progress_percentage ?? null,
          status_change:
            data.progress_percentage === 100 && old.status === 'active'
              ? 'completed'
              : null,
          note: data.note || null,
          wins: data.wins || null,
          blockers: data.blockers || null,
          evidence_urls: data.evidence_urls || [],
          created_at: new Date().toISOString(),
        }

        return {
          ...old,
          progress_percentage:
            data.progress_percentage ?? old.progress_percentage,
          status:
            data.progress_percentage === 100 && old.status === 'active'
              ? 'completed'
              : old.status,
          updates: [...(old.updates || []), optimisticUpdate],
        }
      })

      return { previous, commitmentId }
    },

    onError: (err, _vars, context) => {
      if (context?.previous && context?.commitmentId) {
        queryClient.setQueryData(
          queryKeys.commitments.detail(context.commitmentId),
          context.previous,
        )
      }
      toast.error('Failed to update progress', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSuccess: () => {
      toast.success('Progress updated')
    },

    onSettled: (_data, _err, { commitmentId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.commitments.detail(commitmentId),
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

export function useAddMilestone(commitmentId: string) {
  const queryClient = useQueryClient()
  const detailKey = queryKeys.commitments.detail(commitmentId)

  return useMutation({
    mutationFn: (data: MilestoneCreate) =>
      CommitmentService.addMilestone(commitmentId, data),

    onMutate: async newMilestone => {
      await queryClient.cancelQueries({ queryKey: detailKey })
      const previous = queryClient.getQueryData(detailKey)

      queryClient.setQueryData(detailKey, (old: any) => {
        if (!old) return old
        const optimistic = {
          id: `temp-${Date.now()}`,
          commitment_id: commitmentId,
          title: newMilestone.title,
          description: newMilestone.description || null,
          target_date: newMilestone.target_date || null,
          completed_date: null,
          order_index:
            newMilestone.order_index ?? (old.milestones?.length || 0),
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        return {
          ...old,
          milestones: [...(old.milestones || []), optimistic],
        }
      })

      return { previous }
    },

    onError: (err, _data, context) => {
      if (context?.previous)
        queryClient.setQueryData(detailKey, context.previous)
      toast.error('Failed to add milestone', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })
      queryClient.invalidateQueries({ queryKey: detailKey })
    },
  })
}

export function useUpdateMilestone(commitmentId: string) {
  const queryClient = useQueryClient()
  const detailKey = queryKeys.commitments.detail(commitmentId)

  return useMutation({
    mutationFn: ({
      milestoneId,
      data,
    }: {
      milestoneId: string
      data: Partial<MilestoneCreate> & { status?: string }
    }) => CommitmentService.updateMilestone(commitmentId, milestoneId, data),

    onMutate: async ({ milestoneId, data }) => {
      await queryClient.cancelQueries({ queryKey: detailKey })
      const previous = queryClient.getQueryData(detailKey)

      queryClient.setQueryData(detailKey, (old: any) => {
        if (!old) return old
        return {
          ...old,
          milestones: (old.milestones || []).map((m: any) =>
            m.id === milestoneId
              ? {
                  ...m,
                  ...data,
                  completed_date:
                    data.status === 'completed'
                      ? m.completed_date || new Date().toISOString()
                      : data.status === 'pending'
                        ? null
                        : m.completed_date,
                  updated_at: new Date().toISOString(),
                }
              : m,
          ),
        }
      })

      return { previous }
    },

    onError: (err, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(detailKey, context.previous)
      toast.error('Failed to update milestone', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })
      queryClient.invalidateQueries({ queryKey: detailKey })
    },
  })
}

export function useDeleteMilestone(commitmentId: string) {
  const queryClient = useQueryClient()
  const detailKey = queryKeys.commitments.detail(commitmentId)

  return useMutation({
    mutationFn: (milestoneId: string) =>
      CommitmentService.deleteMilestone(commitmentId, milestoneId),

    onMutate: async milestoneId => {
      await queryClient.cancelQueries({ queryKey: detailKey })
      const previous = queryClient.getQueryData(detailKey)

      queryClient.setQueryData(detailKey, (old: any) => {
        if (!old) return old
        return {
          ...old,
          milestones: (old.milestones || []).filter(
            (m: any) => m.id !== milestoneId,
          ),
        }
      })

      return { previous }
    },

    onError: (err, _milestoneId, context) => {
      if (context?.previous)
        queryClient.setQueryData(detailKey, context.previous)
      toast.error('Failed to delete milestone', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })
      queryClient.invalidateQueries({ queryKey: detailKey })
    },
  })
}

// === Attachment Mutations ===

export function useUploadAttachment(commitmentId: string) {
  const queryClient = useQueryClient()
  const detailKey = queryKeys.commitments.detail(commitmentId)

  return useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File
      onProgress?: (percent: number) => void
    }) => CommitmentService.uploadAttachment(commitmentId, file, onProgress),

    onMutate: async ({ file }) => {
      await queryClient.cancelQueries({ queryKey: detailKey })
      const previous = queryClient.getQueryData(detailKey)

      // Optimistically add a temp attachment
      const tempAttachment: CommitmentAttachment & { uploading?: boolean } = {
        id: `temp-${Date.now()}`,
        filename: file.name,
        file_key: '',
        file_url: '',
        file_size: file.size,
        content_type: file.type || 'application/octet-stream',
        uploaded_by_id: 'current-user',
        uploaded_at: new Date().toISOString(),
        uploading: true,
      }

      queryClient.setQueryData(detailKey, (old: any) => {
        if (!old) return old
        return {
          ...old,
          attachments: [...(old.attachments || []), tempAttachment],
        }
      })

      return { previous }
    },

    onError: (err, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(detailKey, context.previous)
      toast.error('Failed to upload file', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSuccess: () => {
      toast.success('File uploaded')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })
      queryClient.invalidateQueries({ queryKey: detailKey })
    },
  })
}

export function useDeleteAttachment(commitmentId: string) {
  const queryClient = useQueryClient()
  const detailKey = queryKeys.commitments.detail(commitmentId)

  return useMutation({
    mutationFn: (attachmentId: string) =>
      CommitmentService.deleteAttachment(commitmentId, attachmentId),

    onMutate: async attachmentId => {
      await queryClient.cancelQueries({ queryKey: detailKey })
      const previous = queryClient.getQueryData(detailKey)

      queryClient.setQueryData(detailKey, (old: any) => {
        if (!old) return old
        return {
          ...old,
          attachments: (old.attachments || []).filter(
            (a: any) => a.id !== attachmentId,
          ),
        }
      })

      return { previous }
    },

    onError: (err, _attachmentId, context) => {
      if (context?.previous)
        queryClient.setQueryData(detailKey, context.previous)
      toast.error('Failed to remove attachment', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSuccess: () => {
      toast.success('Attachment removed')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })
      queryClient.invalidateQueries({ queryKey: detailKey })
    },
  })
}
