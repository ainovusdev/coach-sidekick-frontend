import type { InsightSelection, SandboxAnalytics } from './sandbox-analytics'
import type { DeliveryState } from './sandbox-delivery'
import type { SandboxOutcomes } from './sandbox-outcomes'
import type { TimelineEvent } from './sandbox'

export type SandboxEntityKind = 'client' | 'coach' | 'group'
export interface SandboxRelationship {
  member_id: string
  user_id: string
  name: string
  group_id: string
  group_name: string
  coach_ids: string[]
  coach_names: string[]
  starts_on: string | null
  ends_on: string | null
  hours_received: number
  hours_promised: number | null
  state: DeliveryState
  current: boolean
  last_activity_on: string | null
  next_activity_on: string | null
}
export interface SandboxActivityItem {
  id: string
  kind: 'session' | 'outcome' | 'commitment' | 'assignment'
  occurred_at: string
  title: string
  detail: string | null
  status?: string | null
  session_id?: string | null
  member_id?: string | null
  group_id?: string | null
  coach_id?: string | null
  duration_minutes?: number | null
  duration_estimated?: boolean | null
  href?: string | null
  commitment_id?: string | null
}
export interface SandboxActivityPage {
  items: SandboxActivityItem[]
  next_cursor: string | null
}
export interface SandboxEntityDetail {
  sandbox_id: string
  sandbox_name: string
  viewer_id: string
  my_scope: 'all' | 'groups' | 'self'
  presentation_mode: 'aggregate' | 'personal' | 'named'
  entity: {
    kind: SandboxEntityKind
    id: string
    name: string
    subtitle: string
    active: boolean
  }
  permissions: {
    can_generate_learning: boolean
    can_read_named_learning: boolean
    can_raise_concern: boolean
    can_manage_concerns: boolean
    can_manage_groups: boolean
    can_read_feedback?: boolean
  }
  selection: InsightSelection
  analytics: SandboxAnalytics
  portfolio: SandboxAnalytics | null
  relationships: SandboxRelationship[]
  people: {
    kind: string
    member_id: string
    user_id: string
    name: string
    active: boolean
    href: string | null
  }[]
  available_coaches: { user_id: string; name: string }[]
  available_clients: { member_id: string; user_id: string; name: string }[]
  outcomes: SandboxOutcomes
  attention: {
    id: string
    kind: string
    severity: string
    headline: string
    detail: string
    href: string | null
    member_id?: string | null
    group_id?: string | null
    commitment_id?: string | null
  }[]
  milestones: TimelineEvent[]
  activity: SandboxActivityPage
  /** Client and group pages; the coach page carries none. Older API: absent. */
  stats?: SandboxDetailStats | null
}
export interface SandboxSessionDetail {
  session_id: string
  label: string
  status: string
  started_at: string | null
  scheduled_for: string | null
  coach: { user_id: string; name: string }
  participants: { member_id: string; user_id: string; name: string }[]
  group_ids: string[]
  duration_minutes: number | null
  duration_estimated: boolean
  learning_available: boolean
  learning_note: string
  learning_fields: { label: string; text: string }[]
  full_session_href: string | null
}
export interface SandboxConcern {
  id: string
  sandbox_id: string
  subject_kind: SandboxEntityKind
  subject_id: string
  title: string
  explanation: string
  priority: 'normal' | 'urgent'
  status: 'open' | 'resolved'
  author_id: string
  owner_id: string
  author_name: string
  owner_name: string
  resolution_note: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  revision: number
  history: {
    at: string
    action: string
    by_name?: string | null
    note?: string | null
  }[]
  can_edit: boolean
}
export interface SandboxConcernList {
  items: SandboxConcern[]
  available_owners: { user_id: string; name: string }[]
  can_create: boolean
}
export interface SandboxConcernCreate {
  subject_kind: SandboxEntityKind
  subject_id: string
  title: string
  explanation: string
  priority: 'normal' | 'urgent'
  owner_id?: string
}
export interface SandboxConcernUpdate {
  revision: number
  title?: string
  explanation?: string
  priority?: 'normal' | 'urgent'
  owner_id?: string
  status?: 'open' | 'resolved'
  resolution_note?: string
}

