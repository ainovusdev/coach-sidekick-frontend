'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertCircle, ClipboardCheck } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import PageLayout from '@/components/layout/page-layout'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { VideoReviewPanel } from '@/components/sessions/video-review-panel'
import { CoachEvaluationDialog } from '@/components/sessions/coach-evaluation-dialog'
import { EvaluationsList } from '@/components/sessions/evaluations-list'
import { useSessionReview } from '@/hooks/queries/use-session-review'
import { useCoachEvaluations } from '@/hooks/queries/use-coach-evaluations'
import { SessionService } from '@/services/session-service'
import { isPresignedUrlExpired } from '@/lib/presigned-url'
import { formatDate } from '@/lib/date-utils'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { useAuth } from '@/contexts/auth-context'

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
  const { userId } = useAuth()
  const [evalDialogOpen, setEvalDialogOpen] = useState(false)

  const { data, isLoading, error } = useSessionReview(resolvedParams.sessionId)
  const { data: evaluations = [] } = useCoachEvaluations(data?.id, {
    enabled: !!data?.id,
  })

  const myEvaluation = useMemo(
    () => evaluations.find(e => e.reviewer_id === userId) ?? null,
    [evaluations, userId],
  )

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
        <div className="text-center max-w-md mx-auto bg-surface-1 rounded-lg shadow-sm p-8 border border-app-border">
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
        <div className="min-h-screen bg-surface-1 ">
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
              <div className="shrink-0">
                <Button
                  type="button"
                  variant={myEvaluation ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => setEvalDialogOpen(true)}
                >
                  <ClipboardCheck className="h-4 w-4 mr-1.5" />
                  {myEvaluation
                    ? 'View / edit your evaluation'
                    : 'Evaluate session'}
                </Button>
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
              transcriptCollapsedByDefault
            />

            {(data.is_owner || data.is_admin) && (
              <EvaluationsList
                sessionId={data.id}
                evaluations={evaluations}
                currentUserId={userId}
                isAdmin={data.is_admin}
              />
            )}
          </div>
        </div>

        <CoachEvaluationDialog
          sessionId={data.id}
          open={evalDialogOpen}
          onOpenChange={setEvalDialogOpen}
          existingEvaluation={myEvaluation}
        />
      </PageLayout>
    </ProtectedRoute>
  )
}
