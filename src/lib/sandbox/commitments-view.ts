/**
 * The Commitments tab, as pure functions: which rows a filter leaves, how they
 * fall into sections, and what the sections say about themselves. No React, so
 * the page stays a thin shell over this.
 */

import { fmtDay, pluralise } from '@/lib/sandbox/format'
import { parseDateOnly } from '@/lib/sandbox/term'
import type {
  SandboxCommitmentRow,
  SandboxCommitments,
} from '@/types/sandbox-commitments'

export type ViewBy = 'coach' | 'coachee' | 'list'
export type StatusFilter = 'open' | 'overdue' | 'done' | 'draft'
export const VIEW_BYS: ViewBy[] = ['coach', 'coachee', 'list']
export const VIEW_BY_LABEL: Record<ViewBy, string> = {
  coach: 'Coach',
  coachee: 'Coachee',
  list: 'List',
}
export const STATUS_LABEL: Record<StatusFilter, string> = {
  open: 'Open',
  overdue: 'Overdue',
  done: 'Done',
  draft: 'Drafts',
}

export interface CommitmentFilters {
  status: StatusFilter
  mine: boolean
  q: string
  coachId: string | null // member id
  groupId: string | null
  kind: 'team' | 'coaching' | null
}

export const NO_FILTERS: CommitmentFilters = {
  status: 'open',
  mine: false,
  q: '',
  coachId: null,
  groupId: null,
  kind: null,
}

const TEAM_KEY = 'team'

export function isDone(r: SandboxCommitmentRow): boolean {
  return r.status === 'completed'
}
export function isOpen(r: SandboxCommitmentRow): boolean {
  return r.status === 'active' || r.status === 'in_progress'
}

/** Whole days past the due date; 0 when not late (or not open). */
export function daysLate(r: SandboxCommitmentRow, today: string): number {
  if (!isOpen(r)) return 0
  const due = parseDateOnly(r.target_date)
  const now = parseDateOnly(today)
  if (!due || !now) return 0
  return Math.max(0, Math.round((now.getTime() - due.getTime()) / 86_400_000))
}

function dueWithin(r: SandboxCommitmentRow, today: string, days: number) {
  if (!isOpen(r)) return false
  const due = parseDateOnly(r.target_date)
  const now = parseDateOnly(today)
  if (!due || !now) return false
  const diff = Math.round((due.getTime() - now.getTime()) / 86_400_000)
  return diff >= 0 && diff <= days
}

/** "Fri 26 Sep" reads as a plan; "2 days late" reads as a problem. */
export function dueText(
  r: SandboxCommitmentRow,
  today: string,
): { text: string; late: boolean } {
  if (isDone(r)) return { text: 'Done', late: false }
  const late = daysLate(r, today)
  if (late > 0) return { text: `${pluralise(late, 'day')} late`, late: true }
  if (!r.target_date) return { text: 'No date', late: false }
  if (r.target_date === today) return { text: 'Today', late: false }
  return { text: fmtDay(r.target_date), late: false }
}

export interface Counts {
  open: number
  overdue: number
  done: number
  draft: number
  soon: number
}

export function countRows(rows: SandboxCommitmentRow[], today: string): Counts {
  return {
    open: rows.filter(isOpen).length,
    overdue: rows.filter(r => daysLate(r, today) > 0).length,
    done: rows.filter(isDone).length,
    draft: rows.filter(r => r.status === 'draft').length,
    soon: rows.filter(r => dueWithin(r, today, 7)).length,
  }
}

function matchesStatus(
  r: SandboxCommitmentRow,
  status: StatusFilter,
  today: string,
) {
  if (status === 'done') return isDone(r)
  if (status === 'draft') return r.status === 'draft'
  if (status === 'overdue') return daysLate(r, today) > 0
  return isOpen(r)
}

/** Everything but the status chip — so the chips can show honest counts. */
export function applyScope(
  rows: SandboxCommitmentRow[],
  f: CommitmentFilters,
): SandboxCommitmentRow[] {
  const q = f.q.trim().toLowerCase()
  return rows.filter(r => {
    if (f.mine && !r.is_mine) return false
    if (f.kind && r.kind !== f.kind) return false
    if (f.coachId && r.coach?.member_id !== f.coachId) return false
    if (f.groupId && r.group?.id !== f.groupId) return false
    if (!q) return true
    return [r.title, r.coach?.name, r.coachee?.name, r.assignee?.name]
      .filter(Boolean)
      .some(text => (text as string).toLowerCase().includes(q))
  })
}

