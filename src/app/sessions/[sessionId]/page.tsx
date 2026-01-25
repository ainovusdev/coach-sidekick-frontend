'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
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
  StickyNote,
  LayoutGrid,
  Plus,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
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
import { NotesList } from '@/components/session-notes'
import { AutoExtractionModal } from '@/components/extraction/auto-extraction-modal'
import { useSessionDetails } from '@/hooks/queries/use-session-details'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'

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

  // Debug: Log session data structure
  console.log('Session data:', sessionData)
  console.log('Session object:', sessionData?.session)
  console.log('Client ID direct:', sessionData?.session?.client_id)
  console.log('Client object:', sessionData?.session?.client)

  // Extract client_id from session (might be nested)
  const clientId =
    sessionData?.session?.client_id || sessionData?.session?.client?.id

  console.log('Extracted clientId:', clientId)

  // Fetch commitments for this specific session only
  const { data: commitmentsData } = useCommitments(
    {
      session_id: resolvedParams.sessionId,
      include_drafts: true,
    },
    { enabled: !!resolvedParams.sessionId },
  )

  console.log('Commitments query data:', commitmentsData)

  // Helper to refresh commitments from cache
  const refreshCommitments = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })
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

      // Show extraction modal after analysis completes (if not already shown and has clientId)
      if (!extractionShown && clientId && !isViewer) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto bg-white rounded-lg shadow-sm p-8 border border-gray-200">
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
            iconClassName="w-20 h-20 bg-gray-100"
          />
        </div>
      </div>
    )
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">
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
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload Required
                </h3>
                <p className="text-gray-600">
                  This session requires a recording upload, which is not
                  available with viewer permissions.
                </p>
              </CardContent>
            </Card>
          ) : session.transcription_status === 'processing' ? (
            /* Processing State */
            <Card className="max-w-2xl mx-auto">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-gray-600 animate-spin mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Processing Recording...
                </h3>
                <p className="text-gray-600 text-center">
                  Your file is being transcribed. This may take a few minutes.
                </p>
                <Progress
                  value={session.transcription_progress || 0}
                  className="w-full max-w-xs mt-4"
                />
                <p className="text-sm text-gray-500 mt-2">
                  {session.transcription_progress || 0}% complete
                </p>
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
                  <TabsList className="bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
                    <TabsTrigger
                      value="overview"
                      className="data-[state=active]:bg-black data-[state=active]:text-white rounded-lg"
                    >
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="analysis"
                      className="data-[state=active]:bg-black data-[state=active]:text-white rounded-lg"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Analysis
                    </TabsTrigger>
                    {!isViewer && (
                      <TabsTrigger
                        value="notes"
                        className="data-[state=active]:bg-black data-[state=active]:text-white rounded-lg"
                      >
                        <StickyNote className="h-4 w-4 mr-2" />
                        Notes
                      </TabsTrigger>
                    )}
                  </TabsList>
                </Tabs>

                {/* Quick Actions - Compact Version */}
                {!isViewer && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => setShowCreateCommitment(true)}
                      variant="outline"
                      size="sm"
                      className="border-gray-300 hover:bg-gray-50 hover:border-black transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Commitment
                    </Button>

                    <Button
                      onClick={() => setShowQuickNote(!showQuickNote)}
                      variant="outline"
                      size="sm"
                      className="border-gray-300 hover:bg-gray-50 hover:border-black transition-colors"
                    >
                      <StickyNote className="h-4 w-4 mr-2" />
                      Note
                    </Button>

                    <Button
                      onClick={triggerAnalysisWithProgress}
                      disabled={analyzing || !transcriptsExist}
                      className="bg-black hover:bg-gray-800 text-white"
                      size="sm"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
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
                <Card className="bg-black border-black">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Brain className="h-8 w-8 text-white animate-pulse" />
                      <div className="flex-1">
                        <p className="text-white font-medium mb-2">
                          Analyzing session...
                        </p>
                        <Progress value={analysisProgress} className="h-2" />
                      </div>
                      <span className="text-white text-sm font-medium">
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
                    onViewNotes={() => setActiveTab('notes')}
                    onRefreshCommitments={refreshCommitments}
                  />
                )}

                {/* Analysis Tab (Merged Insights + Performance) */}
                {activeTab === 'analysis' &&
                  (loadingAnalysis ? (
                    <Card className="border-gray-200 shadow-sm">
                      <CardContent className="py-12 flex items-center justify-center">
                        <Loader2 className="h-10 w-10 text-gray-600 animate-spin" />
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
                        wordCount={analysisData.insights?.metadata?.word_count}
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
                    <Card className="border-dashed border-2 border-gray-200">
                      <CardContent className="py-16 text-center">
                        <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-black mb-2">
                          No Analysis Yet
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                          {isViewer
                            ? 'No analysis has been generated for this session yet.'
                            : 'Generate comprehensive AI analysis including insights and coaching performance metrics'}
                        </p>
                        {!isViewer && (
                          <Button
                            onClick={triggerAnalysisWithProgress}
                            disabled={analyzing}
                            className="bg-black hover:bg-gray-800"
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Analysis
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                {/* Notes Tab */}
                {!isViewer && activeTab === 'notes' && (
                  <NotesList sessionId={sessionData.session.id} />
                )}
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
    </ProtectedRoute>
  )
}
