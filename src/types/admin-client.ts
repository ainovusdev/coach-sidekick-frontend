/**
 * Types for Admin Client Management
 */

export interface AdminClientProgram {
  id: string
  name: string
  color: string
}

export interface AdminClient {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  tags: string[]
  coach_id: string
  coach_name: string | null
  coach_email: string
  programs: AdminClientProgram[]
  total_sessions: number
  last_session_date: string | null
  has_portal_access: boolean
  created_at: string
  updated_at: string
}

export interface AdminClientListResponse {
  clients: AdminClient[]
  total: number
  page: number
  per_page: number
}

export interface AdminClientListParams {
  skip?: number
  limit?: number
  search?: string
  coach_id?: string
  program_id?: string
  tags?: string
}

export interface AdminClientUpdate {
  name?: string
  email?: string | null
  phone?: string | null
  notes?: string | null
  tags?: string[]
  coach_id?: string
}

export interface BulkAssignCoachRequest {
  client_ids: string[]
  coach_id: string
}

export interface BulkAssignCoachResponse {
  success_count: number
  failed_count: number
  errors: string[]
}

export interface BulkAssignProgramRequest {
  client_ids: string[]
  program_id: string
  action: 'add' | 'remove'
}

export interface BulkAssignProgramResponse {
  success_count: number
  failed_count: number
  errors: string[]
}

export interface CSVImportRow {
  name: string
  email?: string
  phone?: string
  notes?: string
  tags?: string
  coach_email?: string
}

export interface CSVImportRequest {
  rows: CSVImportRow[]
  default_coach_id?: string
}

export interface CSVImportError {
  row: number
  error: string
}

export interface CSVImportResponse {
  success_count: number
  failed_count: number
  errors: CSVImportError[]
}

export interface CoachStats {
  coach_id: string
  coach_name: string | null
  coach_email: string
  client_count: number
}

export interface ProgramStats {
  program_id: string
  program_name: string
  client_count: number
}

export interface AdminClientStats {
  total_clients: number
  total_with_portal_access: number
  total_sessions: number
  by_coach: CoachStats[]
  by_program: ProgramStats[]
}
