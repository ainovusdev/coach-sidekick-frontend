/**
 * Sandbox v2 types — mirror app/schemas/sandbox.py on the backend.
 */

export type TermMonths = 3 | 4 | 6 | 9 | 12
export const TERM_MONTHS: TermMonths[] = [3, 4, 6, 9, 12]

export type SandboxStatus = 'upcoming' | 'active' | 'ended'
export type Side = 'ours' | 'theirs'
export type GroupMemberKind = 'coach' | 'coachee' | 'supervisor'
export type CadencePer = 'month' | 'fortnight' | 'week'
export type EventState = 'past' | 'current' | 'upcoming'
export type InvitationStatus =
  | 'not_sent'
  | 'sent'
  | 'accepted'
  | 'expired'
  | 'has_account'

export type OurRole = 'account_executive' | 'sandbox_owner' | 'lead_coach'
export type TheirRole = 'primary_client' | 'primary_client_admin' | 'supervisor'
export type SandboxRole = OurRole | TheirRole

export const OUR_ROLES: { value: OurRole; label: string }[] = [
  { value: 'account_executive', label: 'Account executive' },
  { value: 'sandbox_owner', label: 'Sandbox owner' },
  { value: 'lead_coach', label: 'Lead coach' },
]

export const THEIR_ROLES: { value: TheirRole; label: string }[] = [
  { value: 'primary_client', label: 'Primary client' },
  { value: 'primary_client_admin', label: 'Primary client admin' },
  { value: 'supervisor', label: 'Supervisor' },
]

export const ROLE_LABELS: Record<string, string> = {
  account_executive: 'Account executive',
  sandbox_owner: 'Sandbox owner',
  lead_coach: 'Lead coach',
  primary_client: 'Primary client',
  primary_client_admin: 'Primary client admin',
  supervisor: 'Supervisor',
  coach: 'Coach',
  coachee: 'Coachee',
}

export interface SandboxLink {
  label: string
  url: string
}

export type CadenceRange = {
  shape: 'range'
  min: number
  max: number
  per: CadencePer
}
export type CadenceRate = { shape: 'rate'; count: number; per: CadencePer }
export type CadenceTotal = {
  shape: 'total'
  count: number
  span_months: number
}
export type Cadence = CadenceRange | CadenceRate | CadenceTotal

export interface Sandbox {
  id: string
  name: string
  organisation: string
  term_start: string // YYYY-MM-DD
  term_months: TermMonths
  term_end: string
  status: SandboxStatus
  vision: string | null
  links: SandboxLink[]
  created_by_id: string
  created_at: string
  updated_at: string
}

/** What the caller may do on a sandbox (mirrors services/sandbox_access.py). */
export type SandboxCapability =
  | 'sandbox.read'
  | 'sandbox.manage'
  | 'timeline.manage'
  | 'people.manage'
  | 'groups.manage'
  | 'invitations.manage'
  | 'links.read'
  | 'delivery.read'

/** How much of the sandbox the caller sees. */
export type SandboxScope = 'all' | 'groups' | 'self'

export interface SandboxSummary extends Sandbox {
  member_count: number
  group_count: number
  coachee_count: number
  incomplete_group_count: number
  account_executive_names: string[]
  owner_names: string[]
  my_roles: string[]
  my_capabilities: SandboxCapability[]
  my_scope: SandboxScope
}

export interface SandboxListResponse {
  sandboxes: SandboxSummary[]
  total: number
}

export interface SandboxListFilters {
  status?: SandboxStatus | ''
  q?: string
  include_ended?: boolean
}

export interface TermPreview {
  term_start: string
  term_months: number
  term_end: string
  sentence: string
  event_count: number
}

export interface SandboxMember {
  id: string
  sandbox_id: string
  user_id: string
  side: Side
  roles: string[]
  role_labels: string[]
  email: string
  name: string | null
  is_pending_user: boolean
  invitation_status: InvitationStatus | null
  invitation_id: string | null
  invited_at: string | null
  group_ids: string[]
  group_names: string[]
  group_kinds: string[]
  /** The (group, kind) pairs behind the flat lists above. */
  memberships: SandboxMembership[]
  /** Our side: when the "you were added" email went out. */
  notified_at: string | null
  created_at: string
}

