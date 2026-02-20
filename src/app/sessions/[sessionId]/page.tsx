'use client'

import React, { useState } from 'react'
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
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
import { Card, CardContent } from '@/components/ui/card'
import { MediaUploader } from '@/components/sessions/media-uploader'
import SessionHeader from './components/session-header'
import { SessionHeroCard } from './components/session-hero-card'
import { SessionOverviewTab } from './components/session-overview-tab'
import { SessionAnalysisMerged } from './components/session-analysis-merged'
import { QuickNote } from '@/components/session-notes/quick-note'
import {
  AnalysisService,
  type FullAnalysisResponse,
} from '@/services/analysis-service'
import { SessionService } from '@/services/session-service'
import { CommitmentService } from '@/services/commitment-service'
import { CommitmentForm } from '@/components/commitments/commitment-form'
import { toast } from '@/hooks/use-toast'
import { AutoExtractionModal } from '@/components/extraction/auto-extraction-modal'
import { useSessionDetails } from '@/hooks/queries/use-session-details'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { WinsService } from '@/services/wins-service'

export default function SessionDetailsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const router = useRouter()
  const permissions = usePermissions()
  const isViewer = permissions.isViewer()
  const resolvedParams = React.use(params)
  const queryClient = useQueryClient()

  // Use TanStack Query for instant caching
  const {
    data: sessionData,
    isLoading: loading,
    error: queryError,
  } = useSessionDetails(resolvedParams.sessionId)
  const error = queryError ? String(queryError) : null

  // Extract client_id from session (might be nested)
  const clientId =
    sessionData?.session?.client_id || sessionData?.session?.client?.id

  // Fetch commitments for this specific session only
  const { data: commitmentsData } = useCommitments(
    {
      session_id: resolvedParams.sessionId,
      include_drafts: true,
    },
    { enabled: !!resolvedParams.sessionId },
  )

  // Fetch wins for this session (lightweight check for existing data)
  const { data: winsData } = useQuery({
    queryKey: ['wins', 'session', resolvedParams.sessionId],
    queryFn: () => WinsService.getSessionWins(resolvedParams.sessionId),
    enabled: !!resolvedParams.sessionId,
    staleTime: 3 * 60 * 1000,
  })

  // Check if extraction data already exists — skip modal if so
  const hasExistingExtractionData =
    (commitmentsData?.commitments?.length ?? 0) > 0 ||
    (winsData?.wins?.length ?? 0) > 0

  // Helper to refresh commitments and wins from cache
  const refreshCommitments = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })
    queryClient.invalidateQueries({
      queryKey: ['wins', 'session', resolvedParams.sessionId],
    })
  }

  // Analysis state (unified)
  const [analysisData, setAnalysisData] = useState<FullAnalysisResponse | null>(
    null,
  )
  const [analyzing, setAnalyzing] = useState(false)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [autoTriggered, setAutoTriggered] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  // Commitments state (now from TanStack Query cache)
  const [showCreateCommitment, setShowCreateCommitment] = useState(false)

  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Email state
  const [sendingEmail, setSendingEmail] = useState(false)

  // UI state
  const [showQuickNote, setShowQuickNote] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showExtractionModal, setShowExtractionModal] = useState(false)
  const [extractionShown, setExtractionShown] = useState(false)
  const [checkedFromMeeting, setCheckedFromMeeting] = useState(false)

  // Check if we came from a meeting page (session just completed) and trigger extraction modal
  React.useEffect(() => {
    if (
      checkedFromMeeting ||
      !sessionData?.session?.id ||
      !clientId ||
      isViewer ||
      hasExistingExtractionData
    )
      return

    setCheckedFromMeeting(true)

    // Check if session was recently completed (within last 5 minutes)
    const sessionCompletedAt =
      sessionData.session.ended_at || sessionData.session.updated_at
    if (sessionCompletedAt) {
      const completedTime = new Date(sessionCompletedAt).getTime()
      const now = Date.now()
      const fiveMinutesAgo = now - 5 * 60 * 1000

      // If session completed recently and has transcripts, show extraction modal
      const hasTranscripts =
        sessionData.transcript && sessionData.transcript.length > 0
      const isRecentlyCompleted = completedTime > fiveMinutesAgo
      const isSessionComplete = sessionData.session.status === 'completed'

      if (
        isRecentlyCompleted &&
        hasTranscripts &&
        isSessionComplete &&
        !extractionShown
      ) {
        setShowExtractionModal(true)
        setExtractionShown(true)
      }
    }
  }, [
    sessionData,
    clientId,
    isViewer,
    checkedFromMeeting,
    extractionShown,
    hasExistingExtractionData,
  ])

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

      // Show extraction modal after analysis completes (skip if data already exists)
      if (
        !extractionShown &&
        clientId &&
        !isViewer &&
        !hasExistingExtractionData
      ) {
        setShowExtractionModal(true)
        setExtractionShown(true)
      }
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
      // Navigate back to sessions list
      router.push('/sessions')
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

    const sessionDate = formatDate(sessionData.session.created_at)
    const fileDate = formatDate(sessionData.session.created_at, 'yyyy-MM-dd')

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

  // Refresh video URL handler
  const handleRefreshVideoUrl = async () => {
    if (!sessionData?.session?.id) return

    try {
      await SessionService.refreshVideoUrl(sessionData.session.id)
      // Invalidate session details to refetch with new video URL
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(sessionData.session.id),
      })
    } catch (error) {
      console.error('Failed to refresh video URL:', error)
      throw error // Re-throw so VideoPlayer can handle the error state
    }
  }

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
        <div className="text-center max-w-md mx-auto bg-white rounded-lg shadow-sm p-8 border border-app-border">
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
  const needsUpload = (isPendingUpload || !transcriptsExist) && !isProcessing

  return (
    <ProtectedRoute loadingMessage="Loading session details...">
      <PageLayout>
        <div className="min-h-screen bg-white">
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
              if (sessionData?.session) {
                sessionData.session.title = newTitle
              }
            }}
            onSendEmail={!isViewer ? handleSendSummaryEmail : undefined}
            sendingEmail={sendingEmail}
            onDownloadTranscript={
              !isViewer && hasTranscripts ? handleDownloadTranscript : undefined
            }
          />

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Upload Required State */}
            {needsUpload && !isViewer ? (
              <div className="max-w-2xl mx-auto">
                <MediaUploader
                  sessionId={session.id}
                  onUploadComplete={() => {
                    window.location.reload()
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
                    Your file is being transcribed. This may take a few minutes.
                  </p>
                  <div className="w-full max-w-xs">
                    <div className="h-2 bg-app-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-app-primary rounded-full transition-all duration-500"
                        style={{
                          width: `${session.transcription_progress || 0}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-app-secondary mt-2 text-center">
                      {session.transcription_progress || 0}% complete
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
                        className="data-[state=active]:bg-white data-[state=active]:text-app-primary data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm font-medium transition-all"
                      >
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Overview
                      </TabsTrigger>
                      <TabsTrigger
                        value="analysis"
                        className="data-[state=active]:bg-white data-[state=active]:text-app-primary data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm font-medium transition-all"
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        Analysis
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Quick Actions */}
                  {!isViewer && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => setShowCreateCommitment(true)}
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
                        className="bg-app-primary hover:bg-app-primary/90 text-white text-sm"
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
                      videoUrl={session.video_url}
                      onViewAnalysis={() => setActiveTab('analysis')}
                      onRefreshCommitments={refreshCommitments}
                      onRefreshVideoUrl={
                        !isViewer ? handleRefreshVideoUrl : undefined
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
                            Object.values(
                              analysisData.coaching?.coaching_scores || {},
                            ).reduce(
                              (sum, score) =>
                                sum + (typeof score === 'number' ? score : 0),
                              0,
                            ) / 12
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

                        {/* Detailed Analysis */}
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
                </div>
              </div>
            )}
          </div>

          {/* Create Commitment Modal */}
          <CommitmentForm
            open={showCreateCommitment}
            onOpenChange={setShowCreateCommitment}
            onSubmit={async data => {
              try {
                await CommitmentService.createCommitment(data)
                toast({
                  title: 'Commitment Created',
                  description: 'The commitment has been created successfully.',
                })
                setShowCreateCommitment(false)
                refreshCommitments()
              } catch (error) {
                console.error('Failed to create commitment:', error)
              }
            }}
            clientId={clientId || undefined}
            sessionId={sessionData?.session?.id}
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

          {/* Auto-Extraction Modal - Shows after analysis completes */}
          {clientId && (
            <AutoExtractionModal
              open={showExtractionModal}
              onOpenChange={setShowExtractionModal}
              sessionId={sessionData?.session?.id || ''}
              clientId={clientId}
              onComplete={refreshCommitments}
            />
          )}
        </div>
      </PageLayout>
    </ProtectedRoute>
  )
}
