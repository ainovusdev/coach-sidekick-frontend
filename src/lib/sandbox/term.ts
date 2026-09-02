/**
 * Term helpers — mirror app/services/sandbox_timeline.py for instant form
 * feedback. The server's /sandboxes/term-preview is the source of truth.
 */

import type { SandboxStatus, TermMonths } from '@/types/sandbox'

const CHECKIN_COUNT: Record<TermMonths, number> = {
  3: 1,
  4: 1,
  6: 2,
  9: 3,
  12: 4,
}
const MIDPOINT_COUNT: Record<TermMonths, number> = {
  3: 0,
  4: 0,
  6: 1,
  9: 1,
  12: 2,
}

/** Parse a YYYY-MM-DD string as a local calendar date (no timezone shift). */
export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function toDateOnly(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addMonths(date: Date, months: number): Date {
  const total = date.getMonth() + months
  const year = date.getFullYear() + Math.floor(total / 12)
  const month = ((total % 12) + 12) % 12
  const lastDay = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(date.getDate(), lastDay))
}

export function termEnd(start: Date, months: number): Date {
  const end = addMonths(start, months)
  end.setDate(end.getDate() - 1)
  return end
}

export function previewSentence(start: Date, months: TermMonths): string {
  const checkins = CHECKIN_COUNT[months]
  const midpoints = MIDPOINT_COUNT[months]
  const end = termEnd(start, months)
  const reviewMonth = addMonths(
    new Date(end.getFullYear(), end.getMonth(), 1),
    1,
  ).toLocaleString('en-GB', { month: 'long' })
  const parts = [`${checkins} ${checkins === 1 ? 'check-in' : 'check-ins'}`]
  if (midpoints)
    parts.push(
      `${midpoints} ${midpoints === 1 ? 'midpoint report' : 'midpoint reports'}`,
    )
  return `Creates ${parts.join(', ')} and a results review in ${reviewMonth}.`
}

export function eventCount(months: TermMonths): number {
  return 2 + CHECKIN_COUNT[months] + MIDPOINT_COUNT[months]
}

export function sandboxStatus(
  start: string,
  end: string,
  today: string,
): SandboxStatus {
  if (today < start) return 'upcoming'
  if (today > end) return 'ended'
  return 'active'
}

const MS_PER_DAY = 86_400_000

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY)
}

/** Whole months into the term, 1-based ("Month 4 of 6"). */
export function monthOfTerm(start: Date, today: Date): number {
  let months =
    (today.getFullYear() - start.getFullYear()) * 12 +
    (today.getMonth() - start.getMonth())
  if (today.getDate() < start.getDate()) months -= 1
  return Math.max(1, months + 1)
}

/** "term starts in 5 months" / "term starts in 12 days" / "term starts tomorrow". */
export function startsInText(start: Date, today: Date): string {
  const days = daysBetween(today, start)
  if (days <= 0) return 'term starts today'
  if (days === 1) return 'term starts tomorrow'
  if (days < 45) return `term starts in ${days} days`
  const months = Math.round(days / 30.4)
  return `term starts in ${months} ${months === 1 ? 'month' : 'months'}`
}

export function termProgress(start: Date, end: Date, today: Date): number {
  const total = daysBetween(start, end) + 1
  const done = daysBetween(start, today) + 1
  if (total <= 0) return 0
  return Math.min(1, Math.max(0, done / total))
}
