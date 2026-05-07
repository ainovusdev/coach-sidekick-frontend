import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  VideoComment,
  VideoCommentsService,
} from '@/services/video-comments-service'
import { queryKeys } from '@/lib/query-client'

export function useCreateVideoComment(sessionId: string) {
  const queryClient = useQueryClient()
  const key = queryKeys.videoComments.list(sessionId)

  return useMutation({
    mutationFn: (data: {
      content: string
      video_offset_seconds: number
      parent_id?: string | null
    }) => VideoCommentsService.create(sessionId, data),

    onMutate: async data => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<VideoComment[]>(key)
      const optimistic: VideoComment = {
        id: `temp-${Date.now()}`,
        session_id: sessionId,
        author_id: 'me',
        author_name: 'You',
        author_email: null,
        content: data.content,
        video_offset_seconds: data.video_offset_seconds,
        parent_id: data.parent_id ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      queryClient.setQueryData<VideoComment[]>(key, old => {
        const next = [...(old ?? []), optimistic]
        next.sort((a, b) => a.video_offset_seconds - b.video_offset_seconds)
        return next
      })
      return { previous }
    },

    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      toast.error('Failed to add comment', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

export function useUpdateVideoComment(sessionId: string) {
  const queryClient = useQueryClient()
  const key = queryKeys.videoComments.list(sessionId)

  return useMutation({
    mutationFn: ({
      commentId,
      content,
    }: {
      commentId: string
      content: string
    }) => VideoCommentsService.update(sessionId, commentId, { content }),

    onMutate: async ({ commentId, content }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<VideoComment[]>(key)
      queryClient.setQueryData<VideoComment[]>(key, old =>
        (old ?? []).map(c =>
          c.id === commentId
            ? { ...c, content, updated_at: new Date().toISOString() }
            : c,
        ),
      )
      return { previous }
    },

    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      toast.error('Failed to update comment', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

export function useDeleteVideoComment(sessionId: string) {
  const queryClient = useQueryClient()
  const key = queryKeys.videoComments.list(sessionId)

  return useMutation({
    mutationFn: (commentId: string) =>
      VideoCommentsService.delete(sessionId, commentId),

    onMutate: async commentId => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<VideoComment[]>(key)
      queryClient.setQueryData<VideoComment[]>(key, old =>
        (old ?? []).filter(c => c.id !== commentId),
      )
      return { previous }
    },

    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      toast.error('Failed to delete comment', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
