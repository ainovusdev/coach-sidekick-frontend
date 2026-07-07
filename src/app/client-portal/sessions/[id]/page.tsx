'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChevronLeft,
  Clock,
  Users,
  BarChart3,
  LayoutList,
  Smile,
  Meh,
  Frown,
  Video,
} from 'lucide-react'
import { formatDate, formatRelativeTime } from '@/lib/date-utils'
import { useClientSessionDetail } from '@/hooks/queries/use-client-sessions'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { ClientSessionOverview } from './components/client-session-overview'
import { ClientSessionAnalysis } from './components/client-session-analysis'
import { VideoPlayer } from '@/components/sessions/video-player'

export default function ClientSessionDetailPage() {
  const params = useParams()
  const sessionId = params.id as string

  const {
    data: sessionData,
    isLoading,
    error,
    refetch,
  } = useClientSessionDetail(sessionId)

  const { data: commitmentData, refetch: refetchCommitments } = useCommitments(
    { session_id: sessionId },
    { enabled: !!sessionId },
  )
  const structuredCommitments = commitmentData?.commitments ?? []

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14">
        <Skeleton className="h-5 w-24 mb-4" />
        <Skeleton className="h-4 w-56 mb-2" />
        <Skeleton className="h-9 w-2/3 mb-3" />
        <Skeleton className="h-4 w-1/3 mb-7" />
        <Skeleton className="h-28 w-full rounded-xl mb-4" />
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !sessionData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14">
        <div className="text-center py-12">
          <p className="text-ink-3 mb-4">
            {error instanceof Error ? error.message : 'Session not found'}
          </p>
          <Link href="/client-portal/sessions">
            <Button variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Sessions
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const session = sessionData.session
  const hasInsights = sessionData.insights != null
  const hasRecording = !!session.video_url || !!session.video_unavailable
  const sentimentScore = sessionData.insights?.sentiment?.score
  const sentimentLabel = sessionData.insights?.sentiment?.overall

  const getSentimentIcon = () => {
    if (sentimentScore == null) return null
    if (sentimentScore >= 7)
      return <Smile className="h-3.5 w-3.5 text-forest" />
    if (sentimentScore >= 4)
      return <Meh className="h-3.5 w-3.5 text-amber-token" />
    return <Frown className="h-3.5 w-3.5 text-ink-4" />
  }

  const getSentimentPillClass = () => {
    if (sentimentScore == null) return ''
    if (sentimentScore >= 7) return 'bg-forest-bg text-forest'
    if (sentimentScore >= 4) return 'bg-amber-token-bg text-amber-token'
    return 'bg-surface-3 text-ink-3'
  }

  const startedAt = session.started_at
  const headerLine = startedAt
    ? `${formatDate(startedAt, 'EEEE')} · ${formatDate(startedAt, 'MMMM d')} · ${
        session.duration_minutes || 0
      } minutes`
    : 'Session Details'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14">
      {/* Editorial back link */}
      <Link
        href="/client-portal/sessions"
        className="inline-flex items-center gap-1 text-[12px] font-medium text-ink-3 hover:text-ink mb-4"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        All sessions
      </Link>

      {/* Editorial hero */}
      <div className="mb-7">
        <p className="text-[12px] font-medium text-ink-3 mb-1">{headerLine}</p>
        <h1 className="text-[30px] font-bold tracking-tight leading-[1.2] text-ink m-0">
          {session.summary
            ? session.summary.split(/[.!?]/)[0]?.trim() || 'Session recap'
            : 'Session recap'}
        </h1>
        <p className="text-[13px] text-ink-3 mt-1.5">
          {session.coach ? (
            <>
              A check-in with{' '}
              <b className="font-medium text-ink-2">{session.coach.name}</b>
            </>
          ) : (
            <>{startedAt && formatRelativeTime(startedAt)}</>
          )}
        </p>

        {/* Quiet meta row */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="inline-flex items-center gap-1.5 h-[22px] px-2 rounded-md bg-surface-3 text-ink-2 text-[11px] font-medium capitalize">
            {session.status}
          </span>
          {sentimentScore != null && (
            <span
              className={`inline-flex items-center gap-1.5 h-[22px] px-2 rounded-md text-[11px] font-medium ${getSentimentPillClass()}`}
            >
              {getSentimentIcon()}
              {sentimentLabel} · {sentimentScore.toFixed(1)}
            </span>
          )}
          {session.is_group_session && (
            <span className="inline-flex items-center gap-1.5 h-[22px] px-2 rounded-md bg-indigo-bg text-indigo text-[11px] font-medium">
              <Users className="h-3 w-3" />
              Group session
            </span>
          )}
          {(session.key_topics?.length ?? 0) > 0 && (
            <span className="font-mono text-[11px] text-ink-3">
              {session.key_topics?.length} topics
            </span>
          )}
          {(structuredCommitments.length || session.action_items?.length || 0) >
            0 && (
            <span className="font-mono text-[11px] text-ink-3">
              {structuredCommitments.length ||
                session.action_items?.length ||
                0}{' '}
              commitments
            </span>
          )}
        </div>
      </div>

      {/* Processing Notice */}
      {session.status === 'processing' &&
        !session.summary &&
        !sessionData.transcript?.length &&
        !hasInsights && (
          <div className="mb-6 p-4 bg-surface-2 border border-line rounded-[10px] flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-surface-3 flex items-center justify-center animate-pulse">
              <Clock className="h-4 w-4 text-ink-3" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-ink m-0">
                Session processing
              </p>
              <p className="text-[12px] text-ink-3 m-0">
                Details will appear once processing is complete.
              </p>
            </div>
          </div>
        )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 bg-surface-2 border border-line">
          <TabsTrigger value="overview" className="gap-2 text-[13px]">
            <LayoutList className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            className="gap-2 text-[13px]"
            disabled={!hasInsights}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Insights & Analysis
          </TabsTrigger>
          {hasRecording && (
            <TabsTrigger value="recording" className="gap-2 text-[13px]">
              <Video className="h-3.5 w-3.5" />
              Recording
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <ClientSessionOverview
            sessionData={sessionData}
            sessionId={sessionId}
            commitments={structuredCommitments}
            onRefetchCommitments={() => refetchCommitments()}
          />
        </TabsContent>

        <TabsContent value="analysis">
          <ClientSessionAnalysis sessionData={sessionData} />
        </TabsContent>

        {hasRecording && (
          <TabsContent value="recording">
            <VideoPlayer
              videoUrl={session.video_url}
              sessionId={sessionId}
              videoUnavailable={session.video_unavailable}
              onRefresh={async () => {
                await refetch()
              }}
              getDownloadUrl={async () => session.video_download_url ?? null}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Empty State */}
      {!session.summary &&
        (!session.action_items || session.action_items.length === 0) &&
        !sessionData.transcript?.length &&
        !sessionData.tasks?.length &&
        !hasInsights && (
          <div className="mt-6 text-center py-16 bg-surface-1 rounded-[10px] border border-line">
            <div className="h-14 w-14 bg-surface-3 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="h-6 w-6 text-ink-4" />
            </div>
            <h3 className="text-[15px] font-medium text-ink mb-1">
              Session details coming soon
            </h3>
            <p className="text-[13px] text-ink-3 max-w-md mx-auto">
              This session is still being processed. Check back soon for the
              full summary, transcript, and insights.
            </p>
          </div>
        )}
    </div>
  )
}
