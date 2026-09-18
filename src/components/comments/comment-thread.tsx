'use client'

/**
 * One comment thread on one target: list (oldest first, replies nested one
 * level) + composer. Mentions reach whoever `context` allows — the API decides
 * (coach, coachee, sandbox members); the composer only asks.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useFeatureFlagEnabled } from '@/hooks/use-feature-flag'
import { Skeleton } from '@/components/ui/skeleton'
import { useComments } from '@/hooks/queries/use-comments'
import {
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
} from '@/hooks/mutations/use-comment-mutations'
import { useViewerId } from '@/hooks/use-viewer-id'
import { cn } from '@/lib/utils'
import type { Comment, CommentTargetType } from '@/types/comment'
import type { PeopleContext } from '@/types/people'
import { CommentComposer, type CommentSubmission } from './comment-composer'
import { CommentList } from './comment-list'

interface CommentThreadProps {
  targetType: CommentTargetType
  targetId: string
  context: PeopleContext
  /** Thread embedded in the parent payload, shown while the list refreshes. */
  initialComments?: Comment[]
  /** Overrides the API's `can_comment` (e.g. a read-only surface). */
  canComment?: boolean
  /** Deep link: scroll this comment into view and ring it for two seconds. */
  highlightId?: string | null
  className?: string
}

export function CommentThread({
  targetType,
  targetId,
  context,
  initialComments,
  canComment: canCommentProp,
  highlightId,
  className,
}: CommentThreadProps) {
  // Behind the `comment-threads` flag: these threads mount inside four
  // pre-existing panels (vision, outcome, sprint, commitment) that every coach
  // and coachee already opens, so the flag has to stop the request too, not
  // just hide the section.
  const enabled = useFeatureFlagEnabled('comment-threads')
  const viewerId = useViewerId()
  const { data, isLoading } = useComments(targetType, targetId, {
    enabled,
    initialData: initialComments,
  })
  const createComment = useCreateComment(targetType, targetId)
  const updateComment = useUpdateComment(targetType, targetId)
  const deleteComment = useDeleteComment(targetType, targetId)

  const comments = data?.comments ?? []
  const canComment = canCommentProp ?? data?.can_comment ?? false

  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  // After the hooks above, so hook order never changes between renders.
  const flagOff = !enabled

  // --- deep-link flash ----------------------------------------------------
  const [flashId, setFlashId] = useState<string | null>(null)
  const handledRef = useRef<string | null>(null)
  useEffect(() => {
    if (!highlightId || handledRef.current === highlightId) return
    if (!data) return
    const el = document.getElementById(`comment-${highlightId}`)
    if (!el) return
    handledRef.current = highlightId
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setFlashId(highlightId)
    const t = window.setTimeout(() => setFlashId(null), 2000)
    return () => window.clearTimeout(t)
  }, [highlightId, data])

  // --- actions ------------------------------------------------------------
  const post = useCallback(
    (submission: CommentSubmission, parentId?: string) => {
      createComment.mutate({
        body: submission.body,
        mentions: submission.mentions,
        mentionPeople: submission.mentionPeople,
        parent_id: parentId,
      })
    },
    [createComment],
  )

  const onSubmitReply = useCallback(
    (parentId: string, submission: CommentSubmission) => {
      setReplyingTo(null)
      post(submission, parentId)
    },
    [post],
  )

  const onUpdate = useCallback(
    (id: string, submission: CommentSubmission) => {
      updateComment.mutate({
        id,
        body: submission.body,
        mentions: submission.mentions,
        mentionPeople: submission.mentionPeople,
      })
    },
    [updateComment],
  )

  const onDelete = useCallback(
    (id: string) => deleteComment.mutate(id),
    [deleteComment],
  )

  if (flagOff) return null

  return (
    <div data-testid="comment-thread" className={cn('space-y-3', className)}>
      {isLoading && !data ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-5/6" />
        </div>
      ) : (
        <CommentList
          comments={comments}
          context={context}
          viewerId={viewerId}
          canComment={canComment}
          flashId={flashId}
          replyingTo={replyingTo}
          onReply={setReplyingTo}
          onSubmitReply={onSubmitReply}
          onCancelReply={() => setReplyingTo(null)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}

      {canComment && (
        <CommentComposer
          context={context}
          onSubmit={submission => post(submission)}
          isPending={createComment.isPending}
        />
      )}
    </div>
  )
}
