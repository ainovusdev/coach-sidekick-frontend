/**
 * Comment Service — the generic `/comments` API (see SANDBOX.html + plan).
 */

import { ApiClient } from '@/lib/api-client'
import type {
  Comment,
  CommentCreate,
  CommentListResponse,
  CommentTargetType,
  CommentUpdate,
} from '@/types/comment'

const BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/comments`

export class CommentService {
  /** Threaded list (top-level oldest first, each with `replies`) + `can_comment`. */
  static async list(
    targetType: CommentTargetType,
    targetId: string,
  ): Promise<CommentListResponse> {
    const params = new URLSearchParams({
      target_type: targetType,
      target_id: targetId,
    })
    return ApiClient.get(`${BASE}?${params.toString()}`)
  }

  static async create(data: CommentCreate): Promise<Comment> {
    return ApiClient.post(BASE, data)
  }

  static async update(id: string, data: CommentUpdate): Promise<Comment> {
    return ApiClient.patch(`${BASE}/${id}`, data)
  }

  /** Soft delete — the server keeps the row with `deleted_at` set. */
  static async remove(id: string): Promise<void> {
    await ApiClient.delete(`${BASE}/${id}`)
  }
}
