/**
 * Client Portal Outcome Service
 * API client for client-side outcome (target) and goal management
 */

import { ApiClient } from '@/lib/api-client'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface ClientGoal {
  id: string
  title: string
  category: string | null
  status: string
  progress: number
  created_at: string
}

export interface ClientOutcome {
  id: string
  title: string
  description: string | null
  status: string
  progress_percentage: number
  goal_titles: string[]
  goal_ids: string[]
  commitment_count: number
  completed_commitment_count: number
  created_at: string
  updated_at: string
}

export interface ClientOutcomeDetail extends ClientOutcome {
  commitments: Array<{
    id: string
    title: string
    status: string
    progress_percentage: number
    target_date: string | null
  }>
}

export interface ClientOutcomeCreate {
  title: string
  description?: string
  goal_id: string
}

export class ClientOutcomeService {
  static async listGoals(): Promise<ClientGoal[]> {
    return ApiClient.get(`${BACKEND_URL}/client-portal/goals`)
  }

  static async listOutcomes(filters?: {
    status?: string
  }): Promise<ClientOutcome[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    const query = params.toString()
    return ApiClient.get(
      `${BACKEND_URL}/client-portal/outcomes${query ? `?${query}` : ''}`,
    )
  }

  static async getOutcome(id: string): Promise<ClientOutcomeDetail> {
    return ApiClient.get(`${BACKEND_URL}/client-portal/outcomes/${id}`)
  }

  static async createOutcome(
    data: ClientOutcomeCreate,
  ): Promise<ClientOutcome> {
    return ApiClient.post(`${BACKEND_URL}/client-portal/outcomes`, data)
  }
}
