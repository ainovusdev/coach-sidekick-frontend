/**
 * Small formatting helpers for the sandbox screens.
 */

import { parseDateOnly } from '@/lib/sandbox/term'
import type { SandboxGroup, SandboxStatus } from '@/types/sandbox'

/** Fixed three-letter months: browsers render en-GB September as "Sept". */
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const month = (d: Date) => MONTHS[d.getMonth()]

/** "1 Jun" / "1 Jun 2026" — date-only fields, no timezone shift. */
export function fmtDay(
  value: string | null | undefined,
  withYear = false,
): string {
  const d = parseDateOnly(value)
  if (!d) return ''
  return `${d.getDate()} ${month(d)}${withYear ? ` ${d.getFullYear()}` : ''}`
}

/** "1 Jun – 1 Jul" · "1 – 31 Aug" · "28 Sep – 9 Oct" · "1 – 11 Dec". */
export function fmtWindow(start: string, end: string): string {
  const s = parseDateOnly(start)
  const e = parseDateOnly(end)
  if (!s || !e) return ''
  const sameMonth =
    s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
  if (sameMonth) return `${s.getDate()} – ${e.getDate()} ${month(e)}`
  return `${s.getDate()} ${month(s)} – ${e.getDate()} ${month(e)}`
}

/** "1 Jun 2026 · 6 months" */
export function fmtTerm(start: string, months: number): string {
  return `${fmtDay(start, true)} · ${months} months`
}

export function fmtHours(hours: number | null | undefined): string {
  if (hours == null) return '—'
  return Number.isInteger(hours) ? `${hours} h` : `${hours} h`
}

/** "13.5 h at 45 min → 18 sessions" */
export function fmtContract(
  group: Pick<
    SandboxGroup,
    'hours_per_coachee' | 'session_length_minutes' | 'expected_sessions'
  >,
): string {
  if (group.hours_per_coachee == null)
    return `${group.session_length_minutes} min sessions`
  const sessions =
    group.expected_sessions == null
      ? ''
      : ` → ${group.expected_sessions} sessions`
  return `${group.hours_per_coachee} h at ${group.session_length_minutes} min${sessions}`
}

export function getInitials(
  name: string | null | undefined,
  fallback = '',
): string {
  const source = (name || fallback || '').trim()
  if (!source) return '?'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function firstName(
  name: string | null | undefined,
  fallback = '',
): string {
  const source = (name || fallback || '').trim()
  return source.split(/\s+/)[0] || ''
}

export const STATUS_LABEL: Record<SandboxStatus, string> = {
  upcoming: 'Upcoming',
  active: 'Active',
  ended: 'Ended',
}

export const STATUS_CLASS: Record<SandboxStatus, string> = {
  upcoming: 'bg-indigo-bg text-indigo',
  active: 'bg-forest-bg text-forest',
  ended: 'bg-surface-3 text-ink-3',
}

export function pluralise(
  n: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return `${n} ${n === 1 ? singular : plural}`
}

export function listNames(names: string[], max = 3): string {
  if (names.length <= max) return names.join(', ')
  return `${names.slice(0, max).join(', ')} +${names.length - max}`
}
