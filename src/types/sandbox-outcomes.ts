// Gold sealing — matches app/schemas/sandbox_outcomes.py
import type { EventBrief } from '@/types/sandbox-delivery'

export type OutcomeStatus =
  | 'draft'
  | 'proposed'
  | 'changes_requested'
  | 'sealed'
/** Per coachee: the strongest state among their outcomes. */
export type CoacheeOutcomeState =
  | 'none'
  | 'drafting'
  | 'changes_requested'
  | 'proposed'
  | 'sealed'

export interface OutcomeHistoryEntry {
  at: string
  by: string | null
  by_name: string | null
  action: string
  note: string | null
}

export interface Outcome {
  id: string
  sandbox_id: string
  member_id: string
  title: string
  measure: string | null
  status: OutcomeStatus
  created_by_id: string
  created_by_name: string | null
  proposed_by_id: string | null
  proposed_by_name: string | null
  proposed_at: string | null
  decided_by_id: string | null
  decided_by_name: string | null
  decided_at: string | null
  decision_note: string | null
  sealed_at: string | null
  history: OutcomeHistoryEntry[]
  created_at: string
  updated_at: string
}

/** What the outcome list needs to know about one coachee. */
export interface CoacheeOutcomes {
  member_id: string
  user_id: string
  name: string | null
  email: string
  group_ids: string[]
  group_names: string[]
  approver_names: string[]
  can_propose: boolean
  can_approve: boolean
  state: CoacheeOutcomeState
  outcomes: Outcome[]
}

export interface OutcomeTotals {
  coachees: number
  sealed: number
  proposed: number
  changes_requested: number
  drafting: number
  none: number
}

export interface SandboxOutcomes {
  sandbox_id: string
  window: EventBrief | null
  today: string
  can_reopen: boolean
  max_per_coachee: number
  coachees: CoacheeOutcomes[]
  totals: OutcomeTotals
}

export interface OutcomeCreate {
  member_id: string
  title: string
  measure?: string | null
  propose?: boolean
}

export interface OutcomeUpdate {
  title?: string
  measure?: string | null
}

export interface OutcomeDecision {
  decision: 'seal' | 'changes'
  note?: string | null
}
