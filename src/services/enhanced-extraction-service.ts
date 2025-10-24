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

export class EnhancedExtractionService {
  /**
   * Extract goals, targets, and commitments from a session
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
}
