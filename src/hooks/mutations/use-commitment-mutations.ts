import { useMutation, useQueryClient } from '@tanstack/react-query'
import posthog from 'posthog-js'
import { CommitmentService } from '@/services/commitment-service'
import {
  Commitment,
  CommitmentAttachment,
  CommitmentCreate,
  CommitmentUpdate,
  CommitmentUpdateCreate,
  MilestoneCreate,
} from '@/types/commitment'
import { invalidateQueries, queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'
import { nowUTC } from '@/lib/date-utils'
import { useAuth } from '@/contexts/auth-context'
import { assigneeOf } from '@/lib/commitments/assignee'

/**
 * "Assigned to Priya" when the row went to someone other than the actor;
 * null otherwise (own list, or the client themself — nothing to announce).
 */
function assignedToast(
  commitment: {
    assignee?: any
    assigned_to_id?: string | null
    assigned_to_name?: string | null
    client_id?: string | null
    client_name?: string | null
  },
  currentUserId: string | null,
): string | null {
  const a = assigneeOf(commitment)
  if (!a?.user_id || a.user_id === currentUserId) return null
  return `Assigned to ${a.name || a.email || 'them'}`
}

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
  const { userId: currentUserId } = useAuth()

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
        assignee_kind: newCommitment.assigned_to_id
          ? 'user'
          : newCommitment.client_id
            ? 'client'
            : 'none',
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

      toast.error("Couldn't create", {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSuccess: data => {
      posthog.capture('commitment_created', {
        commitment_id: data.id,
        commitment_type: data.type ?? null,
        client_id: data.client_id ?? null,
        assignee_kind: data.assignee_kind ?? null,
      })
      toast.success(assignedToast(data, currentUserId) ?? 'Created', {
        description: data.title,
      })
    },

    onSettled: () => {
      // Refetch to get the real data from server; the assignee's bell too.
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      // A sandbox cockpit shows commitment counts on its timeline cards.
      queryClient.invalidateQueries({ queryKey: queryKeys.sandboxes.details() })
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
  const { userId: currentUserId } = useAuth()

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

      toast.error("Couldn't save", {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSuccess: (data, { data: patch }) => {
      // Reassignment always confirms who it went to, even on silent surfaces —
      // that is the one change the person can't see on the row they're editing.
      const assigned =
        patch.assigned_to_id !== undefined
          ? assignedToast(data, currentUserId)
          : null
      if (assigned) {
        toast.success(assigned, { description: data.title })
      } else if (!options?.silent) {
        toast.success('Saved', { description: data.title })
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      // A sandbox cockpit shows commitment counts on its timeline cards.
      queryClient.invalidateQueries({ queryKey: queryKeys.sandboxes.details() })
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

      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      // A sandbox cockpit shows commitment counts on its timeline cards.
      queryClient.invalidateQueries({ queryKey: queryKeys.sandboxes.details() })

      toast.success('Confirmed', {
        description: data.title,
      })
    },

    onError: err => {
      toast.error("Couldn't confirm", {
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
      const commitmentTitle = commitmentData?.title

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

      toast.error("Couldn't delete", {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSuccess: (_data, _commitmentId, context) => {
      toast.success('Deleted', {
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
      toast.error("Couldn't save progress", {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSuccess: (data, { commitmentId, data: updateData }) => {
      if (updateData.progress_percentage === 100) {
        posthog.capture('commitment_completed', {
          commitment_id: commitmentId,
        })
      }
      toast.success('Progress saved')
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

      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      // A sandbox cockpit shows commitment counts on its timeline cards.
      queryClient.invalidateQueries({ queryKey: queryKeys.sandboxes.details() })

      toast.success(`${data.length} confirmed`)
    },

    onError: err => {
      toast.error("Couldn't confirm", {
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

      toast.success(`${commitmentIds.length} discarded`)
    },

    onError: err => {
      toast.error("Couldn't discard", {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },
  })
}

// ---------------------------------------------------------------------------
// Related commitments (symmetric). `related` is the row being related when the
// caller already has it, so the parent's list can show it before the server
// answers.
// ---------------------------------------------------------------------------

export interface RelateVariables {
  commitmentId: string
  relatedId: string
  related?: Commitment
  sandboxId?: string | null
}

function addRelated(old: any, row: Commitment | undefined, relatedId: string) {
  if (!old) return old
  const present = (old.related ?? []).some(
    (r: Commitment) => r.id === relatedId,
  )
  if (present) return old
  return {
    ...old,
    related: row ? [...(old.related ?? []), row] : old.related,
    related_total: (old.related_total ?? 0) + 1,
    related_done:
      (old.related_done ?? 0) + (row?.status === 'completed' ? 1 : 0),
  }
}

function dropRelated(old: any, relatedId: string) {
  if (!old) return old
  const gone = (old.related ?? []).find((r: Commitment) => r.id === relatedId)
  return {
    ...old,
    related: (old.related ?? []).filter((r: Commitment) => r.id !== relatedId),
    related_total: Math.max(0, (old.related_total ?? 0) - 1),
    related_done: Math.max(
      0,
      (old.related_done ?? 0) - (gone?.status === 'completed' ? 1 : 0),
    ),
  }
}

export function useRelateCommitment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ commitmentId, relatedId }: RelateVariables) =>
      CommitmentService.relateCommitment(commitmentId, relatedId),
    onMutate: async ({ commitmentId, relatedId, related }) => {
      const key = queryKeys.commitments.detail(commitmentId)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (old: any) =>
        addRelated(old, related, relatedId),
      )
      return { previous, key }
    },
    onError: (err, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(context.key, context.previous)
      toast.error("Couldn't relate", {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },
    onSettled: (_data, _err, { sandboxId }) =>
      invalidateQueries.afterCommitmentChange(queryClient, { sandboxId }),
  })
}

export function useUnrelateCommitment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ commitmentId, relatedId }: RelateVariables) =>
      CommitmentService.unrelateCommitment(commitmentId, relatedId),
    onMutate: async ({ commitmentId, relatedId }) => {
      const key = queryKeys.commitments.detail(commitmentId)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (old: any) => dropRelated(old, relatedId))
      return { previous, key }
    },
    onError: (err, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(context.key, context.previous)
      toast.error("Couldn't unrelate", {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },
    onSettled: (_data, _err, { sandboxId }) =>
      invalidateQueries.afterCommitmentChange(queryClient, { sandboxId }),
  })
}

export { addRelated as _addRelated, dropRelated as _dropRelated }

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
      toast.error("Couldn't add milestone", {
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
      toast.error("Couldn't save milestone", {
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
      toast.error("Couldn't delete milestone", {
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
      toast.error("Couldn't upload", {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSuccess: data => {
      // Immediately replace temp attachment with the real one from server
      queryClient.setQueryData(detailKey, (old: any) => {
        if (!old) return old
        return {
          ...old,
          attachments: [
            ...(old.attachments || []).filter(
              (a: any) => !a.id?.startsWith('temp-'),
            ),
            data,
          ],
        }
      })
      toast.success('File uploaded')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })
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
      toast.error("Couldn't remove attachment", {
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
