import { Card, CardContent } from '@/components/ui/card'
import { TranscriptViewer } from '@/components/meeting/transcript-viewer'
import { CoachingPanel } from '@/components/meeting/coaching-panel'
import { ClientProfileCard } from '@/components/meeting/client-profile-card'
import { SimilarSessionsCard } from '@/components/meeting/similar-sessions-card'
import { PatternInsightsCard } from '@/components/meeting/pattern-insights-card'
import { QuickNote } from '@/components/session-notes/quick-note'
import { QuickCommitment } from '@/components/commitments/quick-commitment'
import { ParticipantSelector } from '@/components/group-session/participant-selector'
import { GroupSessionBadge } from '@/components/group-session/group-session-badge'
import { TranscriptEntry } from '@/types/meeting'
import { GroupSessionParticipant } from '@/types/group-session'
import { GroupSessionService } from '@/services/group-session-service'
import { useState, useEffect } from 'react'
import { useCoachingWebSocket } from '@/hooks/use-coaching-websocket'
import {
  FileText,
  Target,
  User,
  History,
  TrendingUp,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Info,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Video,
  Link2,
  ClipboardList,
  Dumbbell,
  FileEdit,
  Newspaper,
  Share2,
  Check,
  Loader2,
} from 'lucide-react'
import { MeetingContextService } from '@/services/meeting-context-service'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MeetingResourcesPanel } from './meeting-resources-panel'
import { PreSessionResponsesCompact } from '@/components/meeting/pre-session-responses-compact'
import { useResources } from '@/hooks/queries/use-resources'
import { useShareResource } from '@/hooks/mutations/use-resource-mutations'
import { CATEGORY_COLORS } from '@/types/resource'
import type { ResourceCategory } from '@/types/resource'

const RESOURCE_CATEGORY_ICONS: Record<string, typeof FileText> = {
  general: FileText,
  document: FileText,
  worksheet: ClipboardList,
  exercise: Dumbbell,
  article: Newspaper,
  template: FileEdit,
  video: Video,
  link: Link2,
}

interface MeetingPanelsProps {
  transcript: TranscriptEntry[]
  botId: string
  sessionId?: string
  clientId?: string
  isGroupSession?: boolean
  isMeetingEnded?: boolean
}

type SidebarTab = 'transcript' | 'context' | 'resources' | 'questionnaire'

