export interface ScheduleSessionRequest {
  client_id: string
  scheduled_for: string // ISO datetime
  title?: string
  meeting_url?: string
  send_questionnaire?: boolean
  /**
   * Which sandbox agreement this session credits, when the coachee is in more
   * than one and the coach chose. Sent together or not at all; without them the
   * session waits in review and counts toward nothing.
   */
  sandbox_id?: string
  sandbox_group_id?: string
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

export type QuestionnaireKind =
  | 'pre_session'
  | 'post_session'
  | 'coach_reflection'
export type QuestionType =
  | 'text'
  | 'scale'
  | 'yes_no'
  | 'choice'
  | 'date'
  | 'list'

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
  /** `choice` options. */
  options?: string[] | null
  /** The helper line under the question. */
  hint?: string | null
  /** The coachee a per-coachee question is about, when there is more than one. */
  section?: string | null
  /** What one entry of a `list` is called, e.g. "Win". */
  item_label?: string | null
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
  /** Group sessions only: one entry per coachee who was in the room. */
  participants?: ThrillFormStatusView[]
}

export interface CoachReflectionAnswer {
  key: string | null
  question_text: string
  answer: string
  subject_client_id: string | null
  subject_name: string | null
}

/** The coach's half of the post-session pair. Sandbox sessions only. */
export interface CoachReflectionView {
  /** False for a session that credits no sandbox: the page shows nothing. */
  applicable: boolean
  status: 'not_sent' | 'sent' | 'completed'
  sent_at: string | null
  completed_at: string | null
  subjects: { client_id: string; name: string }[]
  responses: CoachReflectionAnswer[]
  wins: string[]
  /** A bearer link, given to the session's coach alone until it is filled in. */
  fill_url: string | null
}

export type PreSessionStatus = 'not_started' | 'in_progress' | 'completed'

export interface PreSessionPrep {
  session: {
    id: string
    title: string | null
    scheduled_for: string | null
    meeting_url: string | null
  } | null
  questions: QuestionItem[]
  existing_answers: QuestionAnswerPair[]
  status: PreSessionStatus
}

export interface QuestionnaireTokenResponse {
  token: string
  questionnaire_url: string
  expires_at: string
}

export interface StartBotResponse {
  id: string
  session_id: string
}
