export interface GroupSessionParticipant {
  client_id: string
  client_name: string
  client_email: string | null
}

export interface GroupSession {
  id: string
  coach_id: string
  coach_name: string | null
  program_id: string | null
  program_name: string | null
  title: string | null
  status: string
  session_type: string
  meeting_url: string | null
  is_group_session: boolean
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  summary: string | null
  key_topics: string[]
  participant_client_ids: string[]
  participants: GroupSessionParticipant[]
  participant_count: number
  created_at: string
  updated_at: string
}

export interface GroupSessionCreate {
  program_id?: string
  client_ids: string[]
  title?: string
  meeting_url?: string
  session_type?: string
}

export interface GroupSessionUpdate {
  title?: string
  status?: string
}

export interface GroupSessionListResponse {
  sessions: GroupSession[]
  total: number
  page: number
  per_page: number
}

export interface GroupSessionFilters {
  program_id?: string
  page?: number
  per_page?: number
}

export interface GroupSessionTokenResponse {
  tokens: Array<{
    client_id: string
    client_name: string
    token: string
    share_url: string
  }>
}
