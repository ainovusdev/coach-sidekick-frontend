import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { CommentService } from '@/services/comment-service'
import type {
  Comment,
  CommentListResponse,
  CommentTargetType,
} from '@/types/comment'

interface UseCommentsOptions {
  enabled?: boolean
  /**
   * Thread already embedded in a parent payload (the commitment detail carries
   * `comments`). Shown at once, then refreshed — the list endpoint is the truth
   * for `can_comment`.
   */
  initialData?: Comment[]
}

/** The threaded comments on one target. */
export function useComments(
  targetType: CommentTargetType,
  targetId: string | null | undefined,
  { enabled = true, initialData }: UseCommentsOptions = {},
) {
  return useQuery<CommentListResponse>({
    queryKey: queryKeys.comments.list(targetType, targetId ?? ''),
    queryFn: () => CommentService.list(targetType, targetId as string),
    enabled: enabled && !!targetId,
    initialData:
      initialData && targetId
        ? {
            target_type: targetType,
            target_id: targetId,
            can_comment: true,
            comments: initialData,
          }
        : undefined,
    // Embedded data is only a head start — always confirm with the server.
    initialDataUpdatedAt: 0,
    staleTime: 15 * 1000,
  })
}
