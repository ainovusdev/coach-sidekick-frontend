/**
 * Client Portal Sprint Service
 * API client for client-side sprint viewing
 */

import { ApiClient } from '@/lib/api-client'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface ClientSprint {
  id: string
  client_id: string
  sprint_number: number
  title: string
  description?: string
  start_date: string
  end_date: string
  status: string
  duration_weeks: number
  is_current: boolean
  progress_percentage: number
  target_count: number
  completed_target_count: number
  created_at: string
  updated_at: string
}

export class ClientSprintService {
  /**
   * List all sprints for the current client
   */
  static async listSprints(status?: string): Promise<ClientSprint[]> {
    const params = new URLSearchParams()
    if (status) params.append('status', status)

    const queryString = params.toString()
    const url = `${BACKEND_URL}/client-portal/sprints${queryString ? `?${queryString}` : ''}`

    const response = await ApiClient.get(url)

    // Backend returns array directly
    if (Array.isArray(response)) {
      return response
    }

    return response.sprints || []
  }

  /**
   * Get the current active sprint for the client
   */
  static async getCurrentSprint(): Promise<ClientSprint | null> {
    const response = await ApiClient.get(
      `${BACKEND_URL}/client-portal/sprints/current`,
    )
    return response
  }
}
