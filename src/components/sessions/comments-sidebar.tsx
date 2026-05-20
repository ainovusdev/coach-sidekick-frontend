'use client'

import {
  forwardRef,
  KeyboardEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  MessageSquare,
  Trash2,
  Pencil,
  Clock,
  X,
  Check,
  CornerDownRight,
  Reply,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { formatVideoOffset } from '@/hooks/use-synced-transcript'
import { VideoComment } from '@/services/video-comments-service'

export type CommentsSidebarHandle = {
  focusComposer: (atSeconds?: number) => void
}

interface CommentsSidebarProps {
  sessionId: string
  comments: VideoComment[]
  isLoading?: boolean
  currentUserId: string | null | undefined
  isAdmin: boolean
  currentTimeSec: number
  getCurrentTime: () => number
  /** False on transcript-only sessions; suppresses playback affordances. */
  hasPlayableVideo?: boolean
  onSeek: (offsetSec: number) => void
  onPause: () => void
  onResume: () => void
  isPlayingRef: React.MutableRefObject<boolean>
  onCreate: (data: {
    content: string
    video_offset_seconds: number
    parent_id?: string | null
  }) => Promise<unknown>
  onUpdate: (commentId: string, content: string) => Promise<unknown>
  onDelete: (commentId: string) => Promise<unknown>
  className?: string
}

type ThreadedComment = VideoComment & { replies: VideoComment[] }

function parseClock(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const parts = trimmed.split(':').map(p => p.trim())
  if (parts.some(p => !/^\d+$/.test(p))) return null
  const nums = parts.map(Number)
  if (nums.length === 1) return nums[0]
  if (nums.length === 2) return nums[0] * 60 + nums[1]
  if (nums.length === 3) return nums[0] * 3600 + nums[1] * 60 + nums[2]
  return null
}

function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true })
  } catch {
    return ''
  }
}

export const CommentsSidebar = forwardRef<
  CommentsSidebarHandle,
  CommentsSidebarProps
