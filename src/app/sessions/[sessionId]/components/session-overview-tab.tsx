'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Lightbulb,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  User,
  Loader2,
} from 'lucide-react'
import type { SessionInsights } from '@/services/analysis-service'
import type { Commitment } from '@/types/commitment'
import { SessionCommitmentsList } from './session-commitments-list'
import { GroupAggregatedCommitments } from './group-aggregated-commitments'
import { SessionNotesCompact } from './session-notes-compact'
import { SessionResourcesCompact } from './session-resources-compact'
import { SessionWins } from '@/components/wins/session-wins'
import TranscriptViewer from './transcript-viewer'
import { VideoPlayer } from '@/components/sessions/video-player'

interface TranscriptEntry {
  id: string
  speaker: string
  text: string
  timestamp: string
  confidence: number | null
  created_at: string
  is_partial?: boolean
}

export interface ClientAnalysis {
  summary?: string
  action_items?: string[]
  key_topics?: string[]
  sentiment_overall?: string
  sentiment_score?: number
  engagement_level?: string
  emotions_detected?: string[]
  coaching_scores?: Record<string, number>
  go_live_scores?: Record<string, number>
  suggestions?: string[]
  generated_at?: string
}

interface SessionOverviewTabProps {
  insights?: SessionInsights
  commitments?: Commitment[]
  sessionId: string
  clientId?: string
  transcript?: TranscriptEntry[]
  isViewer?: boolean
  videoUrl?: string | null
  onViewAnalysis: () => void
  onRefreshCommitments?: () => void
  onRefreshVideoUrl?: () => Promise<void>
  isGroupSession?: boolean
  selectedClientId?: string | null
  clientAnalyses?: Record<string, ClientAnalysis>
  onGenerateClientAnalysis?: () => void
  generatingClientAnalysis?: boolean
  isCompleted?: boolean
  commitmentsLoaded?: boolean
  onCreateCommitment?: () => void
}

