'use client'

import type { Comment } from '@/types/comment'
import type { PeopleContext } from '@/types/people'
import { CommentItem, type CommentItemActions } from './comment-item'
import type { CommentSubmission } from './comment-composer'

interface CommentListProps extends CommentItemActions {
  comments: Comment[]
  context: PeopleContext
  viewerId: string | null
  canComment: boolean
  flashId: string | null
  replyingTo: string | null
  onSubmitReply: (parentId: string, submission: CommentSubmission) => void
  onCancelReply: () => void
}

export function CommentList({ comments, flashId, ...rest }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="py-2 text-center text-sm text-ink-4">No comments yet</p>
    )
  }
  return (
    <div className="space-y-1" data-testid="comment-list">
      {comments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          depth={0}
          flash={flashId === comment.id}
          flashId={flashId}
          {...rest}
        />
      ))}
    </div>
  )
}
