import type { Comment } from './comment'

/**
 * TypeScript interfaces for the Commitments System
 * Matches backend schema from implementation plan
 */

export type CommitmentType =
  | 'commitment'
  | 'habit'
  | 'mp_outcome'
  | 'learning'
  | 'sprint'

export const commitmentTypeLabels: Record<string, string> = {
  commitment: 'Commitment',
  habit: 'Habit',
  mp_outcome: 'MP Outcome',
  learning: 'Learning',
  sprint: 'Sprint',
}

export type CommitmentStatus =
  | 'draft'
  | 'active'
  | 'in_progress'
  | 'completed'
  | 'abandoned'
export type CommitmentPriority = 'low' | 'medium' | 'high' | 'urgent'
export type MilestoneStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'skipped'

// Attachment on a commitment
export interface CommitmentAttachment {
  id: string
  filename: string
  file_key: string
  file_url: string
  file_size: number
  content_type: string
  uploaded_by_id: string
  uploaded_at: string
}

// Base commitment interface
export interface CommitmentBase {
  title: string
  description?: string
  type: CommitmentType
  priority: CommitmentPriority
  start_date?: string // ISO date string
  target_date?: string // ISO date string
  measurement_criteria?: string
}

export type AssigneeKind = 'user' | 'client' | 'none'
export type CommitmentSource = 'manual' | 'ai_extracted' | 'rule'
export type CommitmentVisibility = 'shared' | 'private'

/**
 * Who a commitment is for. A user (`user_id` set), or the client themself
 * (`client_id` set; `user_id` is their login when they have one). Read it
 * through `assigneeOf()` in `@/lib/commitments/assignee`.
 */
export interface Assignee {
  user_id: string | null
  client_id: string | null
  name: string | null
  email: string | null
  has_account: boolean | null
  roles: string[]
}

// Create commitment request. Context is optional: a client, a sandbox, or
// neither (assigned person to person). At least one of client / sandbox /
// assignee is required.
export interface CommitmentCreate extends CommitmentBase {
  client_id?: string | null
  sandbox_id?: string | null
  session_id?: string
  assigned_to_id?: string | null // null with a client = the client themself
  visibility?: CommitmentVisibility
  target_ids?: string[] // Target IDs to link to (legacy)
  /** Commitments to relate the new one to (each must be visible to the caller). */
  related_ids?: string[]
  metadata?: Record<string, unknown>
}

/** The sandbox timeline event a commitment *is* (see `Commitment.timeline_event`). */
export interface TimelineEventBrief {
  id: string
  sandbox_id: string | null
  kind: string
  label: string
  window_start: string
  window_end: string
  state: 'past' | 'current' | 'upcoming'
  removed: boolean
}

// Update commitment request
export interface CommitmentUpdate {
  title?: string
  description?: string
  type?: CommitmentType
  status?: CommitmentStatus
  priority?: CommitmentPriority
  target_date?: string
  progress_percentage?: number
  measurement_criteria?: string
  assigned_to_id?: string | null // null with a client = the client themself
  visibility?: CommitmentVisibility
  metadata?: Record<string, unknown>
}

// Full commitment response from backend
export interface Commitment extends CommitmentBase {
  id: string
  client_id: string | null
  sandbox_id?: string | null
  created_by_id: string | null
  session_id?: string
  status: CommitmentStatus
  progress_percentage: number
  extracted_from_transcript: boolean
  extraction_confidence?: number
  transcript_context?: string
  completed_date?: string
  created_at: string
  updated_at: string

  // Assignment — `assignee` is the truth; the flat fields stay for one release
  assigned_to_id?: string | null
  assigned_to_name?: string | null
  assigned_by_id?: string | null
  assigned_by_name?: string | null
  assignee?: Assignee | null
  assignee_kind?: AssigneeKind
  is_coach_commitment?: boolean

  // Origin + visibility + what the viewer may do
  source?: CommitmentSource
  visibility?: CommitmentVisibility
  can_edit?: boolean | null
  can_delete?: boolean | null

  // Computed fields
  client_name?: string | null
  sandbox_name?: string | null
  session_title?: string
  session_date?: string
  creator_name?: string
  update_count?: number
  milestone_count?: number

  // Related data
  attachments?: CommitmentAttachment[]
  updates?: CommitmentUpdateEntry[]
  /** Threaded comments (top-level with `replies`), embedded by the detail endpoint. */
  comments?: Comment[]
  milestones?: Milestone[]
  linked_target_ids?: string[] // IDs of linked targets/desired wins
  target_links?: Array<{ target_id: string }> // Junction table links to targets
  metadata?: Record<string, any> // Flexible metadata field

  // Related commitments — symmetric pairs. The detail view fills `related`
  // with the rows the viewer may see; the counts are on every row and count
  // every relation.
  related?: Commitment[]
  related_total?: number
  related_done?: number
  /** Set when this commitment *is* a sandbox timeline event: title and dates follow it. */
  timeline_event_id?: string | null
  timeline_event?: TimelineEventBrief | null
}

// Commitment progress update
export interface CommitmentUpdateCreate {
  progress_percentage?: number
  note?: string
  wins?: string
  blockers?: string
  evidence_urls?: string[]
}

// Commitment update entry (history)
export interface CommitmentUpdateEntry {
  id: string
  commitment_id: string
  updated_by_id: string
  updated_by_name?: string
  progress_percentage?: number
  status_change?: string
  note?: string
  wins?: string
  blockers?: string
  evidence_urls?: string[]
  created_at: string
  /** Ledger detail: {kind:'assignment'|'status', ...} */
  metadata?: Record<string, unknown>
}

// Milestone
export interface Milestone {
  id: string
  commitment_id: string
  title: string
  description?: string
  target_date?: string
  completed_date?: string
  order_index: number
  status: MilestoneStatus
  created_at: string
  updated_at: string
}

// Create milestone request
export interface MilestoneCreate {
  title: string
  description?: string
  target_date?: string
  order_index?: number
}

// AI-extracted commitment from transcript
export interface ExtractedCommitment {
  title: string
  description: string
  type: CommitmentType
  suggested_deadline_days: number
  confidence: number
  transcript_context: string
  measurement_criteria: string
}

// List commitments filters
export interface CommitmentFilters {
  client_id?: string
  status?: CommitmentStatus
  type?: CommitmentType
  include_drafts?: boolean
  session_id?: string
  assigned_to_id?: string
  assigned_to_type?: 'coach' | 'client'
  my_clients_only?: boolean
  sandbox_id?: string
  involving_me?: boolean
  created_by_me?: boolean
  /** 'me' | 'client' | 'none' | a user id */
  assignee?: string
}

// Commitment list response
export interface CommitmentListResponse {
  commitments: Commitment[]
  total: number
}

// Stats for dashboard
export interface CommitmentStats {
  total_active: number
  total_completed: number
  completion_rate: number
  at_risk_count: number // commitments past deadline
}
