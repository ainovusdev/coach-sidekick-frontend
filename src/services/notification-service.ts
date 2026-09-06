/**
 * Notification Service — the in-app notification centre (the bell).
 * `X-Active-Client` goes with every call through ApiClient, so a coachee with
 * several profiles sees the active profile's rows plus the user-level ones.
 */
import { ApiClient } from '@/lib/api-client'
import type {
  NotificationList,
  NotificationSettings,
} from '@/types/notifications'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const BASE = `${BACKEND_URL}/notifications`

export class NotificationService {
  static list(unreadOnly = false, limit = 30): Promise<NotificationList> {
    return ApiClient.get(
      `${BASE}?limit=${limit}${unreadOnly ? '&unread_only=true' : ''}`,
    )
  }

  static unreadCount(): Promise<{ unread: number }> {
    return ApiClient.get(`${BASE}/unread-count`)
  }

  static markRead(id: string): Promise<{ updated: number; unread: number }> {
    return ApiClient.post(`${BASE}/${id}/read`, {})
  }

  static markAllRead(): Promise<{ updated: number; unread: number }> {
    return ApiClient.post(`${BASE}/read-all`, {})
  }

  static settings(): Promise<NotificationSettings> {
    return ApiClient.get(`${BASE}/settings`)
  }

  static updateSettings(emailEnabled: boolean): Promise<NotificationSettings> {
    return ApiClient.put(`${BASE}/settings`, { email_enabled: emailEnabled })
  }
}
