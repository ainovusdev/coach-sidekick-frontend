import { ApiClient } from '@/lib/api-client'
import { Client } from '@/types/meeting'
import authService from '@/services/auth-service'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api/v1'

export interface ClientCreateDto {
  name: string
  email?: string
  phone?: string
  notes?: string
  tags?: string[]
}

export interface ClientUpdateDto {
  name?: string
  email?: string
  phone?: string
  notes?: string
  tags?: string[]
}

// Backend response format
interface BackendClient {
  id: string
  name: string
  email?: string
  phone?: string
  notes?: string
  tags: string[]
  created_at: string
  updated_at: string
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
function transformClient(backendClient: BackendClient): Client {
  const userId = authService.getUserIdFromToken() || ''
  return {
    id: backendClient.id,
    coach_id: userId,
    name: backendClient.name,
    email: backendClient.email,
    phone: backendClient.phone,
    company: undefined,
    position: undefined,
    notes: backendClient.notes,
    tags: backendClient.tags || [],
    status: 'active' as const, // Backend doesn't have status, defaulting to active
    created_at: backendClient.created_at,
    updated_at: backendClient.updated_at,
  }
}

export class ClientService {
  static async listClients(params?: {
    page?: number
    per_page?: number
    search?: string
  }): Promise<ClientListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.per_page)
      queryParams.append('per_page', params.per_page.toString())
    if (params?.search) queryParams.append('search', params.search)

    const response: BackendClientListResponse = await ApiClient.get(
      `${BACKEND_URL}/clients?${queryParams}`,
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
      `${BACKEND_URL}/clients`,
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
