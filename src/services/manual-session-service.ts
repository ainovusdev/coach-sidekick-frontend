import { ApiClient } from '@/lib/api-client'
import { CoachingSession } from '@/types/meeting'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api/v1'

export interface ManualSessionCreateDto {
  client_id: string
  session_date?: string
  notes?: string
  session_metadata?: Record<string, any>
}

export interface TranscriptionStatus {
  session_id: string
  transcription_status: string
  transcription_progress: number
  status: string
}

export interface FileUploadResponse {
  message: string
  session_id: string
  filename: string
  size: number
}

export class ManualSessionService {
  static async createManualSession(data: ManualSessionCreateDto): Promise<CoachingSession> {
    const response = await ApiClient.post(`${BACKEND_URL}/sessions/manual`, data)
    return response
  }

  static async uploadMediaFile(
    sessionId: string,
    file: File,
    _onProgress?: (progress: number) => void
  ): Promise<FileUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${BACKEND_URL}/sessions/${sessionId}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Upload failed')
    }

    return response.json()
  }

  static async getTranscriptionStatus(sessionId: string): Promise<TranscriptionStatus> {
    const response = await ApiClient.get(
      `${BACKEND_URL}/sessions/${sessionId}/transcription-status`
    )
    return response
  }

  static subscribeToTranscriptionProgress(
    sessionId: string,
    onProgress: (status: string, progress: number) => void
  ) {
    // This will be implemented with WebSocket connection
    // For now, we'll poll the status endpoint
    const interval = setInterval(async () => {
      try {
        const status = await this.getTranscriptionStatus(sessionId)
        onProgress(status.transcription_status, status.transcription_progress)
        
        if (status.transcription_status === 'completed' || 
            status.transcription_status === 'failed') {
          clearInterval(interval)
        }
      } catch (error) {
        console.error('Failed to get transcription status:', error)
      }
    }, 2000) // Poll every 2 seconds

    // Return cleanup function
    return () => clearInterval(interval)
  }
}