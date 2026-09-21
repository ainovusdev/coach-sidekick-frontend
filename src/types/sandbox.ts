/**
 * Sandbox v2 types — mirror app/schemas/sandbox.py on the backend.
 */

export type TermMonths = 3 | 4 | 6 | 9 | 12
export const TERM_MONTHS: TermMonths[] = [3, 4, 6, 9, 12]

export type SandboxStatus = 'upcoming' | 'active' | 'ended'
export type Side = 'ours' | 'theirs'
export type GroupMemberKind = 'coach' | 'coachee' | 'supervisor'
/** On the sandbox's list of coaches / coachees, in a group yet or not. */
export type RosterKind = 'coach' | 'coachee'
/** A 1:1 pairing holds one coach and one coachee; a group any number. */
export type GroupType = 'pair' | 'group'
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
  /** The client's people, and anyone coached here — ours included. */
  needs_invitation?: boolean
  invitation_id: string | null
  invited_at: string | null
  group_ids: string[]
  group_names: string[]
  group_kinds: string[]
  /** The lists they are on — a group row counts, so does being listed with none. */
  roster: RosterKind[]
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
  /** The day sessions start counting in the groups they join (default today). */
  effective_on?: string | null
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
  /** Already on this sandbox: which member they are, and the lists they are on. */
  member_id?: string | null
  member_roster?: RosterKind[]
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
  kind: GroupType
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
  /** The event's own checklist: the steps behind the call. */
  milestone_total: number
  milestone_done: number
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
  /** My member row when I am coached here as well as working here. */
  my_coachee_member_id?: string | null
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
  /** Ours: `['coach']`. Theirs: `['coachee']`. */
  roster?: RosterKind[]
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
  kind?: GroupType
  /** People are picked from the sandbox's lists, by member id. */
  coach_member_ids?: string[]
  coachee_member_ids?: string[]
  supervisor_member_ids?: string[]
}

export interface SandboxGroupBulkCreate {
  groups: SandboxGroupCreate[]
  allow_duplicates?: boolean
}

export interface MemberRosterUpdate {
  roster: RosterKind[]
  /** Go ahead although they have had sessions in a group they leave. */
  force?: boolean
}

export interface SandboxGroupUpdate {
  name?: string | null
  hours_per_coachee?: number | string | null
  session_length_minutes?: number
  cadence?: Cadence | null
  starts_on?: string | null
  /** A pairing can always become a group; a group a pairing only if it fits. */
  kind?: GroupType
  /** From the preview: the save lands only if it still does what was shown. */
  expected_basis?: string
}

/** When one person in a group starts counting, and whether that can be corrected. */
export interface GroupWindow {
  enrollment_id: string
  member_id: string
  kind: 'coach' | 'coachee'
  name: string | null
  email: string
  starts_on: string
  group_starts_on: string
  /** Added after the group began, so their earlier sessions don't count. */
  is_late: boolean
  can_correct: boolean
  earliest: string
}

export interface WindowCoacheeChange {
  member_id: string
  enrollment_id: string
  name: string | null
  is_current: boolean
  starts_on_before: string | null
  starts_on_after: string | null
  sessions_gained: number
  minutes_gained: number
  first_on: string | null
  last_on: string | null
  pace_before: string | null
  pace_after: string | null
}

/** What moving a window does — counts and days only. Preview and save share it. */
export interface WindowChange {
  group_id: string
  coachees: WindowCoacheeChange[]
  sessions_gained: number
  minutes_gained: number
  becomes_ambiguous: number
  basis: string
  earliest: string | null
  late_coaches: {
    enrollment_id: string
    member_id: string
    starts_on: string
  }[]
}

export interface CountsFromRequest {
  counts_from: string
  coach_enrollment_ids?: string[]
}

export interface CountsFromUpdate extends CountsFromRequest {
  reason: string
  expected_basis?: string
}

export interface SandboxGroupMemberCreate {
  /** The day their sessions start counting here (default today). */
  effective_on?: string | null
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
  | 'credit_held'
  | 'stale_preview'
  | 'busy'
  | 'before_group_start'
  | 'before_term_start'
  | 'at_group_start'
  | 'overlaps_earlier'

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
  /** credit_held: the first counted day the change would drop */
  first_on?: string
  /** stale_preview: what the change does now */
  preview?: WindowChange
  earliest?: string
  group_starts_on?: string
}
