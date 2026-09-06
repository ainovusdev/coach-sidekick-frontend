import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CommentService } from '@/services/comment-service'
import { invalidateQueries, queryKeys } from '@/lib/query-client'
import { nowUTC } from '@/lib/date-utils'
import { useAuth } from '@/contexts/auth-context'
import type {
  Comment,
  CommentListResponse,
  CommentPerson,
  CommentTargetType,
} from '@/types/comment'

type ListCache = CommentListResponse | undefined

/** Map over every comment (top-level and replies) in a thread. */
function mapThread(
  comments: Comment[],
  fn: (c: Comment) => Comment,
): Comment[] {
  return comments.map(c => {
    const next = fn(c)
    return next.replies ? { ...next, replies: next.replies.map(fn) } : next
  })
}

export interface CreateCommentVariables {
  body: string
  mentions: string[]
  parent_id?: string
  /** Same people as `mentions`, for the optimistic row only. */
  mentionPeople?: CommentPerson[]
}

/**
 * Post a comment (or a reply) on one target. Optimistic: the row appears at
 * the end of the thread (or of its parent's replies) before the server answers.
 */
export function useCreateComment(
  targetType: CommentTargetType,
  targetId: string,
) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const listKey = queryKeys.comments.list(targetType, targetId)

  return useMutation({
    mutationFn: ({ body, mentions, parent_id }: CreateCommentVariables) =>
      CommentService.create({
        target_type: targetType,
        target_id: targetId,
        body,
        mentions,
        parent_id,
      }),

    onMutate: async vars => {
      await queryClient.cancelQueries({ queryKey: listKey })
      const previous = queryClient.getQueryData<ListCache>(listKey)
      const now = nowUTC()
      const optimistic: Comment = {
        id: `optimistic-${Date.now()}`,
        target_type: targetType,
        target_id: targetId,
        parent_id: vars.parent_id ?? null,
        body: vars.body,
        author: {
          id: user?.id ?? 'current-user',
          name: user?.full_name ?? null,
          email: user?.email ?? '',
        },
        mentions: vars.mentionPeople ?? [],
        attachments: [],
        created_at: now,
        updated_at: now,
        edited_at: null,
        deleted_at: null,
        can_edit: false,
        can_delete: false,
        replies: [],
      }
      queryClient.setQueryData<ListCache>(listKey, old => {
        const base: CommentListResponse = old ?? {
          target_type: targetType,
          target_id: targetId,
          can_comment: true,
          comments: [],
        }
        if (!vars.parent_id) {
          return { ...base, comments: [...base.comments, optimistic] }
        }
        return {
          ...base,
          comments: base.comments.map(c =>
            c.id === vars.parent_id
              ? { ...c, replies: [...(c.replies ?? []), optimistic] }
              : c,
          ),
        }
      })
      return { previous, optimisticId: optimistic.id }
    },

    onError: (error: any, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous)
      toast.error(error?.message || 'Could not post the comment')
    },

    onSuccess: (created, _vars, context) => {
      // Swap the placeholder for the real row now (edit/delete rights, id)
      // rather than waiting for the refetch.
      queryClient.setQueryData<ListCache>(listKey, old =>
        old
          ? {
              ...old,
              comments: mapThread(old.comments, c =>
                c.id === context?.optimisticId
                  ? { ...created, replies: created.replies ?? c.replies ?? [] }
                  : c,
              ),
            }
          : old,
      )
      toast.success('Posted')
    },

    onSettled: () => {
      void invalidateQueries.afterCommentChange(
        queryClient,
        targetType,
        targetId,
      )
    },
  })
}

export interface UpdateCommentVariables {
  id: string
  body: string
  mentions: string[]
  mentionPeople?: CommentPerson[]
}

export function useUpdateComment(
  targetType: CommentTargetType,
  targetId: string,
) {
  const queryClient = useQueryClient()
  const listKey = queryKeys.comments.list(targetType, targetId)

  return useMutation({
    mutationFn: ({ id, body, mentions }: UpdateCommentVariables) =>
      CommentService.update(id, { body, mentions }),

    onMutate: async vars => {
      await queryClient.cancelQueries({ queryKey: listKey })
      const previous = queryClient.getQueryData<ListCache>(listKey)
      const now = nowUTC()
      queryClient.setQueryData<ListCache>(listKey, old =>
        old
          ? {
              ...old,
              comments: mapThread(old.comments, c =>
                c.id === vars.id
                  ? {
                      ...c,
                      body: vars.body,
                      mentions: vars.mentionPeople ?? c.mentions,
                      edited_at: now,
                      updated_at: now,
                    }
                  : c,
              ),
            }
          : old,
      )
      return { previous }
    },

    onError: (error: any, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous)
      toast.error(error?.message || 'Could not save the comment')
    },

    onSuccess: () => {
      toast.success('Saved')
    },

    onSettled: () => {
      void invalidateQueries.afterCommentChange(
        queryClient,
        targetType,
        targetId,
      )
    },
  })
}

export function useDeleteComment(
  targetType: CommentTargetType,
  targetId: string,
) {
  const queryClient = useQueryClient()
  const listKey = queryKeys.comments.list(targetType, targetId)

  return useMutation({
    mutationFn: (id: string) => CommentService.remove(id),

    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey: listKey })
      const previous = queryClient.getQueryData<ListCache>(listKey)
      const now = nowUTC()
      // Mirror the server: the row stays (replies keep their parent), body empties.
      queryClient.setQueryData<ListCache>(listKey, old =>
        old
          ? {
              ...old,
              comments: mapThread(old.comments, c =>
                c.id === id
                  ? { ...c, body: '', deleted_at: now, mentions: [] }
                  : c,
              ),
            }
          : old,
      )
      return { previous }
    },

    onError: (error: any, _id, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous)
      toast.error(error?.message || 'Could not delete the comment')
    },

    onSuccess: () => {
      toast.success('Deleted')
    },

    onSettled: () => {
      void invalidateQueries.afterCommentChange(
        queryClient,
        targetType,
        targetId,
      )
    },
  })
}
