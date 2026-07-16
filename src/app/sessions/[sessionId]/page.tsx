'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import PageLayout from '@/components/layout/page-layout'
import { usePermissions } from '@/contexts/permission-context'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  Brain,
  FileText,
  Sparkles,
  LayoutGrid,
  Plus,
  StickyNote,
  Video,
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
import { Card, CardContent } from '@/components/ui/card'
import { MediaUploader } from '@/components/sessions/media-uploader'
import SessionHeader from './components/session-header'
import { SessionHeroCard } from './components/session-hero-card'
import { SessionOverviewTab } from './components/session-overview-tab'
import { SessionAnalysisMerged } from './components/session-analysis-merged'
import { SessionProficiencyAnalysis } from './components/session-proficiency-analysis'
import { VideoReviewPanel } from '@/components/sessions/video-review-panel'
import { EvaluationsList } from '@/components/sessions/evaluations-list'
import { useCoachEvaluations } from '@/hooks/queries/use-coach-evaluations'
import { useFeatureFlagEnabled } from '@/hooks/use-feature-flag'
import { useAuth } from '@/contexts/auth-context'
import { isPresignedUrlExpired } from '@/lib/presigned-url'
import { GroupParticipantBar } from './components/group-participant-bar'
import { QuickNote } from '@/components/session-notes/quick-note'
import {
  AnalysisService,
  type FullAnalysisResponse,
} from '@/services/analysis-service'
import { SessionService } from '@/services/session-service'
import { StartBotCard } from './components/start-bot-card'
import { AnalysisPrintView } from './components/analysis-print-view'
import { PreSessionResponses } from './components/pre-session-responses'
import { CommitmentCreatePanel } from '@/components/commitments/commitment-create-panel'
import { CommitmentDetailPanel } from '@/components/commitments/commitment-detail-panel'
import { toast } from '@/hooks/use-toast'
import { useSessionDetails } from '@/hooks/queries/use-session-details'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { useOptionalProcessing } from '@/contexts/processing-context'
import { websocketService } from '@/services/websocket-service'

/**
 * Choose the wall-clock time that maps to t=0 of the recording.
 *
 * `recording_started_at` is when the Recall.ai bot started capturing video
 * (when it fires, the video file's t=0 is at this moment). It is the
 * authoritative anchor when present. Some transcripts may fire a few seconds
 * BEFORE this — those are partial captures from before recording actually
 * began, and the synced-transcript hook is responsible for dropping them so
 * they don't appear ahead of the video.
 *
 * Fall back to the first transcript timestamp when recording_started_at is
 * missing, and to session.started_at as a last resort (least reliable —
 * it's when the DB row was created, ~60-90s before the bot actually joined).
 */
function pickVideoAnchor(
  recordingStartedAt: string | null | undefined,
  transcript: Array<{ timestamp: string; is_partial?: boolean }> | undefined,
  sessionStartedAt: string | null | undefined,
): string | null {
  if (recordingStartedAt) return recordingStartedAt
  const firstFinal = transcript?.find(t => !t.is_partial)?.timestamp
  return firstFinal ?? transcript?.[0]?.timestamp ?? sessionStartedAt ?? null
}

