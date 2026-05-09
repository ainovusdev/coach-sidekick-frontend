import { ApiClient } from '@/lib/api-client'
import type {
  CalendarAuthUrlResponse,
  CalendarConnectionStatus,
  CalendarSettingsUpdate,
} from '@/types/calendar'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://coach-sidekick-backend-production.up.railway.app/api/v1'

export class CalendarService {
  static async getStatus(): Promise<CalendarConnectionStatus> {
    return ApiClient.get(`${BACKEND_URL}/calendar/status`)
  }

  static async getAuthUrl(): Promise<CalendarAuthUrlResponse> {
    return ApiClient.get(`${BACKEND_URL}/calendar/google/auth-url`)
  }

  static async updateSettings(
    body: CalendarSettingsUpdate,
  ): Promise<CalendarConnectionStatus> {
    return ApiClient.patch(`${BACKEND_URL}/calendar/settings`, body)
  }

  static async disconnect(): Promise<{ disconnected: boolean }> {
    return ApiClient.post(`${BACKEND_URL}/calendar/disconnect`, {})
  }
}
