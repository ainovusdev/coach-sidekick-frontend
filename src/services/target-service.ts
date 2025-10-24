/**
 * Target Service - API client for target endpoints
 */

import { ApiClient } from '@/lib/api-client'
import {
  Target,
  TargetCreate,
  TargetUpdate,
  CommitmentTargetLink,
} from '@/types/sprint'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export class TargetService {
  /**
   * List targets with optional filters
   */
  static async listTargets(filters?: {
    goal_id?: string
    sprint_id?: string
    status?: string
  }): Promise<Target[]> {
    const params = new URLSearchParams()

    if (filters?.goal_id) params.append('goal_id', filters.goal_id)
    if (filters?.sprint_id) params.append('sprint_id', filters.sprint_id)
    if (filters?.status) params.append('status', filters.status)

    const queryString = params.toString()
    const url = `${BACKEND_URL}/targets/${queryString ? `?${queryString}` : ''}`

    const response = await ApiClient.get(url)

    // Backend returns array directly
    if (Array.isArray(response)) {
      return response
    }

    return response.targets || []
  }

  /**
   * Get single target by ID
   */
  static async getTarget(targetId: string): Promise<Target> {
    const response = await ApiClient.get(`${BACKEND_URL}/targets/${targetId}`)
    return response
  }

  /**
   * Create a new target
   */
  static async createTarget(data: TargetCreate): Promise<Target> {
    const response = await ApiClient.post(`${BACKEND_URL}/targets/`, data)
    return response
  }

  /**
   * Update an existing target
   */
  static async updateTarget(
    targetId: string,
    data: TargetUpdate,
  ): Promise<Target> {
    const response = await ApiClient.patch(
      `${BACKEND_URL}/targets/${targetId}`,
      data,
    )
    return response
  }

  /**
   * Delete a target
   */
  static async deleteTarget(targetId: string): Promise<void> {
    await ApiClient.delete(`${BACKEND_URL}/targets/${targetId}`)
  }

  /**
   * Link a commitment to a target
   */
  static async linkCommitment(
    targetId: string,
    commitmentId: string,
  ): Promise<CommitmentTargetLink> {
    const response = await ApiClient.post(
      `${BACKEND_URL}/targets/${targetId}/link-commitment`,
      {
        commitment_id: commitmentId,
        target_id: targetId,
      },
    )
    return response
  }

  /**
   * Unlink a commitment from a target
   */
  static async unlinkCommitment(
    targetId: string,
    commitmentId: string,
  ): Promise<void> {
    await ApiClient.delete(
      `${BACKEND_URL}/targets/${targetId}/unlink-commitment/${commitmentId}`,
    )
  }

  /**
   * Get all commitments for a target
   */
  static async getTargetCommitments(targetId: string): Promise<any[]> {
    const response = await ApiClient.get(
      `${BACKEND_URL}/targets/${targetId}/commitments`,
    )
    return Array.isArray(response) ? response : []
  }

  /**
   * Bulk confirm draft targets
   */
  static async bulkConfirmTargets(targetIds: string[]): Promise<Target[]> {
    const response = await ApiClient.post(
      `${BACKEND_URL}/targets/bulk-confirm`,
      {
        target_ids: targetIds,
      },
    )
    return Array.isArray(response) ? response : []
  }
}
