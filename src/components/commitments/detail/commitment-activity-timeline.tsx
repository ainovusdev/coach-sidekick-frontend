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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/date-utils'
import type { Commitment } from '@/types/commitment'
import {
  buildActivityFeed,
  resolveActorName,
  type ActivityItem,
} from './build-activity-feed'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  active: 'Active',
  in_progress: 'In Progress',
  completed: 'Completed',
  abandoned: 'Abandoned',
}

function ItemIcon({ item }: { item: ActivityItem }) {
  const base = 'h-3.5 w-3.5'
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
    case 'completed':
      return <CheckCircle2 className={cn(base, 'text-forest')} />
    default:
      return <div className="h-2 w-2 rounded-full bg-line" />
  }
}

function ItemBody({
  item,
  actor,
  extractedByAi,
}: {
  item: ActivityItem
  actor: string
  extractedByAi?: boolean
}) {
  switch (item.kind) {
    case 'created':
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
    case 'status':
      return (
        <span className="text-ink-3">
          <span className="text-ink-2 font-medium">{actor}</span> moved it to{' '}
          <span className="text-ink-2 font-medium">
            {STATUS_LABELS[item.toStatus || ''] || item.toStatus}
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
}: {
  commitment: Commitment
  currentUserId?: string
}) {
  const groups = buildActivityFeed(commitment)

  const ctx = {
    currentUserId,
    assignedToId: commitment.assigned_to_id,
    assignedToName: commitment.assigned_to_name,
    createdById: commitment.created_by_id,
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
