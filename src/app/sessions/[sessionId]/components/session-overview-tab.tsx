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

  // Top 3 insights only
  const topInsights = insights?.insights?.slice(0, 3) || []
  const topActionItems = insights?.action_items?.slice(0, 3) || []

  console.log('SessionOverviewTab - clientId:', clientId)
  console.log('SessionOverviewTab - commitments from props:', commitments)
  console.log('SessionOverviewTab - commitments length:', commitments?.length)

  return (
    <div className="space-y-6">
      {/* Summary Section - Modern Design */}
      {insights?.summary && (
        <div className="relative overflow-hidden">
          <Card className="border-gray-200 shadow-sm bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-8">
              {/* Summary Text */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-black rounded-lg">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-black">
                    Session Summary
                  </h3>
                </div>
                <p className="text-gray-700 text-base leading-relaxed pl-12">
                  {insights.summary}
                </p>
              </div>

              {/* Topics - Modern Pills */}
              {insights.topics && insights.topics.length > 0 && (
                <div className="pl-12">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">
                    Key Topics
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {insights.topics.slice(0, 8).map((topic, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-black hover:border-black hover:shadow-sm transition-all"
                      >
                        {topic}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Session Recording */}
      {onRefreshVideoUrl && (
        <VideoPlayer
          videoUrl={videoUrl}
          sessionId={sessionId}
          onRefresh={onRefreshVideoUrl}
        />
      )}

      {/* Commitments and Wins Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Commitments */}
        {!isViewer && (
          <SessionCommitmentsList
            sessionId={sessionId}
            commitments={commitments || []}
            onUpdate={onRefreshCommitments || (() => {})}
          />
        )}

        {/* Right: Wins */}
        {clientId && (
          <SessionWins
            sessionId={sessionId}
            clientId={clientId}
            isViewer={isViewer}
          />
        )}
      </div>

      {/* Notes Section */}
      <SessionNotesCompact sessionId={sessionId} onViewAll={onViewNotes} />

      {/* Insights and Action Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Insights */}
        {topInsights.length > 0 && (
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-black" />
                  <h3 className="text-base font-semibold text-black">
                    Top Insights
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onViewAnalysis}
                  className="text-xs hover:bg-gray-50"
                >
                  View All
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topInsights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Items from Analysis */}
        {topActionItems.length > 0 && (
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-black" />
                  <h3 className="text-base font-semibold text-black">
                    Suggested Actions
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onViewAnalysis}
                  className="text-xs hover:bg-gray-50"
                >
                  View All
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topActionItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-black transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommendations Preview */}
      {insights?.recommendations?.next_session_focus &&
        insights.recommendations.next_session_focus.length > 0 && (
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-black" />
                <h3 className="text-base font-semibold text-black">
                  Next Session Focus
                </h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.recommendations.next_session_focus
                  .slice(0, 4)
                  .map((focus, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 p-3 bg-white border border-gray-200 rounded-lg"
                    >
                      <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">{focus}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Collapsible Transcript Section */}
      {transcript && transcript.length > 0 && !isViewer && (
        <Collapsible open={transcriptOpen} onOpenChange={setTranscriptOpen}>
          <Card className="border-gray-200 shadow-sm">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <h3 className="text-base font-semibold text-black">
                      Session Transcript
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {transcript.length} messages
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-gray-100"
                  >
                    {transcriptOpen ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Collapse
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Expand
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="border-t border-gray-100 pt-4">
                  <TranscriptViewer transcript={transcript} />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Empty State */}
      {!insights && (
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="py-16 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Analysis Available Yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Generate AI analysis to see session insights, recommendations, and
              key takeaways.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
