/**
 * TypeScript interfaces for the Sprint & Target System
 */

export type SprintStatus = 'planning' | 'active' | 'completed' | 'cancelled'
export type TargetStatus = 'active' | 'completed' | 'deferred' | 'abandoned'

// Sprint interfaces
export interface SprintBase {
  title: string
  description?: string
  start_date: string // ISO date string
  end_date: string // ISO date string
}

export interface SprintCreate extends SprintBase {
  client_id: string
  status?: SprintStatus
}

export interface SprintUpdate {
  title?: string
  description?: string
  start_date?: string
  end_date?: string
  status?: SprintStatus
}

export interface Sprint extends SprintBase {
  id: string
  client_id: string
  sprint_number: number
  status: SprintStatus
  created_at: string
  updated_at: string
  created_by_id: string

  // Computed fields
  duration_weeks?: number
  is_current?: boolean
  progress_percentage?: number
  target_count?: number
  completed_target_count?: number
}

export interface SprintDetail extends Sprint {
  targets: Target[]
}

// Target interfaces
export interface TargetBase {
  title: string
  description?: string
}

export interface TargetCreate extends TargetBase {
  goal_id: string
  sprint_id: string
  status?: TargetStatus
}

export interface TargetUpdate {
  title?: string
  description?: string
  status?: TargetStatus
  progress_percentage?: number
  order_index?: number
}

export interface Target extends TargetBase {
  id: string
  goal_id: string
  sprint_id: string
  status: TargetStatus
  progress_percentage: number
  order_index: number
  created_at: string
  updated_at: string
  created_by_id: string

  // Computed fields
  commitment_count?: number
  completed_commitment_count?: number
  goal_title?: string
}

// Commitment-Target Link
export interface CommitmentTargetLink {
  id: string
  commitment_id: string
  target_id: string
  created_at: string
}

// Enhanced commitment with target links
export interface CommitmentWithTargets {
  id: string
  title: string
  description?: string
  status: string
  linked_target_ids: string[]
  session_id?: string
  created_at: string
}
