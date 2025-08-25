import { ApiClient } from '@/lib/api-client'
import { Client } from '@/types/meeting'
import authService from '@/services/auth-service'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface ClientCreateDto {
  name: string
  notes?: string
}

export interface ClientUpdateDto {
  name?: string
  notes?: string
}

// Backend response format
interface BackendClient {
  id: string
  name: string
  notes?: string
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
    notes: backendClient.notes,
    created_at: backendClient.created_at,
    updated_at: backendClient.updated_at,
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
