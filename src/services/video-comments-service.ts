import { ApiClient } from '@/lib/api-client'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://coach-sidekick-backend-production.up.railway.app/api/v1'

export interface VideoComment {
  id: string
  session_id: string
  author_id: string
  author_name: string | null
  author_email: string | null
  content: string
  video_offset_seconds: number
  parent_id: string | null
  created_at: string
  updated_at: string
}

export interface VideoCommentCreatePayload {
  content: string
  video_offset_seconds: number
  parent_id?: string | null
}

export interface VideoCommentUpdatePayload {
  content: string
}

export class VideoCommentsService {
  static list(sessionId: string): Promise<VideoComment[]> {
    return ApiClient.get(`${BACKEND_URL}/sessions/${sessionId}/comments`)
  }

  static create(
    sessionId: string,
    payload: VideoCommentCreatePayload,
  ): Promise<VideoComment> {
    return ApiClient.post(
      `${BACKEND_URL}/sessions/${sessionId}/comments`,
      payload,
    )
  }

  static update(
    sessionId: string,
    commentId: string,
    payload: VideoCommentUpdatePayload,
  ): Promise<VideoComment> {
    return ApiClient.patch(
      `${BACKEND_URL}/sessions/${sessionId}/comments/${commentId}`,
      payload,
    )
  }

  static delete(sessionId: string, commentId: string): Promise<void> {
    return ApiClient.delete(
      `${BACKEND_URL}/sessions/${sessionId}/comments/${commentId}`,
    )
  }
}
