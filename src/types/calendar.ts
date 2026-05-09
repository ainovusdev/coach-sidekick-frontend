export interface CalendarConnectionStatus {
  connected: boolean
  provider?: string
  google_account_email?: string | null
  recall_status?: string | null
  title_prefix_filter?: string | null
  auto_send_questionnaire: boolean
  auto_deploy_bot: boolean
  last_sync_at?: string | null
  last_error?: string | null
}

export interface CalendarSettingsUpdate {
  title_prefix_filter?: string | null
  auto_send_questionnaire?: boolean
  auto_deploy_bot?: boolean
}

export interface CalendarAuthUrlResponse {
  auth_url: string
}