export interface SandboxFeedbackAnswer {
  key: string | null
  question_text: string
  answer: string
  subject_name: string | null
}
export interface SandboxThrillFormFeedback {
  member_id: string | null
  client_name: string
  status: 'sent' | 'in_progress' | 'completed'
  completed_at: string | null
  answers: SandboxFeedbackAnswer[]
}
export interface SandboxCoachReflectionFeedback {
  status: 'sent' | 'completed'
  completed_at: string | null
  answers: SandboxFeedbackAnswer[]
  wins: string[]
}
export interface SandboxSessionFeedback {
  session_id: string
  occurred_at: string
  coach_id: string | null
  coach_name: string
  group_id: string | null
  group_name: string | null
  participants: string[]
  reflection: SandboxCoachReflectionFeedback | null
  thrill_forms: SandboxThrillFormFeedback[]
}
export interface SandboxWin {
  text: string
  session_id: string
  occurred_at: string
  coach_name: string
  group_name: string | null
}
/** Internal only: `visible` is false for the client's side and coachees. */
export interface SandboxFeedback {
  visible: boolean
  sessions: SandboxSessionFeedback[]
  wins: SandboxWin[]
}

/**
 * How often one coachee and their coaching actually meet. Contract to date —
 * the reporting-period selector does not trim it. `null` is "not measurable".
 */
/** Why there is no projection; `null` means there is one. */
export type SandboxForecastReason =
  | 'filtered'
  | 'ended'
  | 'no_target'
  | 'not_started'
  | 'complete'
  | 'term_over'
  | 'too_early'

/**
 * Where an agreement lands if the last eight weeks continue. The target is
 * sessions; `hours_short` can be above zero even when it is met. Anything the
 * reason does not fill is null, never zero.
 */
export interface SandboxDetailForecast {
  reason: SandboxForecastReason | null
  expected_sessions: number | null
  delivered_sessions: number | null
  window_days: number | null
  window_meetings: number | null
  projected_sessions: number | null
  shortfall_sessions: number | null
  projected_hours: number | null
  hours_short: number | null
  finishes_on: string | null
  recovery: 'gap' | 'more_than_daily' | null
  needed_gap_days: number | null
}

export interface SandboxDetailForecastSummary {
  current: number
  complete: number
  projected_to_finish: number
  projected_short: number
  not_projectable: number
}

export interface SandboxFollowThroughCounts {
  open: number
  overdue: number
  completed: number
  completed_dated: number
  completed_on_time: number
  completed_undated: number
  abandoned: number
}

/** Our side only. `null` on `stats` means it is not this viewer's to see. */
interface SandboxDetailFollowThrough {
  total: SandboxFollowThroughCounts
  coachees: (SandboxFollowThroughCounts & { member_id: string; name: string })[]
  /** False under a coach filter: the Commitments tab cannot show that count. */
  linkable: boolean
}

export interface SandboxDetailRhythm {
  member_id: string
  group_id: string
  name: string
  group_name: string
  current: boolean
  starts_on: string
  ends_on: string
  agreed: string | null
  meetings: number
  meeting_dates: string[]
  typical_gap_days: number | null
  longest_gap_days: number | null
  last_on: string | null
  days_since_last: number | null
  next_on: string | null
  estimated_durations: number
  /** Group page only. Recorded participation, not verified attendance. */
  group_meetings_held: number | null
  group_meetings_recorded: number | null
  /** Optional only so an older API response still renders. */
  forecast?: SandboxDetailForecast
}

interface SandboxDetailOutcomeCounts {
  total: number
  agreed: number
  waiting: number
  changes_requested: number
  drafting: number
  coachees: number
  coachees_with_agreed: number
  coachees_with_none: number
  /** Subjects whose outcomes this viewer may not read; in no count. */
  unavailable: number
}

export interface SandboxDetailStats {
  as_of: string
  rhythm: SandboxDetailRhythm[]
  /** `null`: withheld from this viewer. Zeroes are observed. */
  outcomes: SandboxDetailOutcomeCounts | null
  /** Group page only; absent under a coach filter. */
  forecast_summary?: SandboxDetailForecastSummary | null
  follow_through?: SandboxDetailFollowThrough | null
}
