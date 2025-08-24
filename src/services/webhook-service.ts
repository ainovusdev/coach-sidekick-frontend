import { ApiClient } from '@/lib/api-client'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface WebhookEvent {
  event: string
  data: {
    bot_id: string
    status?: string
    recording?: any
    transcript?: {
      id: string
      speaker: string
      words: Array<{
        text: string
        start: number
        end: number
      }>
      timestamp?: string
      is_final?: boolean
    }
  }
}

export interface WebhookResponse {
  success: boolean
  message?: string
  processed?: {
    event_type: string
    bot_id: string
    transcript_saved?: boolean
  }
}

export class WebhookService {
  static async processWebhookEvent(
    event: WebhookEvent,
  ): Promise<WebhookResponse> {
    // Forward webhook event to backend
    const response = await ApiClient.post(
      `${BACKEND_URL}/webhooks/recall/transcript`,
      event,
    )
    return response
  }

  static async verifyWebhookSignature(
    signature: string,
    payload: string,
  ): Promise<boolean> {
    try {
      const response = await ApiClient.post(`${BACKEND_URL}/webhooks/verify`, {
        signature,
        payload,
      })
      return response.valid === true
    } catch (error) {
      console.error('Failed to verify webhook signature:', error)
      return false
    }
  }
}