>(function CommentsSidebar(
  {
    sessionId,
    comments,
    isLoading,
    currentUserId,
    isAdmin,
    currentTimeSec,
    getCurrentTime,
    hasPlayableVideo = true,
    onSeek,
    onPause,
    onResume,
    isPlayingRef,
    onCreate,
    onUpdate,
    onDelete,
    className,
  },
  ref,
) {
  const [draftContent, setDraftContent] = useState('')
  const [draftOffsetSec, setDraftOffsetSec] = useState<number | null>(null)
  const [offsetEditValue, setOffsetEditValue] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyValue, setReplyValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null)
  const wasPlayingOnFocusRef = useRef<boolean>(false)
  const draftKey = `video-comment-draft:${sessionId}`

  // Restore draft on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey)
      if (raw) {
        const parsed = JSON.parse(raw) as {
          content?: string
          offset?: number | null
        }
        if (parsed.content) setDraftContent(parsed.content)
        if (typeof parsed.offset === 'number') setDraftOffsetSec(parsed.offset)
      }
    } catch {
      /* ignore parse errors */
    }
  }, [draftKey])

  // Persist draft on every change.
  useEffect(() => {
    const payload = JSON.stringify({
      content: draftContent,
      offset: draftOffsetSec,
    })
    try {
      if (draftContent.trim() || draftOffsetSec !== null) {
        localStorage.setItem(draftKey, payload)
      } else {
        localStorage.removeItem(draftKey)
      }
    } catch {
      /* ignore storage errors */
    }
  }, [draftKey, draftContent, draftOffsetSec])

  useImperativeHandle(
    ref,
    () => ({
      focusComposer: atSeconds => {
        if (typeof atSeconds === 'number') setDraftOffsetSec(atSeconds)
        setTimeout(() => textareaRef.current?.focus(), 0)
      },
    }),
    [],
  )

  // Tree builder: top-level sorted by offset asc, replies sorted by
  // created_at asc within each thread (chronological — Slack convention).
  const threads = useMemo<ThreadedComment[]>(() => {
    const repliesByParent = new Map<string, VideoComment[]>()
    for (const c of comments ?? []) {
      if (c.parent_id) {
        const arr = repliesByParent.get(c.parent_id) ?? []
        arr.push(c)
        repliesByParent.set(c.parent_id, arr)
      }
    }
    for (const arr of repliesByParent.values()) {
      arr.sort((a, b) => a.created_at.localeCompare(b.created_at))
    }
    return (comments ?? [])
      .filter(c => !c.parent_id)
      .sort((a, b) => a.video_offset_seconds - b.video_offset_seconds)
      .map(c => ({ ...c, replies: repliesByParent.get(c.id) ?? [] }))
  }, [comments])

  const activeThreadId = useMemo(() => {
    if (threads.length === 0) return null
    let answer: string | null = null
    for (const t of threads) {
      if (t.video_offset_seconds <= currentTimeSec) answer = t.id
      else break
    }
    return answer
  }, [threads, currentTimeSec])

  const handleComposerFocus = useCallback(() => {
    // Capture timestamp at focus moment, not at submit.
    if (draftOffsetSec === null) {
      setDraftOffsetSec(getCurrentTime())
    }
    // Auto-pause; remember whether to resume on blur.
    wasPlayingOnFocusRef.current = isPlayingRef.current
    if (isPlayingRef.current) onPause()
  }, [draftOffsetSec, getCurrentTime, isPlayingRef, onPause])

  const handleComposerBlur = useCallback(() => {
    if (wasPlayingOnFocusRef.current && !draftContent.trim()) {
      onResume()
    }
    wasPlayingOnFocusRef.current = false
  }, [draftContent, onResume])

  const handleSubmit = useCallback(() => {
    const content = draftContent.trim()
    if (!content) return
    const offset = draftOffsetSec ?? getCurrentTime()
    // Optimistic insert handles the visual update via the mutation's
    // onMutate; close the composer synchronously so the user doesn't
    // see the typed-out content lingering while the network resolves.
    // Resume video — message has been sent.
    if (wasPlayingOnFocusRef.current) onResume()
    wasPlayingOnFocusRef.current = false
    setDraftContent('')
    setDraftOffsetSec(null)
    try {
      localStorage.removeItem(draftKey)
    } catch {
      /* ignore */
    }
    void onCreate({ content, video_offset_seconds: Math.max(0, offset) })
  }, [
    draftContent,
    draftOffsetSec,
    getCurrentTime,
    onCreate,
    onResume,
    draftKey,
  ])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  const startEditingOffset = useCallback(() => {
    setOffsetEditValue(formatVideoOffset(draftOffsetSec ?? getCurrentTime()))
  }, [draftOffsetSec, getCurrentTime])

  const commitOffsetEdit = useCallback(() => {
    if (offsetEditValue === null) return
    const parsed = parseClock(offsetEditValue)
    if (parsed !== null) setDraftOffsetSec(parsed)
    setOffsetEditValue(null)
  }, [offsetEditValue])

  // -- Reply composer --

  const openReply = useCallback(
    (parentId: string) => {
      setReplyingToId(parentId)
      setReplyValue('')
      // Auto-pause on opening, remember to resume if cancelled empty.
      wasPlayingOnFocusRef.current = isPlayingRef.current
      if (isPlayingRef.current) onPause()
      setTimeout(() => replyTextareaRef.current?.focus(), 0)
    },
    [isPlayingRef, onPause],
  )

  const closeReply = useCallback(() => {
    if (wasPlayingOnFocusRef.current && !replyValue.trim()) {
      onResume()
    }
    wasPlayingOnFocusRef.current = false
    setReplyingToId(null)
    setReplyValue('')
  }, [onResume, replyValue])

  const submitReply = useCallback(
    (parent: ThreadedComment) => {
      const content = replyValue.trim()
      if (!content) return
      // Resume video — message sent.
      if (wasPlayingOnFocusRef.current) onResume()
      wasPlayingOnFocusRef.current = false
      // Close the composer synchronously; the mutation's onMutate inserts
      // the optimistic reply, so the new card appears in its place.
      setReplyingToId(null)
      setReplyValue('')
      void onCreate({
        content,
        video_offset_seconds: parent.video_offset_seconds,
        parent_id: parent.id,
      })
    },
    [onCreate, onResume, replyValue],
  )

  return (
    <Card className={cn('border-line flex flex-col', className)}>
      <CardHeader className="border-b border-line py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <MessageSquare className="h-4 w-4 text-ink-3" />
            Comments
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {threads.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-b border-line p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-ink-3">
              At
            </span>
            {offsetEditValue === null ? (
              <button
                type="button"
                onClick={startEditingOffset}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-bg px-2 py-0.5 font-mono text-xs text-indigo ring-1 ring-indigo hover:bg-indigo-bg"
                title="Click to edit timestamp"
              >
                <Clock className="h-3 w-3" />
                {formatVideoOffset(draftOffsetSec ?? currentTimeSec)}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Input
                  autoFocus
                  value={offsetEditValue}
                  onChange={e => setOffsetEditValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      commitOffsetEdit()
                    } else if (e.key === 'Escape') {
                      e.preventDefault()
                      setOffsetEditValue(null)
                    }
                  }}
                  onBlur={commitOffsetEdit}
                  placeholder="m:ss"
                  className="h-7 w-20 px-2 text-xs"
                />
              </span>
            )}
            {hasPlayableVideo && (
              <button
                type="button"
                onClick={() => setDraftOffsetSec(getCurrentTime())}
                className="text-[11px] text-ink-3 hover:text-indigo hover:underline"
                title="Pin to current playback time"
              >
                use current
              </button>
            )}
          </div>
          <Textarea
            ref={textareaRef}
            value={draftContent}
            onChange={e => setDraftContent(e.target.value)}
            onFocus={handleComposerFocus}
            onBlur={handleComposerBlur}
            onKeyDown={handleKeyDown}
            placeholder="Leave a comment for this moment…"
            className="min-h-[72px] resize-none text-sm"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-ink-4">
              ⌘/Ctrl + Enter to send
            </span>
            <div className="flex items-center gap-2">
              {(draftContent || draftOffsetSec !== null) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDraftContent('')
                    setDraftOffsetSec(null)
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!draftContent.trim()}
                className="bg-indigo hover:bg-indigo text-ink-on-dark"
              >
                Comment
              </Button>
            </div>
          </div>
        </div>

        <div className="max-h-[28rem] overflow-y-auto">
          {isLoading && threads.length === 0 ? (
            <div className="space-y-3 p-3">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-md bg-surface-3"
                />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-ink-3">
              <p className="font-medium text-ink-2">No comments yet.</p>
              <p className="mt-1 text-ink-3">
                Click any line in the transcript or the button above to leave
                the first one.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {threads.map(thread => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  isActive={thread.id === activeThreadId}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onSeek={onSeek}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  editingId={editingId}
                  setEditingId={setEditingId}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  replyingToId={replyingToId}
                  replyValue={replyValue}
                  setReplyValue={setReplyValue}
                  onOpenReply={() => openReply(thread.id)}
                  onCloseReply={closeReply}
                  onSubmitReply={() => submitReply(thread)}
                  replyTextareaRef={replyTextareaRef}
                />
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

interface ThreadItemProps {
  thread: ThreadedComment
  isActive: boolean
  currentUserId: string | null | undefined
  isAdmin: boolean
  onSeek: (offsetSec: number) => void
  onUpdate: (commentId: string, content: string) => Promise<unknown>
  onDelete: (commentId: string) => Promise<unknown>
  editingId: string | null
  setEditingId: (id: string | null) => void
  editValue: string
  setEditValue: (v: string) => void
  replyingToId: string | null
  replyValue: string
  setReplyValue: (v: string) => void
  onOpenReply: () => void
  onCloseReply: () => void
  onSubmitReply: () => void
  replyTextareaRef: React.RefObject<HTMLTextAreaElement | null>
}

function ThreadItem({
  thread,
  isActive,
  currentUserId,
  isAdmin,
  onSeek,
  onUpdate,
  onDelete,
  editingId,
  setEditingId,
  editValue,
  setEditValue,
  replyingToId,
  replyValue,
  setReplyValue,
  onOpenReply,
  onCloseReply,
  onSubmitReply,
  replyTextareaRef,
}: ThreadItemProps) {
  const replyCount = thread.replies.length
  const showingReplyComposer = replyingToId === thread.id

  return (
    <li
      className={cn(
        'transition-colors',
        isActive
          ? 'bg-indigo-bg/60 ring-inset ring-1 ring-indigo'
          : 'hover:bg-paper',
      )}
    >
      <CommentBody
        comment={thread}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onSeek={() => onSeek(thread.video_offset_seconds)}
        onUpdate={onUpdate}
        onDelete={onDelete}
        editingId={editingId}
        setEditingId={setEditingId}
        editValue={editValue}
        setEditValue={setEditValue}
        showOffsetChip
        replyCount={replyCount}
        onReply={onOpenReply}
      />

      {(replyCount > 0 || showingReplyComposer) && (
        <div className="ml-7 border-l-2 border-indigo pl-3 pb-3 pr-3 space-y-2">
          {thread.replies.map(reply => (
            <CommentBody
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onSeek={() => onSeek(thread.video_offset_seconds)}
              onUpdate={onUpdate}
              onDelete={onDelete}
              editingId={editingId}
              setEditingId={setEditingId}
              editValue={editValue}
              setEditValue={setEditValue}
              compact
            />
          ))}
          {showingReplyComposer && (
            <div className="rounded-md border border-line bg-surface-1 p-2">
              <Textarea
                ref={replyTextareaRef}
                value={replyValue}
                onChange={e => setReplyValue(e.target.value)}
                onKeyDown={e => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault()
                    onSubmitReply()
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    onCloseReply()
                  }
                }}
                placeholder="Reply…"
                className="min-h-[56px] resize-none text-sm"
              />
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[11px] text-ink-4">
                  ⌘/Ctrl + Enter to send · Esc to cancel
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={onCloseReply}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={onSubmitReply}
                    disabled={!replyValue.trim()}
                    className="bg-indigo hover:bg-indigo text-ink-on-dark"
                  >
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

interface CommentBodyProps {
  comment: VideoComment
  currentUserId: string | null | undefined
  isAdmin: boolean
  onSeek: () => void
  onUpdate: (commentId: string, content: string) => Promise<unknown>
  onDelete: (commentId: string) => Promise<unknown>
  editingId: string | null
  setEditingId: (id: string | null) => void
  editValue: string
  setEditValue: (v: string) => void
  showOffsetChip?: boolean
  replyCount?: number
  onReply?: () => void
  compact?: boolean
}

function CommentBody({
  comment,
  currentUserId,
  isAdmin,
  onSeek,
  onUpdate,
  onDelete,
  editingId,
  setEditingId,
  editValue,
  setEditValue,
  showOffsetChip,
  replyCount = 0,
  onReply,
  compact,
}: CommentBodyProps) {
  const isMine = !!currentUserId && comment.author_id === currentUserId
  const canDelete = isMine || isAdmin
  const isEditing = editingId === comment.id
  const authorLabel = isMine
    ? 'You'
    : comment.author_name || comment.author_email || 'Unknown'
  const cascadeWarning =
    replyCount > 0
      ? `Delete this comment and its ${replyCount} ${
          replyCount === 1 ? 'reply' : 'replies'
        }? This cannot be undone.`
      : 'This cannot be undone.'

  const inlineActions = !isEditing && (isMine || canDelete) && (
    <span
      className="hidden group-hover:inline-flex items-center gap-0.5"
      onClick={e => e.stopPropagation()}
    >
      {isMine && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-ink-3 hover:text-indigo"
          title="Edit"
          onClick={() => {
            setEditingId(comment.id)
            setEditValue(comment.content)
          }}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      )}
      {canDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-ink-3 hover:text-vermillion hover:bg-vermillion-bg"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete comment?</AlertDialogTitle>
              <AlertDialogDescription>{cascadeWarning}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(comment.id)}
                className="bg-vermillion hover:bg-vermillion"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </span>
  )

  return (
    <div
      className={cn('group cursor-pointer', compact ? 'py-1.5' : 'p-3')}
      onClick={() => !isEditing && onSeek()}
    >
      <div className="flex items-center justify-between gap-2">
        {showOffsetChip ? (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              onSeek()
            }}
            className="rounded-full bg-surface-3 px-2 py-0.5 font-mono text-[11px] text-ink-2 hover:bg-indigo-bg hover:text-indigo"
          >
            {formatVideoOffset(comment.video_offset_seconds)}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-ink-3">
            <CornerDownRight className="h-3 w-3" />
            <span className="font-medium text-ink-2">{authorLabel}</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-[11px] text-ink-3">
          {showOffsetChip && (
            <>
              <span className="font-medium text-ink-2">{authorLabel}</span>
              <span className="mx-1">·</span>
            </>
          )}
          <span
            className={cn(compact && inlineActions && 'group-hover:hidden')}
          >
            {timeAgo(comment.created_at)}
          </span>
          {compact && inlineActions}
        </span>
      </div>
      {isEditing ? (
        <div className="mt-2" onClick={e => e.stopPropagation()}>
          <Textarea
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            className="min-h-[60px] text-sm"
            autoFocus
          />
          <div className="mt-2 flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingId(null)
                setEditValue('')
              }}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={
                !editValue.trim() || editValue.trim() === comment.content
              }
              onClick={async () => {
                await onUpdate(comment.id, editValue.trim())
                setEditingId(null)
                setEditValue('')
              }}
              className="bg-indigo hover:bg-indigo text-ink-on-dark"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <p
          className={cn(
            'whitespace-pre-wrap text-sm leading-relaxed text-ink-2',
            compact ? 'mt-0.5' : 'mt-1',
          )}
        >
          {comment.content}
        </p>
      )}
      {!isEditing && !compact && (
        <div
          className="mt-1 flex items-center gap-1"
          onClick={e => e.stopPropagation()}
        >
          {onReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-ink-3 hover:text-indigo"
              onClick={onReply}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
              {replyCount > 0 && (
                <span className="ml-1 text-[10px] text-ink-3">
                  ({replyCount})
                </span>
              )}
            </Button>
          )}
          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isMine && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  setEditingId(comment.id)
                  setEditValue(comment.content)
                }}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-vermillion hover:bg-vermillion-bg hover:text-vermillion"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {cascadeWarning}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(comment.id)}
                      className="bg-vermillion hover:bg-vermillion"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
