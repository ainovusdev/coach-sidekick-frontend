'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCoachingWebSocket } from '@/hooks/use-coaching-websocket'
import { useWebSocket } from '@/contexts/websocket-context'
import { Sparkles, AlertCircle, Lightbulb, Clock } from 'lucide-react'

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
  const [_lastUpdate, setLastUpdate] = useState<Date | null>(null)
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

  // Helper to get priority styles - subtle colored dots only
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          dot: 'bg-red-500',
          badge: 'bg-gray-100 text-gray-600',
        }
      case 'medium':
        return {
          dot: 'bg-amber-500',
          badge: 'bg-gray-100 text-gray-600',
        }
      case 'low':
        return {
          dot: 'bg-emerald-500',
          badge: 'bg-gray-100 text-gray-600',
        }
      default:
        return {
          dot: 'bg-gray-400',
          badge: 'bg-gray-100 text-gray-600',
        }
    }
  }

  return (
    <div className={`${className} flex flex-col h-full`}>
      <Card className="h-full flex flex-col bg-white border-0 shadow-sm">
        {/* Header */}
        <CardHeader className="pb-3 flex-shrink-0 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5">
              <div className="p-1.5 bg-gray-900 rounded-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                Coaching Suggestions
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-gray-900 rounded-full animate-pulse" />
                  Live
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  Offline
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="w-12 h-12 border-3 border-gray-200 rounded-full" />
                    <div className="absolute inset-0 w-12 h-12 border-3 border-gray-900 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-gray-600">
                    Analyzing conversation...
                  </p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Analysis Error
                      </p>
                      <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {suggestions.length === 0 &&
                personalAISuggestions.length === 0 &&
                !loading &&
                !error && (
                  <div className="flex flex-col items-center justify-center py-10 px-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                      <Lightbulb className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {waitingForSuggestions
                        ? 'Listening to your session...'
                        : 'Ready for insights'}
                    </h3>
                    <p className="text-xs text-gray-500 text-center max-w-[200px]">
                      {waitingForSuggestions
                        ? 'AI-powered suggestions will appear as the conversation unfolds'
                        : 'Continue the conversation to receive coaching suggestions'}
                    </p>
                    {waitingForSuggestions && (
                      <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                        <Clock className="h-3 w-3" />
                        Updates every 30-60s
                      </div>
                    )}
                    {!isConnected && (
                      <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                        <AlertCircle className="h-3 w-3" />
                        Reconnecting...
                      </div>
                    )}
                  </div>
                )}

              {/* Suggestions List */}
              {(suggestions.length > 0 || personalAISuggestions.length > 0) && (
                <div className="space-y-3">
                  {[...suggestions, ...personalAISuggestions].map(
                    (suggestion, index) => {
                      const priority =
                        'priority' in suggestion
                          ? suggestion.priority
                          : 'medium'
                      const styles = getPriorityStyles(priority)

                      return (
                        <div
                          key={suggestion.id || `suggestion-${index}`}
                          className="group relative bg-white border border-gray-100 rounded-lg p-3 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
                        >
                          {/* Suggestion Content */}
                          <div className="flex items-start gap-3">
                            {/* Priority Dot + Emoji/Icon */}
                            <div className="flex-shrink-0 flex items-center gap-2 mt-1">
                              <div
                                className={`w-2 h-2 rounded-full ${styles.dot}`}
                                title={`${priority} priority`}
                              />
                              {'go_live_emoji' in suggestion &&
                              suggestion.go_live_emoji ? (
                                <span className="text-base">
                                  {suggestion.go_live_emoji}
                                </span>
                              ) : null}
                            </div>

                            {/* Text Content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800 leading-relaxed">
                                {suggestion.suggestion ||
                                  ('content' in suggestion
                                    ? (suggestion as any).content
                                    : '')}
                              </p>

                              {/* Tags Row */}
                              {(('go_live_value' in suggestion &&
                                suggestion.go_live_value) ||
                                ('timing' in suggestion &&
                                  suggestion.timing &&
                                  suggestion.timing !== 'now')) && (
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  {'go_live_value' in suggestion &&
                                    suggestion.go_live_value && (
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${styles.badge}`}
                                      >
                                        {suggestion.go_live_value}
                                      </span>
                                    )}
                                  {'timing' in suggestion &&
                                    suggestion.timing &&
                                    suggestion.timing !== 'now' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-50 text-gray-500">
                                        <Clock className="h-3 w-3" />
                                        {suggestion.timing.replace(/_/g, ' ')}
                                      </span>
                                    )}
                                </div>
                              )}

                              {/* Rationale (for non-simplified view) */}
                              {!simplified &&
                                'rationale' in suggestion &&
                                suggestion.rationale && (
                                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                                    {suggestion.rationale}
                                  </p>
                                )}
                            </div>
                          </div>

                          {/* Confidence Bar (for non-simplified view) */}
                          {!simplified && suggestion.confidence && (
                            <div className="mt-2 pt-2 border-t border-gray-50">
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400">
                                  Confidence
                                </span>
                                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gray-400 rounded-full transition-all duration-500"
                                    style={{
                                      width: `${suggestion.confidence * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-gray-400">
                                  {Math.round(suggestion.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    },
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
