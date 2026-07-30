/**
 * Pure date + grouping logic for the public weekly check-in page.
 *
 * Everything here is deliberately side-effect free so the whole correctness
 * story of the page lives in one readable file.
 *
 * The page derives every displayed value from the BROWSER's calendar day, and
 * ignores the server's `overdue` / `open_count` / `overdue_count` /
 * `due_this_week_count`. The backend computes those against its own
 * `date.today()` (UTC on Railway); for a client at UTC+13 that is a day stale
 * and would render "Due today" inside a red OVERDUE group. One derivation,
 * client-side, so the label, the grouping, the colour and the header counts can
 * never disagree with each other or with the phone in the user's hand.
 */

import {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  format,
  nextFriday,
  nextMonday,
  startOfDay,
} from 'date-fns'
import { formatDateOnly, parseDateForPicker } from '@/lib/date-utils'
import type { CheckinCommitment } from '@/services/checkin-service'

/**
 * The ONLY place a Date becomes a wire string. Always `format`, never
 * `toISOString().split('T')[0]`.
 *
 * Do not "consistency-fix" this to match the rest of the repo. The
 * `toISOString()` form used in commitment-row.tsx / due-date-field.tsx /
 * commitment-detail-panel.tsx is wrong at positive UTC offsets: react-day-picker
 * hands back LOCAL midnight, and `toISOString()` on local midnight in UTC+5:30
 * rolls back a day (pick Jun 15 → send "2026-06-14"). It survives there because
 * it happens to be correct for the Americas. Check-in links arrive by email and
 * are opened in every timezone, so here it would be a live bug.
 */
export function toDateOnly(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

/** Local midnight of a `yyyy-MM-dd` API value — feeds both the picker and the maths. */
export function parseDay(
  targetDate: string | null | undefined,
): Date | undefined {
  return parseDateForPicker(targetDate ?? undefined)
}

/**
 * Whole calendar days from today to the due date. Negative = overdue.
 * Returns null when there is no due date.
 */
export function daysFromToday(
  targetDate: string | null | undefined,
): number | null {
  const due = parseDay(targetDate)
  if (!due) return null
  return differenceInCalendarDays(due, new Date())
}

export type CheckinBucket = 'overdue' | 'week' | 'later' | 'undated' | 'done'

/**
 * Which section a row belongs in. The overdue / this-week / later thresholds
 * mirror the digest sweeper's `today` and `today + 7` partition, so the email
 * and the page tell the same story about the same commitment.
 */
export function bucketOf(item: CheckinCommitment): CheckinBucket {
  if (item.completed) return 'done'
  const days = daysFromToday(item.target_date)
  if (days === null) return 'undated'
  if (days < 0) return 'overdue'
  if (days <= 7) return 'week'
  return 'later'
}

export function isOverdue(item: CheckinCommitment): boolean {
  return bucketOf(item) === 'overdue'
}

/** Human due-date text for a row. */
export function dueLabel(item: CheckinCommitment): string {
  if (!item.target_date) return 'Add a date'
  const days = daysFromToday(item.target_date)
  if (item.completed)
    return `Was due ${formatDateOnly(item.target_date, 'MMM d')}`
  if (days === null) return 'Add a date'
  if (days < 0) {
    const n = Math.abs(days)
    return `${n} day${n === 1 ? '' : 's'} overdue`
  }
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  // Inside a week, the weekday name is more useful than a number.
  if (days < 7) return `Due ${formatDateOnly(item.target_date, 'EEEE')}`
  return `Due ${formatDateOnly(item.target_date, 'MMM d')}`
}

/** Spoken form for aria-labels and live-region announcements. */
export function spokenDate(targetDate: string | null | undefined): string {
  if (!targetDate) return 'no date set'
  return formatDateOnly(targetDate, 'EEEE, MMMM d')
}

export interface QuickDateOption {
  label: string
  /** Secondary, muted text so "Friday" is never ambiguous. */
  hint: string
  value: string
}

/**
 * The quick-pick chips.
 *
 * Built optimistically, then de-duplicated by the resulting `yyyy-MM-dd`. That
 * single rule handles every weekday edge case without a pile of conditionals:
 * on a Thursday `nextFriday` collides with Tomorrow and drops out; on a Sunday
 * `nextMonday` collides with Tomorrow and drops out; on a Friday `nextFriday`
 * is a genuine +7 and survives. Do not replace this with per-weekday branching.
 */
export function quickDateOptions(now: Date = new Date()): QuickDateOption[] {
  const today = startOfDay(now)
  const candidates: Array<{ label: string; date: Date }> = [
    { label: 'Today', date: today },
    { label: 'Tomorrow', date: addDays(today, 1) },
    { label: format(nextFriday(today), 'EEEE'), date: nextFriday(today) },
    { label: 'Next Monday', date: nextMonday(today) },
    { label: 'In 2 weeks', date: addWeeks(today, 2) },
  ]

  const seen = new Set<string>()
  const options: QuickDateOption[] = []
  for (const c of candidates) {
    const value = toDateOnly(c.date)
    if (seen.has(value)) continue
    seen.add(value)
    options.push({ label: c.label, hint: format(c.date, 'MMM d'), value })
  }
  return options
}

export interface CheckinSectionData {
  key: CheckinBucket
  title: string
  items: CheckinCommitment[]
}

/**
 * Section order and titles. The first three deliberately echo the digest
 * email's wording so the email → page transition reads as one product.
 * "No date yet" is split out of the email's catch-all on purpose: it is the
 * natural home for the reschedule affordance this page now offers.
 */
const SECTION_ORDER: Array<{ key: CheckinBucket; title: string }> = [
  { key: 'overdue', title: 'Overdue' },
  { key: 'week', title: 'This week' },
  { key: 'later', title: 'Later' },
  { key: 'undated', title: 'No date yet' },
  { key: 'done', title: 'Done this week' },
]

/** Group rows into display sections, dropping empty ones. */
export function groupCommitments(
  items: CheckinCommitment[],
): CheckinSectionData[] {
  const byBucket = new Map<CheckinBucket, CheckinCommitment[]>()
  for (const item of items) {
    const bucket = bucketOf(item)
    const list = byBucket.get(bucket)
    if (list) list.push(item)
    else byBucket.set(bucket, [item])
  }

  // Soonest first inside a section; undated keeps its incoming order.
  const bySoonest = (a: CheckinCommitment, b: CheckinCommitment) => {
    const da = daysFromToday(a.target_date)
    const db = daysFromToday(b.target_date)
    if (da === null || db === null) return 0
    return da - db
  }

  return SECTION_ORDER.flatMap(({ key, title }) => {
    const sectionItems = byBucket.get(key)
    if (!sectionItems || sectionItems.length === 0) return []
    return [{ key, title, items: [...sectionItems].sort(bySoonest) }]
  })
}
