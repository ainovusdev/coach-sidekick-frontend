import { ApiClient } from '@/lib/api-client'
import { Client } from '@/types/meeting'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface ClientCreateDto {
  name: string
  email?: string
  notes?: string
  meta_performance_vision?: string
  auto_send_questionnaire?: boolean
  questionnaire_lead_time_hours?: number
}

// Real-time recognition for the New Client modal.
export interface ClientEmailLookup {
  exists: boolean
  kind: 'none' | 'pending_user' | 'active_user'
  name: string | null
  already_my_client: boolean
}

// createClient may, for an existing active user, create the row unlinked and send
// an accept/decline request instead of connecting immediately.
export interface CreateClientResult {
  client: Client
  accessRequestSent: boolean
  accessRequestName?: string
}

export interface ClientUpdateDto {
  name?: string
  email?: string
  notes?: string
  meta_performance_vision?: string
  auto_send_questionnaire?: boolean
  questionnaire_lead_time_hours?: number
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
  auto_send_questionnaire?: boolean
  questionnaire_lead_time_hours?: number
  created_at: string
  updated_at: string
  has_portal_access?: boolean
  linked_user_email?: string
  coach_id?: string
  is_my_client?: boolean
  coach_name?: string
  access_request_sent?: boolean
  access_request_name?: string
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

// Simple client for dropdowns/dashboard (lightweight)
export interface SimpleClient {
  id: string
  name: string
  email?: string
  is_my_client?: boolean
  coach_name?: string
  last_session_date?: string | null
}

export interface SimpleClientListResponse {
  clients: SimpleClient[]
  total: number
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
    auto_send_questionnaire: backendClient.auto_send_questionnaire,
    questionnaire_lead_time_hours: backendClient.questionnaire_lead_time_hours,
    created_at: backendClient.created_at,
    updated_at: backendClient.updated_at,
    is_my_client: backendClient.is_my_client,
    coach_name: backendClient.coach_name,
    client_session_stats: backendClient.client_session_stats,
    invitation_status: backendClient.invitation_status,
    invitation_sent_at: backendClient.invitation_sent_at,
  }
}

export interface ClientSignupInvitation {
  id: string
  client_id: string
  email: string
  accepted_at: string | null
  expires_at: string
  created_at: string
}

export interface ClientAccessInvitation {
  id: string
  client_id: string
  email: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  created_at: string
}

export class ClientService {
  /**
   * Lightweight client list for dropdowns and dashboard.
   * Only fetches id, name, email - much faster than full list.
   */
  static async listClientsSimple(
    search?: string,
  ): Promise<SimpleClientListResponse> {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    const queryString = params.toString()
    const url = `${BACKEND_URL}/clients/simple${queryString ? `?${queryString}` : ''}`

    return await ApiClient.get(url)
  }

  /**
   * Full client list with all details (session stats, invitation status, etc.)
   * Use only on dedicated clients page where all data is needed.
   * Paginates through all pages to fetch every client.
   */
  static async listClients(): Promise<ClientListResponse> {
    const allClients: Client[] = []
    let page = 1
    let total = 0

    while (true) {
      const response: BackendClientListResponse = await ApiClient.get(
        `${BACKEND_URL}/clients/?per_page=100&page=${page}`,
      )
      total = response.total
      allClients.push(...response.clients.map(transformClient))

      if (allClients.length >= total || response.clients.length < 100) {
        break
      }
      page++
    }

    return {
      clients: allClients,
      total,
      page: 1,
      per_page: total,
    }
  }

  static async getClient(clientId: string): Promise<Client> {
    const response: BackendClient = await ApiClient.get(
      `${BACKEND_URL}/clients/${clientId}`,
    )
    return transformClient(response)
  }

  static async createClient(
    data: ClientCreateDto,
  ): Promise<CreateClientResult> {
    const response: BackendClient = await ApiClient.post(
      `${BACKEND_URL}/clients/`,
      data,
    )
    return {
      client: transformClient(response),
      accessRequestSent: Boolean(response.access_request_sent),
      accessRequestName: response.access_request_name,
    }
  }

  // Real-time email recognition for the New Client modal: is this email already a
  // person in the system, and are they already this coach's client?
  static async lookupEmail(email: string): Promise<ClientEmailLookup> {
    return await ApiClient.get(
      `${BACKEND_URL}/clients/lookup-email?email=${encodeURIComponent(email)}`,
    )
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

  static async getClientSignupInvitations(
    clientId: string,
  ): Promise<ClientSignupInvitation[]> {
    return await ApiClient.get(`${BACKEND_URL}/clients/${clientId}/invitations`)
  }

  static async getClientAccessInvitations(
    clientId: string,
  ): Promise<ClientAccessInvitation[]> {
    return await ApiClient.get(
      `${BACKEND_URL}/client-access-invitations/sent?client_id=${clientId}`,
    )
  }

  static async cancelInvitation(clientId: string): Promise<void> {
    // Try access invitations first (more common, uses query param)
    try {
      const accessInvitations =
        await ClientService.getClientAccessInvitations(clientId)
      const pendingAccess = accessInvitations.find(
        inv => inv.status === 'pending',
      )
      if (pendingAccess) {
        await ApiClient.delete(
          `${BACKEND_URL}/client-access-invitations/${pendingAccess.id}`,
        )
        return
      }
    } catch (e) {
      console.warn('Could not fetch access invitations:', e)
    }

    // Try signup invitations
    try {
      const signupInvitations =
        await ClientService.getClientSignupInvitations(clientId)
      const pendingSignup = signupInvitations.find(
        inv => !inv.accepted_at && new Date(inv.expires_at) > new Date(),
      )
      if (pendingSignup) {
        await ApiClient.delete(`${BACKEND_URL}/invitations/${pendingSignup.id}`)
        return
      }
    } catch (e) {
      console.warn('Could not fetch signup invitations:', e)
    }

    throw new Error('No pending invitation found for this client')
  }
}
