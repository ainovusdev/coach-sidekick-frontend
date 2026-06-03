export interface ScheduleSessionRequest {
  client_id: string
  scheduled_for: string // ISO datetime
  title?: string
  meeting_url?: string
  send_questionnaire?: boolean
}

export interface ScheduledSession {
  id: string
  coach_id: string
  client_id: string | null
  client_name: string | null
  title: string | null
  meeting_url: string | null
  status: string
  scheduled_for: string | null
  questionnaire_sent: boolean
  questionnaire_completed: boolean
  created_at: string
  google_calendar_event_id?: string | null
}

export type QuestionnaireKind = 'pre_session' | 'post_session'
export type QuestionType = 'text' | 'scale' | 'yes_no'

export interface QuestionCondition {
  depends_on: number
  show_if?: string
  show_if_not?: string
}

export interface QuestionnaireValidation {
  valid: boolean
  kind?: QuestionnaireKind
  client_name: string
  coach_name: string
  session_title: string | null
  scheduled_for: string | null
  questions: QuestionItem[]
  existing_answers: QuestionnaireAnswerItem[]
}

export interface QuestionItem {
  index: number
  text: string
  type?: QuestionType
  optional?: boolean
  scale_min?: number | null
  scale_max?: number | null
  scale_min_label?: string | null
  scale_max_label?: string | null
  condition?: QuestionCondition | null
}

export interface QuestionnaireAnswerItem {
  question_index: number
  answer: string
}

export interface QuestionnaireResponseView {
  client_id: string
  client_name: string
  responses: QuestionAnswerPair[]
  status: string
  completed_at: string | null
}

export interface QuestionAnswerPair {
  question_index: number
  question_text: string
  answer: string
}

export type ThrillFormStatus = 'not_sent' | 'sent' | 'in_progress' | 'completed'

export interface ThrillFormStatusView {
  status: ThrillFormStatus
  sent_at: string | null
  completed_at: string | null
  client_id: string | null
  client_name: string | null
  responses: QuestionAnswerPair[]
}

export interface QuestionnaireTokenResponse {
  token: string
  questionnaire_url: string
  expires_at: string
}

export interface StartBotRequest {
  meeting_url: string
  bot_name?: string
}

export interface StartBotResponse {
  id: string
  session_id: string
}
