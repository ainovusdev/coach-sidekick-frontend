import { Card, CardContent } from '@/components/ui/card'
import { TranscriptViewer } from '@/components/meeting/transcript-viewer'
import { CoachingPanel } from '@/components/meeting/coaching-panel'
import { ClientProfileCard } from '@/components/meeting/client-profile-card'
import { SimilarSessionsCard } from '@/components/meeting/similar-sessions-card'
import { PatternInsightsCard } from '@/components/meeting/pattern-insights-card'
import { AnalysisConversationsCard } from '@/components/meeting/analysis-conversations-card'
import { QuickNote } from '@/components/session-notes/quick-note'
import { QuickCommitment } from '@/components/commitments/quick-commitment'
import { TranscriptEntry } from '@/types/meeting'
import { useState, useEffect } from 'react'
import { useCoachingWebSocket } from '@/hooks/use-coaching-websocket'
import {
  FileText,
  Target,
  User,
  History,
  TrendingUp,
  MessageSquareText,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Info,
  Sparkles,
} from 'lucide-react'
import { MeetingContextService } from '@/services/meeting-context-service'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MeetingPanelsProps {
  transcript: TranscriptEntry[]
  botId: string
  sessionId?: string
  clientId?: string
}

type SidebarTab = 'transcript' | 'context'

