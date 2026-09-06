// In-app notifications — matches app/schemas/notification.py
export interface AppNotification {
  id: string
  type: string
  title: string
  message: string
  data: Record<string, unknown> & { url?: string; sandbox_id?: string }
  is_read: boolean
  read_at: string | null
  /** when the email half went out; null = switched off, no address, or failed */
  emailed_at: string | null
  created_at: string
}

export interface NotificationList {
  items: AppNotification[]
  unread: number
  total: number
}

/** The person's own switch for the email half. The in-app row is always written. */
export interface NotificationSettings {
  email_enabled: boolean
  email: string | null
}
