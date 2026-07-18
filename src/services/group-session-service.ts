import { ApiClient } from '@/lib/api-client'
import {
  GroupSession,
  GroupSessionCreate,
  GroupSessionListResponse,
  GroupSessionFilters,
  GroupSessionParticipant,
} from '@/types/group-session'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export class GroupSessionService {
  static async createGroupSession(
    data: GroupSessionCreate,
  ): Promise<GroupSession> {
    return await ApiClient.post(`${BACKEND_URL}/group-sessions/`, data)
  }

  static async listGroupSessions(
    params?: GroupSessionFilters,
  ): Promise<GroupSessionListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.program_id) queryParams.append('program_id', params.program_id)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.per_page)
      queryParams.append('per_page', params.per_page.toString())

    return await ApiClient.get(`${BACKEND_URL}/group-sessions/?${queryParams}`)
  }

  static async getParticipants(
    sessionId: string,
  ): Promise<GroupSessionParticipant[]> {
    return await ApiClient.get(
      `${BACKEND_URL}/group-sessions/${sessionId}/participants`,
    )
  }
}
