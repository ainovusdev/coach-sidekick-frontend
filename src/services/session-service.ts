import { ApiClient } from '@/lib/api-client'
import { CoachingSession } from '@/types/meeting'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://coach-sidekick-backend-production.up.railway.app/api/v1'

export interface SessionCreateDto {
  client_id?: string
  bot_id: string
  meeting_url: string
  session_metadata?: Record<string, any>
}

export interface SessionUpdateDto {
  title?: string
  status?: string
  ended_at?: string
  summary?: string
  coach_notes?: string
  key_topics?: string[]
  action_items?: string[]
  session_metadata?: Record<string, any>
  // null detaches the client from a solo session.
  client_id?: string | null
}

export interface SessionListResponse {
  sessions: CoachingSession[]
  total: number
  page: number
  per_page: number
}

// Backend response format matching
interface BackendSession {
  id: string
  coach_id: string
  client_id?: string
  bot_id: string
  meeting_url: string
  status: string
  started_at: string
  ended_at?: string
  duration_seconds?: number
  summary?: string
  key_topics: string[]
  action_items: string[]
  personal_ai_uploaded: boolean
  created_at: string
  updated_at: string
  coach_name?: string
  client_name?: string
  is_group_session?: boolean
  participant_count?: number | null
  video_url?: string | null
  video_unavailable?: boolean
}

// Transform backend session to UI format
function transformSession(backendSession: BackendSession): CoachingSession & {
  summary?: string
  duration_seconds?: number
  key_topics?: string[]
  action_items?: string[]
  coach_id?: string
  coach_name?: string
  client_name?: string
  video_url?: string | null
  video_unavailable?: boolean
} {
  return {
    id: backendSession.id,
    user_id: backendSession.coach_id,
    bot_id: backendSession.bot_id,
    meeting_url: backendSession.meeting_url,
    status: backendSession.status,
    client_id: backendSession.client_id,
    created_at: backendSession.started_at || backendSession.created_at,
    updated_at: backendSession.updated_at,
    summary: backendSession.summary,
    duration_seconds: backendSession.duration_seconds,
    key_topics: backendSession.key_topics,
    action_items: backendSession.action_items,
    coach_id: backendSession.coach_id,
    coach_name: backendSession.coach_name,
    client_name: backendSession.client_name,
    is_group_session: backendSession.is_group_session,
    participant_count: backendSession.participant_count,
    video_url: backendSession.video_url,
    video_unavailable: backendSession.video_unavailable,
  }
}

export class SessionService {
  static async listSessions(params?: {
    page?: number
    per_page?: number
    client_id?: string
    coach_id?: string
    status?: string
    scope?: 'mine' | 'shared' | 'all'
  }): Promise<SessionListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.per_page)
      queryParams.append('per_page', params.per_page.toString())
    if (params?.client_id) queryParams.append('client_id', params.client_id)
    if (params?.coach_id) queryParams.append('coach_id', params.coach_id)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.scope) queryParams.append('scope', params.scope)

    const response = await ApiClient.get(
      `${BACKEND_URL}/sessions/?${queryParams}`,
    )

    return {
      sessions: response.sessions.map(transformSession),
      total: response.total,
      page: response.page,
      per_page: response.per_page,
    }
  }

  static async getSession(sessionId: string): Promise<CoachingSession> {
    const response: BackendSession = await ApiClient.get(
      `${BACKEND_URL}/sessions/${sessionId}`,
    )
    return transformSession(response)
  }

  static async getSessionByBotId(botId: string): Promise<CoachingSession> {
    const response: BackendSession = await ApiClient.get(
      `${BACKEND_URL}/sessions/by-bot/${botId}`,
    )
    return transformSession(response)
  }

  static async createSession(data: SessionCreateDto): Promise<CoachingSession> {
    const response: BackendSession = await ApiClient.post(
      `${BACKEND_URL}/sessions/`,
      data,
    )
    return transformSession(response)
  }

  static async updateSession(
    sessionId: string,
    data: SessionUpdateDto,
  ): Promise<CoachingSession> {
    const response: BackendSession = await ApiClient.patch(
      `${BACKEND_URL}/sessions/${sessionId}`,
      data,
    )
    return transformSession(response)
  }

  // Backend caps per_page at 100, so fetch every page and concatenate to
  // return the client's full session history (not just the first page).
  static async getClientSessions(
    clientId: string,
  ): Promise<SessionListResponse> {
    const PER_PAGE = 100

    const fetchPage = async (page: number) =>
      ApiClient.get(
        `${BACKEND_URL}/clients/${clientId}/sessions?page=${page}&per_page=${PER_PAGE}`,
      )

    const first = await fetchPage(1)
    const total: number = first.total ?? first.sessions.length
    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

    const rawSessions = [...first.sessions]
    if (totalPages > 1) {
      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(i + 2)),
      )
      for (const response of rest) rawSessions.push(...response.sessions)
    }

    return {
      sessions: rawSessions.map(transformSession),
      total,
      page: 1,
      per_page: rawSessions.length,
    }
  }

  static async getSessionDetails(sessionId: string): Promise<any> {
    return await ApiClient.get(`${BACKEND_URL}/sessions/${sessionId}/details`)
  }

  static async getSessionReview(sessionId: string): Promise<{
    id: string
    title: string | null
    duration_seconds: number | null
    started_at: string | null
    recording_started_at: string | null
    video_url: string | null
    video_unavailable: boolean
    coach_name: string | null
    is_owner: boolean
    is_admin: boolean
    is_shared_with_all_coaches: boolean
    transcript: Array<{
      id: string
      speaker: string
      text: string
      timestamp: string
      confidence: number | null
    }>
  }> {
    return await ApiClient.get(`${BACKEND_URL}/sessions/${sessionId}/review`)
  }

  static async deleteSession(sessionId: string): Promise<{
    success: boolean
    message: string
    session_id: string
  }> {
    return await ApiClient.delete(`${BACKEND_URL}/sessions/${sessionId}`)
  }

  static async sendSummaryEmail(
    sessionId: string,
    nextSessionDate?: string,
  ): Promise<{
    success: boolean
    message: string
    sent_to: string
    sent_at: string
  }> {
    return await ApiClient.post(
      `${BACKEND_URL}/sessions/${sessionId}/send-summary-email`,
      {
        session_id: sessionId,
        next_session_date: nextSessionDate,
      },
    )
  }

  static async refreshVideoUrl(sessionId: string): Promise<{
    success: boolean
    video_url: string
    fetched_at: string
  }> {
    return await ApiClient.get(`${BACKEND_URL}/sessions/${sessionId}/video-url`)
  }

  static async generateClientAnalysis(
    sessionId: string,
    clientId?: string,
  ): Promise<any> {
    const params = clientId ? `?client_id=${clientId}` : ''
    return await ApiClient.post(
      `${BACKEND_URL}/sessions/${sessionId}/client-analysis/generate${params}`,
      {},
    )
  }
}
