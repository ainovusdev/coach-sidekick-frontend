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
} from 'lucide-react'
import type { SessionInsights } from '@/services/analysis-service'
import type { Commitment } from '@/types/commitment'
import { SessionCommitmentsList } from './session-commitments-list'
import { SessionNotesCompact } from './session-notes-compact'
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

interface SessionOverviewTabProps {
  insights?: SessionInsights
  commitments?: Commitment[]
  sessionId: string
  clientId?: string
  transcript?: TranscriptEntry[]
  isViewer?: boolean
  videoUrl?: string | null
  onViewAnalysis: () => void
  onViewNotes: () => void
  onRefreshCommitments?: () => void
  onRefreshVideoUrl?: () => Promise<void>
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
  onViewNotes,
  onRefreshCommitments,
  onRefreshVideoUrl,
}: SessionOverviewTabProps) {
  const [transcriptOpen, setTranscriptOpen] = useState(false)

  const topInsights = insights?.insights?.slice(0, 3) || []
  const topActionItems = insights?.action_items?.slice(0, 3) || []

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      {insights?.summary && (
        <Card className="border-app-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-app-surface rounded-lg flex-shrink-0">
                <MessageSquare className="h-5 w-5 text-app-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-semibold text-app-primary">
                    Session Summary
                  </h3>
                  <span className="w-1.5 h-1.5 bg-app-secondary rounded-full" />
                  <span className="text-xs text-app-secondary">
                    AI Generated
                  </span>
                </div>
                <p className="text-app-secondary leading-relaxed">
                  {insights.summary}
                </p>

                {/* Topics */}
                {insights.topics && insights.topics.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-app-border">
                    <p className="text-xs text-app-secondary uppercase tracking-wider font-medium mb-2">
                      Key Topics
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {insights.topics.slice(0, 6).map((topic, idx) => (
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

      {/* Commitments and Wins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!isViewer && (
          <SessionCommitmentsList
            sessionId={sessionId}
            commitments={commitments || []}
            onUpdate={onRefreshCommitments || (() => {})}
          />
        )}
        {clientId && (
          <SessionWins
            sessionId={sessionId}
            clientId={clientId}
            isViewer={isViewer}
          />
        )}
      </div>

      {/* Notes */}
      <SessionNotesCompact sessionId={sessionId} onViewAll={onViewNotes} />

      {/* Insights and Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Insights */}
        {topInsights.length > 0 && (
          <Card className="border-app-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-app-secondary" />
                  <h3 className="text-sm font-semibold text-app-primary">
                    Top Insights
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
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {topInsights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 p-3 bg-app-surface rounded-lg"
                  >
                    <span className="flex-shrink-0 w-5 h-5 bg-app-primary text-white rounded text-xs flex items-center justify-center font-medium">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-app-secondary leading-relaxed">
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Items */}
        {topActionItems.length > 0 && (
          <Card className="border-app-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-app-secondary" />
                  <h3 className="text-sm font-semibold text-app-primary">
                    Suggested Actions
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
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {topActionItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 border border-app-border rounded-lg hover:border-app-secondary transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4 text-app-secondary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-app-secondary">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Next Session Focus */}
      {insights?.recommendations?.next_session_focus &&
        insights.recommendations.next_session_focus.length > 0 && (
          <Card className="border-app-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-app-secondary" />
                <h3 className="text-sm font-semibold text-app-primary">
                  Next Session Focus
                </h3>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {insights.recommendations.next_session_focus
                  .slice(0, 4)
                  .map((focus, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 p-3 bg-app-surface rounded-lg"
                    >
                      <ArrowRight className="h-4 w-4 text-app-secondary mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-app-secondary">{focus}</p>
                    </div>
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
                  {onRefreshVideoUrl && (
                    <VideoPlayer
                      videoUrl={videoUrl}
                      sessionId={sessionId}
                      onRefresh={onRefreshVideoUrl}
                    />
                  )}
                  <TranscriptViewer transcript={transcript} />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Empty State */}
      {!insights && (
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
