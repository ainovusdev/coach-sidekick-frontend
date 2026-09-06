import { differenceInCalendarDays, parseISO } from 'date-fns'
import {
  Commitment,
  CommitmentPriority,
  CommitmentStatus,
} from '@/types/commitment'
import {
  COMMITMENT_STATUS_LABEL,
  COMMITMENT_STATUS_ORDER,
  DRAFT_GROUP_LABEL,
} from '@/lib/commitments/labels'
import {
  assigneeKindOf,
  assigneeOf,
  isAssignedTo,
} from '@/lib/commitments/assignee'

export type CommitmentTab = 'all' | 'active' | 'drafts' | 'completed'
export type CommitmentSort = 'smart' | 'due' | 'priority' | 'created' | 'client'
export type CommitmentGroupBy =
  | 'none'
  | 'client'
  | 'sandbox'
  | 'session'
  | 'status'
  | 'assignee'
export type DueFilter = 'overdue' | 'soon' | 'today' | null

/**
 * Who a row is for, from the viewer's seat. The flat list's sections and the
 * `view=` URL param share this vocabulary, so a section heading and a filter
 * always mean the same thing.
 */
export type CommitmentSection = 'mine' | 'unassigned' | 'clients' | 'others'
export type CommitmentView = 'all' | CommitmentSection
/** `view=assigned` reads better in a URL than `view=others`. */
export const VIEW_PARAM: Record<CommitmentView, string> = {
  all: 'all',
  mine: 'mine',
  unassigned: 'unassigned',
  clients: 'clients',
  others: 'assigned',
}
export const VIEW_FROM_PARAM: Record<string, CommitmentView> = {
  all: 'all',
  mine: 'mine',
  unassigned: 'unassigned',
  clients: 'clients',
  assigned: 'others',
}

export const COMMITMENT_TABS: CommitmentTab[] = [
  'all',
  'active',
  'drafts',
  'completed',
]

export const COMMITMENT_GROUP_BYS: CommitmentGroupBy[] = [
  'none',
  'client',
  'sandbox',
  'session',
  'status',
  'assignee',
]

export const SECTION_ORDER: CommitmentSection[] = [
  'mine',
  'unassigned',
  'clients',
  'others',
]

export const SECTION_LABELS: Record<CommitmentSection, string> = {
  mine: 'Assigned to me',
  unassigned: 'Unassigned',
  clients: 'Assigned to clients',
  others: 'Assigned to others',
}

export const VIEW_LABELS: Record<CommitmentView, string> = {
  all: 'Everyone',
  ...SECTION_LABELS,
}

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

export function isOpen(c: Commitment): boolean {
  return !CLOSED_STATUSES.includes(c.status)
}

export function isOverdue(c: Commitment): boolean {
  if (CLOSED_STATUSES.includes(c.status)) return false
  const days = daysUntilDue(c)
  return days !== null && days < 0
}

export function isDueToday(c: Commitment): boolean {
  if (CLOSED_STATUSES.includes(c.status)) return false
  return daysUntilDue(c) === 0
}

export function isDueSoon(c: Commitment): boolean {
  if (CLOSED_STATUSES.includes(c.status)) return false
  const days = daysUntilDue(c)
  return days !== null && days >= 0 && days <= 7
}

/** Which section a row belongs to, from `viewerId`'s seat. */
export function sectionOf(
  c: Commitment,
  viewerId: string | null | undefined,
): CommitmentSection {
  if (isAssignedTo(c, viewerId)) return 'mine'
  const kind = assigneeKindOf(c)
  if (kind === 'none') return 'unassigned'
  if (kind === 'client') return 'clients'
  return 'others'
}

export function matchesTab(c: Commitment, tab: CommitmentTab): boolean {
  if (tab === 'active') return c.status === 'active'
  if (tab === 'drafts') return c.status === 'draft'
  if (tab === 'completed') return c.status === 'completed'
  return true
}

