import { ApiClient } from '@/lib/api-client'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface BatchSaveStatus {
  session_id: string
  saved_count: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  last_saved_at: string
}

export class TranscriptService {
  static async getBatchStatus(sessionId: string): Promise<BatchSaveStatus> {
    return await ApiClient.get(
      `${BACKEND_URL}/transcripts/sessions/${sessionId}/batch-status`,
    )
  }

  static async forceSave(
    sessionId: string,
  ): Promise<{ status: string; message: string }> {
    return await ApiClient.post(
      `${BACKEND_URL}/transcripts/sessions/${sessionId}/force-save`,
      {},
    )
  }
}
