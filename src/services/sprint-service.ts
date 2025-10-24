/**
 * Sprint Service - API client for sprint endpoints
 */

import { ApiClient } from '@/lib/api-client'
import {
  Sprint,
  SprintDetail,
  SprintCreate,
  SprintUpdate,
} from '@/types/sprint'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export class SprintService {
  /**
   * List sprints with optional filters
   */
  static async listSprints(filters?: {
    client_id?: string
    status?: string
  }): Promise<Sprint[]> {
    const params = new URLSearchParams()

    if (filters?.client_id) params.append('client_id', filters.client_id)
    if (filters?.status) params.append('status', filters.status)

    const queryString = params.toString()
    const url = `${BACKEND_URL}/sprints/${queryString ? `?${queryString}` : ''}`

    const response = await ApiClient.get(url)

    // Backend returns array directly
    if (Array.isArray(response)) {
      return response
    }

    return response.sprints || []
  }

  /**
   * Get current active sprint for a client
   */
  static async getCurrentSprint(
    clientId: string,
  ): Promise<SprintDetail | null> {
    const response = await ApiClient.get(
      `${BACKEND_URL}/sprints/current/${clientId}`,
    )
    return response
  }

  /**
   * Get single sprint by ID
   */
  static async getSprint(sprintId: string): Promise<SprintDetail> {
    const response = await ApiClient.get(`${BACKEND_URL}/sprints/${sprintId}`)
    return response
  }

  /**
   * Create a new sprint
   */
  static async createSprint(data: SprintCreate): Promise<Sprint> {
    const response = await ApiClient.post(`${BACKEND_URL}/sprints/`, data)
    return response
  }

  /**
   * Update an existing sprint
   */
  static async updateSprint(
    sprintId: string,
    data: SprintUpdate,
  ): Promise<Sprint> {
    const response = await ApiClient.patch(
      `${BACKEND_URL}/sprints/${sprintId}`,
      data,
    )
    return response
  }

  /**
   * Delete a sprint
   */
  static async deleteSprint(sprintId: string): Promise<void> {
    await ApiClient.delete(`${BACKEND_URL}/sprints/${sprintId}`)
  }
}