export interface SandboxMembership {
  row_id: string
  group_id: string
  group_name: string
  kind: GroupMemberKind
}

/** Set a person's group memberships exactly (People page → Change groups). */
export interface MemberGroupsUpdate {
  memberships: { group_id: string; kind: GroupMemberKind }[]
  /** Go ahead although they have had sessions in a group they leave. */
  force?: boolean
}

export interface EmailLookup {
  exists: boolean
  kind: 'none' | 'pending_user' | 'active_user'
  name: string | null
  already_member: boolean
  member_id: string | null
  member_side: Side | null
  member_roles: string[]
  member_group_names: string[]
}

export interface PersonSearchResult {
  id: string
  full_name: string | null
  email: string
  roles: string[]
  is_member: boolean
  member_roles: string[]
}

export interface SandboxGroupMember {
  id: string
  group_id: string
  member_id: string
  kind: GroupMemberKind
  user_id: string
  name: string | null
  email: string
  is_pending_user: boolean
  invitation_status: InvitationStatus | null
}

export interface CadenceAgreement {
  lo: number
  hi: number
  expected: number | null
  agrees: boolean | null
  sentence: string
}

export type GroupMissingField =
  | 'coach'
  | 'coachee'
  | 'hours_per_coachee'
  | 'cadence'

export interface SandboxGroup {
  id: string
  sandbox_id: string
  name: string | null
  display_name: string
  is_one_to_one: boolean
  hours_per_coachee: number | null
  session_length_minutes: number
  cadence: Cadence | null
  cadence_text: string | null
  starts_on: string
  starts_on_is_default: boolean
  expected_sessions: number | null
  is_complete: boolean
  missing: GroupMissingField[]
  agreement: CadenceAgreement | null
  coaches: SandboxGroupMember[]
  coachees: SandboxGroupMember[]
  supervisors: SandboxGroupMember[]
  position: number
  created_at: string
  updated_at: string
}

export type TimelineKind =
  | 'gold_sealing'
  | 'check_in'
  | 'midpoint_reporting'
  | 'results_review'
  | 'custom'

export interface TimelineEvent {
  id: string
  kind: TimelineKind
  label: string
  window_start: string
  window_end: string
  position: number
  state: EventState
  /** Stable identity of a generated event ("check_in:2"); null = added by hand. */
  gen_key: string | null
  is_custom: boolean
  /** Window moved by hand (or a custom event). Kept on regeneration by default. */
  is_hand_adjusted: boolean
  /** The reason given when the event was added by hand. */
  note: string | null
  removed_at: string | null
  removed_reason: string | null
  /**
   * The commitment this event *is* (title = label, dates = window), with how
   * its related commitments stand. Only our side with the whole list and
   * platform admins get it; null leaves the card inert (a calendar).
   */
  commitment_id: string | null
  commitment_status: string | null
  related_total: number
  related_done: number
}

export interface TimelineEventCreate {
  label: string
  window_start: string
  window_end: string
  note: string
}

export interface TimelineEventUpdate {
  label?: string
  window_start?: string
  window_end?: string
  /** Move the later check-ins by the same number of days. */
  shift_following?: boolean
}

export type TimelineChangeAction =
  | 'unchanged'
  | 'moved'
  | 'added'
  | 'dropped'
  | 'kept'
  | 'overwritten'

export interface TimelineChange {
  action: TimelineChangeAction
  event_id: string | null
  gen_key: string | null
  kind: TimelineKind
  label: string
  before_start: string | null
  before_end: string | null
  after_start: string | null
  after_end: string | null
  is_hand_adjusted: boolean
  is_custom: boolean
  was_removed: boolean
}

export interface TimelineRegeneratePreview {
  term_start: string
  term_months: number
  term_end: string
  overwrite_hand_adjusted: boolean
  changes: TimelineChange[]
  counts: Record<TimelineChangeAction, number>
  /** Events on the timeline today that regeneration leaves alone by default. */
  hand_adjusted_count: number
}

export interface SetupChecklist {
  term_set: boolean
  vision_added: boolean
  team_both_sides: boolean
  our_side_count: number
  their_side_count: number
  groups: { count: number; coachee_count: number; incomplete_count: number }
  invitations: {
    total_client_side: number
    pending_count: number
    sent_count: number
    accepted_count: number
    expired_count: number
  }
  done_count: number
  total: number
}

