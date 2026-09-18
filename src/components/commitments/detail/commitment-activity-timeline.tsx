'use client'

/**
 * Chronological activity feed: comments AND system events in one column.
 *
 * The underlying `commitment_updates` rows already stored status changes and
 * progress deltas; the old panel rendered only the free-text fields, so the
 * history of how a commitment actually moved was invisible.
 */

import {
  Plus,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Trophy,
  AlertTriangle,
  UserRound,
  MessageSquare,
  Zap,
} from 'lucide-react'
import { firstName } from '@/lib/commitments/assignee'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/date-utils'
import { statusInfo } from '@/lib/commitments/labels'
import type { Commitment } from '@/types/commitment'
import type { Comment } from '@/types/comment'
import {
  buildActivityFeed,
  resolveActorName,
  type ActivityItem,
} from './build-activity-feed'

function ItemIcon({ item }: { item: ActivityItem }) {
  const base = 'h-3.5 w-3.5'
  if (item.commentId) {
    return <MessageSquare className={cn(base, 'text-ink-3')} />
  }
  switch (item.kind) {
    case 'created':
      return <Plus className={cn(base, 'text-ink-3')} />
    case 'status':
      return item.toStatus === 'completed' ? (
        <CheckCircle2 className={cn(base, 'text-forest')} />
      ) : (
        <div className="h-2 w-2 rounded-full bg-ds-accent" />
      )
    case 'progress':
      return <TrendingUp className={cn(base, 'text-amber-token')} />
    case 'assigned':
      return <UserRound className={cn(base, 'text-ink-3')} />
    case 'completed':
      return <CheckCircle2 className={cn(base, 'text-forest')} />
    case 'auto_resolved':
      return item.toStatus === 'completed' ? (
        <CheckCircle2 className={cn(base, 'text-forest')} />
      ) : (
        <Zap className={cn(base, 'text-ink-3')} />
      )
    default:
      return <div className="h-2 w-2 rounded-full bg-line" />
  }
}

function ItemBody({
  item,
  actor,
  extractedByAi,
  currentUserId,
  clientFirstName,
}: {
  item: ActivityItem
  actor: string
  extractedByAi?: boolean
  currentUserId?: string
  clientFirstName?: string
}) {
  if (item.commentId) {
    const anchor = `comment-${item.commentId}`
    return (
      <div className="space-y-0.5">
        <span className="text-ink-3">
          <span className="text-ink-2 font-medium">{actor}</span> commented
        </span>
        <a
          href={`#${anchor}`}
          className="block text-sm text-ink-2 line-clamp-2 hover:underline"
          onClick={e => {
            const el = document.getElementById(anchor)
            if (!el) return
            e.preventDefault()
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }}
        >
          {item.note}
        </a>
      </div>
    )
  }
  switch (item.kind) {
    case 'created':
      if (item.autoRule) {
        return (
          <span className="text-ink-3" data-testid="activity-created-auto">
            <span className="inline-flex items-center gap-1">
              <Zap className="h-3 w-3 text-ink-3" />
              Created automatically · {item.autoRule}
            </span>
          </span>
        )
      }
      return (
        <span className="text-ink-3">
          {extractedByAi ? (
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-ds-accent" />
              Extracted from the session transcript
            </span>
          ) : (
            <>
              <span className="text-ink-2 font-medium">{actor}</span> created
              this commitment
            </>
          )}
        </span>
      )
    case 'auto_resolved':
      return (
        <span className="text-ink-3" data-testid="activity-auto-resolved">
          {item.toStatus === 'completed' ? 'Completed' : 'Dismissed'}{' '}
          automatically
          {item.reason ? ` — ${item.reason}` : ''}
        </span>
      )
    case 'status':
      return (
        <span className="text-ink-3">
          <span className="text-ink-2 font-medium">{actor}</span> moved it to{' '}
          <span className="text-ink-2 font-medium">
            {statusInfo(item.toStatus).label}
          </span>
        </span>
      )
    case 'progress':
      return (
        <span className="text-ink-3">
          <span className="text-ink-2 font-medium">{actor}</span> set progress{' '}
          {item.fromProgress !== undefined && (
            <>
              <span className="tabular-nums">{item.fromProgress}%</span>
              {' → '}
            </>
          )}
          <span className="text-ink-2 font-medium tabular-nums">
            {item.toProgress}%
          </span>
        </span>
      )
    case 'completed':
      return <span className="text-ink-3">Marked complete</span>
    case 'assigned':
      return (
        <span className="text-ink-3">
          <span className="text-ink-2 font-medium">{actor}</span>
          {item.toClient ? (
            <> handed this back to {clientFirstName ?? 'the client'}</>
          ) : (
            <>
              {' '}
              assigned this to{' '}
              <span className="text-ink-2 font-medium">
                {item.toAssigneeId && item.toAssigneeId === currentUserId
                  ? 'you'
                  : item.toAssigneeName || 'someone'}
              </span>
            </>
          )}
        </span>
      )
    default:
      return (
        <div className="space-y-1.5">
          {item.note && (
            <p className="text-sm text-ink-2 whitespace-pre-wrap">
              {item.note}
            </p>
          )}
          {item.wins && (
            <p className="text-xs text-forest flex items-start gap-1.5">
              <Trophy className="h-3 w-3 mt-0.5 shrink-0" />
              <span className="whitespace-pre-wrap">{item.wins}</span>
            </p>
          )}
          {item.blockers && (
            <p className="text-xs text-vermillion flex items-start gap-1.5">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              <span className="whitespace-pre-wrap">{item.blockers}</span>
            </p>
          )}
        </div>
      )
  }
}

export function CommitmentActivityTimeline({
  commitment,
  currentUserId,
  comments,
}: {
  commitment: Commitment
  currentUserId?: string
  /** Live thread (from useComments); falls back to the embedded one. */
  comments?: Comment[]
}) {
  const groups = buildActivityFeed(commitment, comments)

  const ctx = {
    currentUserId,
    assignedToId: commitment.assigned_to_id ?? undefined,
    assignedToName: commitment.assigned_to_name ?? undefined,
    createdById: commitment.created_by_id ?? undefined,
    creatorName: commitment.creator_name,
  }

  return (
    <div className="space-y-4">
      {groups.map(group => {
        const actor = resolveActorName(group, ctx)
        return (
          <div key={group.key} className="flex gap-3">
            {/* Rail */}
            <div className="flex flex-col items-center pt-1">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-3 shrink-0">
                <ItemIcon item={group.items[0]} />
              </div>
              <div className="w-px flex-1 bg-line mt-1" />
            </div>

            <div className="flex-1 min-w-0 pb-1 space-y-1">
              {group.items.map(item => (
                <div key={item.id}>
                  <ItemBody
                    item={item}
                    actor={actor}
                    extractedByAi={commitment.extracted_from_transcript}
                    currentUserId={currentUserId}
                    clientFirstName={
                      firstName(commitment.client_name) || undefined
                    }
                  />
                </div>
              ))}
              <p className="text-[11px] text-ink-3">{formatDate(group.at)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
