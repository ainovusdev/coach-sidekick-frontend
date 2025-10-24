'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { usePermissions } from '@/contexts/permission-context'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  Brain,
  FileText,
  BarChart,
  Sparkles,
  Eye,
  Target,
  StickyNote,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { MediaUploader } from '@/components/sessions/media-uploader'
import { useSessionData } from './hooks/use-session-data'
import SessionHeader from './components/session-header'
import TranscriptViewer from './components/transcript-viewer'
import FullCoachingAnalysis from './components/full-coaching-analysis'
import {
  AnalysisService,
  type FullAnalysisResponse,
} from '@/services/analysis-service'
import { SessionInsightsModern } from '@/components/sessions/session-insights-modern'
import { SessionService } from '@/services/session-service'
import { CommitmentService } from '@/services/commitment-service'
import { GoalService } from '@/services/goal-service'
import { TargetService } from '@/services/target-service'
import {
  EnhancedExtractionService,
  ExtractionResult,
} from '@/services/enhanced-extraction-service'
import { DraftCommitmentsReview } from '@/components/commitments/draft-commitments-review'
import { EnhancedDraftReview } from '@/components/extraction/enhanced-draft-review'
import { CommitmentForm } from '@/components/commitments/commitment-form'
import type { Commitment } from '@/types/commitment'
import { toast } from '@/hooks/use-toast'
import { NotesList } from '@/components/session-notes'