export interface SandboxInvitation {
  id: string
  sandbox_id: string
  member_id: string
  email: string
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  invited_by_name: string | null
  expires_at: string
  accepted_at: string | null
  revoked_at: string | null
  created_at: string
}

export interface SandboxOverview {
  sandbox: Sandbox
  members: SandboxMember[]
  groups: SandboxGroup[]
  timeline: TimelineEvent[]
  /** Events taken out by hand, newest removal first. Restorable. */
  timeline_removed: TimelineEvent[]
  /** Ops artefacts: null / empty unless the caller manages invitations. */
  checklist: SetupChecklist | null
  invitations: SandboxInvitation[]
  my_roles: string[]
  my_capabilities: SandboxCapability[]
  my_scope: SandboxScope
  today: string
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export interface SandboxCreate {
  name: string
  organisation: string
  term_start: string
  term_months: TermMonths
  vision?: string | null
  links?: SandboxLink[]
}

export interface SandboxUpdate {
  name?: string
  organisation?: string
  term_start?: string
  term_months?: TermMonths
  vision?: string | null
  links?: SandboxLink[]
  /** On a term change: also reset hand-adjusted, removed and added events. */
  overwrite_hand_adjusted?: boolean
}

export interface SandboxMemberCreate {
  side: Side
  roles: string[]
  user_id?: string
  email?: string
  name?: string | null
}

export interface SandboxMemberUpdate {
  roles?: string[]
  name?: string
}

export interface CoacheeInput {
  user_id?: string
  email?: string
  name?: string | null
}

export interface SandboxGroupCreate {
  name?: string | null
  hours_per_coachee?: number | string | null
  session_length_minutes?: number
  cadence?: Cadence | null
  starts_on?: string | null
  coach_user_ids?: string[]
  coachees?: CoacheeInput[]
  supervisor_member_ids?: string[]
}

export interface SandboxGroupUpdate {
  name?: string | null
  hours_per_coachee?: number | string | null
  session_length_minutes?: number
  cadence?: Cadence | null
  starts_on?: string | null
}

export interface SandboxGroupMemberCreate {
  kind: GroupMemberKind
  user_id?: string
  email?: string
  name?: string | null
  member_id?: string
}

export interface InvitationSendRequest {
  member_ids?: string[]
  all_pending?: boolean
}

export interface EmailPreview {
  subject: string
  html: string
  text: string
  to_email: string
}

export interface WelcomeData {
  sandbox_id: string
  sandbox_name: string
  organisation: string
  roles: string[]
  role_labels: string[]
  is_coachee: boolean
  account_executive: { name: string | null; email: string } | null
  term_start: string
  term_end: string
  status: SandboxStatus
}

export interface InvitationValidation {
  valid: boolean
  reason: 'invalid' | 'expired' | 'revoked' | 'accepted' | null
  sandbox_id: string | null
  sandbox_name: string | null
  organisation: string | null
  roles: string[]
  role_labels: string[]
  is_coachee: boolean
  inviter_name: string | null
  inviter_email: string | null
  email: string | null
  name: string | null
  existing_user: boolean
  expires_at: string | null
}

export interface InvitationAcceptResponse {
  access_token: string | null
  token_type: string
  user_id: string
  email: string
  full_name: string | null
  roles: string[]
  client_id: string | null
  sandbox_id: string
  landing: 'client_portal' | 'welcome'
}

/** Stable error codes the backend puts in `detail.code` on 409/400. */
export type SandboxErrorCode =
  | 'last_account_executive'
  | 'member_in_groups'
  | 'already_member'
  | 'already_in_group'
  | 'has_sessions'
  | 'group_has_sessions'

/** A group someone is leaving although they have had sessions in it. */
export interface GroupWithSessions {
  group_id: string
  group_name: string
  kind: GroupMemberKind
  sessions: number
}

export interface SandboxErrorDetail {
  code: SandboxErrorCode
  message: string
  group_names?: string[]
  member_id?: string
  /** member_in_groups / has_sessions / group_has_sessions: sessions on record */
  sessions?: number
  name?: string
  groups?: GroupWithSessions[]
  coachee_names?: string[]
}
