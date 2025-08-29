'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  Brain,
  FileText,
  BarChart,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { MediaUploader } from '@/components/sessions/media-uploader'
import { useSessionData } from './hooks/use-session-data'
import SessionHeader from './components/session-header'
import TranscriptViewer from './components/transcript-viewer'
import FullCoachingAnalysis from './components/full-coaching-analysis'
import {
  AnalysisService,
  type SessionInsights,
  type CoachingAnalysis,
} from '@/services/analysis-service'
import { SessionInsightsModern } from '@/components/sessions/session-insights-modern'
import { SessionService } from '@/services/session-service'
import { toast } from '@/hooks/use-toast'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default function SessionDetailsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const router = useRouter()
  const resolvedParams = React.use(params)

  const { sessionData, loading, error } =
    useSessionData(resolvedParams.sessionId)

  // Analysis state
  const [analysis, setAnalysis] = useState<SessionInsights | null>(null)
  const [coachingAnalysis, setCoachingAnalysis] =
    useState<CoachingAnalysis | null>(null)
  const [analyzingSession, setAnalyzingSession] = useState(false)
  const [analyzingCoaching, setAnalyzingCoaching] = useState(false)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)

  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Load existing analysis when component mounts
  React.useEffect(() => {
    const loadAnalysis = async () => {
      if (sessionData?.session?.id) {
        setLoadingAnalysis(true)
        try {
          // Load both types of analysis
          const [existingAnalysis, existingCoachingAnalysis] =
            await Promise.all([
              AnalysisService.getLatestAnalysis(sessionData.session.id),
              AnalysisService.getLatestCoachingAnalysis(sessionData.session.id),
            ])

          if (existingAnalysis) {
            setAnalysis(existingAnalysis)
          }
          if (existingCoachingAnalysis) {
            setCoachingAnalysis(existingCoachingAnalysis)
          }
        } catch (error) {
          console.error('Failed to load analysis:', error)
        } finally {
          setLoadingAnalysis(false)
        }
      }
    }
    loadAnalysis()
  }, [sessionData?.session?.id])

  // Combined trigger function for both insights and coaching analysis
  const triggerBothAnalyses = async () => {
    if (!sessionData?.session?.id) return

    setAnalyzingSession(true)
    setAnalyzingCoaching(true)
    
    try {
      // Run both analyses in parallel
      const [newInsights, newCoaching] = await Promise.all([
        AnalysisService.triggerInsightsAnalysis(sessionData.session.id),
        AnalysisService.triggerCoachingAnalysis(sessionData.session.id)
      ])
      
      setAnalysis(newInsights)
      setCoachingAnalysis(newCoaching)
      
      toast({
        title: 'Analysis Complete',
        description: 'Session insights and coaching metrics have been generated successfully.',
      })
    } catch (error) {
      console.error('Analysis failed:', error)
      toast({
        title: 'Analysis Failed',
        description:
          error instanceof Error ? error.message : 'Failed to analyze session',
        variant: 'destructive',
      })
    } finally {
      setAnalyzingSession(false)
      setAnalyzingCoaching(false)
    }
  }

  // Trigger insights analysis function (for regeneration)
  const triggerAnalysis = async () => {
    if (!sessionData?.session?.id) return

    setAnalyzingSession(true)
    try {
      const newAnalysis = await AnalysisService.triggerInsightsAnalysis(
        sessionData.session.id,
      )
      setAnalysis(newAnalysis)
      toast({
        title: 'Analysis Complete',
        description: 'Session insights have been generated successfully.',
      })
    } catch (error) {
      console.error('Analysis failed:', error)
      toast({
        title: 'Analysis Failed',
        description:
          error instanceof Error ? error.message : 'Failed to analyze session',
        variant: 'destructive',
      })
    } finally {
      setAnalyzingSession(false)
    }
  }

  // Trigger coaching analysis function (for regeneration)
  const triggerCoachingAnalysis = async () => {
    if (!sessionData?.session?.id) return

    setAnalyzingCoaching(true)
    try {
      const newAnalysis = await AnalysisService.triggerCoachingAnalysis(
        sessionData.session.id,
      )
      setCoachingAnalysis(newAnalysis)
      toast({
        title: 'Coaching Analysis Complete',
        description: 'Coaching scores and GO LIVE values have been analyzed.',
      })
    } catch (error) {
      console.error('Coaching analysis failed:', error)
      toast({
        title: 'Coaching Analysis Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to analyze coaching session',
        variant: 'destructive',
      })
    } finally {
      setAnalyzingCoaching(false)
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
      console.error('Failed to delete session:', error)
      toast({
        title: 'Delete Failed',
        description:
          error instanceof Error ? error.message : 'Failed to delete session',
        variant: 'destructive',
      })
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

  const { session, transcript } = sessionData

  // Show upload option for any session that needs transcripts:
  // 1. Session status is 'pending_upload' OR
  // 2. No transcripts exist and not currently processing
  const hasTranscripts = transcript && transcript.length > 0
  const isPendingUpload = session.status === 'pending_upload'
  const isProcessing = session.transcription_status === 'processing'
  const needsUpload = (isPendingUpload || !hasTranscripts) && !isProcessing

  return (
    <ProtectedRoute loadingMessage="Loading session details...">
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <SessionHeader
        session={session}
        onBack={() => router.back()}
        onDelete={() => setShowDeleteDialog(true)}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Show uploader prominently for manual sessions that need upload */}
        {needsUpload ? (
          <div className="max-w-2xl mx-auto">
            <MediaUploader
              sessionId={session.id}
              onUploadComplete={() => {
                // Refresh session data after upload
                window.location.reload()
              }}
            />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Transcript Section with Accordion */}
            {session.transcription_status === 'processing' ? (
              <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
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
            ) : transcript && transcript.length > 0 ? (
              <Accordion
                type="single"
                collapsible
                defaultValue="transcript"
                className="w-full"
              >
                <AccordionItem
                  value="transcript"
                  className="bg-white rounded-xl shadow-sm border border-gray-100"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50/50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <FileText className="h-5 w-5 text-gray-700" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Session Transcript
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {transcript.length} messages •{' '}
                          {Math.round(
                            transcript.reduce(
                              (acc, t) => acc + (t.text?.length || 0),
                              0,
                            ) / 100,
                          )}{' '}
                          min read
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="border-t border-gray-100 pt-4">
                      <TranscriptViewer transcript={transcript} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500">No transcript available</p>
                </CardContent>
              </Card>
            )}

            {/* Analysis Section - Modern Cards Layout */}
            {hasTranscripts && (
              <div className="space-y-6">
                {/* Analysis Header with Actions - Only show if no analysis */}
                {(!analysis || !coachingAnalysis) && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gray-100 rounded-xl">
                        <Brain className="h-6 w-6 text-gray-700" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Ready for Analysis
                        </h2>
                        <p className="text-sm text-gray-500">
                          Generate AI-powered insights from this session
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={triggerBothAnalyses}
                        disabled={analyzingSession || analyzingCoaching}
                        className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm"
                      >
                        {(analyzingSession || analyzingCoaching) ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Insights
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {loadingAnalysis && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-10 w-10 text-gray-600 animate-spin mb-4" />
                      <p className="text-gray-600">Loading analysis...</p>
                    </div>
                  </div>
                )}

                {/* Session Insights - Modern Design */}
                {analysis && !loadingAnalysis && (
                  <div className="space-y-4">
                    {/* Regenerate Button */}
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={triggerAnalysis}
                        disabled={analyzingSession}
                        className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                      >
                        {analyzingSession ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Regenerate Analysis
                          </>
                        )}
                      </Button>
                    </div>
                    <SessionInsightsModern insights={analysis} />
                  </div>
                )}

                {/* Coaching Analysis */}
                {coachingAnalysis && !loadingAnalysis && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BarChart className="h-5 w-5 text-gray-700" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Coaching Metrics
                          </h3>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={triggerCoachingAnalysis}
                          disabled={analyzingCoaching}
                          className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                        >
                          Regenerate
                        </Button>
                      </div>
                    </div>
                    <div className="p-6">
                      <FullCoachingAnalysis analysis={coachingAnalysis} />
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!analysis && !coachingAnalysis && !loadingAnalysis && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200 border-dashed p-12">
                    <div className="text-center">
                      <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No Analysis Yet
                      </h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Generate AI-powered insights and coaching metrics to
                        better understand this session
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={triggerBothAnalyses}
                          disabled={analyzingSession || analyzingCoaching}
                          className="bg-gray-900 hover:bg-gray-800 text-white"
                        >
                          {(analyzingSession || analyzingCoaching) ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate Insights
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

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
