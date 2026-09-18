'use client'

import { useState } from 'react'
import { MessageSquare, Pencil, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { formatDate, formatRelativeTime } from '@/lib/date-utils'
import { commentPersonName, type Comment } from '@/types/comment'
import type { PeopleContext } from '@/types/people'
import { CommentBody } from './comment-body'
import { CommentComposer, type CommentSubmission } from './comment-composer'

export interface CommentItemActions {
  onReply: (parentId: string) => void
  onUpdate: (id: string, submission: CommentSubmission) => void
  onDelete: (id: string) => void
}

interface CommentItemProps extends CommentItemActions {
  comment: Comment
  context: PeopleContext
  viewerId: string | null
  canComment: boolean
  depth: 0 | 1
  /** Two-second ring after a deep link. */
  flash: boolean
  replyingTo: string | null
  onSubmitReply: (parentId: string, submission: CommentSubmission) => void
  onCancelReply: () => void
  flashId: string | null
}

function initials(name: string) {
  const parts = name
    .trim()
    .split(/[\s@._-]+/)
    .filter(Boolean)
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase()
}

function IconButton({
  label,
  testId,
  onClick,
  danger,
  children,
}: {
  label: string
  testId: string
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      data-testid={testId}
      onClick={onClick}
      className={cn(
        'rounded-md p-1 text-ink-3 transition-colors hover:bg-surface-3',
        danger ? 'hover:text-vermillion' : 'hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

export function CommentItem(props: CommentItemProps) {
  const {
    comment,
    context,
    viewerId,
    canComment,
    depth,
    flash,
    replyingTo,
    onReply,
    onUpdate,
    onDelete,
    onSubmitReply,
    onCancelReply,
    flashId,
  } = props
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const deleted = !!comment.deleted_at
  const author = commentPersonName(comment.author)
  const isOptimistic = comment.id.startsWith('optimistic-')
  // A reply to a reply threads under the top-level parent (depth is 1 max).
  const replyTarget =
    depth === 0 ? comment.id : (comment.parent_id ?? comment.id)
  const replies = depth === 0 ? (comment.replies ?? []) : []
  const isReplying = depth === 0 && replyingTo === comment.id

  return (
    <div
      id={`comment-${comment.id}`}
      data-testid="comment-item"
      data-comment={comment.id}
      className={cn(
        'group/comment -mx-2 rounded-lg px-2 py-1.5 transition-shadow duration-300',
        flash && 'ring-2 ring-amber-token',
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full bg-surface-3 font-medium text-ink-3',
            depth === 0 ? 'h-7 w-7 text-[11px]' : 'h-6 w-6 text-[10px]',
          )}
          aria-hidden
        >
          {initials(author)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs leading-6">
            <span className="truncate font-medium text-ink">
              {comment.author.id === viewerId ? 'You' : author}
            </span>
            <span className="text-ink-4">·</span>
            <span
              className="shrink-0 text-ink-3"
              title={formatDate(comment.created_at, 'PPp')}
            >
              {isOptimistic
                ? 'just now'
                : formatRelativeTime(comment.created_at)}
            </span>
            {comment.edited_at && !deleted && (
              <span className="text-ink-4">(edited)</span>
            )}

            {!deleted && !editing && !isOptimistic && (
              <div className="ml-auto flex items-center gap-0.5 opacity-100 md:opacity-0 md:transition-opacity md:group-hover/comment:opacity-100 md:group-focus-within/comment:opacity-100">
                {canComment && (
                  <IconButton
                    label="Reply"
                    testId="comment-reply"
                    onClick={() => onReply(replyTarget)}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </IconButton>
                )}
                {comment.can_edit && (
                  <IconButton
                    label="Edit"
                    testId="comment-edit"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </IconButton>
                )}
                {comment.can_delete && (
                  <IconButton
                    label="Delete"
                    testId="comment-delete"
                    onClick={() => setConfirmDelete(true)}
                    danger
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconButton>
                )}
              </div>
            )}
          </div>

          {deleted ? (
            <p className="text-sm italic text-ink-4">Comment deleted</p>
          ) : editing ? (
            <CommentComposer
              context={context}
              initialContent={comment.body}
              submitLabel="Save"
              autoFocus
              className="mt-1"
              onSubmit={submission => {
                setEditing(false)
                onUpdate(comment.id, submission)
              }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <CommentBody html={comment.body} viewerId={viewerId} />
          )}
        </div>
      </div>

      {(replies.length > 0 || isReplying) && (
        <div className="ml-[38px] mt-1 space-y-1 border-l border-line pl-3">
          {replies.map(reply => (
            <CommentItem
              key={reply.id}
              {...props}
              comment={reply}
              depth={1}
              flash={flashId === reply.id}
            />
          ))}
          {isReplying && (
            <CommentComposer
              context={context}
              placeholder={`Reply to ${author}…`}
              submitLabel="Reply"
              autoFocus
              className="pt-1"
              onSubmit={submission => onSubmitReply(comment.id, submission)}
              onCancel={onCancelReply}
            />
          )}
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="z-[80]" overlayClassName="z-[80]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
            <AlertDialogDescription>
              {replies.length > 0
                ? 'The replies stay; the comment itself is removed for everyone.'
                : 'It is removed for everyone. This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="comment-delete-confirm"
              className="bg-vermillion text-ink-on-dark hover:bg-vermillion/90"
              onClick={() => onDelete(comment.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
