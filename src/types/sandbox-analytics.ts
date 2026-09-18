import type { CoacheeDelivery, DeliveryState } from './sandbox-delivery'
export type ReportingPeriod = 'term' | '90d' | '30d'
export interface InsightSelection {
  period: ReportingPeriod
  group_id: string | null
  subject_member_id?: string | null
  coach_user_id?: string | null
  entity_kind?: 'client' | 'coach' | 'group' | null
}
export interface ReportingDates {
  period: ReportingPeriod
  starts_on: string | null
  ends_on: string | null
  available: boolean
}
export interface Headcount {
  count: number
  total: number
}
export interface SandboxAnalytics {
  sandbox_id: string
  viewer_id: string
  my_scope: 'all' | 'groups' | 'self'
  presentation_mode: 'aggregate' | 'personal' | 'named'
  dates: ReportingDates
  available_groups: { group_id: string; display_name: string }[]
  selected_group_id: string | null
  selected_subject_member_id?: string | null
  selected_coach_user_id?: string | null
  current_contract: {
    as_of: string
    state: DeliveryState
    hours_received: number
    hours_promised: number | null
    expected_hours: number | null
    expectation_available: boolean
    coachees_on_track: Headcount
    coachees_unmeasurable: number
  }
  metrics: {
    sessions_held: number
    hours_received: number
    participation: Headcount
    agreed_outcomes: Headcount
  }
  weekly_series: {
    sessions_held?: number
    starts_on: string
    ends_on: string
    hours_received: number
    expected_hours: number | null
    cumulative_hours_received: number
    cumulative_expected_hours: number | null
  }[]
  groups: {
    group_id: string
    display_name: string
    sessions_held: number
    hours_received: number
    hours_promised: number | null
    coachees_on_track: Headcount
    yet_to_start: number
    last_activity_on: string | null
    next_activity_on: string | null
    state: DeliveryState
    coachees: CoacheeDelivery[]
  }[]
  coaches: {
    user_id: string
    name: string
    sessions_held: number
    coachees_reached: number
  }[]
  upcoming: { session_id: string; scheduled_on: string; group_ids: string[] }[]
  coverage: {
    sessions_held: number
    sessions_with_learning_evidence: number
    sessions_with_estimated_duration: number
    sessions_missing_date: number
    relationships_missing_hours: number
    learning_note: string
  }
  definitions: Record<string, string>
}