export default function MeetingPanels({
  transcript,
  botId,
  sessionId,
  clientId,
}: MeetingPanelsProps) {
  const [fullContext, setFullContext] = useState<any>(null)
  const [patterns, setPatterns] = useState<any[]>([])
  const [contextLoading, setContextLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('transcript')
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(true)

  const recentTranscript = transcript

  useEffect(() => {
    const fetchContext = async () => {
      try {
        setContextLoading(true)
        const context = clientId
          ? await MeetingContextService.getMeetingContextWithClientId(
              botId,
              clientId,
            )
          : await MeetingContextService.getMeetingContext(botId)
        if (context) {
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

    fetchContext()
    const intervalId = setInterval(fetchContext, 30000)
    return () => clearInterval(intervalId)
  }, [botId, clientId])

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
    <div className="h-full flex overflow-hidden">
      {/* AI Suggestions Toggle Button */}
      <div className="flex-shrink-0 flex items-start pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAiSuggestionsOpen(!aiSuggestionsOpen)}
          className={cn(
            'h-auto py-3 px-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-r-lg rounded-l-none border-l-0',
            aiSuggestionsOpen && 'bg-gray-100 dark:bg-gray-700',
          )}
        >
          <div className="flex flex-col items-center gap-2">
            {aiSuggestionsOpen ? (
              <PanelLeftClose className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <PanelLeftOpen className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            )}
            <Sparkles className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
          </div>
        </Button>
      </div>

      {/* Collapsible AI Suggestions Panel */}
      <div
        className={cn(
          'flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden',
          aiSuggestionsOpen ? 'w-80 lg:w-96' : 'w-0',
        )}
      >
        <div className="w-80 lg:w-96 h-full">
          <CoachingPanel
            botId={botId}
            className="h-full shadow-sm"
            simplified={true}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-8 gap-4 min-h-0 overflow-hidden p-1">
        {/* Left Column - Notes (5/8) */}
        <div className="lg:col-span-5 h-full overflow-hidden">
          {sessionId ? (
            <QuickNote sessionId={sessionId} noteType="coach_private" />
          ) : (
            <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <FileText className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notes
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Session loading...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Commitments (3/8) */}
        <div className="lg:col-span-3 h-full overflow-hidden">
          {sessionId && clientId ? (
            <QuickCommitment sessionId={sessionId} clientId={clientId} />
          ) : sessionId && !clientId ? (
            <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-amber-100 dark:border-amber-900/50 h-full">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                    <Target className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Commitments
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      No client selected
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Target className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Commitments
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Session loading...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Sidebar Toggle Button */}
      <div className="flex-shrink-0 flex items-start pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            'h-auto py-3 px-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-l-lg rounded-r-none border-r-0',
            sidebarOpen && 'bg-gray-100 dark:bg-gray-700',
          )}
        >
          <div className="flex flex-col items-center gap-2">
            {sidebarOpen ? (
              <PanelRightClose className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <PanelRightOpen className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            )}
            <div className="flex flex-col items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
              <Info className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
        </Button>
      </div>

      {/* Collapsible Sidebar */}
      <div
        className={cn(
          'flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden',
          sidebarOpen ? 'w-80' : 'w-0',
        )}
      >
        <div className="w-80 h-full flex flex-col">
          {/* Sidebar Tabs */}
          <div className="flex-shrink-0 border-b border-gray-100 dark:border-gray-700">
            <div className="flex">
              <button
                onClick={() => setSidebarTab('transcript')}
                className={cn(
                  'flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 flex items-center justify-center gap-1.5',
                  sidebarTab === 'transcript'
                    ? 'text-gray-900 dark:text-white border-gray-900 dark:border-white'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300',
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Transcript
                {transcript.length > 0 && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">
                    {transcript.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSidebarTab('context')}
                className={cn(
                  'flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 flex items-center justify-center gap-1.5',
                  sidebarTab === 'context'
                    ? 'text-gray-900 dark:text-white border-gray-900 dark:border-white'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300',
                )}
              >
                <Info className="h-3.5 w-3.5" />
                Context
              </button>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-hidden">
            {sidebarTab === 'transcript' ? (
              <TranscriptViewer
                transcript={recentTranscript}
                mode="sidebar"
                autoScroll={true}
              />
            ) : (
              <div className="h-full overflow-y-auto">
                <Accordion
                  type="multiple"
                  defaultValue={['profile']}
                  className="divide-y divide-gray-100 dark:divide-gray-700"
                >
                  {/* Client Profile */}
                  <AccordionItem value="profile" className="border-none">
                    <AccordionTrigger className="px-4 py-2.5 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-700 text-xs">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Client Profile
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3">
                      {contextLoading ? (
                        <div className="animate-pulse space-y-2">
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                        </div>
                      ) : (
                        <ClientProfileCard
                          profile={fullContext?.client_profile}
                          insights={fullContext?.insights}
                          compact={true}
                        />
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Similar Sessions */}
                  <AccordionItem value="similar" className="border-none">
                    <AccordionTrigger className="px-4 py-2.5 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-700 text-xs">
                      <div className="flex items-center gap-2">
                        <History className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Similar Sessions
                        </span>
                        {(fullContext?.similar_sessions?.length || 0) > 0 && (
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">
                            {fullContext?.similar_sessions?.length}
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3">
                      {contextLoading ? (
                        <div className="animate-pulse space-y-2">
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
                        </div>
                      ) : (
                        <SimilarSessionsCard
                          sessions={fullContext?.similar_sessions || []}
                          summaries={fullContext?.session_summaries}
                          compact={true}
                        />
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Pattern Insights */}
                  <AccordionItem value="patterns" className="border-none">
                    <AccordionTrigger className="px-4 py-2.5 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-700 text-xs">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Pattern Insights
                        </span>
                        {patterns.length > 0 && (
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">
                            {patterns.length}
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3">
                      {contextLoading ? (
                        <div className="animate-pulse space-y-2">
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-4/5"></div>
                        </div>
                      ) : (
                        <PatternInsightsCard
                          currentPatterns={patterns}
                          patternHistory={fullContext?.pattern_history}
                          recurringThemes={fullContext?.recurring_themes}
                          insights={fullContext?.insights}
                          compact={true}
                        />
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Analysis Conversations */}
                  <AccordionItem value="analysis" className="border-none">
                    <AccordionTrigger className="px-4 py-2.5 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-700 text-xs">
                      <div className="flex items-center gap-2">
                        <MessageSquareText className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Analysis
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3">
                      <AnalysisConversationsCard
                        conversations={fullContext?.analysis_conversations}
                        loading={contextLoading}
                        compact={true}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
