import { differenceInCalendarDays, parseISO } from 'date-fns'
import {
  Commitment,
  CommitmentPriority,
  CommitmentStatus,
} from '@/types/commitment'

export type CommitmentTab = 'all' | 'active' | 'drafts' | 'completed'
export type CommitmentSort = 'smart' | 'due' | 'priority' | 'created' | 'client'
export type CommitmentGroupBy = 'none' | 'client' | 'session' | 'status'
export type DueFilter = 'overdue' | 'soon' | null

export const COMMITMENT_TABS: CommitmentTab[] = [
  'all',
  'active',
  'drafts',
  'completed',
]

export const CLOSED_STATUSES: CommitmentStatus[] = ['completed', 'abandoned']

const PRIORITY_RANK: Record<CommitmentPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export function daysUntilDue(c: Commitment): number | null {
  if (!c.target_date) return null
  return differenceInCalendarDays(parseISO(c.target_date), new Date())
}

export function isOverdue(c: Commitment): boolean {
  if (CLOSED_STATUSES.includes(c.status)) return false
  const days = daysUntilDue(c)
  return days !== null && days < 0
}

export function isDueSoon(c: Commitment): boolean {
  if (CLOSED_STATUSES.includes(c.status)) return false
  const days = daysUntilDue(c)
  return days !== null && days >= 0 && days <= 7
}

export function matchesTab(c: Commitment, tab: CommitmentTab): boolean {
  if (tab === 'active') return c.status === 'active'
  if (tab === 'drafts') return c.status === 'draft'
  if (tab === 'completed') return c.status === 'completed'
  return true
}

export function matchesSearch(c: Commitment, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [c.title, c.description, c.client_name].some(
    field => field && field.toLowerCase().includes(q),
  )
}

export function matchesDueFilter(c: Commitment, due: DueFilter): boolean {
  if (due === 'overdue') return isOverdue(c)
  if (due === 'soon') return isDueSoon(c)
  return true
}

/**
 * Smart ordering buckets: drafts need review first, then overdue,
 * then dated (soonest first), then undated, closed items last.
 */
function smartRank(c: Commitment): number {
  if (c.status === 'draft') return 0
  if (CLOSED_STATUSES.includes(c.status)) return 4
  if (isOverdue(c)) return 1
  return c.target_date ? 2 : 3
}

function byCreatedDesc(a: Commitment, b: Commitment): number {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

function tieBreak(a: Commitment, b: Commitment): number {
  const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
  if (p !== 0) return p
  return byCreatedDesc(a, b)
}

function byDueAsc(a: Commitment, b: Commitment): number {
  if (!a.target_date && !b.target_date) return 0
  if (!a.target_date) return 1
  if (!b.target_date) return -1
  return new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
}

export function compareSmart(a: Commitment, b: Commitment): number {
  const rankDiff = smartRank(a) - smartRank(b)
  if (rankDiff !== 0) return rankDiff
  const rank = smartRank(a)
  if (rank === 1 || rank === 2) {
    const d = byDueAsc(a, b)
    if (d !== 0) return d
  }
  if (rank === 4) {
    const d =
      new Date(b.completed_date ?? b.updated_at).getTime() -
      new Date(a.completed_date ?? a.updated_at).getTime()
    if (d !== 0) return d
  }
  return tieBreak(a, b)
}

export const SORT_COMPARATORS: Record<
  CommitmentSort,
  (a: Commitment, b: Commitment) => number
> = {
  smart: compareSmart,
  due: (a, b) => byDueAsc(a, b) || tieBreak(a, b),
  priority: (a, b) =>
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
    byDueAsc(a, b) ||
    byCreatedDesc(a, b),
  created: (a, b) => byCreatedDesc(a, b) || tieBreak(a, b),
  client: (a, b) =>
    (a.client_name || '').localeCompare(b.client_name || '') ||
    compareSmart(a, b),
}

export interface CommitmentGroup {
  key: string
  label: string
  /** ISO date shown next to the label (session grouping) */
  dateISO?: string | null
  commitments: Commitment[]
  draftCount: number
  activeCount: number
  completedCount: number
}

const STATUS_GROUP_ORDER: CommitmentStatus[] = [
  'draft',
  'active',
  'in_progress',
  'completed',
  'abandoned',
]

const STATUS_GROUP_LABELS: Record<CommitmentStatus, string> = {
  draft: 'Drafts — needs review',
  active: 'Active',
  in_progress: 'In Progress',
  completed: 'Completed',
  abandoned: 'Abandoned',
}

function buildGroup(key: string, label: string): CommitmentGroup {
  return {
    key,
    label,
    commitments: [],
    draftCount: 0,
    activeCount: 0,
    completedCount: 0,
  }
}

function addToGroup(group: CommitmentGroup, c: Commitment) {
  group.commitments.push(c)
  if (c.status === 'draft') group.draftCount++
  else if (c.status === 'active' || c.status === 'in_progress')
    group.activeCount++
  else if (c.status === 'completed') group.completedCount++
}

export function groupCommitments(
  commitments: Commitment[],
  groupBy: Exclude<CommitmentGroupBy, 'none'>,
  sort: CommitmentSort,
): CommitmentGroup[] {
  const map = new Map<string, CommitmentGroup>()

  for (const c of commitments) {
    let key: string
    let label: string

    if (groupBy === 'client') {
      key = c.client_id
      label = c.client_name || 'Unknown Client'
    } else if (groupBy === 'session') {
      key = c.session_id || '__manual__'
      label = c.session_id ? c.session_title || 'Session' : 'Manually Created'
    } else {
      key = c.status
      label = STATUS_GROUP_LABELS[c.status]
    }

    let group = map.get(key)
    if (!group) {
      group = buildGroup(key, label)
      if (groupBy === 'session' && c.session_id) {
        group.dateISO = c.session_date || null
      }
      map.set(key, group)
    }
    addToGroup(group, c)
  }

  const groups = Array.from(map.values())
  const comparator = SORT_COMPARATORS[sort]
  for (const group of groups) {
    group.commitments.sort(comparator)
  }

  if (groupBy === 'client') {
    groups.sort((a, b) => a.label.localeCompare(b.label))
  } else if (groupBy === 'session') {
    // Newest session first; the manual bucket goes last
    groups.sort((a, b) => {
      if (a.key === '__manual__') return 1
      if (b.key === '__manual__') return -1
      if (!a.dateISO) return 1
      if (!b.dateISO) return -1
      return new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
    })
  } else {
    groups.sort(
      (a, b) =>
        STATUS_GROUP_ORDER.indexOf(a.key as CommitmentStatus) -
        STATUS_GROUP_ORDER.indexOf(b.key as CommitmentStatus),
    )
  }

  return groups
}
