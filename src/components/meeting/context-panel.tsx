'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCoachingWebSocket } from '@/hooks/use-coaching-websocket'
import { ClientProfileCard } from './client-profile-card'
import { SimilarSessionsCard } from './similar-sessions-card'
import { PatternInsightsCard } from './pattern-insights-card'
import {
  TrendingUp,
  Users,
  Brain,
  Activity,
  Target,
  Lightbulb,
  AlertTriangle,
  Clock,
  MessageSquare,
  Zap,
  User,
  History,
  Sparkles
} from 'lucide-react'

interface Pattern {
  name: string
  intensity: number
  type: 'positive' | 'negative' | 'neutral'
  description?: string
}

interface MeetingState {
  phase: string
  energy: string
  flow: string
  participation: string
  mood: string
  key_topic: string
  coach_effectiveness: string
  client_engagement: string
  patterns?: string[]
  dominant_pattern?: string
}

interface ContextPanelProps {
  botId: string
  className?: string
}

export function ContextPanel({ botId, className }: ContextPanelProps) {
  const [meetingState, setMeetingState] = useState<MeetingState | null>(null)
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [contextInfo, setContextInfo] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [fullContext, setFullContext] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Handle WebSocket updates
  useCoachingWebSocket(botId, {
    onMeetingState: (state) => {
      console.log('[Context Panel] Meeting state update:', state)
      setMeetingState(state)
      
      // Extract patterns if available
      if (state.patterns) {
        const newPatterns: Pattern[] = state.patterns.map((p: string) => ({
          name: p,
          intensity: 0.7,
          type: getPatternType(p)
        }))
        setPatterns(newPatterns)
      }
    },
    onMessage: (message) => {
      if (message.type === 'ALERT') {
        setAlerts(prev => [...prev.slice(-2), message.data])
      }
      if (message.type === 'suggestions_update') {
        if (message.data.context) {
          setContextInfo(message.data.context)
        }
        if (message.data.full_context) {
          setFullContext(message.data.full_context)
        }
      }
    }
  })

  const getPatternType = (pattern: string): 'positive' | 'negative' | 'neutral' => {
    const positive = ['breakthrough', 'engaged_discussion', 'active_questioning', 'productive']
    const negative = ['resistance', 'one_sided_conversation', 'short_responses', 'challenging']
    
    if (positive.some(p => pattern.toLowerCase().includes(p))) return 'positive'
    if (negative.some(p => pattern.toLowerCase().includes(p))) return 'negative'
    return 'neutral'
  }

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'opening': return <Clock className="h-4 w-4" />
      case 'exploration': return <Brain className="h-4 w-4" />
      case 'deepening': return <Target className="h-4 w-4" />
      case 'action': return <Zap className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const getEnergyColor = (energy: string) => {
    switch (energy) {
      case 'high': return 'text-green-600 bg-green-50'
      case 'low': return 'text-red-600 bg-red-50'
      default: return 'text-yellow-600 bg-yellow-50'
    }
  }

  return (
    <div className={`${className} h-full flex flex-col`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-4 h-9">
          <TabsTrigger value="overview" className="text-xs">
            <Activity className="h-3 w-3 mr-1" />
            Live
          </TabsTrigger>
          <TabsTrigger value="profile" className="text-xs">
            <User className="h-3 w-3 mr-1" />
            Client
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">
            <History className="h-3 w-3 mr-1" />
            Similar
          </TabsTrigger>
          <TabsTrigger value="patterns" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Patterns
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          {/* Overview Tab */}
          <TabsContent value="overview" className="h-full overflow-y-auto space-y-3 mt-3">
            {/* Meeting State Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-blue-600" />
                  Meeting Dynamics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {meetingState ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Phase</span>
                      <div className="flex items-center gap-1">
                        {getPhaseIcon(meetingState.phase)}
                        <span className="text-xs font-medium capitalize">
                          {meetingState.phase}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Energy</span>
                      <Badge className={`text-xs ${getEnergyColor(meetingState.energy)}`}>
                        {meetingState.energy}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Engagement</span>
                      <span className="text-xs font-medium capitalize">
                        {meetingState.client_engagement?.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {meetingState.key_topic && (
                      <div className="pt-2 border-t">
                        <span className="text-xs text-gray-600">Topic: </span>
                        <span className="text-xs font-medium">
                          {meetingState.key_topic.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 text-xs text-gray-500">
                    Analyzing conversation dynamics...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Patterns */}
            {patterns.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Brain className="h-4 w-4 text-purple-600" />
                    Active Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {patterns.slice(0, 3).map((pattern, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-xs capitalize">
                        {pattern.name.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        {pattern.type === 'positive' && (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        )}
                        {pattern.type === 'negative' && (
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        )}
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              pattern.type === 'positive' ? 'bg-green-500' :
                              pattern.type === 'negative' ? 'bg-red-500' :
                              'bg-gray-400'
                            }`}
                            style={{ width: `${pattern.intensity * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Alerts */}
            {alerts.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm text-orange-700">
                    <AlertTriangle className="h-4 w-4" />
                    Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {alerts.map((alert, index) => (
                    <div key={index} className="text-xs text-orange-700">
                      {alert.message || alert}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Client Profile Tab */}
          <TabsContent value="profile" className="h-full overflow-y-auto mt-3">
            <ClientProfileCard 
              profile={fullContext?.client_profile}
              insights={fullContext?.insights}
            />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="h-full overflow-y-auto mt-3">
            <SimilarSessionsCard 
              sessions={fullContext?.similar_sessions || []}
              summaries={fullContext?.session_summaries}
            />
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="h-full overflow-y-auto mt-3">
            <PatternInsightsCard 
              currentPatterns={patterns.map(p => p.name)}
              patternHistory={fullContext?.pattern_history}
              recurringThemes={fullContext?.recurring_themes}
              insights={fullContext?.insights}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}