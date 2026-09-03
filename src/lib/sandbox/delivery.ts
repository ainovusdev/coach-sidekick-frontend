// The one place the pace vocabulary lives (labels, tones, short strings).
import { fmtDay } from '@/lib/sandbox/format'
import type {
  AttentionItem,
  AttentionKind,
  AttentionSeverity,
  DeliveryState,
  Pace,
} from '@/types/sandbox-delivery'

export type Tone = 'default' | 'good' | 'warning' | 'danger' | 'muted'

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

export const TONE_CLASS: Record<Tone, string> = {
  default: 'bg-surface-3 text-ink-2',
  good: 'bg-forest-bg text-forest',
  warning: 'bg-amber-token-bg text-amber-token',
  danger: 'bg-vermillion-bg text-vermillion',
  muted: 'bg-surface-3 text-ink-3',
}

export const TONE_DOT: Record<Tone, string> = {
  default: 'bg-ink-3',
  good: 'bg-forest',
  warning: 'bg-amber-token',
  danger: 'bg-vermillion',
  muted: 'bg-ink-4',
}

export const TONE_TEXT: Record<Tone, string> = {
  default: 'text-ink',
  good: 'text-forest',
  warning: 'text-amber-token',
  danger: 'text-vermillion',
  muted: 'text-ink-3',
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
