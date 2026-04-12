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
}

export interface QuestionnaireValidation {
  valid: boolean
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
