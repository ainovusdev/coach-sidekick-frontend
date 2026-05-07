import { ApiClient } from '@/lib/api-client'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://coach-sidekick-backend-production.up.railway.app/api/v1'

// null encodes "Not Observed"; integers 1-4 are scores.
export type EvaluationScores = Record<string, number | null>

export interface CoachEvaluation {
  id: string
  session_id: string
  reviewer_id: string
  reviewer_name: string | null
  reviewer_email: string | null
  scores: EvaluationScores
  feedback: string | null
  created_at: string
  updated_at: string
}

export interface CoachEvaluationCreatePayload {
  scores: EvaluationScores
  feedback?: string | null
}

export interface CoachEvaluationUpdatePayload {
  scores?: EvaluationScores
  feedback?: string | null
}

export class CoachEvaluationsService {
  static list(sessionId: string): Promise<CoachEvaluation[]> {
    return ApiClient.get(`${BACKEND_URL}/sessions/${sessionId}/evaluations`)
  }

  static create(
    sessionId: string,
    payload: CoachEvaluationCreatePayload,
  ): Promise<CoachEvaluation> {
    return ApiClient.post(
      `${BACKEND_URL}/sessions/${sessionId}/evaluations`,
      payload,
    )
  }

  static update(
    sessionId: string,
    evaluationId: string,
    payload: CoachEvaluationUpdatePayload,
  ): Promise<CoachEvaluation> {
    return ApiClient.patch(
      `${BACKEND_URL}/sessions/${sessionId}/evaluations/${evaluationId}`,
      payload,
    )
  }

  static delete(sessionId: string, evaluationId: string): Promise<void> {
    return ApiClient.delete(
      `${BACKEND_URL}/sessions/${sessionId}/evaluations/${evaluationId}`,
    )
  }
}
