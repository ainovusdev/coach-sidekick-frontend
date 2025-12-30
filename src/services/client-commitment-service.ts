/**
 * Client Portal Commitment Service
 * API client for client-side commitment management
 */

import { ApiClient } from '@/lib/api-client'
import {
  Commitment,
  CommitmentUpdateCreate,
  CommitmentListResponse,
} from '@/types/commitment'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface ClientCommitmentCreate {
  title: string
  description?: string
  type?: 'action' | 'habit' | 'milestone' | 'learning'
  target_date: string // Required
}

export interface ClientCommitmentUpdate {
  title?: string
  description?: string
  type?: 'action' | 'habit' | 'milestone' | 'learning'
  target_date?: string
  status?: 'active' | 'completed' | 'abandoned'
  progress_percentage?: number
}

export class ClientCommitmentService {
  /**
   * List commitments for the current client
   */
  static async listCommitments(params?: {
    status?: string
    include_coach_created?: boolean
  }): Promise<CommitmentListResponse> {
    const searchParams = new URLSearchParams()

    if (params?.status) searchParams.append('status', params.status)
    if (params?.include_coach_created !== undefined) {
      searchParams.append(
        'include_coach_created',
        String(params.include_coach_created),
      )
    }

    const queryString = searchParams.toString()
    const url = `${BACKEND_URL}/client-portal/commitments${queryString ? `?${queryString}` : ''}`

    const response = await ApiClient.get(url)

    // Backend returns array directly, wrap it in expected format
    if (Array.isArray(response)) {
      return {
        commitments: response,
        total: response.length,
      }
    }

    return response
  }

  /**
   * Create a new commitment (client self-created)
   */
  static async createCommitment(
    data: ClientCommitmentCreate,
  ): Promise<Commitment> {
    const response = await ApiClient.post(
      `${BACKEND_URL}/client-portal/commitments`,
      data,
    )
    return response
  }

  /**
   * Update an existing commitment
   */
  static async updateCommitment(
    commitmentId: string,
    data: ClientCommitmentUpdate,
  ): Promise<Commitment> {
    const response = await ApiClient.patch(
      `${BACKEND_URL}/client-portal/commitments/${commitmentId}`,
      data,
    )
    return response
  }

  /**
   * Update progress on a commitment
   */
  static async updateProgress(
    commitmentId: string,
    data: CommitmentUpdateCreate,
  ): Promise<any> {
    const response = await ApiClient.post(
      `${BACKEND_URL}/client-portal/commitments/${commitmentId}/progress`,
      data,
    )
    return response
  }

  /**
   * Delete a commitment (only client-created ones)
   */
  static async deleteCommitment(commitmentId: string): Promise<void> {
    await ApiClient.delete(
      `${BACKEND_URL}/client-portal/commitments/${commitmentId}`,
    )
  }

  /**
   * Mark commitment as complete
   */
  static async completeCommitment(commitmentId: string): Promise<Commitment> {
    return this.updateCommitment(commitmentId, {
      status: 'completed',
      progress_percentage: 100,
    })
  }
}