export default function SessionDetailsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const router = useRouter()
  const permissions = usePermissions()
  const isViewer = permissions.isViewer()
  const isAdmin = permissions.isAdmin() || permissions.isSuperAdmin()
  // Proficiency Ladder rubric visibility is gated by a PostHog feature flag
  // rather than by role, so access can be rolled out without a deploy.
  const showProficiency = useFeatureFlagEnabled('proficiency-rubric')
  const { userId: currentUserId } = useAuth()
  const resolvedParams = React.use(params)
  const queryClient = useQueryClient()
  const { data: evaluations = [] } = useCoachEvaluations(
    resolvedParams.sessionId,
  )

  // Use TanStack Query for instant caching.
  //
  // Phase 1.6: when this session has an auto-deployed bot waiting to join
  // (status='scheduled' AND bot_id is set), poll so we can auto-redirect to
  // the live page the moment the bot's status flips. For all other states
  // (manual sessions with no bot_id, already-active, completed, etc.) we
  // don't poll — TanStack Query's refetchInterval=false skips it.
  const {
    data: sessionData,
    isLoading: loading,
    error: queryError,
  } = useSessionDetails(resolvedParams.sessionId, {
    refetchInterval: query => {
      const s: any = (query.state.data as any)?.session
      if (!s || s.status !== 'scheduled' || !s.bot_id) return false
      if (!s.scheduled_for) return 30_000
      const startMs = new Date(s.scheduled_for).getTime()
      const fiveMin = 5 * 60 * 1000
      return startMs - Date.now() <= fiveMin ? 10_000 : 30_000
    },
  })
  const error = queryError ? String(queryError) : null

  // Phase 1.6: once an auto-deployed bot joins, the bot.in_call_recording
  // webhook flips the session to status='active' on the backend. Detect
  // that here and bounce the coach over to the live transcript page.
  // Replace (not push) so the back button doesn't trap them on the stale
  // pre-session view. Guarded so we don't redirect repeatedly.
  const liveRedirectFiredRef = useRef(false)
  useEffect(() => {
    const s: any = (sessionData as any)?.session
    if (!s) return
    if (liveRedirectFiredRef.current) return
    if (s.status === 'active' && s.bot_id) {
      liveRedirectFiredRef.current = true
      router.replace(`/meeting/${s.bot_id}`)
    }
  }, [sessionData, router])

  // Share recipients land on the owner URL (`/sessions/[id]`) but `/details`
  // is owner-only. On a /details error, probe /review — if accessible and
  // we're not the owner, redirect to the narrow review surface.
  const reviewProbedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!queryError) return
    const sid = resolvedParams.sessionId
    if (reviewProbedRef.current === sid) return
    reviewProbedRef.current = sid
    let cancelled = false
    ;(async () => {
      try {
        const review = await SessionService.getSessionReview(sid)
        if (cancelled) return
        if (!review.is_owner) {
          router.replace(`/sessions/${sid}/review`)
        }
      } catch {
        // /review also failed — leave the existing not-found UI alone.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [queryError, resolvedParams.sessionId, router])

  // Group session state
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const isGroupSession = sessionData?.session?.is_group_session ?? false
  const groupParticipants = sessionData?.session?.participants ?? []

  // Extract client_id from session (might be nested)
  // For group sessions with a selected participant, use that participant's client_id
  const baseClientId =
    sessionData?.session?.client_id || sessionData?.session?.client?.id
  const clientId = isGroupSession
    ? (selectedClientId ?? baseClientId)
    : baseClientId

  // Fetch commitments for this specific session only
  const { data: commitmentsData } = useCommitments(
    {
      session_id: resolvedParams.sessionId,
      include_drafts: true,
    },
    { enabled: !!resolvedParams.sessionId },
  )

  // Helper to refresh commitments and wins from cache
  const refreshCommitments = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })
    queryClient.invalidateQueries({
      queryKey: ['wins', 'session', resolvedParams.sessionId],
    })
  }

  // Auto-refresh when background processing completes
  const processing = useOptionalProcessing()
  const processingSession = processing?.processingSessions.get(
    resolvedParams.sessionId,
  )

  useEffect(() => {
    const unsub = websocketService.on(
      'session:processing_complete',
      (data: any) => {
        if (data.session_id === resolvedParams.sessionId) {
          // Refresh all session data without hard reload
          queryClient.invalidateQueries({
            queryKey: queryKeys.sessions.detail(resolvedParams.sessionId),
          })
          queryClient.invalidateQueries({
            queryKey: queryKeys.sessions.all,
          })
        }
      },
    )
    return unsub
  }, [resolvedParams.sessionId, queryClient])

  // Also auto-refresh when ProcessingContext detects completion (polling fallback)
  const prevProcessingStatus = useRef(processingSession?.status)
  useEffect(() => {
    if (
      prevProcessingStatus.current === 'processing' &&
      processingSession?.status === 'completed'
    ) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(resolvedParams.sessionId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.all,
      })
    }
    prevProcessingStatus.current = processingSession?.status
  }, [processingSession?.status, resolvedParams.sessionId, queryClient])

  // Analysis state (unified)
  const [analysisData, setAnalysisData] = useState<FullAnalysisResponse | null>(
    null,
  )
  const [analyzing, setAnalyzing] = useState(false)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [autoTriggered, setAutoTriggered] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  // Client analysis state (group sessions)
  const [generatingClientAnalysis, setGeneratingClientAnalysis] =
    useState(false)

  // Commitments state (now from TanStack Query cache)
  const [showCommitmentCreatePanel, setShowCommitmentCreatePanel] =
    useState(false)
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<
    string | null
  >(null)

  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Email state
  const [sendingEmail, setSendingEmail] = useState(false)

  // UI state
  const [showQuickNote, setShowQuickNote] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showUploaderForScheduled, setShowUploaderForScheduled] =
    useState(false)

  // Auto-trigger analysis
  React.useEffect(() => {
    const loadAndAutoTriggerAnalysis = async () => {
      if (!sessionData?.session?.id || autoTriggered) return

      setLoadingAnalysis(true)
      try {
        // Load analysis using new unified endpoint
        const existingAnalysis = await AnalysisService.getAnalysis(
          sessionData.session.id,
        )

        if (existingAnalysis) {
          setAnalysisData(existingAnalysis)
        }

        // Auto-trigger analysis if:
        // 1. No analysis exists
        // 2. Session has transcripts
        // 3. Session is not still processing
        // 4. Not a viewer
        // 5. Haven't already auto-triggered
        const hasTranscripts =
          sessionData.transcript && sessionData.transcript.length > 0
        const isSessionComplete =
          sessionData.session.status === 'completed' ||
          sessionData.session.transcription_status === 'completed'
        const needsAnalysis = !existingAnalysis

        if (hasTranscripts && isSessionComplete && needsAnalysis && !isViewer) {
          setAutoTriggered(true)
          setLoadingAnalysis(false) // Stop loading before triggering
          // Trigger analysis automatically
          await triggerAnalysisWithProgress()
        } else {
          setLoadingAnalysis(false)
        }
      } catch (error) {
        console.error('Failed to load analysis:', error)
        setLoadingAnalysis(false)
      }
    }
    loadAndAutoTriggerAnalysis()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData?.session?.id, autoTriggered, isViewer])

  // Trigger unified analysis with progress
  const triggerAnalysisWithProgress = async () => {
    if (!sessionData?.session?.id) return

    setAnalyzing(true)
    setAnalysisProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      // Run unified analysis
      const fullAnalysis = await AnalysisService.triggerAnalysis(
        sessionData.session.id,
      )

      clearInterval(progressInterval)
      setAnalysisProgress(100)

      setAnalysisData(fullAnalysis)

      toast({
        title: 'Analysis Complete',
        description:
          'Session insights and coaching metrics have been generated successfully.',
      })
    } catch (error) {
      // ApiClient already shows error toast, just log it
      console.error('Analysis failed:', error)
    } finally {
      setAnalyzing(false)
      setTimeout(() => setAnalysisProgress(0), 1000)
    }
  }

  // Delete session handler
  const handleDeleteSession = async () => {
    if (!sessionData?.session?.id) return

    setDeleting(true)
    try {
      await SessionService.deleteSession(sessionData.session.id)
      toast({
        title: 'Session Deleted',
        description: 'The session and all associated data have been deleted.',
      })
      // Navigate to client profile if client exists, otherwise sessions list
      if (clientId) {
        router.push(`/clients/${clientId}`)
      } else {
        router.push('/sessions')
      }
    } catch (error) {
      // ApiClient already shows error toast, just log it
      console.error('Failed to delete session:', error)
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // Download transcript handler
  const handleDownloadTranscript = () => {
    if (!sessionData?.transcript || sessionData.transcript.length === 0) return

    const sessionDate = formatDate(
      sessionData.session.started_at || sessionData.session.created_at,
    )
    const fileDate = formatDate(
      sessionData.session.started_at || sessionData.session.created_at,
      'yyyy-MM-dd',
    )

    const lines: string[] = [
      'Session Transcript',
      `Session: ${sessionDate}`,
      '---',
      '',
    ]

    for (const entry of sessionData.transcript) {
      const time = entry.timestamp
        ? formatDate(entry.timestamp, 'HH:mm:ss')
        : ''
      lines.push(`[${time}] ${entry.speaker}:`)
      lines.push(entry.text)
      lines.push('')
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Session_${fileDate}_Transcript.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Send summary email handler
  const handleSendSummaryEmail = async () => {
    if (!sessionData?.session?.id) return

    setSendingEmail(true)
    try {
      const result = await SessionService.sendSummaryEmail(
        sessionData.session.id,
      )
      toast({
        title: 'Email Sent Successfully',
        description: `Session summary sent to ${result.sent_to}`,
      })
    } catch (error) {
      // ApiClient already shows error toast, just log it
      console.error('Failed to send email:', error)
    } finally {
      setSendingEmail(false)
    }
  }

  // Generate per-client analysis for group sessions
  const handleGenerateClientAnalysis = async () => {
    if (!sessionData?.session?.id || !selectedClientId) return

    setGeneratingClientAnalysis(true)
    try {
      await SessionService.generateClientAnalysis(
        sessionData.session.id,
        selectedClientId,
      )
      // Invalidate session details to refetch with new client_analyses
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(sessionData.session.id),
      })
      toast({
        title: 'Analysis Generated',
        description:
          'Personalized analysis has been generated for this participant.',
      })
    } catch (error) {
      console.error('Failed to generate client analysis:', error)
    } finally {
      setGeneratingClientAnalysis(false)
    }
  }

  // Refresh video URL handler
  const handleRefreshVideoUrl = async () => {
    if (!sessionData?.session?.id) return

    try {
      await SessionService.refreshVideoUrl(sessionData.session.id)
    } catch (error) {
      console.error('Failed to refresh video URL:', error)
      throw error // Re-throw so VideoPlayer can handle the error state
    } finally {
      // Refetch either way: on success to pick up the new presigned URL,
      // on failure to pick up the `video_unavailable` flag the backend
      // writes when Recall.ai no longer has the file.
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(sessionData.session.id),
      })
    }
  }

  // Auto-refresh an expired presigned video URL exactly once per landing.
  // Without this, the user has to click "Refresh" themselves before they can
  // play a recording older than the URL's 7-day signed window.
  const autoRefreshedSessionRef = useRef<string | null>(null)
  useEffect(() => {
    const sid = sessionData?.session?.id
    if (!sid) return
    if (autoRefreshedSessionRef.current === sid) return
    if (isViewer) return
    if (sessionData?.session?.video_unavailable) return
    const url = sessionData?.session?.video_url
    if (!url || !isPresignedUrlExpired(url)) return

    autoRefreshedSessionRef.current = sid
    handleRefreshVideoUrl().catch(() => {
      // Errors are already toasted/logged inside handleRefreshVideoUrl;
      // swallowing here keeps the effect from triggering React error boundary.
    })
    // We intentionally don't include handleRefreshVideoUrl in deps —
    // it's stable enough and we guard against re-runs via the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sessionData?.session?.id,
    sessionData?.session?.video_url,
    sessionData?.session?.video_unavailable,
    isViewer,
  ])

  if (loading) {
    return (
      <div className="min-h-screen bg-app-surface">
        <LoadingState
          message="Loading session details..."
          variant="default"
          className="min-h-screen"
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-app-surface flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto bg-surface-1 rounded-lg shadow-sm p-8 border border-app-border">
          <EmptyState
            icon={AlertCircle}
            title="Error Loading Session"
            description={error}
            action={{
              label: 'Go Back',
              onClick: () => router.back(),
              icon: ArrowLeft,
            }}
            secondaryAction={{
              label: 'Try Again',
              onClick: () => window.location.reload(),
              variant: 'outline',
            }}
            iconClassName="w-20 h-20 bg-app-surface"
          />
        </div>
      </div>
    )
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-app-surface flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-app-primary">
            Session not found
          </h1>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const { session, transcript, meeting_summary } = sessionData

  // Show upload option for any session that needs transcripts
  const hasTranscripts = transcript && transcript.length > 0
  const transcriptsExist =
    hasTranscripts ||
    (meeting_summary?.total_transcript_entries &&
      meeting_summary.total_transcript_entries > 0)
  const isPendingUpload = session.status === 'pending_upload'
  const isProcessing = session.transcription_status === 'processing'
  // A session is "scheduled" (show StartBotCard) if:
  // - status is explicitly "scheduled", OR
  // - it was originally scheduled (has scheduled_for) and has no transcripts yet
  //   (covers the case where a previous bot was kicked/failed)
  const isScheduled =
    session.status === 'scheduled' ||
    (session.scheduled_for && !transcriptsExist && !isProcessing)
  const needsUpload =
    (isPendingUpload || !transcriptsExist) && !isProcessing && !isScheduled

  return (
    <ProtectedRoute loadingMessage="Loading session details...">
      <PageLayout>
        <div className="min-h-screen bg-surface-1 ">
          {/* Header */}
          <SessionHeader
            session={session}
            onBack={() => {
              // Navigate to client profile if client exists, otherwise go back
              if (clientId) {
                router.push(`/clients/${clientId}`)
              } else {
                router.push('/sessions')
              }
            }}
            onDelete={!isViewer ? () => setShowDeleteDialog(true) : undefined}
            onTitleUpdate={newTitle => {
              // Update the query cache so the title change is reflected everywhere
              // Must include 'full-details' suffix to match useSessionDetails query key
              queryClient.setQueryData(
                [
                  ...queryKeys.sessions.detail(resolvedParams.sessionId),
                  'full-details',
                ],
                (old: any) => {
                  if (!old) return old
                  return {
                    ...old,
                    session: { ...old.session, title: newTitle },
                  }
                },
              )
            }}
            onSendEmail={!isViewer ? handleSendSummaryEmail : undefined}
            sendingEmail={sendingEmail}
            onDownloadTranscript={
              !isViewer && hasTranscripts ? handleDownloadTranscript : undefined
            }
          />

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Scheduled Session State */}
            {isScheduled && !showUploaderForScheduled ? (
              <div className="space-y-6">
                {/* Pre-Session Responses */}
                <PreSessionResponses
                  sessionId={session.id}
                  clientId={clientId}
                />

                {/* Start Bot Card */}
                {!isViewer && (
                  <StartBotCard
                    sessionId={session.id}
                    clientId={clientId}
                    clientName={session.client_name || session.client?.name}
                    scheduledFor={session.scheduled_for}
                    meetingUrl={session.meeting_url}
                    questionnaireSent={session.questionnaire_sent}
                    onShowUploader={() => setShowUploaderForScheduled(true)}
                  />
                )}

                {/* Quick Note */}
                {!isViewer && <QuickNote sessionId={session.id} />}
              </div>
            ) : isScheduled && showUploaderForScheduled ? (
              <div className="max-w-2xl mx-auto space-y-4">
                <button
                  onClick={() => setShowUploaderForScheduled(false)}
                  className="text-sm text-app-secondary hover:text-app-primary transition-colors mb-2"
                >
                  &larr; Back to session
                </button>
                <MediaUploader
                  sessionId={session.id}
                  sessionTitle={session.title}
                  onUploadComplete={() => {
                    queryClient.invalidateQueries({
                      queryKey: queryKeys.sessions.detail(
                        resolvedParams.sessionId,
                      ),
                    })
                  }}
                />
              </div>
            ) : needsUpload && !isViewer ? (
              <div className="max-w-2xl mx-auto">
                <MediaUploader
                  sessionId={session.id}
                  sessionTitle={session.title}
                  onUploadComplete={() => {
                    // Invalidate to pick up the status change to "processing"
                    queryClient.invalidateQueries({
                      queryKey: queryKeys.sessions.detail(
                        resolvedParams.sessionId,
                      ),
                    })
                  }}
                />
              </div>
            ) : needsUpload && isViewer ? (
              <Card className="max-w-2xl mx-auto">
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-app-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-app-primary mb-2">
                    Upload Required
                  </h3>
                  <p className="text-app-secondary">
                    This session requires a recording upload, which is not
                    available with viewer permissions.
                  </p>
                </CardContent>
              </Card>
            ) : session.transcription_status === 'processing' ? (
              /* Processing State */
              <Card className="max-w-2xl mx-auto border-app-border shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="relative mb-6">
                    <div className="w-14 h-14 bg-app-surface rounded-xl flex items-center justify-center">
                      <Loader2 className="w-7 h-7 text-app-secondary animate-spin" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-app-primary rounded-full animate-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold text-app-primary mb-2">
                    Processing Recording
                  </h3>
                  <p className="text-app-secondary text-center mb-6 max-w-sm text-sm">
                    Your file is being transcribed. You can navigate away
                    &mdash; we&apos;ll notify you when it&apos;s ready.
                  </p>
                  <div className="w-full max-w-xs">
                    <div className="h-2 bg-app-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-app-primary rounded-full transition-all duration-500"
                        style={{
                          width: `${processingSession?.progress ?? session.transcription_progress ?? 0}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-app-secondary mt-2 text-center">
                      {processingSession?.progress ??
                        session.transcription_progress ??
                        0}
                      % complete
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Main Content with New Layout */
              <div className="space-y-6">
                {/* Tabs with Quick Actions on the Right */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="flex-1"
                  >
                    <TabsList className="bg-app-surface p-1 rounded-lg">
                      <TabsTrigger
                        value="overview"
                        className="data-[state=active]:bg-surface-1 dark:data-[state=active]:bg-ink-2 data-[state=active]:text-app-primary data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm font-medium transition-all"
                      >
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Overview
                      </TabsTrigger>
                      <TabsTrigger
                        value="analysis"
                        className="data-[state=active]:bg-surface-1 dark:data-[state=active]:bg-ink-2 data-[state=active]:text-app-primary data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm font-medium transition-all"
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        Analysis
                      </TabsTrigger>
                      {!isViewer &&
                        (session.bot_id ||
                          session.video_url ||
                          session.video_unavailable) && (
                          <TabsTrigger
                            value="recording"
                            className="data-[state=active]:bg-surface-1 dark:data-[state=active]:bg-ink-2 data-[state=active]:text-app-primary data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm font-medium transition-all"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Recording
                          </TabsTrigger>
                        )}
                    </TabsList>
                  </Tabs>

                  {/* Quick Actions */}
                  {!isViewer && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => setShowCommitmentCreatePanel(true)}
                        variant="outline"
                        size="sm"
                        className="border-app-border hover:bg-app-surface text-sm"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Commitment
                      </Button>

                      <Button
                        onClick={() => setShowQuickNote(!showQuickNote)}
                        variant="outline"
                        size="sm"
                        className="border-app-border hover:bg-app-surface text-sm"
                      >
                        <StickyNote className="h-3.5 w-3.5 mr-1.5" />
                        Note
                      </Button>

                      <Button
                        onClick={triggerAnalysisWithProgress}
                        disabled={analyzing || !transcriptsExist}
                        size="sm"
                        className="bg-app-primary hover:bg-app-primary/90 text-app-background text-sm"
                      >
                        {analyzing ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                            Regenerate
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Group Session Participant Bar */}
                {isGroupSession && groupParticipants.length > 0 && (
                  <GroupParticipantBar
                    participants={groupParticipants}
                    selectedClientId={selectedClientId}
                    onSelectClient={setSelectedClientId}
                  />
                )}

                {/* Quick Note Form (collapsible) */}
                {showQuickNote && !isViewer && (
                  <QuickNote sessionId={sessionData.session.id} />
                )}

                {/* Analyzing Progress Indicator */}
                {analyzing && (
                  <Card className="border-app-border shadow-sm bg-app-surface">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-app-surface rounded-lg">
                          <Brain className="h-5 w-5 text-app-secondary animate-pulse" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-app-primary font-medium mb-1.5">
                            Analyzing session...
                          </p>
                          <div className="h-1.5 bg-app-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-app-primary rounded-full transition-all duration-300"
                              style={{ width: `${analysisProgress}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-app-secondary font-medium">
                          {analysisProgress}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tab Content */}
                <div className="space-y-6">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <SessionOverviewTab
                      insights={analysisData?.insights || undefined}
                      commitments={commitmentsData?.commitments || []}
                      sessionId={sessionData.session.id}
                      clientId={clientId}
                      transcript={transcript}
                      isViewer={isViewer}
                      onViewAnalysis={() => setActiveTab('analysis')}
                      onRefreshCommitments={refreshCommitments}
                      isGroupSession={isGroupSession}
                      selectedClientId={selectedClientId}
                      clientAnalyses={session.client_analyses}
                      onGenerateClientAnalysis={
                        !isViewer && isGroupSession && selectedClientId
                          ? handleGenerateClientAnalysis
                          : undefined
                      }
                      generatingClientAnalysis={generatingClientAnalysis}
                      isCompleted={
                        session.status === 'completed' ||
                        session.transcription_status === 'completed'
                      }
                      onCreateCommitment={
                        !isViewer && clientId
                          ? () => setShowCommitmentCreatePanel(true)
                          : undefined
                      }
                    />
                  )}

                  {/* Analysis Tab (Merged Insights + Performance) */}
                  {activeTab === 'analysis' &&
                    (loadingAnalysis ? (
                      <Card className="border-app-border shadow-sm">
                        <CardContent className="py-12 flex flex-col items-center justify-center">
                          <div className="w-10 h-10 bg-app-surface rounded-lg flex items-center justify-center mb-3">
                            <Loader2 className="h-5 w-5 text-app-secondary animate-spin" />
                          </div>
                          <p className="text-sm text-app-secondary">
                            Loading analysis...
                          </p>
                        </CardContent>
                      </Card>
                    ) : analysisData?.insights || analysisData?.coaching ? (
                      <>
                        {/* Hero Card with Key Metrics */}
                        <SessionHeroCard
                          overallScore={
                            analysisData.coaching?.coaching_scores?.overall ||
                            (() => {
                              const vals = Object.values(
                                analysisData.coaching?.coaching_scores || {},
                              ).filter(
                                (v): v is number => typeof v === 'number',
                              )
                              return vals.length > 0
                                ? vals.reduce((a, b) => a + b, 0) / vals.length
                                : 0
                            })()
                          }
                          sentiment={analysisData.coaching?.sentiment}
                          wordCount={
                            analysisData.insights?.metadata?.word_count
                          }
                          speakerBalance={
                            analysisData.insights?.metadata?.speaker_balance
                          }
                          coachingStyle={
                            analysisData.insights?.metadata?.coaching_style
                          }
                        />

                        {/* Print Button + Detailed Analysis */}
                        <div className="flex justify-end">
                          <AnalysisPrintView
                            insights={analysisData.insights || undefined}
                            coaching={
                              analysisData.coaching
                                ? {
                                    ...analysisData.coaching,
                                    session_id: analysisData.session_id,
                                    timestamp: analysisData.timestamp,
                                  }
                                : undefined
                            }
                            sessionTitle={
                              session.title ||
                              `Session ${formatDate(session.started_at || session.created_at)}`
                            }
                            clientName={
                              session.client_name || session.client?.name
                            }
                            coachName={session.coach_name}
                            sessionDate={
                              session.started_at || session.created_at
                            }
                          />
                        </div>

                        <SessionAnalysisMerged
                          insights={analysisData.insights || undefined}
                          coaching={
                            analysisData.coaching
                              ? {
                                  ...analysisData.coaching,
                                  session_id: analysisData.session_id,
                                  timestamp: analysisData.timestamp,
                                }
                              : undefined
                          }
                        />

                        {/* Proficiency Ladder rubric — gated by the
                            `proficiency-rubric` PostHog feature flag */}
                        {showProficiency && analysisData.proficiency ? (
                          <SessionProficiencyAnalysis
                            proficiency={analysisData.proficiency}
                          />
                        ) : null}
                      </>
                    ) : (
                      <Card className="border-dashed border-2 border-app-border">
                        <CardContent className="py-16 text-center">
                          <div className="w-12 h-12 bg-app-surface rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Brain className="h-6 w-6 text-app-secondary" />
                          </div>
                          <h3 className="text-base font-semibold text-app-primary mb-2">
                            No Analysis Yet
                          </h3>
                          <p className="text-sm text-app-secondary max-w-sm mx-auto mb-4">
                            {isViewer
                              ? 'No analysis has been generated for this session yet.'
                              : 'Generate AI analysis to see insights and coaching metrics.'}
                          </p>
                          {!isViewer && (
                            <Button
                              onClick={triggerAnalysisWithProgress}
                              disabled={analyzing}
                              className="bg-app-primary hover:bg-app-primary/90"
                            >
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate Analysis
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                  {/* Recording Tab — video player + synced transcript + comments */}
                  {activeTab === 'recording' && !isViewer && (
                    <>
                      <VideoReviewPanel
                        sessionId={sessionData.session.id}
                        videoUrl={session.video_url ?? null}
                        videoUnavailable={session.video_unavailable}
                        videoAnchorAt={pickVideoAnchor(
                          (session.metadata as any)?.recording_started_at,
                          transcript,
                          session.started_at,
                        )}
                        transcript={(transcript ?? []) as any}
                        isOwner={
                          !!currentUserId &&
                          !!session.coach_id &&
                          currentUserId === session.coach_id
                        }
                        onRefreshVideoUrl={handleRefreshVideoUrl}
                      />
                      <EvaluationsList
                        sessionId={sessionData.session.id}
                        evaluations={evaluations}
                        currentUserId={currentUserId}
                        isAdmin={isAdmin}
                      />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Create Commitment Panel */}
          {clientId && (
            <CommitmentCreatePanel
              isOpen={showCommitmentCreatePanel}
              onClose={() => setShowCommitmentCreatePanel(false)}
              clientId={clientId}
              sessionId={sessionData?.session?.id}
              onCreated={commitment => {
                setShowCommitmentCreatePanel(false)
                setSelectedCommitmentId(commitment.id)
                refreshCommitments()
              }}
            />
          )}

          {/* Commitment Detail Panel */}
          <CommitmentDetailPanel
            commitmentId={selectedCommitmentId}
            clientId={clientId || undefined}
            onClose={() => setSelectedCommitmentId(null)}
            onCommitmentUpdate={refreshCommitments}
          />

          {/* Delete Confirmation Dialog */}
          <ConfirmationDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            title="Delete Session"
            description="Are you sure you want to delete this session? This will permanently remove the session, all transcripts, analyses, and associated data. This action cannot be undone."
            confirmText={deleting ? 'Deleting...' : 'Delete Session'}
            cancelText="Cancel"
            onConfirm={handleDeleteSession}
            variant="destructive"
          />
        </div>
      </PageLayout>
    </ProtectedRoute>
  )
}
