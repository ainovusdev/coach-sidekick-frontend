/**
 * Turns a commitment's stored history into a chronological activity feed.
 *
 * The key structural point: a single `commitment_updates` row can be BOTH a
 * system event and a comment — the same row can move progress to 60% *and*
 * carry a note. So this is fan-out-then-sort, not merge-two-arrays.
 *
 * Pure function, no React, so the ordering/dedup rules are unit-testable.
 */

import type { Commitment, CommitmentUpdateEntry } from '@/types/commitment'
import { commentPersonName, type Comment } from '@/types/comment'
import { htmlToPlainText } from '@/components/ui/rich-text-editor'
import { autoInfo } from '@/lib/commitments/automatic'

export type ActivityKind =
  | 'comment'
  | 'status'
  | 'progress'
  | 'created'
  | 'completed'
  | 'assigned'
  | 'auto_resolved'

export interface ActivityItem {
  id: string
  kind: ActivityKind
  at: string
  actorId?: string
  actorName?: string
  /** comment — `note` is the ledger note, or the excerpt of a thread comment */
  note?: string
  wins?: string
  blockers?: string
  /** Set for thread comments: links to `#comment-{id}`. */
  commentId?: string
  /** status */
  toStatus?: string
  /** progress */
  fromProgress?: number
  toProgress?: number
  /** assigned — who it went to (null = back to the client) */
  toAssigneeId?: string | null
  toAssigneeName?: string | null
  toClient?: boolean
  /** created — set when a rule made the row; the label for "· session prep" */
  autoRule?: string
  /** auto_resolved — why Coach Sidekick closed it */
  reason?: string
}

export interface ActivityGroup {
  /** Source update id, or a synthetic key for created/completed. */
  key: string
  at: string
  actorId?: string
  actorName?: string
  items: ActivityItem[]
}

function sameDay(a?: string | null, b?: string | null) {
  if (!a || !b) return false
  return new Date(a).toDateString() === new Date(b).toDateString()
}

const EXCERPT_LENGTH = 160

function excerptOf(html: string): string {
  const text = htmlToPlainText(html).replace(/\s+/g, ' ').trim()
  return text.length > EXCERPT_LENGTH
    ? `${text.slice(0, EXCERPT_LENGTH - 1).trimEnd()}…`
    : text
}

/** Top-level comments and their replies, flattened; deleted rows skipped. */
function flattenComments(comments: Comment[]): Comment[] {
  return comments.flatMap(c => [c, ...(c.replies ?? [])])
}