export default function MeetingPanels({
  transcript,
  botId,
  sessionId,
  clientId,
  isGroupSession,
  isMeetingEnded,
}: MeetingPanelsProps) {
  const [fullContext, setFullContext] = useState<any>(null)
  const [patterns, setPatterns] = useState<any[]>([])
  const [contextLoading, setContextLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('transcript')
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(true)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [commitmentsOpen, setCommitmentsOpen] = useState(true)
  const [sharingResourceId, setSharingResourceId] = useState<string | null>(
    null,
  )

  // Group session participant selection
  const [participants, setParticipants] = useState<GroupSessionParticipant[]>(
    [],
  )
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null)

  // Fetch participants for group sessions
  useEffect(() => {
    if (!isGroupSession || !sessionId) return
    const fetchParticipants = async () => {
      try {
        const data = await GroupSessionService.getParticipants(sessionId)
        setParticipants(data)
        // Auto-select first participant
        if (data.length > 0 && !selectedParticipantId) {
          setSelectedParticipantId(data[0].client_id)
        }
      } catch (error) {
        console.error('Failed to fetch group session participants:', error)
      }
    }
    fetchParticipants()
  }, [isGroupSession, sessionId])

  // Resolve the active client/session for commitments
  const selectedParticipant = participants.find(
    p => p.client_id === selectedParticipantId,
  )
  const commitmentClientId = isGroupSession
    ? selectedParticipant?.client_id
    : clientId
  const commitmentSessionId = sessionId

  // Resources for the collapsible section
  const { data: allResourcesData } = useResources({})
  const allResources = allResourcesData?.resources || []
  const shareResource = useShareResource()

  const handleQuickShare = async (resourceId: string) => {
    const targetClientId = commitmentClientId || clientId
    if (!targetClientId) return
    setSharingResourceId(resourceId)
    try {
      await shareResource.mutateAsync({
        id: resourceId,
        data: { shared_with_client_id: targetClientId },
      })
    } finally {
      setSharingResourceId(null)
    }
  }

  const isResourceSharedWithClient = (resource: (typeof allResources)[0]) => {
    const targetClientId = commitmentClientId || clientId
    if (!targetClientId) return false
    return resource.shares?.some(
      s =>
        s.shared_with_client_id === targetClientId ||
        s.shared_with_id === targetClientId,
    )
  }

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

      {/* Collapsible AI Suggestions Panel + Resources */}
      <div
        className={cn(
          'flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden',
          aiSuggestionsOpen ? 'w-72 xl:w-80 2xl:w-96' : 'w-0',
        )}
      >
        <div className="w-72 xl:w-80 2xl:w-96 h-full flex flex-col">
          <div className="flex-1 min-h-0 overflow-hidden">
            <CoachingPanel
              botId={botId}
              className="h-full shadow-sm"
              simplified={true}
            />
          </div>

          {/* Resources section below AI suggestions */}
          {allResources.length > 0 && (
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setResourcesOpen(!resourcesOpen)}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">
                    Resources
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1 py-0 h-4"
                  >
                    {allResources.length}
                  </Badge>
                </div>
                {resourcesOpen ? (
                  <ChevronUp className="h-3 w-3 text-gray-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                )}
              </button>

              {resourcesOpen && (
                <div className="px-3 pb-2 max-h-[180px] overflow-y-auto space-y-0.5">
                  {allResources.map(resource => {
                    const Icon =
                      RESOURCE_CATEGORY_ICONS[resource.category] || FileText
                    const colors =
                      CATEGORY_COLORS[resource.category as ResourceCategory] ||
                      CATEGORY_COLORS.general
                    const alreadyShared = isResourceSharedWithClient(resource)
                    const isSharing = sharingResourceId === resource.id
                    const targetClientId = commitmentClientId || clientId

                    return (
                      <div
                        key={resource.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <div className={`p-1 rounded ${colors.bg} shrink-0`}>
                          <Icon className={`h-3 w-3 ${colors.text}`} />
                        </div>
                        <p className="flex-1 min-w-0 text-[11px] font-medium text-gray-900 dark:text-white truncate">
                          {resource.title}
                        </p>
                        {targetClientId &&
                          (alreadyShared ? (
                            <div className="shrink-0 flex items-center gap-0.5 text-green-600 dark:text-green-400">
                              <Check className="h-2.5 w-2.5" />
                              <span className="text-[9px] font-medium">
                                Shared
                              </span>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-5 text-[9px] px-1.5 shrink-0"
                              onClick={() => handleQuickShare(resource.id)}
                              disabled={isSharing}
                            >
                              {isSharing ? (
                                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                              ) : (
                                <>
                                  <Share2 className="h-2.5 w-2.5 mr-0.5" />
                                  Share
                                </>
                              )}
                            </Button>
                          ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-1">
        {/* Participant tags for group sessions */}
        {isGroupSession && sessionId && participants.length > 0 && (
          <div className="flex-shrink-0 flex items-center gap-2 px-1 pb-2">
            <GroupSessionBadge count={participants.length} />
            <ParticipantSelector
              participants={participants}
              selectedId={selectedParticipantId}
              onSelect={setSelectedParticipantId}
            />
          </div>
        )}

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
          {/* Left Column - Notes + Resources (7/12 ≈ 58%) */}
          <div className="lg:col-span-7 xl:col-span-8 h-full overflow-hidden flex flex-col">
            <div className="flex-1 min-h-0 overflow-hidden">
              {sessionId ? (
                <QuickNote
                  sessionId={sessionId}
                  noteType="coach_private"
                  clientId={commitmentClientId || undefined}
                  isMeetingEnded={isMeetingEnded}
                />
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
          </div>

          {/* Right Column - Commitments (collapsible) */}
          <div
            className={cn(
              'overflow-hidden flex flex-col',
              commitmentsOpen
                ? 'lg:col-span-5 xl:col-span-4 h-full'
                : 'lg:col-span-5 xl:col-span-4',
            )}
          >
            <button
              onClick={() => setCommitmentsOpen(!commitmentsOpen)}
              className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-t-xl flex-shrink-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors lg:hidden"
            >
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  Commitments
                </span>
              </div>
              {commitmentsOpen ? (
                <ChevronUp className="h-3 w-3 text-gray-400" />
              ) : (
                <ChevronDown className="h-3 w-3 text-gray-400" />
              )}
            </button>
            <div
              className={cn(
                'flex-1 min-h-0 overflow-hidden flex flex-col gap-2',
                !commitmentsOpen && 'hidden lg:flex',
              )}
            >
              {commitmentSessionId && commitmentClientId ? (
                <QuickCommitment
                  sessionId={commitmentSessionId}
                  clientId={commitmentClientId}
                />
              ) : sessionId && !commitmentClientId ? (
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
              <BookOpen className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
        </Button>
      </div>

      {/* Collapsible Sidebar */}
      <div
        className={cn(
          'flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden',
          sidebarOpen ? 'w-72 xl:w-80' : 'w-0',
        )}
      >
        <div className="w-72 xl:w-80 h-full flex flex-col">
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
              <button
                onClick={() => setSidebarTab('resources')}
                className={cn(
                  'flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 flex items-center justify-center gap-1.5',
                  sidebarTab === 'resources'
                    ? 'text-gray-900 dark:text-white border-gray-900 dark:border-white'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300',
                )}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Resources
              </button>
              <button
                onClick={() => setSidebarTab('questionnaire')}
                className={cn(
                  'flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 flex items-center justify-center gap-1.5',
                  sidebarTab === 'questionnaire'
                    ? 'text-gray-900 dark:text-white border-gray-900 dark:border-white'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300',
                )}
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Q&A
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
            ) : sidebarTab === 'questionnaire' ? (
              <PreSessionResponsesCompact
                sessionId={sessionId}
                clientId={commitmentClientId || clientId}
              />
            ) : sidebarTab === 'resources' ? (
              <MeetingResourcesPanel
                clientId={commitmentClientId || clientId || ''}
                clientName={selectedParticipant?.client_name}
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
                </Accordion>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
