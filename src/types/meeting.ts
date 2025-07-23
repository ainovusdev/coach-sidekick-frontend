export interface Bot {
  id: string
  status: string
  meeting_url: string
  platform?: string
  meeting_id?: string
}

export interface TranscriptEntry {
  speaker: string
  text: string
  timestamp: string
  confidence: number
  is_final: boolean
  start_time?: number
  end_time?: number
}

export interface Client {
  id: string
  coach_id: string
  name: string
  email?: string
  phone?: string
  company?: string
  position?: string
  notes?: string
  tags: string[]
  status: 'active' | 'inactive' | 'archived'
  created_at: string
  updated_at: string
}

export interface ClientSessionStats {
  client_id: string
  total_sessions: number
  total_duration_minutes: number
  last_session_date?: string
  average_engagement_score?: number
  average_overall_score?: number
  improvement_trends: Record<string, any>
  coaching_focus_areas: string[]
  updated_at: string
}

export interface CoachingSession {
  id: string
  user_id: string
  bot_id: string
  meeting_url: string
  status: string
  client_id?: string
  client?: Client
  created_at: string
  updated_at: string
}
