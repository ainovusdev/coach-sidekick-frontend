export interface Program {
  id: string
  name: string
  description: string | null
  color: string
  metadata: Record<string, any>
  created_by: string
  created_at: string
  updated_at: string
  client_count: number
  coach_count: number
}

export interface ProgramCreate {
  name: string
  description?: string | null
  color?: string
  metadata?: Record<string, any>
  client_ids?: string[]
}

export interface ProgramUpdate {
  name?: string
  description?: string | null
  color?: string
  metadata?: Record<string, any>
}

export interface ProgramListResponse {
  programs: Program[]
  total: number
  page: number
  per_page: number
}

export interface ProgramMembership {
  id: string
  program_id: string
  client_id: string
  assigned_by: string | null
  assigned_at: string
}

export interface ClientSessionSummary {
  client_id: string
  client_name: string
  client_email: string | null
  coach_id: string
  coach_name: string
  total_sessions: number
  missed_sessions: number
  last_session_date: string | null
  last_session_summary: string | null
  session_streak: number
  completion_rate: number
  status: 'at-risk' | 'on-track' | 'excelling'
  emerging_themes: string[]
  programs: string[]
}

export interface ProgramDashboard {
  program_id: string
  program_name: string
  program_description: string | null
  program_color: string
  total_clients: number
  total_sessions: number
  missed_sessions: number
  active_this_week: number
  clients: ClientSessionSummary[]
  common_themes: string[]
}

// Trend Analysis Types
export interface TrendDataPoint {
  date: string
  value: number
  label: string
}

export interface TrendAnalysis {
  session_frequency: TrendDataPoint[]
  completion_rate_trend: TrendDataPoint[]
  attendance_by_weekday: Record<string, number>
  monthly_summary: Record<string, number>
}

// Action Items Types
export interface ActionItemSummary {
  id: string
  description: string
  session_id: string
  session_date: string
  client_id: string
  client_name: string
  coach_id: string
  coach_name: string | null
  status: 'pending' | 'completed' | 'overdue'
  due_date?: string
}

export interface ProgramActionItems {
  total_action_items: number
  pending_count: number
  completed_count: number
  overdue_count: number
  action_items: ActionItemSummary[]
  completion_rate: number
}

// Calendar Types
export interface UpcomingSession {
  session_id: string
  client_id: string
  client_name: string
  coach_id: string
  coach_name: string | null
  scheduled_date: string
  title?: string
  status: string
}

export interface ProgramCalendar {
  upcoming_sessions: UpcomingSession[]
  sessions_this_week: number
  sessions_next_week: number
  coach_workload: Record<string, number>
}

// Theme Analysis Types
export interface ThemeEvolution {
  theme: string
  occurrences: TrendDataPoint[]
  total_count: number
  first_seen: string
  last_seen: string
}

export interface ThemeAnalysis {
  trending_themes: ThemeEvolution[]
  declining_themes: ThemeEvolution[]
  emerging_themes: string[]
  theme_correlations: Record<string, string[]>
}
