import { ApiClient } from '@/lib/api-client'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface CreateBotRequest {
  meeting_url: string
  client_id?: string
  recording_mode?: 'raw_transcript' | 'speaker_separated_audio' | 'video'
  bot_name?: string
}

export interface CreateBotResponse {
  id: string // Changed from bot_id to id
  status: string
  meeting_url: string
  bot_name?: string
  created_at: string
  session_id: string
}

export interface BotInfo {
  id: string
  status: string
  meeting_url?: string
  platform?: string
  meeting_id?: string
  meeting_status?: string
  duration_seconds?: number
  updated_at?: string
}

export interface StopBotResponse {
  bot_id: string
  status: string
  message: string
}

export interface RealTimeTranscript {
  session_id: string
  bot_id: string
  transcripts: Array<{
    id: string
    speaker: string
    text: string
    timestamp: string
    is_final: boolean
  }>
  last_updated: string
}

export class MeetingService {
  static async createBot(data: CreateBotRequest): Promise<CreateBotResponse> {
    const response = await ApiClient.post(`${BACKEND_URL}/bots/create`, data)
    return response
  }

  static async stopBot(botId: string): Promise<StopBotResponse> {
    const response = await ApiClient.post(
      `${BACKEND_URL}/bots/${botId}/stop`,
      {},
    )
    return response
  }

  static async getBotInfo(botId: string): Promise<BotInfo> {
    try {
      const response = await ApiClient.get(
        `${BACKEND_URL}/bots/${botId}/status`,
      )
      return response
    } catch (error) {
      console.error('Error fetching bot info:', error)
      // Return default if all fails
      return {
        id: botId,
        status: 'unknown',
        meeting_status: 'unknown',
        duration_seconds: 0,
        updated_at: new Date().toISOString(),
      }
    }
  }

  static async getRealTimeTranscript(
    botId: string,
  ): Promise<RealTimeTranscript> {
    try {
      // Use backend API
      const session = await ApiClient.get(
        `${BACKEND_URL}/sessions/by-bot/${botId}`,
      )

      if (session && session.id) {
        const transcripts = await ApiClient.get(
          `${BACKEND_URL}/transcripts/sessions/${session.id}/transcripts`,
        )

        return {
          session_id: session.id,
          bot_id: botId,
          transcripts: transcripts.transcripts || [],
          last_updated: new Date().toISOString(),
        }
      }
    } catch (error) {
      console.error('Error fetching real-time transcript:', error)
    }

    return {
      session_id: '',
      bot_id: botId,
      transcripts: [],
      last_updated: new Date().toISOString(),
    }
  }

  static async forceSaveTranscripts(
    sessionId: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await ApiClient.post(
      `${BACKEND_URL}/transcripts/sessions/${sessionId}/force-save`,
      {},
    )
    return response
  }
}
