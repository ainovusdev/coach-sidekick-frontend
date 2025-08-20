'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CoachingService } from '@/services/coaching-service'
import { useCoachingWebSocket } from '@/hooks/use-coaching-websocket'
import { useWebSocket } from '@/contexts/websocket-context'
import {
  Brain,
  RefreshCw,
  Zap,
  AlertCircle,
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
  const handleWebSocketMessage = useCallback((message: any) => {
    console.log('[WebSocket] Message received:', message)
    
    if (message.type === 'suggestions_update') {
      const data = message.data
      if (data.replace) {
        // Replace all suggestions with new ones
        const newSuggestions = data.suggestions.map((s: any) => ({
          id: s.id,
          type: 'immediate' as const,
          priority: s.priority || 'medium',
          category: s.category || 'general',
          suggestion: s.content,
          rationale: s.rationale || '',
          timing: 'now' as const,
          timestamp: s.timestamp,
          source: 'openai' as const
        }))
        setSuggestions(newSuggestions)
        setPersonalAISuggestions([]) // Clear personal AI suggestions when replacing
      }
      setLastUpdate(new Date())
    }
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
    onMessage: handleWebSocketMessage,
    onAnalysisUpdate: handleAnalysisUpdate
  })

  // Auto-refresh suggestions on mount and periodically
  useEffect(() => {
    fetchSuggestions()
    
    // Poll every 10 seconds regardless of WebSocket connection
    // This ensures suggestions are always up-to-date
    console.log('[Coaching Panel] Starting 10-second polling interval')
    const interval = setInterval(() => {
      console.log('[Coaching Panel] Auto-refreshing suggestions...')
      fetchSuggestions(false)
    }, 30000) // Changed from 15000 to 10000 for 10-second intervals
    
    return () => clearInterval(interval)
  }, [botId, fetchSuggestions])


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
              Coaching Suggestions
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
          <div className="h-full flex flex-col">

            <div className="flex-1 overflow-y-auto pt-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pr-2">
                {/* AI Suggestions - Single Column */}
                <div className="space-y-3 col-span-2">

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

                  {suggestions.length === 0 && personalAISuggestions.length === 0 && !loading && !error && (
                    <div className="text-center py-8 text-gray-500">
                      <Brain className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No suggestions yet.</p>
                      <p className="text-xs mt-1">
                        {metadata?.transcriptLength
                          ? 'Keep the conversation going.'
                          : 'Waiting for conversation...'}
                      </p>
                    </div>
                  )}

                  {/* Combined suggestions */}
                  {[...suggestions, ...personalAISuggestions].map((suggestion, index) => (
                    <Card key={suggestion.id || `suggestion-${index}`} className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-gray-900">
                          {suggestion.suggestion || suggestion.content}
                        </p>
                        {suggestion.rationale && (
                          <p className="text-xs text-gray-500 mt-1">
                            {suggestion.rationale}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
