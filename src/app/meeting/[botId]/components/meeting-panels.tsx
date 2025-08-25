import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TranscriptViewer } from '@/components/meeting/transcript-viewer'
import { CoachingPanel } from '@/components/meeting/coaching-panel'
import { ClientProfileCard } from '@/components/meeting/client-profile-card'
import { SimilarSessionsCard } from '@/components/meeting/similar-sessions-card'
import { PatternInsightsCard } from '@/components/meeting/pattern-insights-card'
import { AnalysisConversationsCard } from '@/components/meeting/analysis-conversations-card'
import { TranscriptEntry } from '@/types/meeting'
import { useState, useEffect } from 'react'
import { useCoachingWebSocket } from '@/hooks/use-coaching-websocket'
import { MessageSquare } from 'lucide-react'
import { MeetingContextService } from '@/services/meeting-context-service'

interface MeetingPanelsProps {
  transcript: TranscriptEntry[]
  botId: string
  showDebug: boolean
}

export default function MeetingPanels({
  transcript,
  botId,
}: MeetingPanelsProps) {
  const [fullContext, setFullContext] = useState<any>(null)
  const [patterns, setPatterns] = useState<any[]>([])
  const [contextLoading, setContextLoading] = useState(true)

  // Get recent transcript entries
  const recentTranscript = transcript

  // Fetch meeting context on mount and periodically
  useEffect(() => {
    const fetchContext = async () => {
      try {
        setContextLoading(true)
        const context = await MeetingContextService.getMeetingContext(botId)
        if (context) {
          console.log('Meeting context fetched:', context)
          setFullContext(context)
          if (context.patterns) {
            setPatterns(context.patterns)
          }
        }
      } catch (error) {
        console.error('Failed to fetch meeting context:', error)
      } finally {
        setContextLoading(false)
      }
    }

    // Fetch immediately
    fetchContext()

    // Refresh context every 30 seconds
    const intervalId = setInterval(fetchContext, 30000)

    return () => clearInterval(intervalId)
  }, [botId])

  // Handle WebSocket updates for context (as fallback or real-time updates)
  useCoachingWebSocket(botId, {
    onMessage: message => {
      if (message.type === 'suggestions_update') {
        if (message.data.full_context) {
          console.log('Context update from WebSocket:', message.data.full_context)
          setFullContext(message.data.full_context)
        }
      }
    },
    onMeetingState: state => {
      if (state.patterns) {
        setPatterns(state.patterns)
      }
    },
  })

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-10 gap-4 overflow-hidden">
      {/* Left Column - Transcript (3/10) */}
      <div className="lg:col-span-3 h-full overflow-hidden">
        <Card className="h-full flex flex-col bg-white shadow-sm">
          <CardHeader className="pb-3 border-b bg-gray-50 flex-shrink-0">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-gray-600" />
              Recent Conversation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-grow min-h-0 relative">
            <div className="absolute inset-0 overflow-y-auto px-4 py-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <TranscriptViewer transcript={recentTranscript} compact={true} autoScroll={true} />
            </div>
          </CardContent>
          {transcript.length > 0 && (
            <div className="flex-shrink-0 text-center py-2 px-4 border-t bg-gray-50">
              <span className="text-xs text-gray-500 font-medium">
                {transcript.length} entries
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Center Column - Coaching Suggestions (4/10) */}
      <div className="lg:col-span-4 h-full overflow-hidden">
        <CoachingPanel
          botId={botId}
          className="h-full shadow-sm"
          simplified={true}
        />
      </div>

      {/* Right Column - Context (3/10) */}
      <div className="lg:col-span-3 h-full overflow-hidden">
        <div className="h-full overflow-y-auto space-y-3 px-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {contextLoading ? (
            <>
              {/* Loading states for context cards */}
              <Card className="h-auto animate-pulse">
                <CardHeader className="pb-2 py-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="h-auto animate-pulse">
                <CardHeader className="pb-2 py-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Client Profile */}
              <ClientProfileCard
                profile={fullContext?.client_profile}
                insights={fullContext?.insights}
                compact={true}
              />

              {/* Similar Sessions */}
              <SimilarSessionsCard
                sessions={fullContext?.similar_sessions || []}
                summaries={fullContext?.session_summaries}
                compact={true}
              />

              {/* Analysis Conversations */}
              <AnalysisConversationsCard
                conversations={fullContext?.analysis_conversations}
                loading={contextLoading}
                compact={true}
              />

              {/* Pattern Insights */}
              <PatternInsightsCard
                currentPatterns={patterns}
                patternHistory={fullContext?.pattern_history}
                recurringThemes={fullContext?.recurring_themes}
                insights={fullContext?.insights}
                compact={true}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
