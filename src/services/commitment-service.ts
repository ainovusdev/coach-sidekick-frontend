/**
 * Commitment Service
 * API client for all commitment-related endpoints
 */

import { ApiClient } from '@/lib/api-client'
import {
  Commitment,
  CommitmentCreate,
  CommitmentUpdate,
  CommitmentUpdateCreate,
  CommitmentFilters,
  CommitmentListResponse,
  ExtractedCommitment,
  MilestoneCreate,
  Milestone,
  CommitmentStats,
} from '@/types/commitment'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export class CommitmentService {
  /**
   * List commitments with optional filters
   */
  static async listCommitments(
    filters?: CommitmentFilters,
  ): Promise<CommitmentListResponse> {
    const params = new URLSearchParams()

    if (filters?.client_id) params.append('client_id', filters.client_id)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.type) params.append('type', filters.type)
    if (filters?.session_id) params.append('session_id', filters.session_id)
    if (filters?.include_drafts !== undefined)
      params.append('include_drafts', String(filters.include_drafts))

    const queryString = params.toString()
    const url = `${BACKEND_URL}/commitments/${queryString ? `?${queryString}` : ''}`

    const response = await ApiClient.get(url)
    return response
  }

  /**
   * Get single commitment by ID
   */
  static async getCommitment(commitmentId: string): Promise<Commitment> {
    const response = await ApiClient.get(
      `${BACKEND_URL}/commitments/${commitmentId}`,
    )
    return response
  }

  /**
   * Create a new commitment
   */
  static async createCommitment(data: CommitmentCreate): Promise<Commitment> {
    const response = await ApiClient.post(`${BACKEND_URL}/commitments/`, data)
    return response
  }

  /**
   * Update an existing commitment
   */
  static async updateCommitment(
    commitmentId: string,
    data: CommitmentUpdate,
  ): Promise<Commitment> {
    const response = await ApiClient.patch(
      `${BACKEND_URL}/commitments/${commitmentId}`,
      data,
    )
    return response
  }

  /**
   * Confirm a draft commitment (make it active)
   */
  static async confirmCommitment(commitmentId: string): Promise<Commitment> {
    const response = await ApiClient.post(
      `${BACKEND_URL}/commitments/${commitmentId}/confirm`,
      {},
    )
    return response
  }

  /**
   * Discard/delete a commitment
   */
  static async discardCommitment(commitmentId: string): Promise<void> {
    await ApiClient.delete(`${BACKEND_URL}/commitments/${commitmentId}`)
  }

  /**
   * Update progress on a commitment
   */
  static async updateProgress(
    commitmentId: string,
    data: CommitmentUpdateCreate,
  ): Promise<Commitment> {
    const response = await ApiClient.post(
      `${BACKEND_URL}/commitments/${commitmentId}/progress`,
      data,
    )
    return response
  }

  /**
   * Extract commitments from a session transcript using AI
   */
  static async extractFromSession(
    sessionId: string,
  ): Promise<ExtractedCommitment[]> {
    const response = await ApiClient.post(
      `${BACKEND_URL}/commitments/extract/${sessionId}`,
      {},
      120000, // 2 minute timeout for AI extraction
    )
    return response
  }

  /**
   * Add a milestone to a commitment
   */
  static async addMilestone(
    commitmentId: string,
    data: MilestoneCreate,
  ): Promise<Milestone> {
    const response = await ApiClient.post(
      `${BACKEND_URL}/commitments/${commitmentId}/milestones`,
      data,
    )
    return response
  }

  /**
   * Update a milestone
   */
  static async updateMilestone(
    commitmentId: string,
    milestoneId: string,
    data: Partial<MilestoneCreate>,
  ): Promise<Milestone> {
    const response = await ApiClient.patch(
      `${BACKEND_URL}/commitments/${commitmentId}/milestones/${milestoneId}`,
      data,
    )
    return response
  }

  /**
   * Delete a milestone
   */
  static async deleteMilestone(
    commitmentId: string,
    milestoneId: string,
  ): Promise<void> {
    await ApiClient.delete(
      `${BACKEND_URL}/commitments/${commitmentId}/milestones/${milestoneId}`,
    )
  }

  /**
   * Get commitment statistics (for dashboard)
   */
  static async getStats(clientId?: string): Promise<CommitmentStats> {
    const url = clientId
      ? `${BACKEND_URL}/commitments/stats?client_id=${clientId}`
      : `${BACKEND_URL}/commitments/stats`

    const response = await ApiClient.get(url)
    return response
  }

  /**
   * Bulk confirm draft commitments
   */
  static async bulkConfirm(commitmentIds: string[]): Promise<Commitment[]> {
    const response = await ApiClient.post(
      `${BACKEND_URL}/commitments/bulk-confirm`,
      { commitment_ids: commitmentIds },
    )
    return response
  }

  /**
   * Bulk discard draft commitments
   */
  static async bulkDiscard(commitmentIds: string[]): Promise<void> {
    await ApiClient.post(`${BACKEND_URL}/commitments/bulk-discard`, {
      commitment_ids: commitmentIds,
    })
  }
}
