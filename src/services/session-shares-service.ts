import { ApiClient } from '@/lib/api-client'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://coach-sidekick-backend-production.up.railway.app/api/v1'

export interface SessionShare {
  id: string
  session_id: string
  shared_with_user_id: string
  shared_with_name: string | null
  shared_with_email: string | null
  created_by_id: string
  created_at: string
}

export interface SessionShareList {
  is_shared_with_all_coaches: boolean
  shares: SessionShare[]
}

export interface CoachSearchResult {
  id: string
  full_name: string | null
  email: string
}

export class SessionSharesService {
  static list(sessionId: string): Promise<SessionShareList> {
    return ApiClient.get(`${BACKEND_URL}/sessions/${sessionId}/shares`)
  }

  static add(sessionId: string, userIds: string[]): Promise<SessionShareList> {
    return ApiClient.post(`${BACKEND_URL}/sessions/${sessionId}/shares`, {
      user_ids: userIds,
    })
  }

  static revoke(sessionId: string, shareId: string): Promise<void> {
    return ApiClient.delete(
      `${BACKEND_URL}/sessions/${sessionId}/shares/${shareId}`,
    )
  }

  static toggleShareWithAll(
    sessionId: string,
    shareWithAll: boolean,
  ): Promise<SessionShareList> {
    return ApiClient.patch(`${BACKEND_URL}/sessions/${sessionId}/shares/all`, {
      share_with_all: shareWithAll,
    })
  }

  static searchCoaches(q: string, limit = 10): Promise<CoachSearchResult[]> {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    params.set('limit', String(limit))
    return ApiClient.get(`${BACKEND_URL}/coaches/search?${params.toString()}`)
  }
}