export function applyFilters(
  rows: SandboxCommitmentRow[],
  f: CommitmentFilters,
  today: string,
): SandboxCommitmentRow[] {
  return applyScope(rows, f).filter(r => matchesStatus(r, f.status, today))
}

export function activeFilterCount(f: CommitmentFilters): number {
  return [f.coachId, f.groupId, f.kind].filter(Boolean).length
}

export interface CommitmentSection {
  key: string
  /** `null` for the Team section. */
  memberId: string | null
  userId: string | null
  name: string
  /** One quiet fact under the name. */
  fact: string
  rows: SandboxCommitmentRow[]
  open: number
  overdue: number
  done: number
  total: number
  /** The viewer's own client row, when this is a coachee they coach. */
  myClientId: string | null
}

/**
 * Sections for the Coach / Coachee views. `visible` are the rows to show;
 * `scoped` are the same rows before the status chip, which is what the header's
 * progress is measured on — a section should not read "0 of 0" just because
 * the viewer is looking at Overdue.
 *
 * Everyone the viewer follows gets a section in the Open view, rows or not:
 * a coach with nothing open is information too.
 */
export function buildSections(
  data: SandboxCommitments,
  visible: SandboxCommitmentRow[],
  scoped: SandboxCommitmentRow[],
  by: Exclude<ViewBy, 'list'>,
  today: string,
  includeEmpty: boolean,
): CommitmentSection[] {
  const keyOf = (r: SandboxCommitmentRow) =>
    (by === 'coach' ? r.coach?.member_id : r.coachee?.member_id) ?? TEAM_KEY
  const sections = new Map<string, CommitmentSection>()
  const blank = (
    key: string,
    name: string,
    fact: string,
    userId: string | null,
    myClientId: string | null = null,
  ): CommitmentSection => ({
    key,
    memberId: key === TEAM_KEY ? null : key,
    userId,
    name,
    fact,
    rows: [],
    open: 0,
    overdue: 0,
    done: 0,
    total: 0,
    myClientId,
  })

  if (by === 'coach')
    for (const c of data.coaches)
      if (c.member_id)
        sections.set(
          c.member_id,
          blank(c.member_id, c.name, `coaches ${c.coachee_count}`, c.user_id),
        )
  if (by === 'coachee')
    for (const c of data.coachees)
      if (c.member_id)
        sections.set(
          c.member_id,
          blank(
            c.member_id,
            c.name,
            c.coach_names.length ? `with ${c.coach_names.join(' and ')}` : '',
            c.user_id,
            c.my_client_id,
          ),
        )

  const sectionFor = (r: SandboxCommitmentRow) => {
    const key = keyOf(r)
    let s = sections.get(key)
    if (!s) {
      const person = by === 'coach' ? r.coach : r.coachee
      s =
        key === TEAM_KEY
          ? blank(TEAM_KEY, 'Team', 'shared work', null)
          : blank(key, person?.name ?? 'Someone', '', person?.user_id ?? null)
      sections.set(key, s)
    }
    return s
  }
  for (const r of scoped) {
    const s = sectionFor(r)
    if (isOpen(r)) s.open++
    if (daysLate(r, today) > 0) s.overdue++
    if (isDone(r)) s.done++
    if (r.status !== 'draft' && r.status !== 'abandoned') s.total++
  }
  for (const r of visible) sectionFor(r).rows.push(r)

  return [...sections.values()]
    .filter(s => s.rows.length > 0 || (includeEmpty && s.key !== TEAM_KEY))
    .sort((a, b) => {
      if ((a.key === TEAM_KEY) !== (b.key === TEAM_KEY))
        return a.key === TEAM_KEY ? 1 : -1
      return b.overdue - a.overdue || a.name.localeCompare(b.name)
    })
}

/**
 * Who the row is about, from the seat of the section it sits in. A section
 * already says whose it is, so a row never repeats that name.
 */
export function whoText(
  r: SandboxCommitmentRow,
  by: ViewBy,
  sectionUserId: string | null = null,
): string {
  if (r.kind === 'team') {
    const about =
      by !== 'coachee' && r.coachee ? ` · about ${r.coachee.name}` : ''
    if (!r.assignee) return `Unassigned${about}`
    if (sectionUserId && r.assignee.user_id === sectionUserId)
      return `Team work${about}`
    return `Team · ${r.assignee.name}${about}`
  }
  if (by === 'coach') return r.coachee?.name ?? ''
  if (by === 'coachee') return r.coach ? `with ${r.coach.name}` : ''
  return [r.coachee?.name, r.coach ? `with ${r.coach.name}` : '']
    .filter(Boolean)
    .join(' ')
}