export function matchesView(
  c: Commitment,
  view: CommitmentView,
  viewerId: string | null | undefined,
): boolean {
  if (view === 'all') return true
  return sectionOf(c, viewerId) === view
}

/** A specific person (`assignee=<userId>`) — beats `view` when set. */
export function matchesAssignee(
  c: Commitment,
  assigneeId: string | null,
): boolean {
  if (!assigneeId) return true
  return assigneeOf(c)?.user_id === assigneeId
}

export function matchesSearch(c: Commitment, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const a = assigneeOf(c)
  return [
    c.title,
    c.description,
    c.client_name,
    c.sandbox_name,
    a?.name,
    a?.email,
  ].some(field => field && field.toLowerCase().includes(q))
}

export function matchesDueFilter(c: Commitment, due: DueFilter): boolean {
  if (due === 'overdue') return isOverdue(c)
  if (due === 'soon') return isDueSoon(c)
  if (due === 'today') return isDueToday(c)
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

/** The row's context name: the client, else the sandbox. */
function contextName(c: Commitment): string {
  return c.client_name || c.sandbox_name || ''
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
    contextName(a).localeCompare(contextName(b)) || compareSmart(a, b),
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

const NO_GROUP_KEY = '__none__'

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

function groupKeyAndLabel(
  c: Commitment,
  groupBy: Exclude<CommitmentGroupBy, 'none'>,
  viewerId: string | null | undefined,
): { key: string; label: string } {
  switch (groupBy) {
    case 'client':
      return c.client_id
        ? { key: c.client_id, label: c.client_name || 'Unknown client' }
        : { key: NO_GROUP_KEY, label: 'No client' }
    case 'sandbox':
      return c.sandbox_id
        ? { key: c.sandbox_id, label: c.sandbox_name || 'Sandbox' }
        : { key: NO_GROUP_KEY, label: 'No sandbox' }
    case 'session':
      return c.session_id
        ? { key: c.session_id, label: c.session_title || 'Session' }
        : { key: NO_GROUP_KEY, label: 'Manually created' }
    case 'assignee': {
      const a = assigneeOf(c)
      if (!a) return { key: NO_GROUP_KEY, label: 'Unassigned' }
      if (viewerId && a.user_id === viewerId)
        return { key: viewerId, label: 'You' }
      return {
        key: a.user_id ?? `client:${a.client_id}`,
        label: a.name || a.email || 'Someone',
      }
    }
    case 'status':
      return {
        key: c.status,
        label:
          c.status === 'draft'
            ? DRAFT_GROUP_LABEL
            : COMMITMENT_STATUS_LABEL[c.status],
      }
  }
}

export function groupCommitments(
  commitments: Commitment[],
  groupBy: Exclude<CommitmentGroupBy, 'none'>,
  sort: CommitmentSort,
  viewerId?: string | null,
): CommitmentGroup[] {
  const map = new Map<string, CommitmentGroup>()

  for (const c of commitments) {
    const { key, label } = groupKeyAndLabel(c, groupBy, viewerId)
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

  if (groupBy === 'session') {
    // Newest session first; the manual bucket goes last
    groups.sort((a, b) => {
      if (a.key === NO_GROUP_KEY) return 1
      if (b.key === NO_GROUP_KEY) return -1
      if (!a.dateISO) return 1
      if (!b.dateISO) return -1
      return new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
    })
  } else if (groupBy === 'status') {
    groups.sort(
      (a, b) =>
        COMMITMENT_STATUS_ORDER.indexOf(a.key as CommitmentStatus) -
        COMMITMENT_STATUS_ORDER.indexOf(b.key as CommitmentStatus),
    )
  } else {
    // Alphabetical; "You" first, the no-context bucket last
    groups.sort((a, b) => {
      if (a.key === NO_GROUP_KEY) return 1
      if (b.key === NO_GROUP_KEY) return -1
      if (viewerId && a.key === viewerId) return -1
      if (viewerId && b.key === viewerId) return 1
      return a.label.localeCompare(b.label)
    })
  }

  return groups
}
