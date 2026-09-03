// The one place the gold-sealing vocabulary lives (labels, tones, meta lines).
import type { Tone } from '@/lib/sandbox/delivery'
import type {
  CoacheeOutcomeState,
  Outcome,
  OutcomeStatus,
} from '@/types/sandbox-outcomes'

export const OUTCOME_STATUS_LABEL: Record<OutcomeStatus, string> = {
  draft: 'Draft',
  proposed: 'Proposed',
  changes_requested: 'Changes requested',
  sealed: 'Gold sealed',
}

export function outcomeTone(status: OutcomeStatus): Tone {
  switch (status) {
    case 'sealed':
      return 'good'
    case 'proposed':
      return 'warning'
    case 'changes_requested':
      return 'danger'
    default:
      return 'muted'
  }
}

export const COACHEE_STATE_LABEL: Record<CoacheeOutcomeState, string> = {
  none: 'No outcome yet',
  drafting: 'Drafting',
  changes_requested: 'Changes requested',
  proposed: 'Waiting for a gold seal',
  sealed: 'Gold sealed',
}

export function coacheeStateTone(state: CoacheeOutcomeState): Tone {
  switch (state) {
    case 'sealed':
      return 'good'
    case 'proposed':
      return 'warning'
    case 'changes_requested':
      return 'danger'
    default:
      return 'muted'
  }
}

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

/** "3 Sep" from an ISO datetime (local time). */
export function fmtWhen(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

/** One line under the title: who did the last thing that matters, and when. */
export function outcomeMeta(o: Outcome): string {
  switch (o.status) {
    case 'sealed':
      return `Gold sealed by ${o.decided_by_name ?? 'the approver'} · ${fmtWhen(o.sealed_at)}`
    case 'proposed':
      return `Proposed by ${o.proposed_by_name ?? 'the coach'} · ${fmtWhen(o.proposed_at)}`
    case 'changes_requested':
      return `Sent back by ${o.decided_by_name ?? 'the approver'} · ${fmtWhen(o.decided_at)}`
    default:
      return `Draft by ${o.created_by_name ?? 'the coach'} · ${fmtWhen(o.created_at)}`
  }
}
