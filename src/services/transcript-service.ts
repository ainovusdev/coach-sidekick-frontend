import { ApiClient } from '@/lib/api-client'
import { TranscriptEntry } from '@/types/meeting'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface TranscriptCreateDto {
  speaker: string
  text: string
  timestamp: string
  is_partial?: boolean
  transcript_metadata?: Record<string, any>
}

export interface TranscriptBatchCreateDto {
  transcripts: TranscriptCreateDto[]
  session_metadata?: Record<string, any>
}

export interface TranscriptListResponse {
  transcripts: TranscriptEntry[]
  total: number
  page: number
  per_page: number
}

export interface BatchSaveStatus {
  session_id: string
  saved_count: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  last_saved_at: string
}

// Backend response format
interface BackendTranscript {
  id: string
  session_id: string
  speaker: string
  text: string
  timestamp: string
  is_partial: boolean
  transcript_metadata: Record<string, any>
  created_at: string
}

// Transform backend transcript to UI format
function transformTranscript(
  backendTranscript: BackendTranscript,
): TranscriptEntry {
  return {
    speaker: backendTranscript.speaker,
    text: backendTranscript.text,
    timestamp: backendTranscript.timestamp,
    confidence: 1.0, // Backend doesn't have confidence, default to 1.0
    is_final: !backendTranscript.is_partial,
    start_time: backendTranscript.transcript_metadata?.start_time,
    end_time: backendTranscript.transcript_metadata?.end_time,
  }
}

export class TranscriptService {
  static async getSessionTranscripts(
    sessionId: string,
    params?: {
      page?: number
      per_page?: number
      include_partial?: boolean
    },
  ): Promise<TranscriptListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.per_page)
      queryParams.append('per_page', params.per_page.toString())
    if (params?.include_partial !== undefined) {
      queryParams.append('include_partial', params.include_partial.toString())
    }

    const response = await ApiClient.get(
      `${BACKEND_URL}/transcripts/sessions/${sessionId}/transcripts?${queryParams}`,
    )

    return {
      transcripts: response.transcripts.map(transformTranscript),
      total: response.total,
      page: response.page,
      per_page: response.per_page,
    }
  }

  static async createTranscript(
    sessionId: string,
    data: TranscriptCreateDto,
  ): Promise<TranscriptEntry> {
    const response: BackendTranscript = await ApiClient.post(
      `${BACKEND_URL}/transcripts/sessions/${sessionId}/transcripts`,
      data,
    )
    return transformTranscript(response)
  }

  static async batchSaveTranscripts(
    sessionId: string,
    data: TranscriptBatchCreateDto,
  ): Promise<BatchSaveStatus> {
    return await ApiClient.post(
      `${BACKEND_URL}/transcripts/sessions/${sessionId}/transcripts/batch`,
      data,
    )
  }

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
