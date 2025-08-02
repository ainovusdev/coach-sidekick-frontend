'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { CoachingService } from '@/services/coaching-service'
import { useCoachingWebSocket } from '@/hooks/use-coaching-websocket'
import { useWebSocket } from '@/contexts/websocket-context'
import {
  Lightbulb,
  AlertCircle,
  Clock,
  Brain,
  Heart,
  Target,
  BarChart3,
  RefreshCw,
  Zap,
} from 'lucide-react'

interface CoachingSuggestion {
  id: string
  type: 'immediate' | 'reflection' | 'improvement'
  priority: 'high' | 'medium' | 'low'
  category: string
  suggestion: string
  rationale: string
  timing: 'now' | 'next_pause' | 'end_of_call'
  timestamp: string
  source: 'openai' | 'personal-ai'
}

interface PersonalAISuggestion {
  id: string
  suggestion: string
  confidence: number
  source: 'personal-ai'
  timestamp: string
}

interface CoachingAnalysis {
  overallScore: number
  conversationPhase:
    | 'opening'
    | 'exploration'
    | 'insight'
    | 'commitment'
    | 'closing'
  coachEnergyLevel: number
  clientEngagementLevel: number
  suggestions: CoachingSuggestion[]
  personalAISuggestions: PersonalAISuggestion[]
  timestamp: string
}

interface CoachingPanelProps {
  botId: string
  className?: string
}

