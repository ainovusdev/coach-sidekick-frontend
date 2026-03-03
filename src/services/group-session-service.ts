import { ApiClient } from '@/lib/api-client'
import {
  GroupSession,
  GroupSessionCreate,
  GroupSessionUpdate,
  GroupSessionListResponse,
  GroupSessionFilters,
  GroupSessionTokenResponse,
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

  static async getGroupSession(sessionId: string): Promise<GroupSession> {
    return await ApiClient.get(`${BACKEND_URL}/group-sessions/${sessionId}`)
  }

  static async updateGroupSession(
    sessionId: string,
    data: GroupSessionUpdate,
  ): Promise<GroupSession> {
    return await ApiClient.patch(
      `${BACKEND_URL}/group-sessions/${sessionId}`,
      data,
    )
  }

  static async deleteGroupSession(sessionId: string): Promise<void> {
    await ApiClient.delete(`${BACKEND_URL}/group-sessions/${sessionId}`)
  }

  static async endGroupSession(sessionId: string): Promise<GroupSession> {
    return await ApiClient.post(
      `${BACKEND_URL}/group-sessions/${sessionId}/end`,
      {},
    )
  }

  static async addParticipant(
    sessionId: string,
    clientId: string,
  ): Promise<GroupSessionParticipant> {
    return await ApiClient.post(
      `${BACKEND_URL}/group-sessions/${sessionId}/participants`,
      { client_id: clientId },
    )
  }

  static async removeParticipant(
    sessionId: string,
    clientId: string,
  ): Promise<void> {
    await ApiClient.delete(
      `${BACKEND_URL}/group-sessions/${sessionId}/participants/${clientId}`,
    )
  }

  static async getParticipants(
    sessionId: string,
  ): Promise<GroupSessionParticipant[]> {
    return await ApiClient.get(
      `${BACKEND_URL}/group-sessions/${sessionId}/participants`,
    )
  }

  static async generateTokens(
    sessionId: string,
  ): Promise<GroupSessionTokenResponse> {
    return await ApiClient.post(
      `${BACKEND_URL}/group-sessions/${sessionId}/tokens`,
      {},
    )
  }
}
