import { ApiClient } from '@/lib/api-client'
import { CoachingSession } from '@/types/meeting'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api/v1'

export interface SessionCreateDto {
  client_id?: string
  bot_id: string
  meeting_url: string
  session_metadata?: Record<string, any>
}

export interface SessionUpdateDto {
  status?: string
  ended_at?: string
  summary?: string
  key_topics?: string[]
  action_items?: string[]
  session_metadata?: Record<string, any>
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
}

// Transform backend session to UI format
function transformSession(backendSession: BackendSession): CoachingSession & {
  summary?: string
  duration_seconds?: number
  key_topics?: string[]
  action_items?: string[]
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
  }
}

export class SessionService {
  static async listSessions(params?: {
    page?: number
    per_page?: number
    client_id?: string
    status?: string
  }): Promise<SessionListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString())
    if (params?.client_id) queryParams.append('client_id', params.client_id)
    if (params?.status) queryParams.append('status', params.status)

    const response = await ApiClient.get(`${BACKEND_URL}/sessions?${queryParams}`)
    
    return {
      sessions: response.sessions.map(transformSession),
      total: response.total,
      page: response.page,
      per_page: response.per_page,
    }
  }

  static async getSession(sessionId: string): Promise<CoachingSession> {
    const response: BackendSession = await ApiClient.get(`${BACKEND_URL}/sessions/${sessionId}`)
    return transformSession(response)
  }

  static async getSessionByBotId(botId: string): Promise<CoachingSession> {
    const response: BackendSession = await ApiClient.get(`${BACKEND_URL}/sessions/by-bot/${botId}`)
    return transformSession(response)
  }

  static async createSession(data: SessionCreateDto): Promise<CoachingSession> {
    const response: BackendSession = await ApiClient.post(`${BACKEND_URL}/sessions`, data)
    return transformSession(response)
  }

  static async updateSession(sessionId: string, data: SessionUpdateDto): Promise<CoachingSession> {
    const response: BackendSession = await ApiClient.patch(`${BACKEND_URL}/sessions/${sessionId}`, data)
    return transformSession(response)
  }

  static async getClientSessions(clientId: string, params?: {
    page?: number
    per_page?: number
  }): Promise<SessionListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString())

    const response = await ApiClient.get(`${BACKEND_URL}/clients/${clientId}/sessions?${queryParams}`)
    
    return {
      sessions: response.sessions.map(transformSession),
      total: response.total,
      page: response.page,
      per_page: response.per_page,
    }
  }

  static async getSessionDetails(sessionId: string): Promise<any> {
    return await ApiClient.get(`${BACKEND_URL}/sessions/${sessionId}/details`)
  }
}