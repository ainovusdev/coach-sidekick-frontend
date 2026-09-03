// In-app notifications — matches app/schemas/notification.py
export interface AppNotification {
  id: string
  type: string
  title: string
  message: string
  data: Record<string, unknown> & { url?: string; sandbox_id?: string }
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface NotificationList {
  items: AppNotification[]
  unread: number
  total: number
}
