'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCoachingWebSocket } from '@/hooks/use-coaching-websocket'
import { useWebSocket } from '@/contexts/websocket-context'
import { Brain, AlertCircle } from 'lucide-react'

interface CoachingSuggestion {
  id: string
  type: 'immediate' | 'reflection' | 'improvement'
  priority: 'high' | 'medium' | 'low'
  category: string
  suggestion: string
  rationale: string
  timing:
    | 'now'
    | 'next_pause'
    | 'end_of_call'
    | 'immediate'
    | 'next_exchange'
    | 'wait'
  timestamp: string
  source: 'openai' | 'personal-ai'
  go_live_value?: string
  go_live_emoji?: string
  confidence?: number
  trigger_reason?: string
  context_confidence?: number
}

interface PersonalAISuggestion {
  id: string
  suggestion: string
  confidence: number
  source: 'personal-ai'
  timestamp: string
}

interface CoachingPanelProps {
  botId: string
  className?: string
  simplified?: boolean
}

export function CoachingPanel({
  botId,
  className,
  simplified = false,
}: CoachingPanelProps) {
  const [suggestions, setSuggestions] = useState<CoachingSuggestion[]>([])
  const [personalAISuggestions, setPersonalAISuggestions] = useState<
    PersonalAISuggestion[]
  >([])
  const [loading] = useState(false)
  const [error] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [waitingForSuggestions, setWaitingForSuggestions] = useState(true)
  const { isConnected } = useWebSocket()

  // Analysis is now triggered automatically by the backend every 30-60 seconds

  // WebSocket event handlers
  const handleWebSocketMessage = useCallback((message: any) => {
    console.log('[WebSocket] Message received:', message)

    if (message.type === 'suggestions_update') {
      const data = message.data
      if (data.replace) {
        // Replace all suggestions with new ones
        const newSuggestions = data.suggestions.map((s: any) => ({
          id: s.id || `suggestion_${Date.now()}_${Math.random()}`,
          type: 'immediate' as const,
          priority: s.urgency || s.priority || 'medium',
          category: s.category || s.category_display || 'general',
          suggestion: s.content || s.display_text || s.suggestion,
          rationale: s.rationale || '',
          timing: s.timing || 'now',
          timestamp: s.generated_at || s.timestamp || new Date().toISOString(),
          source: 'openai' as const,
          go_live_value: s.go_live_value,
          go_live_emoji: s.go_live_emoji,
          confidence: s.confidence,
          trigger_reason: s.trigger_reason,
          context_confidence: s.context_confidence,
        }))
        setSuggestions(newSuggestions)
        setPersonalAISuggestions([]) // Clear personal AI suggestions when replacing
        setWaitingForSuggestions(false)
      }
      setLastUpdate(new Date())
    }
  }, [])

  // Removed handleAnalysisUpdate as setAnalysis is not used

  // Use WebSocket events
  useCoachingWebSocket(botId, {
    onMessage: handleWebSocketMessage,
    onSuggestionsUpdate: data => {
      console.log('[WebSocket] Suggestions update:', data)
      if (data.replace && data.suggestions) {
        const newSuggestions = data.suggestions.map((s: any) => ({
          id: s.id || `suggestion_${Date.now()}_${Math.random()}`,
          type: 'immediate' as const,
          priority: s.urgency || s.priority || 'medium',
          category: s.category || s.category_display || 'general',
          suggestion: s.content || s.display_text || s.suggestion,
          rationale: s.rationale || '',
          timing: s.timing || 'now',
          timestamp: s.generated_at || s.timestamp || new Date().toISOString(),
          source: 'openai' as const,
          go_live_value: s.go_live_value,
          go_live_emoji: s.go_live_emoji,
          confidence: s.confidence,
          trigger_reason: s.trigger_reason,
          context_confidence: s.context_confidence,
        }))
        setSuggestions(newSuggestions)
        setWaitingForSuggestions(false)
      }
      setLastUpdate(new Date())
    },
    onMeetingState: state => {
      console.log('[WebSocket] Meeting state:', state)
    },
  })

  // WebSocket room joining is handled by useBotWebSocket hook in use-bot-data.ts
  // This component just listens for events via useCoachingWebSocket hook above
  // No need to manually join/leave rooms here to avoid duplicate joins

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
      <Card className="h-full flex flex-col bg-white">
        <CardHeader
          className={
            simplified
              ? 'pb-3 flex-shrink-0 bg-gray-50 border-b'
              : 'pb-3 flex-shrink-0'
          }
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain
                className={
                  simplified
                    ? 'h-4 w-4 text-gray-600'
                    : 'h-5 w-5 text-purple-600'
                }
              />
              <span className={simplified ? 'text-sm' : ''}>
                Coaching Suggestions
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {isConnected ? '🟢 Live' : '🔴 Offline'}
              </span>
            </div>
          </div>
          {!simplified && lastUpdate && (
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

                  {suggestions.length === 0 &&
                    personalAISuggestions.length === 0 &&
                    !loading &&
                    !error && (
                      <div className="text-center py-8 text-gray-500">
                        <Brain className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>
                          {waitingForSuggestions
                            ? 'Analyzing conversation...'
                            : 'No suggestions yet.'}
                        </p>
                        <p className="text-xs mt-1">
                          {waitingForSuggestions
                            ? 'Suggestions will appear every 30-60 seconds based on conversation dynamics'
                            : 'Continue the conversation to receive more suggestions'}
                        </p>
                        {!isConnected && (
                          <p className="text-xs mt-2 text-orange-500">
                            ⚠️ WebSocket disconnected. Reconnecting...
                          </p>
                        )}
                      </div>
                    )}

                  {/* Combined suggestions */}
                  {[...suggestions, ...personalAISuggestions].map(
                    (suggestion, index) => {
                      const urgencyColors: Record<string, string> = {
                        high: 'border-l-red-500',
                        medium: 'border-l-yellow-500',
                        low: 'border-l-green-500',
                      }
                      const priority =
                        'priority' in suggestion
                          ? suggestion.priority
                          : 'medium'
                      const borderColor =
                        urgencyColors[priority] || 'border-l-purple-500'

                      if (simplified) {
                        return (
                          <div
                            key={suggestion.id || `suggestion-${index}`}
                            className={`border-l-4 ${borderColor} bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors`}
                          >
                            <div className="flex items-start gap-2">
                              {'go_live_emoji' in suggestion &&
                                suggestion.go_live_emoji && (
                                  <span className="text-base">
                                    {suggestion.go_live_emoji}
                                  </span>
                                )}
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {suggestion.suggestion ||
                                    ('content' in suggestion
                                      ? (suggestion as any).content
                                      : '')}
                                </p>
                                {'go_live_value' in suggestion &&
                                  suggestion.go_live_value && (
                                    <span className="text-xs text-gray-500 mt-1 inline-block">
                                      {suggestion.go_live_value}
                                      {'timing' in suggestion &&
                                        suggestion.timing &&
                                        suggestion.timing !== 'now' &&
                                        ` • ${suggestion.timing.replace('_', ' ')}`}
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <Card
                          key={suggestion.id || `suggestion-${index}`}
                          className={`border-l-4 ${borderColor} hover:shadow-md transition-shadow`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {'go_live_emoji' in suggestion &&
                                    suggestion.go_live_emoji && (
                                      <span className="text-lg">
                                        {suggestion.go_live_emoji}
                                      </span>
                                    )}
                                  {'go_live_value' in suggestion &&
                                    suggestion.go_live_value && (
                                      <span className="text-xs font-medium text-gray-600 uppercase">
                                        {suggestion.go_live_value}
                                      </span>
                                    )}
                                  {'timing' in suggestion &&
                                    suggestion.timing &&
                                    suggestion.timing !== 'now' && (
                                      <span className="text-xs text-gray-500">
                                        • {suggestion.timing.replace('_', ' ')}
                                      </span>
                                    )}
                                </div>
                                <p className="text-sm font-medium text-gray-900">
                                  {suggestion.suggestion ||
                                    ('content' in suggestion
                                      ? (suggestion as any).content
                                      : '')}
                                </p>
                                {'rationale' in suggestion &&
                                  suggestion.rationale && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {suggestion.rationale}
                                    </p>
                                  )}
                                {suggestion.confidence && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-gray-400">
                                        Confidence:
                                      </span>
                                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-purple-500 rounded-full"
                                          style={{
                                            width: `${suggestion.confidence * 100}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                    {'context_confidence' in suggestion &&
                                      suggestion.context_confidence && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-xs text-gray-400">
                                            Context:
                                          </span>
                                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-blue-500 rounded-full"
                                              style={{
                                                width: `${suggestion.context_confidence * 100}%`,
                                              }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    },
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
