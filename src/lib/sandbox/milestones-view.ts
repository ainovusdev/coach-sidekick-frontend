/**
 * Personal milestones on the Commitments tab, as pure functions: one card per
 * occurrence, what its summary sentence says, how each row reads, and what a
 * preview or report says in a line. No React.
 */

import { firstName, fmtDay, fmtWindow, pluralise } from '@/lib/sandbox/format'
import { parseDateOnly } from '@/lib/sandbox/term'
import type { SandboxCommitmentRow } from '@/types/sandbox-commitments'
import type {
  MilestoneEffects,
  MilestoneReport,
  PersonalMilestoneInfo,
} from '@/types/sandbox-milestones'

/** Timeline order. Anything unknown sorts last, by name. */
export const OCCURRENCE_ORDER: string[] = [
  'gold_sealing',
  'midpoint_reporting:1',
  'midpoint_reporting:2',
  'results_review',
]

export function occurrenceRank(occurrence: string): number {
  const i = OCCURRENCE_ORDER.indexOf(occurrence)
  return i === -1 ? OCCURRENCE_ORDER.length : i
}

export function isMilestoneRow(
  r: SandboxCommitmentRow,
): r is SandboxCommitmentRow & { milestone: PersonalMilestoneInfo } {
  return r.kind === 'milestone' && !!r.milestone
}

const isOpen = (r: SandboxCommitmentRow) =>
  r.status === 'active' || r.status === 'in_progress'

export function daysLate(r: SandboxCommitmentRow, today: string): number {
  if (!isOpen(r)) return 0
  const due = parseDateOnly(r.target_date)
  const now = parseDateOnly(today)
  if (!due || !now) return 0
  return Math.max(0, Math.round((now.getTime() - due.getTime()) / 86_400_000))
}

/** Not open and not done: dismissed by a person or dropped by the automation. */
export function isNotActive(r: SandboxCommitmentRow): boolean {
  return r.status === 'abandoned'
}

export interface MilestoneCounts {
  total: number
  open: number
  overdue: number
  done: number
  /** Done because an outcome was gold-sealed (gold sealing only). */
  sealed: number
  awaiting: number
  dismissed: number
  dropped: number
}

export function countMilestones(
  rows: SandboxCommitmentRow[],
  today: string,
): MilestoneCounts {
  const c: MilestoneCounts = {
    total: 0,
    open: 0,
    overdue: 0,
    done: 0,
    sealed: 0,
    awaiting: 0,
    dismissed: 0,
    dropped: 0,
  }
  for (const r of rows) {
    if (!isNotActive(r)) c.total++
    if (isOpen(r)) c.open++
    if (daysLate(r, today) > 0) c.overdue++
    if (r.status === 'completed') c.done++
    if (r.milestone?.sealed) c.sealed++
    if (r.milestone?.coach_pending) c.awaiting++
    if (isNotActive(r)) {
      if (r.milestone?.resolved_by === 'person') c.dismissed++
      else c.dropped++
    }
  }
  return c
}

/**
 * "7 of 12 sealed · 2 overdue · 1 awaiting a coach · 1 dismissed". Gold
 * sealing says "sealed" for rows the automation closed on a sealed outcome;
 * everything else says "done".
 */
export function milestoneSummary(
  occurrence: string,
  c: MilestoneCounts,
): { key: string; text: string; late?: boolean }[] {
  const parts: { key: string; text: string; late?: boolean }[] = []
  if (c.total > 0) {
    const word =
      occurrence === 'gold_sealing' && c.sealed === c.done && c.done > 0
        ? 'sealed'
        : 'done'
    parts.push({ key: 'done', text: `${c.done} of ${c.total} ${word}` })
  }
  if (c.overdue > 0)
    parts.push({ key: 'overdue', text: `${c.overdue} overdue`, late: true })
  if (c.awaiting > 0)
    parts.push({
      key: 'awaiting',
      text: `${c.awaiting} awaiting a coach`,
      late: true,
    })
  if (c.dismissed > 0)
    parts.push({ key: 'dismissed', text: `${c.dismissed} dismissed` })
  if (c.dropped > 0)
    parts.push({ key: 'dropped', text: `${c.dropped} dropped` })
  return parts
}

