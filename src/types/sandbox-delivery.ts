// Sandbox delivery + dashboards (phase 3). Mirrors app/schemas/sandbox_delivery.py
// and app/schemas/sandbox_dashboard.py. Everything is derived server-side.

import type {
  EventState,
  SandboxStatus,
  SandboxSummary,
  TimelineEvent,
} from '@/types/sandbox'

export type DeliveryState =
  | 'unknown'
  | 'not_started'
  | 'on_track'
  | 'behind'
  | 'ahead'
  | 'complete'
  | 'ended_short'

export interface Delivered {
  sessions: number
  minutes: number
  hours: number
  first_on: string | null
  last_on: string | null
  next_scheduled_on: string | null
  in_flight: number
}

export interface Pace {
  state: DeliveryState
  expected_sessions: number | null
  expected_by_today: number | null
  delivered_sessions: number
  remaining_sessions: number | null
  hours_promised: number | null
  hours_delivered: number
  hours_remaining: number | null
  elapsed_fraction: number
  tolerance: number
  variance: number | null
  sentence: string
}

export interface CoacheeDelivery {
  member_id: string
  user_id: string
  name: string | null
  email: string
  client_ids: string[]
  delivered: Delivered
  pace: Pace
}

export interface GroupDelivery {
  group_id: string
  display_name: string
  starts_on: string
  ends_on: string
  hours_per_coachee: number | null
  session_length_minutes: number
  expected_sessions: number | null
  cadence_text: string | null
  coach_names: string[]
  state: DeliveryState
  delivered_sessions: number
  expected_total: number | null
  coachees: CoacheeDelivery[]
}

export interface DeliveryTotals {
  coachees: number
  delivered_sessions: number
  expected_sessions: number | null
  hours_delivered: number
  hours_promised: number | null
  behind: number
  not_started: number
  on_track: number
  ahead: number
  complete: number
  ended_short: number
  unknown: number
}

export interface SandboxDelivery {
  sandbox_id: string
  today: string
  my_scope: string
  state: DeliveryState
  groups: GroupDelivery[]
  totals: DeliveryTotals
}

export interface EventBrief {
  id: string
  kind: string
  label: string
  window_start: string
  window_end: string
  state: EventState
}

/** One coachee's place in one sandbox group (client-profile card, portal card). */
export interface ClientSandboxContext {
  sandbox_id: string
  sandbox_name: string
  organisation: string
  status: SandboxStatus
  term_start: string
  term_end: string
  term_months: number
  vision: string | null
  group_id: string
  group_name: string
  coach_names: string[]
  hours_per_coachee: number | null
  session_length_minutes: number
  expected_sessions: number | null
  cadence_text: string | null
  starts_on: string
  delivered: Delivered
  pace: Pace
  current_event: EventBrief | null
  next_event: EventBrief | null
  today: string
}

// ---------------------------------------------------------------- dashboard

export type AttentionKind =
  | 'invitation_not_accepted'
  | 'group_incomplete'
  | 'window_open'
  | 'window_opening'
  | 'no_session_yet'
  | 'behind'
export type AttentionSeverity = 'info' | 'warn' | 'urgent'
export type AttentionSection =
  | 'invitations'
  | 'groups'
  | 'timeline'
  | 'delivery'
export type Persona = 'portfolio' | 'coach' | 'client_side' | 'coachee'

export interface AttentionItem {
  kind: AttentionKind
  severity: AttentionSeverity
  section: AttentionSection
  sandbox_id: string
  sandbox_name: string
  organisation: string
  group_id: string | null
  group_name: string | null
  member_id: string | null
  person_name: string | null
  client_id: string | null
  event_id: string | null
  headline: string
  detail: string
  since: string | null
  due: string | null
}

export interface SandboxCard {
  sandbox: SandboxSummary
  my_scope: string
  month_of_term: number
  delivery_state: DeliveryState
  coachee_count: number
  behind_count: number
  not_started_count: number
  delivered_sessions: number
  expected_sessions: number | null
  current_events: TimelineEvent[]
  next_event: TimelineEvent | null
  my_groups: GroupDelivery[]
  attention_count: number
}

export interface DashboardTotals {
  sandboxes: number
  coachees: number
  behind: number
  not_started: number
  invitations_outstanding: number
  groups_incomplete: number
  windows_open: number
  windows_opening: number
  delivered_sessions: number
  expected_sessions: number | null
}

export interface SandboxDashboard {
  persona: Persona
  scope: string
  today: string
  cards: SandboxCard[]
  attention: AttentionItem[]
  totals: DashboardTotals
}