export function buildActivityFeed(
  commitment: Commitment,
  comments: Comment[] = commitment.comments ?? [],
): ActivityGroup[] {
  const updates: CommitmentUpdateEntry[] = [...(commitment.updates || [])]

  // Ascending first, so progress deltas can be computed against the running
  // previous value rather than guessed.
  updates.sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )

  const groups: ActivityGroup[] = []
  let runningProgress: number | undefined = undefined
  let sawCompletedStatus = false

  for (const u of updates) {
    const items: ActivityItem[] = []
    const base = {
      at: u.created_at,
      actorId: u.updated_by_id,
      actorName: u.updated_by_name,
    }

    // Ledger rows written by the service on reassignment:
    // metadata = { kind: 'assignment', assigned_to_id, assigned_to_name?, previous_assignee_id }
    const meta = (u.metadata ?? {}) as Record<string, any>
    if (meta.kind === 'assignment') {
      items.push({
        ...base,
        id: `${u.id}:assigned`,
        kind: 'assigned',
        toAssigneeId: meta.assigned_to_id ?? null,
        toAssigneeName: meta.assigned_to_name ?? null,
        toClient: !meta.assigned_to_id,
      })
    }

    if (u.status_change) {
      items.push({
        ...base,
        id: `${u.id}:status`,
        kind: 'status',
        toStatus: u.status_change,
      })
      if (u.status_change === 'completed') sawCompletedStatus = true
    }

    if (
      u.progress_percentage !== null &&
      u.progress_percentage !== undefined &&
      u.progress_percentage !== runningProgress
    ) {
      items.push({
        ...base,
        id: `${u.id}:progress`,
        kind: 'progress',
        fromProgress: runningProgress,
        toProgress: u.progress_percentage,
      })
      runningProgress = u.progress_percentage
    }

    if (u.note || u.wins || u.blockers) {
      items.push({
        ...base,
        id: `${u.id}:comment`,
        kind: 'comment',
        note: u.note,
        wins: u.wins,
        blockers: u.blockers,
      })
    }

    if (items.length) {
      groups.push({
        key: u.id,
        at: u.created_at,
        actorId: u.updated_by_id,
        actorName: u.updated_by_name,
        items,
      })
    }
  }

  // Thread comments (Slice 2) sit in the same column as the ledger.
  for (const c of flattenComments(comments)) {
    if (c.deleted_at) continue
    groups.push({
      key: `comment:${c.id}`,
      at: c.created_at,
      actorId: c.author.id,
      actorName: commentPersonName(c.author),
      items: [
        {
          id: `comment:${c.id}`,
          kind: 'comment',
          at: c.created_at,
          actorId: c.author.id,
          actorName: commentPersonName(c.author),
          note: excerptOf(c.body),
          commentId: c.id,
        },
      ],
    })
  }

  // There is no DB row for creation — synthesize one so the feed has an origin.
  const auto = autoInfo(commitment)
  groups.unshift({
    key: 'created',
    at: commitment.created_at,
    actorId: commitment.created_by_id ?? undefined,
    actorName: commitment.creator_name,
    items: [
      {
        id: 'created',
        kind: 'created',
        at: commitment.created_at,
        actorId: commitment.created_by_id ?? undefined,
        actorName: commitment.creator_name,
        autoRule: auto?.label,
      },
    ],
  })

  // A rule closed it (silently — no ledger row): say so, with its reason.
  if (auto?.resolved) {
    groups.push({
      key: 'auto_resolved',
      at: auto.resolved.at,
      items: [
        {
          id: 'auto_resolved',
          kind: 'auto_resolved',
          at: auto.resolved.at,
          toStatus: auto.resolved.action,
          reason: auto.resolved.reason,
        },
      ],
    })
  }

  // Only synthesize completion when no status_change row already covers it,
  // otherwise the same event appears twice.
  if (
    commitment.completed_date &&
    !sawCompletedStatus &&
    !groups.some(g => sameDay(g.at, commitment.completed_date))
  ) {
    groups.push({
      key: 'completed',
      at: commitment.completed_date,
      items: [
        {
          id: 'completed',
          kind: 'completed',
          at: commitment.completed_date,
        },
      ],
    })
  }

  // Newest first for rendering.
  return groups.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  )
}

/**
 * Best-effort display name for an actor.
 *
 * Order matters: the backend-supplied name wins, then "You". The
 * 'current-user' check exists because useUpdateCommitmentProgress writes that
 * literal string as updated_by_id in its optimistic update, so without it a
 * freshly posted comment reads "Someone" until the next refetch.
 */
export function resolveActorName(
  item: { actorId?: string; actorName?: string },
  ctx: {
    currentUserId?: string
    assignedToId?: string
    assignedToName?: string
    createdById?: string
    creatorName?: string
  },
): string {
  if (item.actorName) return item.actorName
  if (!item.actorId) return 'Someone'
  if (item.actorId === 'current-user') return 'You'
  if (ctx.currentUserId && item.actorId === ctx.currentUserId) return 'You'
  if (ctx.assignedToId && item.actorId === ctx.assignedToId) {
    return ctx.assignedToName || 'Someone'
  }
  if (ctx.createdById && item.actorId === ctx.createdById) {
    return ctx.creatorName || 'Someone'
  }
  return 'Someone'
}
