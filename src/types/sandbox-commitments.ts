import type {
  CommitmentPriority,
  CommitmentSource,
  CommitmentStatus,
} from '@/types/commitment'
import type { PersonalMilestoneInfo } from '@/types/sandbox-milestones'

/**
 * The sandbox's Commitments tab. Rows are slim on purpose: for someone who only
 * tracks a coaching commitment, this is all the API gives them.
 */
export interface CommitmentPerson {
  user_id: string | null
  member_id: string | null
  name: string
}

export interface CommitmentGroupRef {
  id: string
  name: string
}

export type SandboxCommitmentKind = 'team' | 'coaching' | 'milestone'

export interface SandboxCommitmentRow {
  id: string
  kind: SandboxCommitmentKind
  title: string
  status: CommitmentStatus
  priority: CommitmentPriority | null
  start_date?: string | null
  target_date: string | null
  completed_date: string | null
  created_at: string
  coach: CommitmentPerson | null
  coachee: CommitmentPerson | null
  group: CommitmentGroupRef | null
  assignee: CommitmentPerson | null
  is_mine: boolean
  /** The viewer reads this one in full anyway, so may open, tick or edit it. */
  can_open: boolean
  /** The rights matrix, resolved here so the tick and menu need no second request. */
  can_edit?: boolean
  source?: CommitmentSource
  /** A rule-made row: what the "Automatic" chip says. */
  auto?: {
    rule: string | null
    label: string | null
    why: string | null
  } | null
  /** Set when the row is a coachee's personal milestone. */
  milestone?: PersonalMilestoneInfo | null
}

export interface SandboxCommitmentCoach extends CommitmentPerson {
  coachee_count: number
}

export interface SandboxCommitmentCoachee extends CommitmentPerson {
  coach_names: string[]
  /** The viewer's own client row for this coachee, when they coach them. */
  my_client_id: string | null
}

export interface SandboxCommitments {
  rows: SandboxCommitmentRow[]
  coaches: SandboxCommitmentCoach[]
  coachees: SandboxCommitmentCoachee[]
  groups: CommitmentGroupRef[]
  tracks_everyone: boolean
  /** MILESTONE_RULES_ENABLED — only the empty-state copy reads it. */
  milestones_enabled?: boolean
}