export interface MilestoneCard {
  occurrence: string
  label: string
  /** Active rows: overdue first, then open by window end, then done. */
  rows: SandboxCommitmentRow[]
  /** Dismissed and dropped, folded under "Not active". */
  notActive: SandboxCommitmentRow[]
  counts: MilestoneCounts
}

export function buildMilestoneCards(
  visible: SandboxCommitmentRow[],
  scoped: SandboxCommitmentRow[],
  today: string,
): MilestoneCard[] {
  const cards = new Map<string, MilestoneCard>()
  const cardFor = (
    r: SandboxCommitmentRow & { milestone: PersonalMilestoneInfo },
  ) => {
    const key = r.milestone.occurrence
    let card = cards.get(key)
    if (!card) {
      card = {
        occurrence: key,
        label: r.milestone.label,
        rows: [],
        notActive: [],
        counts: countMilestones([], today),
      }
      cards.set(key, card)
    }
    return card
  }
  const byOccurrence = new Map<string, SandboxCommitmentRow[]>()
  for (const r of scoped) {
    if (!isMilestoneRow(r)) continue
    cardFor(r)
    const list = byOccurrence.get(r.milestone.occurrence) ?? []
    list.push(r)
    byOccurrence.set(r.milestone.occurrence, list)
  }
  for (const [key, list] of byOccurrence)
    cards.get(key)!.counts = countMilestones(list, today)
  for (const r of visible) {
    if (!isMilestoneRow(r) || isNotActive(r)) continue
    cardFor(r).rows.push(r)
  }
  // Dismissed and dropped rows are a fold of their own, whatever the status
  // chip says: "Not active (2)" is information under every cut.
  for (const r of scoped) {
    if (!isMilestoneRow(r) || !isNotActive(r)) continue
    cardFor(r).notActive.push(r)
  }
  const rank = (r: SandboxCommitmentRow) =>
    daysLate(r, today) > 0 ? 0 : isOpen(r) ? 1 : 2
  for (const card of cards.values()) {
    card.rows.sort(
      (a, b) =>
        rank(a) - rank(b) ||
        (a.target_date ?? '').localeCompare(b.target_date ?? '') ||
        (a.coachee?.name ?? '').localeCompare(b.coachee?.name ?? ''),
    )
    card.notActive.sort((a, b) =>
      (a.coachee?.name ?? '').localeCompare(b.coachee?.name ?? ''),
    )
  }
  return [...cards.values()].sort(
    (a, b) =>
      occurrenceRank(a.occurrence) - occurrenceRank(b.occurrence) ||
      a.label.localeCompare(b.label),
  )
}

export type ChipTone = 'quiet' | 'info' | 'warn' | 'muted'

export interface SourceChip {
  text: string
  tone: ChipTone
  /** Hover text: the default dates behind an adjusted row, the reason behind a dropped one. */
  title?: string
}

const DROP_REASON: Record<string, string> = {
  event_removed: 'event removed',
  event_dropped: 'event dropped',
  window_before_arrival: 'closed before they joined',
  window_passed: 'closed before it was created',
  left_sandbox: 'left the sandbox',
}

/**
 * Where a row's dates come from, or why it is not active:
 * "Sandbox dates" (quiet) · "From their start date" · "Adjusted" (with the
 * default in the tooltip) · "Dropped · event removed" · "Dismissed by Priya".
 */
export function sourceChip(
  m: PersonalMilestoneInfo,
  status: string,
  dismissedBy?: string | null,
): SourceChip {
  const defaults = fmtWindow(m.default_start, m.default_end)
  if (status === 'abandoned') {
    if (m.resolved_by === 'person')
      return {
        text: dismissedBy
          ? `Dismissed by ${firstName(dismissedBy)}`
          : 'Dismissed',
        tone: 'muted',
      }
    const why = m.resolved_reason ? DROP_REASON[m.resolved_reason] : null
    return {
      text: why ? `Dropped · ${why}` : 'Dropped',
      tone: 'muted',
      title: defaults ? `Default ${defaults}` : undefined,
    }
  }
  if (!m.follows)
    return {
      text: 'Adjusted',
      tone: 'info',
      title: defaults ? `Default ${defaults}` : undefined,
    }
  if (m.source_kind === 'derived')
    return { text: 'From their start date', tone: 'info' }
  return { text: 'Sandbox dates', tone: 'quiet' }
}