export default function SessionDetailsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const router = useRouter()
  const permissions = usePermissions()
  const isViewer = permissions.isViewer()
  const resolvedParams = React.use(params)

  const { sessionData, loading, error } = useSessionData(
    resolvedParams.sessionId,
  )

  // Analysis state (unified)
  const [analysisData, setAnalysisData] = useState<FullAnalysisResponse | null>(
    null,
  )
  const [analyzing, setAnalyzing] = useState(false)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [autoTriggered, setAutoTriggered] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  // Commitments state
  const [draftCommitments, setDraftCommitments] = useState<Commitment[]>([])
  const [extractingCommitments, setExtractingCommitments] = useState(false)
  const [showCreateCommitment, setShowCreateCommitment] = useState(false)

  // Enhanced extraction state
  const [extractionResult, setExtractionResult] =
    useState<ExtractionResult | null>(null)
  const [useEnhancedExtraction] = useState(true)

  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  // Load draft commitments for this session
  const loadDraftCommitments = async () => {
    if (!sessionData?.session?.id) return

    console.log(
      'Loading draft commitments for session:',
      sessionData.session.id,
    )
    try {
      const response = await CommitmentService.listCommitments({
        session_id: sessionData.session.id,
        status: 'draft',
        include_drafts: true,
      })
      console.log(
        'Draft commitments loaded:',
        response.commitments?.length || 0,
        response.commitments,
      )
      setDraftCommitments(response.commitments || [])
    } catch (error) {
      console.error('Failed to load draft commitments:', error)
    }
  }

  // Extract commitments from session transcript (or enhanced extraction)
  const extractCommitments = async () => {
    if (!sessionData?.session?.id) return

    setExtractingCommitments(true)
    try {
      if (useEnhancedExtraction) {
        // Enhanced extraction: goals + targets + commitments
        const result = await EnhancedExtractionService.extractFromSession(
          sessionData.session.id,
        )
        console.log('Enhanced extraction result:', result)
        setExtractionResult(result)
        toast({
          title: 'Extraction Complete',
          description: `Found ${result.total_created} items: ${result.draft_goals.length} goals, ${result.draft_targets.length} targets, ${result.draft_commitments.length} commitments`,
        })
      } else {
        // Old method: commitments only
        const extracted = await CommitmentService.extractFromSession(
          sessionData.session.id,
        )
        console.log('Extracted commitments:', extracted)
        toast({
          title: 'Commitments Extracted',
          description: `Found ${extracted.length} potential commitments from the session.`,
        })
        await loadDraftCommitments()
      }
    } catch (error) {
      // ApiClient already shows error toast, just log it
      console.error('Failed to extract:', error)
    } finally {
      setExtractingCommitments(false)
    }
  }

  // Handle bulk confirmation of all extracted entities
  const handleConfirmAll = async () => {
    if (!extractionResult || !sessionData?.session) return

    try {
      // Use new confirmation endpoint that creates records
      await EnhancedExtractionService.confirmExtraction({
        session_id: sessionData.session.id,
        client_id: sessionData.session.client_id,
        goals: extractionResult.draft_goals,
        targets: extractionResult.draft_targets,
        commitments: extractionResult.draft_commitments,
        current_sprint_id: extractionResult.current_sprint_id,
      })

      toast({
        title: 'Extraction Confirmed',
        description: `Created ${extractionResult.total_created} items successfully.`,
      })

      // Clear extraction result and reload
      setExtractionResult(null)
      await loadDraftCommitments()
    } catch (error) {
      console.error('Failed to confirm all:', error)
      throw error
    }
  }

  // Load draft commitments when session loads
  React.useEffect(() => {
    if (sessionData?.session?.id && !isViewer) {
      loadDraftCommitments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData?.session?.id, isViewer])

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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <SessionHeader
          session={session}
          onBack={() => router.back()}
          onDelete={!isViewer ? () => setShowDeleteDialog(true) : undefined}
          onTitleUpdate={newTitle => {
            if (sessionData?.session) {
              sessionData.session.title = newTitle
            }
          }}
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
            /* Main Tabs */
            <Tabs defaultValue="analysis" className="space-y-6">
              <div className="flex items-center justify-between">
                <TabsList className="bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger
                    value="analysis"
                    className="data-[state=active]:bg-white"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Analysis
                  </TabsTrigger>
                  <TabsTrigger
                    value="transcript"
                    className="data-[state=active]:bg-white"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Transcript
                  </TabsTrigger>
                  {!isViewer && (
                    <>
                      <TabsTrigger
                        value="commitments"
                        className="data-[state=active]:bg-white"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Commitments
                      </TabsTrigger>
                      <TabsTrigger
                        value="notes"
                        className="data-[state=active]:bg-white"
                      >
                        <StickyNote className="h-4 w-4 mr-2" />
                        Notes
                      </TabsTrigger>
                    </>
                  )}
                </TabsList>

                {/* Global Actions */}
                {!isViewer && !analyzing && (
                  <Button
                    onClick={triggerAnalysisWithProgress}
                    disabled={analyzing || !transcriptsExist}
                    variant="outline"
                    size="sm"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {analysisData ? 'Regenerate' : 'Generate'} Analysis
                  </Button>
                )}
              </div>

              {/* Analyzing Progress Indicator */}
              {analyzing && (
                <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
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

              {/* Analysis Tab */}
              <TabsContent value="analysis" className="space-y-6">
                {loadingAnalysis ? (
                  <Card>
                    <CardContent className="py-12 flex items-center justify-center">
                      <Loader2 className="h-10 w-10 text-gray-600 animate-spin" />
                    </CardContent>
                  </Card>
                ) : analysisData ? (
                  <div className="space-y-6">
                    {/* Insights */}
                    {analysisData.insights && (
                      <SessionInsightsModern insights={analysisData.insights} />
                    )}

                    {/* Coaching Metrics */}
                    {analysisData.coaching && (
                      <Card className="overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center gap-2">
                            <BarChart className="h-5 w-5 text-gray-700" />
                            <h3 className="text-lg font-semibold text-gray-900">
                              Coaching Metrics
                            </h3>
                          </div>
                        </div>
                        <div className="p-6">
                          <FullCoachingAnalysis
                            analysis={{
                              ...analysisData.coaching,
                              session_id: analysisData.session_id,
                              timestamp: analysisData.timestamp,
                            }}
                          />
                        </div>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="border-dashed border-2">
                    <CardContent className="py-16 text-center">
                      <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No Analysis Yet
                      </h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        {isViewer
                          ? 'No insights have been generated for this session yet.'
                          : 'Generate AI-powered insights and coaching metrics'}
                      </p>
                      {!isViewer && (
                        <Button
                          onClick={triggerAnalysisWithProgress}
                          disabled={analyzing}
                          className="bg-gray-900 hover:bg-gray-800"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Analysis
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Transcript Tab */}
              <TabsContent value="transcript">
                {transcript && transcript.length > 0 && !isViewer ? (
                  <Card>
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-700" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Session Transcript
                        </h3>
                        <Badge variant="secondary" className="ml-auto">
                          {transcript.length} messages
                        </Badge>
                      </div>
                    </div>
                    <div className="p-6">
                      <TranscriptViewer transcript={transcript} />
                    </div>
                  </Card>
                ) : isViewer && transcriptsExist ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Transcript Not Available
                      </h3>
                      <p className="text-gray-600">
                        Transcripts are not accessible with viewer permissions.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No transcript available</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Commitments Tab */}
              {!isViewer && (
                <TabsContent value="commitments">
                  <Card>
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-gray-700" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Commitments
                          </h3>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={extractCommitments}
                            disabled={extractingCommitments || !analysisData}
                            variant="outline"
                            size="sm"
                          >
                            {extractingCommitments ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Extracting...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Extract from AI
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => setShowCreateCommitment(true)}
                            size="sm"
                          >
                            + Create
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      {extractionResult ? (
                        <EnhancedDraftReview
                          draftGoals={extractionResult.draft_goals}
                          draftTargets={extractionResult.draft_targets}
                          draftCommitments={extractionResult.draft_commitments}
                          currentSprintId={extractionResult.current_sprint_id}
                          onConfirmGoals={async ids => {
                            await GoalService.bulkConfirmGoals(ids)
                          }}
                          onConfirmTargets={async ids => {
                            await TargetService.bulkConfirmTargets(ids)
                          }}
                          onConfirmCommitments={async ids => {
                            await CommitmentService.bulkConfirm(ids)
                          }}
                          onConfirmAll={handleConfirmAll}
                          onRefresh={() => {
                            setExtractionResult(null)
                            loadDraftCommitments()
                          }}
                        />
                      ) : (
                        <DraftCommitmentsReview
                          sessionId={sessionData.session.id}
                          drafts={draftCommitments}
                          loading={false}
                          onRefresh={loadDraftCommitments}
                        />
                      )}
                    </div>
                  </Card>
                </TabsContent>
              )}

              {/* Notes Tab */}
              {!isViewer && (
                <TabsContent value="notes">
                  <NotesList sessionId={sessionData.session.id} />
                </TabsContent>
              )}
            </Tabs>
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
              loadDraftCommitments()
            } catch (error) {
              console.error('Failed to create commitment:', error)
            }
          }}
          clientId={sessionData?.session?.client_id || undefined}
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
      </div>
    </ProtectedRoute>
  )
}
