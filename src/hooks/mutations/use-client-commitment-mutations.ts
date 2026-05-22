import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ClientCommitmentService } from '@/services/client-commitment-service'
import {
  CommitmentAttachment,
  CommitmentUpdate,
  CommitmentUpdateCreate,
  MilestoneCreate,
} from '@/types/commitment'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'

export function useClientUpdateCommitment(options?: { silent?: boolean }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      commitmentId,
      data,
    }: {
      commitmentId: string
      data: CommitmentUpdate
    }) => ClientCommitmentService.updateCommitment(commitmentId, data as any),

    onMutate: async ({ commitmentId, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.commitments.all })
      const previousDetail = queryClient.getQueryData(
        queryKeys.commitments.detail(commitmentId),
      )

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

export function useClientDiscardCommitment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commitmentId: string) =>
      ClientCommitmentService.deleteCommitment(commitmentId),

    onMutate: async commitmentId => {
      await queryClient.cancelQueries({ queryKey: queryKeys.commitments.all })

      const commitmentData: any = queryClient.getQueryData(
        queryKeys.commitments.detail(commitmentId),
      )
      const commitmentTitle = commitmentData?.title || 'Commitment'

      const previousList = queryClient.getQueryData(
        queryKeys.commitments.lists(),
      )

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

export function useClientUpdateCommitmentProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      commitmentId,
      data,
    }: {
      commitmentId: string
      data: CommitmentUpdateCreate
    }) => ClientCommitmentService.updateProgress(commitmentId, data),

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

export function useClientAddMilestone(commitmentId: string) {
  const queryClient = useQueryClient()
  const detailKey = queryKeys.commitments.detail(commitmentId)

  return useMutation({
    mutationFn: (data: MilestoneCreate) =>
      ClientCommitmentService.addMilestone(commitmentId, data),

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

export function useClientUpdateMilestone(commitmentId: string) {
  const queryClient = useQueryClient()
  const detailKey = queryKeys.commitments.detail(commitmentId)

  return useMutation({
    mutationFn: ({
      milestoneId,
      data,
    }: {
      milestoneId: string
      data: Partial<MilestoneCreate> & { status?: string }
    }) =>
      ClientCommitmentService.updateMilestone(commitmentId, milestoneId, data),

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

export function useClientDeleteMilestone(commitmentId: string) {
  const queryClient = useQueryClient()
  const detailKey = queryKeys.commitments.detail(commitmentId)

  return useMutation({
    mutationFn: (milestoneId: string) =>
      ClientCommitmentService.deleteMilestone(commitmentId, milestoneId),

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

export function useClientUploadAttachment(commitmentId: string) {
  const queryClient = useQueryClient()
  const detailKey = queryKeys.commitments.detail(commitmentId)

  return useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File
      onProgress?: (percent: number) => void
    }) =>
      ClientCommitmentService.uploadAttachment(commitmentId, file, onProgress),

    onMutate: async ({ file }) => {
      await queryClient.cancelQueries({ queryKey: detailKey })
      const previous = queryClient.getQueryData(detailKey)

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

    onSuccess: data => {
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

export function useClientDeleteAttachment(commitmentId: string) {
  const queryClient = useQueryClient()
  const detailKey = queryKeys.commitments.detail(commitmentId)

  return useMutation({
    mutationFn: (attachmentId: string) =>
      ClientCommitmentService.deleteAttachment(commitmentId, attachmentId),

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
