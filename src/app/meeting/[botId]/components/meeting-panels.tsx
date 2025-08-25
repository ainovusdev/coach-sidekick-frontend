import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TranscriptViewer } from '@/components/meeting/transcript-viewer'
import { CoachingPanel } from '@/components/meeting/coaching-panel'
import { ClientProfileCard } from '@/components/meeting/client-profile-card'
import { SimilarSessionsCard } from '@/components/meeting/similar-sessions-card'
import { PatternInsightsCard } from '@/components/meeting/pattern-insights-card'
import { cn } from '@/lib/utils'
import { TranscriptEntry } from '@/types/meeting'
import { useState } from 'react'
import { useCoachingWebSocket } from '@/hooks/use-coaching-websocket'
import { MessageSquare } from 'lucide-react'

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

  // Get recent transcript entries (last 8 messages to prevent overflow)
  const recentTranscript = transcript.slice(-5)

  // Handle WebSocket updates for context
  useCoachingWebSocket(botId, {
    onMessage: message => {
      if (message.type === 'suggestions_update') {
        if (message.data.full_context) {
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
    <div
      className={cn(
        'grid grid-cols-1 lg:grid-cols-10 gap-4 transition-all duration-300 h-full',
      )}
    >
      {/* Left Column - Transcript (3/10) */}
      <div className="lg:col-span-3 h-full overflow-hidden">
        <Card className="h-full flex flex-col bg-white shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b bg-gray-50 flex-shrink-0">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-gray-600" />
              Recent Conversation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <TranscriptViewer transcript={recentTranscript} compact={true} />
            </div>
            {transcript.length > 8 && (
              <div className="text-center py-2 mt-2 border-t flex-shrink-0">
                <span className="text-xs text-gray-500">
                  Showing last {recentTranscript.length} of {transcript.length}{' '}
                  messages
                </span>
              </div>
            )}
          </CardContent>
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
        <div className="h-full overflow-y-auto space-y-3 pr-2">
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

          {/* Pattern Insights */}
          <PatternInsightsCard
            currentPatterns={patterns}
            patternHistory={fullContext?.pattern_history}
            recurringThemes={fullContext?.recurring_themes}
            insights={fullContext?.insights}
            compact={true}
          />
        </div>
      </div>
    </div>
  )
}