/** "15 Aug – 15 Sep", or "3 days late" when the window has closed on an open row. */
export function windowText(
  r: SandboxCommitmentRow,
  today: string,
): { text: string; late: boolean } {
  const late = daysLate(r, today)
  if (late > 0) return { text: `${pluralise(late, 'day')} late`, late: true }
  if (r.start_date && r.target_date)
    return { text: fmtWindow(r.start_date, r.target_date), late: false }
  if (r.target_date) return { text: `by ${fmtDay(r.target_date)}`, late: false }
  return { text: 'No window', late: false }
}

/**
 * Where a row's dates come from, as a sentence for the panel:
 * "Follows the sandbox's Gold sealing (1 Jun – 1 Jul)" ·
 * "Based on their start date (1 Oct)" · "Adjusted · default 15 Aug – 15 Sep".
 */
export function followsText(m: PersonalMilestoneInfo): string {
  const defaults = fmtWindow(m.default_start, m.default_end)
  if (!m.follows) return `Adjusted · default ${defaults}`
  if (m.source_kind === 'derived')
    return `Based on their start date (${fmtDay(m.default_start)})`
  return `Follows the sandbox's ${m.label} (${defaults})`
}

/**
 * The live line under a timeline move: "7 people's Gold sealing follows this
 * window · 2 keep adjusted dates · 1 would get a window".
 */
export function describeMilestoneEffects(
  e: MilestoneEffects | null | undefined,
  label?: string,
): string {
  if (!e) return ''
  const parts: string[] = []
  const what = label ? `${label}` : 'milestone'
  if (e.following > 0)
    parts.push(
      `${e.following === 1 ? "1 person's" : `${e.following} people's`} ${what} follows this window`,
    )
  if (e.adjusted > 0)
    parts.push(
      `${e.adjusted} ${e.adjusted === 1 ? 'keeps' : 'keep'} adjusted dates`,
    )
  if (e.would_create > 0)
    parts.push(
      `${e.would_create} would get ${e.would_create === 1 ? 'a window' : 'windows'}`,
    )
  if (e.would_drop > 0) parts.push(`${e.would_drop} would be dropped`)
  if (e.would_restore > 0) parts.push(`${e.would_restore} would come back`)
  return parts.length
    ? parts.join(' · ')
    : 'No personal milestones change with this.'
}

/**
 * What a change did (or would do) to people's dates, as an appendix:
 * "Personal dates: 3 move · 1 adjusted stays · 1 dropped."
 */
export function describeMilestoneReport(
  r: MilestoneReport | null | undefined,
): string {
  if (!r) return ''
  const parts: string[] = []
  if (r.moved > 0) parts.push(`${r.moved} move`)
  if (r.kept_adjusted > 0)
    parts.push(
      `${r.kept_adjusted} adjusted ${r.kept_adjusted === 1 ? 'stays' : 'stay'}`,
    )
  if (r.created > 0) parts.push(`${r.created} created`)
  if (r.abandoned > 0) parts.push(`${r.abandoned} dropped`)
  if (r.restored > 0) parts.push(`${r.restored} restored`)
  if (r.reassigned > 0) parts.push(`${r.reassigned} reassigned`)
  if (r.completed > 0) parts.push(`${r.completed} completed`)
  if (r.reopened > 0) parts.push(`${r.reopened} reopened`)
  return parts.length ? `Personal dates: ${parts.join(' · ')}.` : ''
}

/** The toast after a move: "7 personal windows followed." */
export function reportToastSuffix(
  r: MilestoneReport | null | undefined,
): string {
  if (!r) return ''
  const bits: string[] = []
  if (r.moved > 0)
    bits.push(`${pluralise(r.moved, 'personal window')} followed`)
  if (r.created > 0) bits.push(`${r.created} created`)
  if (r.abandoned > 0) bits.push(`${r.abandoned} dropped`)
  if (r.restored > 0) bits.push(`${r.restored} restored`)
  return bits.length ? ` ${bits.join(', ')}.` : ''
}

export function reportTotal(r: MilestoneReport | null | undefined): number {
  if (!r) return 0
  return (
    r.moved +
    r.kept_adjusted +
    r.created +
    r.abandoned +
    r.restored +
    r.reassigned +
    r.completed +
    r.reopened
  )
}
