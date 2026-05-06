'use client'

import React, { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import PageLayout from '@/components/layout/page-layout'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { VideoReviewPanel } from '@/components/sessions/video-review-panel'
import { useSessionReview } from '@/hooks/queries/use-session-review'
import { SessionService } from '@/services/session-service'
import { isPresignedUrlExpired } from '@/lib/presigned-url'
import { formatDate } from '@/lib/date-utils'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'

function pickVideoAnchor(
  recordingStartedAt: string | null | undefined,
  transcript: Array<{ timestamp: string }> | undefined,
  sessionStartedAt: string | null | undefined,
): string | null {
  if (recordingStartedAt) return recordingStartedAt
  return transcript?.[0]?.timestamp ?? sessionStartedAt ?? null
}

function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds || seconds <= 0) return null
  const m = Math.floor(seconds / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m`
  return `${m}m`
}

export default function SessionReviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useSessionReview(resolvedParams.sessionId)

  const handleRefreshVideoUrl = async () => {
    if (!data?.id) return
    try {
      await SessionService.refreshVideoUrl(data.id)
    } catch (err) {
      console.error('Failed to refresh video URL:', err)
      throw err
    } finally {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.review(data.id),
      })
    }
  }

  // Auto-refresh expired SigV4 URL on landing — same logic as the owner detail
  // page. Without this, recipients land on a dead URL and have to click
  // Refresh themselves.
  const autoRefreshedRef = useRef<string | null>(null)
  useEffect(() => {
    const sid = data?.id
    if (!sid) return
    if (autoRefreshedRef.current === sid) return
    if (data.video_unavailable) return
    if (!data.is_owner && !data.is_admin) return // only owner/admin can refresh
    const url = data.video_url
    if (!url || !isPresignedUrlExpired(url)) return
    autoRefreshedRef.current = sid
    handleRefreshVideoUrl().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id, data?.video_url, data?.video_unavailable])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-surface">
        <LoadingState
          message="Loading review..."
          variant="default"
          className="min-h-screen"
        />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-app-surface flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 border border-app-border">
          <EmptyState
            icon={AlertCircle}
            title="Session not available"
            description="This session may have been unshared, or you don't have access."
            action={{
              label: 'Back to shared',
              onClick: () => router.push('/sessions/shared'),
              icon: ArrowLeft,
            }}
            iconClassName="w-20 h-20 bg-app-surface"
          />
        </div>
      </div>
    )
  }

  const dateLabel = data.started_at ? formatDate(data.started_at) : null
  const durationLabel = formatDuration(data.duration_seconds)
  const metaParts = [data.coach_name, durationLabel, dateLabel].filter(
    Boolean,
  ) as string[]

  const backHref = data.is_owner ? '/sessions' : '/sessions/shared'
  const backLabel = data.is_owner ? 'Back to sessions' : 'Back to shared'

  return (
    <ProtectedRoute loadingMessage="Loading review...">
      <PageLayout>
        <div className="min-h-screen bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <button
                  onClick={() => router.push(backHref)}
                  className="text-sm text-app-secondary hover:text-app-primary transition-colors flex items-center gap-1 mb-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {backLabel}
                </button>
                <h1 className="text-xl font-semibold text-app-primary truncate">
                  {data.title || 'Session review'}
                </h1>
                {metaParts.length > 0 && (
                  <p className="text-sm text-app-secondary mt-1">
                    {metaParts.join(' · ')}
                  </p>
                )}
              </div>
            </div>

            <VideoReviewPanel
              sessionId={data.id}
              videoUrl={data.video_url}
              videoUnavailable={data.video_unavailable}
              videoAnchorAt={pickVideoAnchor(
                data.recording_started_at,
                data.transcript,
                data.started_at,
              )}
              transcript={data.transcript}
              isOwner={data.is_owner}
              onRefreshVideoUrl={handleRefreshVideoUrl}
            />
          </div>
        </div>
      </PageLayout>
    </ProtectedRoute>
  )
}
