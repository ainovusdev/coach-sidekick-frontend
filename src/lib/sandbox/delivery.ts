// The one place the pace vocabulary lives (labels, tones, short strings).
import { fmtDay } from '@/lib/sandbox/format'
import { daysBetween, parseDateOnly } from '@/lib/sandbox/term'
import type {
  AttentionItem,
  AttentionKind,
  AttentionSeverity,
  DeliveryState,
  Pace,
} from '@/types/sandbox-delivery'

import { type Tone } from '@/lib/tone'

// Tone tokens moved to `@/lib/tone` (shared with commitments); re-exported
// so existing imports keep working.
export { TONE_CLASS, TONE_DOT, TONE_TEXT } from '@/lib/tone'
export type { Tone } from '@/lib/tone'

export const STATE_LABEL: Record<DeliveryState, string> = {
  unknown: 'No contract yet',
  not_started: 'No sessions yet',
  on_track: 'On track',
  behind: 'Behind',
  ahead: 'Ahead',
  complete: 'Complete',
  ended_short: 'Ended short',
}

export function stateTone(state: DeliveryState): Tone {
  switch (state) {
    case 'behind':
    case 'ended_short':
      return 'danger'
    case 'not_started':
      return 'warning'
    case 'on_track':
    case 'ahead':
    case 'complete':
      return 'good'
    default:
      return 'muted'
  }
}

/** "6.5 h" / "13 h" */
export function fmtHoursShort(hours: number | null | undefined): string {
  if (hours == null) return '—'
  const text = Number.isInteger(hours) ? `${hours}` : hours.toFixed(1)
  return `${text.replace(/\.0$/, '')} h`
}

/** "6 of 18 sessions" — or just "6 sessions" without a contract. */
export function fmtDelivered(pace: Pace): string {
  const n = pace.delivered_sessions
  if (pace.expected_sessions == null)
    return `${n} ${n === 1 ? 'session' : 'sessions'}`
  return `${n} of ${pace.expected_sessions} sessions`
}

/**
 * The chip line: `6 of 18 · behind by 2` / `12 of 18 · on track` /
 * `18 of 18 · complete` / `No sessions yet · started 1 Jun` /
 * `Hours not set`.
 */
export function paceLabel(pace: Pace, startsOn?: string | null): string {
  const n = pace.delivered_sessions
  const e = pace.expected_sessions
  switch (pace.state) {
    case 'unknown':
      return 'Hours not set'
    case 'not_started': {
      const started = pace.elapsed_fraction > 0
      const day = startsOn ? fmtDay(startsOn) : ''
      if (!day) return 'No sessions yet'
      return `No sessions yet · ${started ? 'started' : 'starts'} ${day}`
    }
    case 'complete':
      return `${n} of ${e} · complete`
    case 'ended_short':
      return `${n} of ${e} · ended ${Math.max((e ?? 0) - n, 0)} short`
    case 'behind':
      return `${n} of ${e} · behind by ${Math.max(1, Math.round(Math.abs(pace.variance ?? 0)))}`
    case 'ahead':
      return `${n} of ${e} · ahead by ${Math.max(1, Math.round(Math.abs(pace.variance ?? 0)))}`
    default:
      return `${n} of ${e} · on track`
  }
}

export const NO_CONTRACT_COPY =
  'Hours per coachee isn’t set, so there’s nothing to measure against yet.'

// ---------------------------------------------------------------- attention

export const SEVERITY_TONE: Record<AttentionSeverity, Tone> = {
  urgent: 'danger',
  warn: 'warning',
  info: 'default',
}

export const ATTENTION_GROUP_LABEL: Record<AttentionKind, string> = {
  behind: 'Behind',
  no_session_yet: 'No session yet',
  outcome_awaiting_approval: 'Waiting for your gold seal',
  outcomes_to_seal: 'Outcomes to seal',
  outcome_changes_requested: 'Changes requested',
  invitation_not_accepted: 'Invitations',
  group_incomplete: 'Groups to finish',
  window_open: 'Windows open',
  window_opening: 'Opening soon',
}

export const ATTENTION_ORDER: AttentionKind[] = [
  'behind',
  'no_session_yet',
  'outcome_awaiting_approval',
  'outcomes_to_seal',
  'outcome_changes_requested',
  'invitation_not_accepted',
  'group_incomplete',
  'window_open',
  'window_opening',
]

/** Where an attention row takes you: the sandbox page, at the right section. */
export function attentionHref(
  item: AttentionItem,
  basePath = '/sandboxes',
): string {
  return `${basePath}/${item.sandbox_id}#${item.section}`
}

/**
 * When a row started waiting, or when it is due — "Waiting 12 days", "Due
 * 3 Oct", "3 days over".
 *
 * Both dates are on the wire already and neither was ever rendered, so a list
 * ranked correctly by the server still could not tell you which of two behind
 * coachees had been behind since May. A due date wins over a start date: it is
 * the one with a deadline attached.
 *
 * `today` comes from the sandbox, never the browser clock — every other date on
 * these pages is date-only and server-anchored.
 */
export function attentionWhen(
  item: Pick<AttentionItem, 'since' | 'due'>,
  today: string,
): { text: string; overdue: boolean } | null {
  const now = parseDateOnly(today)
  if (!now) return null
  const due = parseDateOnly(item.due)
  if (due) {
    const days = daysBetween(now, due)
    if (days < 0) {
      const over = Math.abs(days)
      return {
        text: `${over} ${over === 1 ? 'day' : 'days'} over`,
        overdue: true,
      }
    }
    if (days === 0) return { text: 'Due today', overdue: true }
    if (days === 1) return { text: 'Due tomorrow', overdue: false }
    return { text: `Due ${fmtDay(item.due)}`, overdue: false }
  }
  const since = parseDateOnly(item.since)
  if (!since) return null
  const days = daysBetween(since, now)
  if (days <= 0) return { text: 'Since today', overdue: false }
  if (days === 1) return { text: 'Waiting a day', overdue: false }
  return { text: `Waiting ${days} days`, overdue: false }
}
