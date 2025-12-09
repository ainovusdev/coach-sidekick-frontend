import { ApiClient } from '@/lib/api-client'
import { Client } from '@/types/meeting'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface ClientCreateDto {
  name: string
  notes?: string
  meta_performance_vision?: string
}

export interface ClientUpdateDto {
  name?: string
  notes?: string
  meta_performance_vision?: string
}

// Backend response format - matches what the API actually returns
interface BackendClient {
  id: string
  name: string
  email?: string
  phone?: string
  notes?: string
  tags?: string[]
  meta_performance_vision?: string
  created_at: string
  updated_at: string
  has_portal_access?: boolean
  linked_user_email?: string
  coach_id?: string
  is_my_client?: boolean
  coach_name?: string
  invitation_status?: 'not_invited' | 'invited' | 'accepted'
  invitation_sent_at?: string
  client_session_stats?: Array<{
    client_id: string
    total_sessions: number
    total_duration_minutes: number
    last_session_date?: string
    average_engagement_score?: number
    average_overall_score?: number
    improvement_trends: Record<string, any>
    coaching_focus_areas: string[]
    updated_at: string
  }>
}

interface BackendClientListResponse {
  clients: BackendClient[]
  total: number
  page: number
  per_page: number
}

export interface ClientListResponse {
  clients: Client[]
  total: number
  page: number
  per_page: number
}

// Transform backend client to UI client format
// Preserve ALL fields from backend to avoid data loss
function transformClient(backendClient: BackendClient): Client {
  return {
    id: backendClient.id,
    coach_id: backendClient.coach_id || '',
    name: backendClient.name,
    email: backendClient.email,
    notes: backendClient.notes,
    meta_performance_vision: backendClient.meta_performance_vision,
    created_at: backendClient.created_at,
    updated_at: backendClient.updated_at,
    is_my_client: backendClient.is_my_client,
    coach_name: backendClient.coach_name,
    client_session_stats: backendClient.client_session_stats,
    invitation_status: backendClient.invitation_status,
    invitation_sent_at: backendClient.invitation_sent_at,
  }
}

export class ClientService {
  static async listClients(): Promise<ClientListResponse> {
    const response: BackendClientListResponse = await ApiClient.get(
      `${BACKEND_URL}/clients/`,
    )

    return {
      clients: response.clients.map(transformClient),
      total: response.total,
      page: response.page,
      per_page: response.per_page,
    }
  }

  static async getClient(clientId: string): Promise<Client> {
    const response: BackendClient = await ApiClient.get(
      `${BACKEND_URL}/clients/${clientId}`,
    )
    return transformClient(response)
  }

  static async createClient(data: ClientCreateDto): Promise<Client> {
    const response: BackendClient = await ApiClient.post(
      `${BACKEND_URL}/clients/`,
      data,
    )
    return transformClient(response)
  }

  static async updateClient(
    clientId: string,
    data: ClientUpdateDto,
  ): Promise<Client> {
    const response: BackendClient = await ApiClient.patch(
      `${BACKEND_URL}/clients/${clientId}`,
      data,
    )
    return transformClient(response)
  }

  static async deleteClient(clientId: string): Promise<void> {
    await ApiClient.delete(`${BACKEND_URL}/clients/${clientId}`)
  }
}