export function SessionOverviewTab({
  insights,
  commitments,
  sessionId,
  clientId,
  transcript,
  isViewer = false,
  videoUrl,
  onViewAnalysis,
  onRefreshCommitments,
  onRefreshVideoUrl,
  isGroupSession = false,
  selectedClientId = null,
  clientAnalyses,
  onGenerateClientAnalysis,
  generatingClientAnalysis = false,
  isCompleted = false,
  commitmentsLoaded = false,
  onCreateCommitment,
}: SessionOverviewTabProps) {
  const [transcriptOpen, setTranscriptOpen] = useState(false)

  // Per-client analysis for group sessions
  const clientAnalysis =
    isGroupSession && selectedClientId && clientAnalyses
      ? clientAnalyses[selectedClientId]
      : null

  // Use per-client data when available, otherwise fall back to session-level insights
  const displaySummary = clientAnalysis?.summary || insights?.summary
  const displayTopics = clientAnalysis?.key_topics || insights?.topics || []
  const normalizeAIString = (item: unknown): string => {
    if (typeof item === 'string') return item
    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>
      return String(
        obj.item ||
          obj.text ||
          obj.suggestion ||
          obj.title ||
          JSON.stringify(item),
      )
    }
    return String(item)
  }
  const displayActionItems = (
    clientAnalysis?.action_items?.slice(0, 3) ||
    insights?.action_items?.slice(0, 3) ||
    []
  ).map(normalizeAIString)
  const displaySuggestions = (
    clientAnalysis?.suggestions?.slice(0, 3) || []
  ).map(normalizeAIString)
  const topInsights = clientAnalysis
    ? []
    : insights?.insights?.slice(0, 3) || []
  const topActionItems = displayActionItems
  const showPersonalized = !!clientAnalysis

  return (
    <div className="space-y-6">
      {/* Per-Client Analysis Pending State */}
      {isGroupSession && selectedClientId && !clientAnalysis && (
        <Card className="border-dashed border-2 border-app-border">
          <CardContent className="py-8 text-center">
            <div className="w-10 h-10 bg-app-surface rounded-lg flex items-center justify-center mx-auto mb-3">
              <User className="h-5 w-5 text-app-secondary" />
            </div>
            <h3 className="text-sm font-semibold text-app-primary mb-1">
              No Personalized Analysis Yet
            </h3>
            <p className="text-xs text-app-secondary max-w-sm mx-auto mb-3">
              Generate a personalized analysis for this participant to see
              insights specific to their session experience.
            </p>
            {onGenerateClientAnalysis && (
              <Button
                onClick={onGenerateClientAnalysis}
                disabled={generatingClientAnalysis}
                size="sm"
                className="bg-app-primary hover:bg-app-primary/90"
              >
                {generatingClientAnalysis ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Generate Analysis
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Section */}
      {displaySummary && (
        <Card className="border-app-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-app-surface rounded-lg flex-shrink-0">
                {showPersonalized ? (
                  <User className="h-5 w-5 text-app-secondary" />
                ) : (
                  <MessageSquare className="h-5 w-5 text-app-secondary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-semibold text-app-primary">
                    {showPersonalized
                      ? 'Personalized Summary'
                      : 'Session Summary'}
                  </h3>
                  <span className="w-1.5 h-1.5 bg-app-secondary rounded-full" />
                  <span className="text-xs text-app-secondary">
                    AI Generated
                  </span>
                </div>
                <p className="text-app-secondary leading-relaxed">
                  {displaySummary}
                </p>

                {/* Engagement & Sentiment for personalized view */}
                {showPersonalized &&
                  (clientAnalysis?.engagement_level ||
                    clientAnalysis?.sentiment_overall) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {clientAnalysis?.engagement_level && (
                        <span className="px-2.5 py-1 bg-app-surface rounded-full text-xs text-app-primary font-medium">
                          Engagement: {clientAnalysis.engagement_level}
                        </span>
                      )}
                      {clientAnalysis?.sentiment_overall && (
                        <span className="px-2.5 py-1 bg-app-surface rounded-full text-xs text-app-primary font-medium">
                          Sentiment: {clientAnalysis.sentiment_overall}
                        </span>
                      )}
                      {clientAnalysis?.emotions_detected &&
                        clientAnalysis.emotions_detected.length > 0 && (
                          <span className="px-2.5 py-1 bg-app-surface rounded-full text-xs text-app-primary font-medium">
                            {clientAnalysis.emotions_detected
                              .slice(0, 3)
                              .join(', ')}
                          </span>
                        )}
                    </div>
                  )}

                {/* Topics */}
                {displayTopics.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-app-border">
                    <p className="text-xs text-app-secondary uppercase tracking-wider font-medium mb-2">
                      Key Topics
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {displayTopics.slice(0, 6).map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-app-surface rounded-full text-sm text-app-primary"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Recording */}
      {videoUrl && onRefreshVideoUrl && !isViewer && (
        <VideoPlayer
          videoUrl={videoUrl}
          sessionId={sessionId}
          onRefresh={onRefreshVideoUrl}
        />
      )}

      {/* Commitments and Wins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!isViewer &&
          (isGroupSession && selectedClientId === null ? (
            <GroupAggregatedCommitments sessionId={sessionId} />
          ) : (
            <SessionCommitmentsList
              sessionId={sessionId}
              clientId={clientId}
              commitments={
                isGroupSession && selectedClientId
                  ? (commitments || []).filter(
                      c => c.client_id === selectedClientId,
                    )
                  : commitments || []
              }
              onUpdate={onRefreshCommitments || (() => {})}
              isCompleted={isCompleted}
              commitmentsLoaded={commitmentsLoaded}
              onCreateCommitment={onCreateCommitment}
            />
          ))}
        <SessionWins
          sessionId={sessionId}
          clientId={clientId || ''}
          isViewer={isViewer}
          isCompleted={isCompleted}
        />
      </div>

      {/* Notes and Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SessionNotesCompact
          sessionId={sessionId}
          isViewer={isViewer}
          clientId={isGroupSession ? selectedClientId : undefined}
        />
        <SessionResourcesCompact
          sessionId={sessionId}
          clientId={clientId}
          isViewer={isViewer}
        />
      </div>

      {/* Insights — Bento Grid */}
      {topInsights.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-app-secondary" />
              <h3 className="text-sm font-semibold text-app-primary">
                Key Insights
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAnalysis}
              className="text-xs text-app-secondary hover:text-app-primary"
            >
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topInsights.map((insight, idx) => (
              <Card
                key={idx}
                className="border-app-border shadow-sm hover:shadow-md transition-shadow group"
              >
                <CardContent className="p-5">
                  <span className="text-[40px] font-bold leading-none text-app-border group-hover:text-app-secondary/20 transition-colors">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <p className="mt-3 text-sm text-app-primary leading-relaxed">
                    {insight}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Actions */}
      {topActionItems.length > 0 && (
        <Card className="border-app-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-app-secondary" />
                <h3 className="text-sm font-semibold text-app-primary">
                  Suggested Actions
                </h3>
                <span className="text-xs text-app-secondary">
                  ({topActionItems.length})
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAnalysis}
                className="text-xs text-app-secondary hover:text-app-primary"
              >
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {topActionItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-app-surface"
                >
                  <div className="flex-shrink-0 mt-1 w-3.5 h-3.5 rounded-full border-[1.5px] border-app-secondary/40" />
                  <p className="text-sm text-app-primary leading-relaxed">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personalized Coaching Suggestions */}
      {showPersonalized && displaySuggestions.length > 0 && (
        <Card className="border-app-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-app-secondary" />
              <h3 className="text-sm font-semibold text-app-primary">
                Coaching Suggestions
              </h3>
              <span className="text-xs text-app-secondary">(Personalized)</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {displaySuggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-app-surface"
                >
                  <span className="flex-shrink-0 mt-0.5 text-xs font-bold text-app-secondary/60">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <p className="text-sm text-app-primary leading-relaxed">
                    {suggestion}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Session Focus */}
      {insights?.recommendations?.next_session_focus &&
        insights.recommendations.next_session_focus.length > 0 && (
          <Card className="border-app-border shadow-sm bg-app-surface">
            <CardContent className="py-4 px-6">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="flex items-center gap-2 mr-1">
                  <TrendingUp className="h-3.5 w-3.5 text-app-secondary" />
                  <span className="text-xs font-semibold text-app-secondary uppercase tracking-wider">
                    Next Session
                  </span>
                </div>
                {insights.recommendations.next_session_focus
                  .slice(0, 6)
                  .map((focus, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-gray-800 border border-app-border text-sm text-app-primary"
                    >
                      {focus}
                    </span>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Transcript */}
      {transcript && transcript.length > 0 && !isViewer && (
        <Collapsible open={transcriptOpen} onOpenChange={setTranscriptOpen}>
          <Card className="border-app-border shadow-sm">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-app-surface transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-app-secondary" />
                    <div>
                      <h3 className="text-sm font-semibold text-app-primary">
                        Session Transcript
                      </h3>
                      <p className="text-xs text-app-secondary">
                        {transcript.length} messages
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-app-secondary"
                  >
                    {transcriptOpen ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" /> Collapse
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" /> Expand
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="border-t border-app-border pt-4 space-y-6">
                  <TranscriptViewer transcript={transcript} />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Empty State */}
      {!insights &&
        !clientAnalysis &&
        !(isGroupSession && selectedClientId) && (
          <Card className="border-dashed border-2 border-app-border">
            <CardContent className="py-16 text-center">
              <div className="w-12 h-12 bg-app-surface rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-app-secondary" />
              </div>
              <h3 className="text-base font-semibold text-app-primary mb-2">
                No Analysis Yet
              </h3>
              <p className="text-sm text-app-secondary max-w-sm mx-auto mb-4">
                Generate AI analysis to see session insights, action items, and
                recommendations.
              </p>
              <Button
                onClick={onViewAnalysis}
                className="bg-app-primary hover:bg-app-primary/90"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Analysis
              </Button>
            </CardContent>
          </Card>
        )}
    </div>
  )
}