export function CoachingPanel({ botId, className }: CoachingPanelProps) {
  const [suggestions, setSuggestions] = useState<CoachingSuggestion[]>([])
  const [personalAISuggestions, setPersonalAISuggestions] = useState<PersonalAISuggestion[]>([])
  const [analysis, setAnalysis] = useState<CoachingAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [metadata, setMetadata] = useState<any>(null)
  const { isConnected } = useWebSocket()

  const fetchSuggestions = useCallback(async (autoAnalyze: boolean = true) => {
    try {
      setLoading(true)
      setError(null)

      // Get suggestions from backend
      const suggestionsData = await CoachingService.getSuggestions(botId)
      
      // Transform backend data to component format
      const transformedSuggestions: CoachingSuggestion[] = suggestionsData.suggestions.map((s, index) => ({
        id: s.id,
        type: s.suggestion_type === 'real_time' ? 'immediate' : 'reflection',
        priority: s.metadata?.confidence && s.metadata.confidence > 0.8 ? 'high' : 
                 s.metadata?.confidence && s.metadata.confidence > 0.5 ? 'medium' : 'low',
        category: s.metadata?.related_topic || 'general',
        suggestion: s.content,
        rationale: s.metadata?.source || 'AI Analysis',
        timing: s.suggestion_type === 'real_time' ? 'now' : 'next_pause',
        timestamp: s.created_at,
        source: s.metadata?.source === 'personal-ai' ? 'personal-ai' : 'openai'
      }))

      // Separate personal AI suggestions
      const personalAI = transformedSuggestions.filter(s => s.source === 'personal-ai')
      const openAI = transformedSuggestions.filter(s => s.source === 'openai')

      setSuggestions(openAI)
      setPersonalAISuggestions(personalAI.map((s, i) => ({
        id: s.id,
        suggestion: s.suggestion,
        confidence: parseFloat(s.priority === 'high' ? '0.9' : s.priority === 'medium' ? '0.7' : '0.5'),
        source: 'personal-ai' as const,
        timestamp: s.timestamp
      })))

      // If autoAnalyze is true and no suggestions exist, trigger analysis
      if (autoAnalyze && transformedSuggestions.length === 0) {
        try {
          await CoachingService.triggerAnalysis({ bot_id: botId, include_history: true })
          // Fetch again after triggering
          setTimeout(() => fetchSuggestions(false), 2000)
        } catch (analyzeError) {
          console.error('Failed to trigger analysis:', analyzeError)
        }
      }

      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [botId])

  const triggerAnalysis = async () => {
    try {
      setLoading(true)
      
      // Trigger analysis via backend
      await CoachingService.triggerAnalysis({
        bot_id: botId,
        include_history: true
      })

      // Refresh suggestions after analysis
      setTimeout(() => fetchSuggestions(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  // WebSocket event handlers
  const handleNewSuggestion = useCallback((suggestion: any) => {
    console.log('[WebSocket] New coaching suggestion:', suggestion)
    
    // Transform and add new suggestion
    const transformed: CoachingSuggestion = {
      id: suggestion.id,
      type: suggestion.suggestion_type === 'real_time' ? 'immediate' : 'reflection',
      priority: suggestion.metadata?.confidence && suggestion.metadata.confidence > 0.8 ? 'high' : 
               suggestion.metadata?.confidence && suggestion.metadata.confidence > 0.5 ? 'medium' : 'low',
      category: suggestion.metadata?.related_topic || 'general',
      suggestion: suggestion.content,
      rationale: suggestion.metadata?.source || 'AI Analysis',
      timing: suggestion.suggestion_type === 'real_time' ? 'now' : 'next_pause',
      timestamp: suggestion.created_at,
      source: suggestion.metadata?.source === 'personal-ai' ? 'personal-ai' : 'openai'
    }
    
    if (transformed.source === 'personal-ai') {
      setPersonalAISuggestions(prev => [...prev, {
        id: transformed.id,
        suggestion: transformed.suggestion,
        confidence: parseFloat(transformed.priority === 'high' ? '0.9' : transformed.priority === 'medium' ? '0.7' : '0.5'),
        source: 'personal-ai' as const,
        timestamp: transformed.timestamp
      }])
    } else {
      setSuggestions(prev => [...prev, transformed])
    }
    
    setLastUpdate(new Date())
  }, [])

  const handleAnalysisUpdate = useCallback((data: { analysisId: string; status: string; results?: any }) => {
    console.log('[WebSocket] Analysis update:', data)
    
    if (data.status === 'completed' && data.results) {
      // Update with new analysis results
      setAnalysis({
        overallScore: data.results.overall_score || 0,
        conversationPhase: 'exploration',
        coachEnergyLevel: 0.8,
        clientEngagementLevel: 0.7,
        suggestions: [],
        personalAISuggestions: [],
        timestamp: new Date().toISOString()
      })
    }
  }, [])

  // Use WebSocket events
  useCoachingWebSocket(botId, {
    onSuggestion: handleNewSuggestion,
    onAnalysisUpdate: handleAnalysisUpdate
  })

  // Auto-refresh suggestions on mount and when disconnected
  useEffect(() => {
    fetchSuggestions()
    
    // Only use polling when WebSocket is disconnected
    if (!isConnected) {
      console.log('[Coaching Panel] Starting polling (WebSocket disconnected)')
      const interval = setInterval(() => fetchSuggestions(false), 15000)
      return () => clearInterval(interval)
    }
  }, [botId, isConnected, fetchSuggestions])

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'low':
        return <Lightbulb className="h-4 w-4 text-blue-500" />
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  const getTimingBadgeColor = (timing: string) => {
    switch (timing) {
      case 'now':
        return 'destructive'
      case 'next_pause':
        return 'default'
      case 'end_of_call':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'opening':
        return '🌅'
      case 'exploration':
        return '🔍'
      case 'insight':
        return '💡'
      case 'commitment':
        return '🎯'
      case 'closing':
        return '🏁'
      default:
        return '💬'
    }
  }

  if (error && error.includes('OpenAI API key')) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            OpenAI Configuration Required
          </h3>
          <p className="text-gray-600 text-sm">
            Add your OPENAI_API_KEY to the .env.local file to enable coaching
            analysis.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`${className} flex flex-col h-full`}>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Coaching Assistant
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchSuggestions()}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={triggerAnalysis}
                disabled={loading}
              >
                <Zap className="h-4 w-4" />
                Analyze
              </Button>
            </div>
          </div>
          {lastUpdate && (
            <p className="text-xs text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden">
          <Tabs
            defaultValue="suggestions"
            className="w-full h-full flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="suggestions">
                <div className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  AI Suggestions ({suggestions.length + personalAISuggestions.length})
                </div>
              </TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="scores">Scores</TabsTrigger>
            </TabsList>

            <TabsContent
              value="suggestions"
              className="flex-1 mt-4 overflow-y-auto"
            >
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pr-2">
                {/* OpenAI Suggestions Column */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">OpenAI ({suggestions.length})</h3>
                  </div>

                  {loading && (
                    <div className="text-center py-4 text-gray-500">
                      <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                      Analyzing...
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {suggestions.length === 0 && !loading && !error && (
                    <div className="text-center py-8 text-gray-500">
                      <Brain className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No OpenAI suggestions yet.</p>
                      <p className="text-xs mt-1">
                        {metadata?.transcriptLength
                          ? 'Keep the conversation going.'
                          : 'Waiting for conversation...'}
                      </p>
                    </div>
                  )}

                  {suggestions.map(suggestion => (
                    <Card key={suggestion.id} className="border-l-4 border-l-blue-500 bg-blue-50/30">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getPriorityIcon(suggestion.priority)}
                            {suggestion.timing === 'now' && (
                              <Badge variant="destructive" className="text-xs">
                                NOW
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(suggestion.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 leading-relaxed">
                          {suggestion.suggestion}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Personal AI Suggestions Column */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-4 w-4 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Personal AI ({personalAISuggestions.length})</h3>
                  </div>

                  {loading && (
                    <div className="text-center py-4 text-gray-500">
                      <div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                      Getting insights...
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {personalAISuggestions.length === 0 && !loading && !error && (
                    <div className="text-center py-8 text-gray-500">
                      <Zap className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No Personal AI suggestions yet.</p>
                      <p className="text-xs mt-1">
                        Need conversation history for insights.
                      </p>
                    </div>
                  )}

                  {personalAISuggestions.map(suggestion => (
                    <Card key={suggestion.id} className="border-l-4 border-l-purple-500 bg-purple-50/30">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(suggestion.confidence * 100)}%
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(suggestion.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 leading-relaxed">
                          {suggestion.suggestion}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="insights"
              className="flex-1 mt-4 overflow-y-auto"
            >
              <div className="pr-2">
                {analysis ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl mb-1">
                            {getPhaseIcon(analysis.conversationPhase)}
                          </div>
                          <p className="text-sm font-medium capitalize">
                            {analysis.conversationPhase.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            Conversation Phase
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl mb-1 font-bold text-purple-600">
                            {analysis.overallScore}/10
                          </div>
                          <p className="text-sm font-medium">Overall Score</p>
                          <p className="text-xs text-gray-500">
                            Coaching Quality
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm flex items-center gap-1">
                            <Zap className="h-4 w-4" />
                            Coach Energy
                          </span>
                          <span className="text-sm font-medium">
                            {analysis.coachEnergyLevel}/10
                          </span>
                        </div>
                        <Progress
                          value={analysis.coachEnergyLevel * 10}
                          className="h-2"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            Client Engagement
                          </span>
                          <span className="text-sm font-medium">
                            {analysis.clientEngagementLevel}/10
                          </span>
                        </div>
                        <Progress
                          value={analysis.clientEngagementLevel * 10}
                          className="h-2"
                        />
                      </div>
                    </div>

                    {metadata && (
                      <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                        <div className="grid grid-cols-2 gap-2">
                          <div>Session: {metadata.sessionAge} minutes</div>
                          <div>
                            Transcript: {metadata.transcriptLength} entries
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No analysis data available yet.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={triggerAnalysis}
                      className="mt-3"
                      disabled={loading}
                    >
                      Start Analysis
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="scores" className="flex-1 mt-4 overflow-y-auto">
              <div className="pr-2">
                {analysis ? (
                  <div className="space-y-3">
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-purple-600 mb-1">
                        {analysis.overallScore}/10
                      </div>
                      <p className="text-sm text-gray-600">
                        Overall Coaching Score
                      </p>
                    </div>

                    <Separator />

                    <div className="text-center text-sm text-gray-500">
                      <p>Detailed criteria scoring will be available</p>
                      <p>as the conversation progresses.</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No scoring data available yet.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
