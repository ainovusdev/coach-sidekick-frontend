export interface GroupSessionParticipant {
  client_id: string
  client_name: string
  client_email: string | null
}

export interface GroupSession {
  id: string
  coach_id: string
  coach_name: string | null
  title: string | null
  status: string
  session_type: string
  meeting_url: string | null
  is_group_session: boolean
  /** Set when the session was started from a sandbox group, and credits it. */
  sandbox_group_id: string | null
  started_at: string
  scheduled_for: string | null
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

/**
 * Two ways to say who is in the room, and exactly one of them per request:
 * hand-picked `client_ids`, or a sandbox group, whose roster the server reads
 * from the open enrollments. Naming the group is also what records which
 * agreement the session credits, so prefer it wherever a group exists.
 */
export interface GroupSessionCreate {
  client_ids?: string[]
  sandbox_id?: string
  sandbox_group_id?: string
  title?: string
  meeting_url?: string
  session_type?: string
}

export interface GroupSessionSchedule extends GroupSessionCreate {
  scheduled_for: string
}

export interface GroupSessionListResponse {
  sessions: GroupSession[]
  total: number
  page: number
  per_page: number
}

export interface GroupSessionFilters {
  page?: number
  per_page?: number
}
