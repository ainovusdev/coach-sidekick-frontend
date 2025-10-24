/**
 * TypeScript interfaces for the Commitments System
 * Matches backend schema from implementation plan
 */

export type CommitmentType = 'action' | 'habit' | 'milestone' | 'learning'
export type CommitmentStatus = 'draft' | 'active' | 'completed' | 'abandoned'
export type CommitmentPriority = 'low' | 'medium' | 'high' | 'urgent'
export type MilestoneStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'skipped'

// Base commitment interface
export interface CommitmentBase {
  title: string
  description?: string
  type: CommitmentType
  priority: CommitmentPriority
  start_date?: string // ISO date string
  target_date?: string // ISO date string
  measurement_criteria?: string
  linked_goal_id?: string
}

// Create commitment request
export interface CommitmentCreate extends CommitmentBase {
  client_id: string
  session_id?: string
  target_ids?: string[] // Target IDs to link to
}

// Update commitment request
export interface CommitmentUpdate {
  title?: string
  description?: string
  status?: CommitmentStatus
  priority?: CommitmentPriority
  target_date?: string
  progress_percentage?: number
  measurement_criteria?: string
}

// Full commitment response from backend
export interface Commitment extends CommitmentBase {
  id: string
  client_id: string
  created_by_id: string
  session_id?: string
  status: CommitmentStatus
  progress_percentage: number
  extracted_from_transcript: boolean
  extraction_confidence?: number
  transcript_context?: string
  completed_date?: string
  created_at: string
  updated_at: string

  // Computed fields
  client_name?: string
  creator_name?: string
  update_count?: number
  milestone_count?: number
  days_until_deadline?: number

  // Related data
  updates?: CommitmentUpdateEntry[]
  milestones?: Milestone[]
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
  progress_percentage?: number
  status_change?: string
  note?: string
  wins?: string
  blockers?: string
  evidence_urls?: string[]
  created_at: string
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
  due_soon_count: number // commitments due within 7 days
}
