/**
 * Enhanced Extraction Service
 * Extracts goals, targets, and commitments from sessions
 */

import { ApiClient } from '@/lib/api-client'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface ExtractionResult {
  draft_goals: any[]
  draft_targets: any[]
  draft_commitments: any[]
  total_created: number
  current_sprint_id: string | null
}

export interface ConfirmExtractionRequest {
  session_id: string
  client_id: string
  goals: any[]
  targets: any[]
  commitments: any[]
  current_sprint_id: string | null
}

export interface ConfirmExtractionResponse {
  success: boolean
  created_goal_ids: string[]
  created_target_ids: string[]
  created_commitment_ids: string[]
  total_created: number
}

export class EnhancedExtractionService {
  /**
   * Extract goals, targets, and commitments from a session.
   * Returns extraction results WITHOUT saving to database.
   */
  static async extractFromSession(
    sessionId: string,
  ): Promise<ExtractionResult> {
    const response = await ApiClient.post(
      `${BACKEND_URL}/sessions/${sessionId}/extract-all`,
      {},
      120000, // 2 minute timeout for AI extraction
    )
    return response
  }

  /**
   * Confirm and save extracted items to database.
   * Only called after coach reviews and approves the extraction.
   */
  static async confirmExtraction(
    request: ConfirmExtractionRequest,
  ): Promise<ConfirmExtractionResponse> {
    const response = await ApiClient.post(
      `${BACKEND_URL}/sessions/extraction/confirm`,
      request,
      30000, // 30 second timeout
    )
    return response
  }
}
