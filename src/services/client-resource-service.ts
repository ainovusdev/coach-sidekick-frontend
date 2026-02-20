/**
 * Client Portal Resource Service
 * API client for client-side resource access
 */

import { ApiClient } from '@/lib/api-client'
import type {
  ClientResource,
  ClientResourceListResponse,
  ClientResourceFilters,
} from '@/types/resource'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export class ClientResourceService {
  static async listResources(
    filters?: ClientResourceFilters,
  ): Promise<ClientResourceListResponse> {
    const params = new URLSearchParams()
    if (filters?.category) params.append('category', filters.category)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.skip !== undefined) params.append('skip', String(filters.skip))
    if (filters?.limit !== undefined)
      params.append('limit', String(filters.limit))
    const query = params.toString()
    return ApiClient.get(
      `${BACKEND_URL}/client-portal/resources${query ? `?${query}` : ''}`,
    )
  }

  static async getResource(id: string): Promise<ClientResource> {
    return ApiClient.get(`${BACKEND_URL}/client-portal/resources/${id}`)
  }

  static async trackDownload(id: string): Promise<void> {
    return ApiClient.post(
      `${BACKEND_URL}/client-portal/resources/${id}/download`,
      {},
    )
  }
}
