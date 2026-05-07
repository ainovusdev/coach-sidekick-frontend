import { useQuery } from '@tanstack/react-query'
import { VideoCommentsService } from '@/services/video-comments-service'
import { queryKeys } from '@/lib/query-client'

export function useVideoComments(sessionId: string | null | undefined) {
  return useQuery({
    queryKey: sessionId
      ? queryKeys.videoComments.list(sessionId)
      : ['video-comments', 'disabled'],
    queryFn: () => VideoCommentsService.list(sessionId as string),
    enabled: !!sessionId,
    staleTime: 30 * 1000,
  })
}
