import { ApiClient } from '@/lib/api-client'
import type {
  ScheduleSessionRequest,
  ScheduledSession,
  QuestionnaireValidation,
  QuestionnaireResponseView,
  QuestionnaireTokenResponse,
  StartBotResponse,
} from '@/types/questionnaire'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://coach-sidekick-backend-production.up.railway.app/api/v1'

export class QuestionnaireService {
  // ---- Authenticated (coach) ----

  static async scheduleSession(
    data: ScheduleSessionRequest,
  ): Promise<ScheduledSession> {
    return ApiClient.post(`${BACKEND_URL}/questionnaire/schedule`, data)
  }

  static async getUpcomingSessions(
    clientId?: string,
  ): Promise<ScheduledSession[]> {
    const params = clientId ? `?client_id=${clientId}` : ''
    return ApiClient.get(`${BACKEND_URL}/questionnaire/upcoming${params}`)
  }

  static async rescheduleSession(
    sessionId: string,
    scheduledFor: string,
  ): Promise<{ id: string; scheduled_for: string }> {
    return ApiClient.patch(
      `${BACKEND_URL}/questionnaire/sessions/${sessionId}/reschedule`,
      { scheduled_for: scheduledFor },
    )
  }

  static async sendQuestionnaire(
    sessionId: string,
    clientId: string,
  ): Promise<QuestionnaireTokenResponse> {
    return ApiClient.post(`${BACKEND_URL}/questionnaire/send`, {
      session_id: sessionId,
      client_id: clientId,
    })
  }

  static async getResponses(
    sessionId: string,
    clientId?: string,
  ): Promise<QuestionnaireResponseView[]> {
    const params = clientId ? `?client_id=${clientId}` : ''
    return ApiClient.get(
      `${BACKEND_URL}/questionnaire/sessions/${sessionId}/responses${params}`,
    )
  }

  static async startBot(
    sessionId: string,
    meetingUrl: string,
    botName?: string,
  ): Promise<StartBotResponse> {
    return ApiClient.post(
      `${BACKEND_URL}/questionnaire/sessions/${sessionId}/start-bot`,
      { meeting_url: meetingUrl, bot_name: botName },
    )
  }

  // ---- Public (no auth, raw fetch) ----

  static async validateToken(token: string): Promise<QuestionnaireValidation> {
    const res = await fetch(`${BACKEND_URL}/questionnaire/public/${token}`)
    if (!res.ok) {
      throw new Error('Questionnaire not found or expired')
    }
    return res.json()
  }

  static async saveAnswer(
    token: string,
    questionIndex: number,
    answer: string,
  ): Promise<void> {
    const res = await fetch(
      `${BACKEND_URL}/questionnaire/public/${token}/answer`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_index: questionIndex, answer }),
      },
    )
    if (!res.ok) {
      throw new Error('Failed to save answer')
    }
  }

  static async submitAll(
    token: string,
    answers: { question_index: number; answer: string }[],
  ): Promise<void> {
    const res = await fetch(
      `${BACKEND_URL}/questionnaire/public/${token}/submit`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      },
    )
    if (!res.ok) {
      throw new Error('Failed to submit questionnaire')
    }
  }

  static async completeQuestionnaire(token: string): Promise<void> {
    const res = await fetch(
      `${BACKEND_URL}/questionnaire/public/${token}/complete`,
      { method: 'POST' },
    )
    if (!res.ok) {
      throw new Error('Failed to complete questionnaire')
    }
  }
}
