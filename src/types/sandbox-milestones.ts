import type { EventState } from '@/types/sandbox'

/**
 * Personal milestones (slice 2): each coachee's gold sealing, midpoint input
 * and results review, as a commitment assigned to their coach and dated from
 * the sandbox timeline — or from their own first day when they joined late.
 * Mirrors `app/schemas/sandbox_milestones.py`.
 */

export type MilestoneOccurrence =
  | 'gold_sealing'
  | 'midpoint_reporting:1'
  | 'midpoint_reporting:2'
  | 'results_review'

export type MilestoneSourceKind = 'event' | 'derived'

export interface PersonalMilestoneInfo {
  id: string
  sandbox_id: string
  member_id: string
  member_name: string | null
  occurrence: MilestoneOccurrence | string
  label: string
  source_kind: MilestoneSourceKind | string
  default_start: string
  default_end: string
  /** The dates track the default; false once a person moved them. */
  follows: boolean
  /** A person chose the assignee; automation leaves it alone. */
  assignee_pinned: boolean
  /** Open and unassigned: the group has no coach yet. */
  coach_pending: boolean
  resolved_by: 'automation' | 'person' | null
  resolved_reason: string | null
  /** Completed because an outcome was gold-sealed. */
  sealed: boolean
}

/** One person's gold sealing or results review window. */
export interface PersonalWindow {
  occurrence: 'gold_sealing' | 'results_review' | string
  kind: string
  label: string
  window_start: string
  window_end: string
  state: EventState
  /** event · derived · sandbox (no personal row — the sandbox's own event). */
  source: 'event' | 'derived' | 'sandbox' | string
  follows: boolean
  /** False when the person's row was dropped: kept for history only. */
  applicable: boolean
  milestone_id: string | null
  event_id: string | null
}

/** A milestone on the person page (our side only). */
export interface PersonalMilestoneRow {
  commitment_id: string
  title: string
  status: string
  start_date: string | null
  target_date: string | null
  completed_date: string | null
  assignee_user_id: string | null
  assignee_name: string | null
  can_edit: boolean
  milestone: PersonalMilestoneInfo
}

export interface MilestoneAssigneeOption {
  user_id: string
  member_id: string
  name: string
  roles: string[]
  /** The group's coach — what automation would pick. */
  is_default: boolean
  is_current: boolean
}

export interface MilestoneAssignees {
  default_user_id: string | null
  people: MilestoneAssigneeOption[]
}

export interface MilestoneFollowRequest {
  dates?: boolean
  assignee?: boolean
  reason?: string
}

/** What a timeline change would do to people's personal milestones. */
export interface MilestoneEffects {
  following: number
  adjusted: number
  would_create: number
  would_drop: number
  would_restore: number
  people: {
    member_id: string
    name?: string
    occurrence: string
    change: 'moves' | 'stays' | 'dropped' | 'restored' | 'created' | string
    from?: (string | null)[]
    to?: string[]
    reason?: string
  }[]
}

/** What a change did to them (the counts a toast reads). */
export interface MilestoneReport {
  moved: number
  kept_adjusted: number
  abandoned: number
  restored: number
  created: number
  reassigned: number
  completed: number
  reopened: number
  notified: number
  rows: MilestoneEffects['people']
}
