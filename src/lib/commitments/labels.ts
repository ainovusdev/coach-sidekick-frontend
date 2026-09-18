// The one label map for commitments: status, priority, source. Every row,
// card, chip and select reads from here so the words never drift.
import type { Tone } from '@/lib/tone'
import type {
  CommitmentPriority,
  CommitmentSource,
  CommitmentStatus,
} from '@/types/commitment'

export const COMMITMENT_STATUS_LABEL: Record<CommitmentStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  in_progress: 'In progress',
  completed: 'Completed',
  abandoned: 'Abandoned',
}

export const COMMITMENT_STATUS_TONE: Record<CommitmentStatus, Tone> = {
  draft: 'warning',
  active: 'default',
  in_progress: 'warning',
  completed: 'good',
  abandoned: 'danger',
}

export const COMMITMENT_STATUS_ORDER: CommitmentStatus[] = [
  'draft',
  'active',
  'in_progress',
  'completed',
  'abandoned',
]

/** Group heading for drafts (they need review, so the heading says so). */
export const DRAFT_GROUP_LABEL = 'Drafts — needs review'

export const COMMITMENT_PRIORITY_LABEL: Record<CommitmentPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export const COMMITMENT_PRIORITY_TONE: Record<CommitmentPriority, Tone> = {
  low: 'muted',
  medium: 'default',
  high: 'warning',
  urgent: 'danger',
}

export const COMMITMENT_SOURCE_LABEL: Record<CommitmentSource, string> = {
  manual: '',
  ai_extracted: 'From transcript',
  rule: 'Automatic',
}

export function statusInfo(status: CommitmentStatus | string | undefined) {
  const key = (status ?? 'active') as CommitmentStatus
  return {
    label: COMMITMENT_STATUS_LABEL[key] ?? String(status),
    tone: COMMITMENT_STATUS_TONE[key] ?? 'default',
  }
}

export function priorityInfo(
  priority: CommitmentPriority | string | undefined,
) {
  const key = (priority ?? 'medium') as CommitmentPriority
  return {
    label: COMMITMENT_PRIORITY_LABEL[key] ?? String(priority),
    tone: COMMITMENT_PRIORITY_TONE[key] ?? 'default',
  }
}

/** Selectable status chip classes by tone (selected / idle). */
export const TONE_CHIP: Record<Tone, { selected: string; unselected: string }> =
  {
    default: {
      selected: 'bg-ds-accent-bg text-ds-accent border-ds-accent',
      unselected:
        'bg-transparent text-ink-3 border-line hover:bg-ds-accent-bg hover:text-ds-accent hover:border-ds-accent',
    },
    good: {
      selected: 'bg-forest-bg text-forest border-forest',
      unselected:
        'bg-transparent text-ink-3 border-line hover:bg-forest-bg hover:text-forest hover:border-forest',
    },
    warning: {
      selected: 'bg-amber-token-bg text-amber-token border-amber-token',
      unselected:
        'bg-transparent text-ink-3 border-line hover:bg-amber-token-bg hover:text-amber-token hover:border-amber-token',
    },
    danger: {
      selected: 'bg-vermillion-bg text-vermillion border-vermillion',
      unselected:
        'bg-transparent text-ink-3 border-line hover:bg-vermillion-bg hover:text-vermillion hover:border-vermillion',
    },
    muted: {
      selected: 'bg-surface-3 text-ink-2 border-line-strong',
      unselected:
        'bg-transparent text-ink-3 border-line hover:bg-surface-3 hover:text-ink-2',
    },
  }

/** Statuses a person can set by hand (drafts are confirmed, not picked). */
export const SETTABLE_STATUSES: CommitmentStatus[] = [
  'active',
  'in_progress',
  'completed',
  'abandoned',
]

/** Outline badge classes for a priority (kanban cards, rows). */
export const PRIORITY_BADGE: Record<CommitmentPriority, string> = {
  urgent: 'bg-vermillion-bg text-vermillion border-vermillion',
  high: 'bg-amber-token-bg text-amber-token border-amber-token',
  medium: 'bg-amber-token-bg text-amber-token border-amber-token',
  low: 'bg-surface-3 text-ink-2 border-line',
}
