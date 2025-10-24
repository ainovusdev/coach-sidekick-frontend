/**
 * Goal Service - API client for goal endpoints
 */

import { ApiClient } from '@/lib/api-client'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface Goal {
  id: string
  client_id: string
  created_by: string
  title: string
  description?: string
  category: string
  target_date?: string
  status: string
  progress: number
  created_at: string
  updated_at: string
}

export interface GoalCreate {
  client_id: string
  title: string
  description?: string
  category?: string
  status?: string
}

export class GoalService {
  /**
   * List goals for a client
   */
  static async listGoals(clientId: string): Promise<Goal[]> {
    const response = await ApiClient.get(
      `${BACKEND_URL}/clients/${clientId}/goals`,
    )
    return Array.isArray(response) ? response : []
  }

  /**
   * Create a new goal
   */
  static async createGoal(data: GoalCreate): Promise<Goal> {
    const response = await ApiClient.post(`${BACKEND_URL}/goals/`, data)
    return response
  }

  /**
   * Update a goal
   */
  static async updateGoal(
    goalId: string,
    data: Partial<GoalCreate>,
  ): Promise<Goal> {
    const response = await ApiClient.patch(
      `${BACKEND_URL}/goals/${goalId}`,
      data,
    )
    return response
  }

  /**
   * Delete a goal
   */
  static async deleteGoal(goalId: string): Promise<void> {
    await ApiClient.delete(`${BACKEND_URL}/goals/${goalId}`)
  }

  /**
   * Bulk confirm draft goals
   */
  static async bulkConfirmGoals(goalIds: string[]): Promise<Goal[]> {
    const response = await ApiClient.post(`${BACKEND_URL}/goals/bulk-confirm`, {
      goal_ids: goalIds,
    })
    return Array.isArray(response) ? response : []
  }
}
