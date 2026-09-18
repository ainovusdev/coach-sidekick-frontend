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
