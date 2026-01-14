'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useCoachingWebSocket } from '@/hooks/use-coaching-websocket'
import { useWebSocket } from '@/contexts/websocket-context'
import {
  Sparkles,
  AlertCircle,
  Lightbulb,
  Clock,
  Zap,
  MessageCircle,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

  const handleWebSocketMessage = useCallback((message: any) => {
    console.log('[WebSocket] Message received:', message)

    if (message.type === 'suggestions_update') {
      const data = message.data
      if (data.replace) {
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
        setPersonalAISuggestions([])
        setWaitingForSuggestions(false)
      }
      setLastUpdate(new Date())
    }
  }, [])

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

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          bg: 'bg-white',
          border: 'border-gray-200',
          accentBg: 'bg-gray-800',
          accentText: 'text-gray-800',
          badge: 'bg-gray-900 text-white',
          icon: Zap,
          label: 'Act Now',
        }
      case 'medium':
        return {
          bg: 'bg-white',
          border: 'border-gray-200',
          accentBg: 'bg-gray-600',
          accentText: 'text-gray-700',
          badge: 'bg-gray-100 text-gray-700',
          icon: MessageCircle,
          label: 'Consider',
        }
      case 'low':
        return {
          bg: 'bg-white',
          border: 'border-gray-200',
          accentBg: 'bg-gray-400',
          accentText: 'text-gray-600',
          badge: 'bg-gray-50 text-gray-600',
          icon: Lightbulb,
          label: 'Idea',
        }
      default:
        return {
          bg: 'bg-white',
          border: 'border-gray-200',
          accentBg: 'bg-gray-400',
          accentText: 'text-gray-600',
          badge: 'bg-gray-50 text-gray-600',
          icon: Lightbulb,
          label: 'Tip',
        }
    }
  }

  const getTimingConfig = (timing: string) => {
    switch (timing) {
      case 'now':
      case 'immediate':
        return { label: 'Use now', color: 'bg-gray-100 text-gray-700' }
      case 'next_pause':
        return { label: 'Next pause', color: 'bg-gray-100 text-gray-600' }
      case 'next_exchange':
        return { label: 'Next exchange', color: 'bg-gray-100 text-gray-600' }
      case 'end_of_call':
        return { label: 'End of call', color: 'bg-gray-100 text-gray-600' }
      case 'wait':
        return { label: 'When ready', color: 'bg-gray-50 text-gray-500' }
      default:
        return null
    }
  }

  const allSuggestions = [...suggestions, ...personalAISuggestions]

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Card className="h-full flex flex-col bg-white border-0 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 flex-shrink-0 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gray-700" />
            <span className="text-sm font-semibold text-gray-900">
              AI Coach
            </span>
          </div>
          {isConnected ? (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
              </span>
              Live
            </span>
          ) : (
            <span className="text-xs text-gray-400">Connecting...</span>
          )}
        </div>

        <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                    <div className="absolute inset-0 w-16 h-16 border-4 border-gray-800 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-gray-700">
                    Analyzing conversation...
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    This takes about 30 seconds
                  </p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">
                        Analysis Error
                      </p>
                      <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {allSuggestions.length === 0 && !loading && !error && (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-5">
                    <Lightbulb className="h-10 w-10 text-gray-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">
                    {waitingForSuggestions
                      ? 'Listening...'
                      : 'Ready for insights'}
                  </h3>
                  <p className="text-sm text-gray-500 text-center max-w-[240px] leading-relaxed">
                    {waitingForSuggestions
                      ? 'AI-powered coaching suggestions will appear as the conversation unfolds'
                      : 'Continue the conversation to receive personalized coaching tips'}
                  </p>
                  {waitingForSuggestions && (
                    <div className="flex items-center gap-2 mt-5 text-sm text-gray-700 bg-gray-100 px-4 py-2 rounded-full font-medium">
                      <Clock className="h-4 w-4" />
                      Updates every 30-60s
                    </div>
                  )}
                </div>
              )}

              {/* Suggestions List */}
              {allSuggestions.length > 0 && (
                <div className="space-y-4">
                  {allSuggestions.map((suggestion, index) => {
                    const priority =
                      'priority' in suggestion ? suggestion.priority : 'medium'
                    const config = getPriorityConfig(priority)
                    const timing =
                      'timing' in suggestion ? suggestion.timing : null
                    const timingConfig = timing ? getTimingConfig(timing) : null
                    const PriorityIcon = config.icon

                    return (
                      <div
                        key={suggestion.id || `suggestion-${index}`}
                        className={cn(
                          'relative rounded-2xl border-2 overflow-hidden transition-all duration-300',
                          'hover:shadow-lg hover:scale-[1.01]',
                          config.bg,
                          config.border,
                        )}
                      >
                        {/* Priority accent bar */}
                        <div
                          className={cn(
                            'absolute left-0 top-0 bottom-0 w-1.5',
                            config.accentBg,
                          )}
                        />

                        <div className="p-4 pl-5">
                          {/* Top row: Priority badge + Timing */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border',
                                  config.badge,
                                )}
                              >
                                <PriorityIcon className="h-3.5 w-3.5" />
                                {config.label}
                              </span>
                              {'go_live_value' in suggestion &&
                                suggestion.go_live_value && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/80 text-gray-700 border border-gray-200">
                                    {suggestion.go_live_value}
                                  </span>
                                )}
                            </div>
                            {timingConfig &&
                              timing !== 'now' &&
                              timing !== 'immediate' && (
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                                    timingConfig.color,
                                  )}
                                >
                                  <Clock className="h-3 w-3" />
                                  {timingConfig.label}
                                </span>
                              )}
                          </div>

                          {/* Main suggestion content */}
                          <div className="flex items-start gap-3">
                            {'go_live_emoji' in suggestion &&
                            suggestion.go_live_emoji ? (
                              <span className="text-3xl flex-shrink-0 mt-0.5">
                                {suggestion.go_live_emoji}
                              </span>
                            ) : (
                              <div
                                className={cn(
                                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                                  config.accentBg,
                                )}
                              >
                                <ArrowRight className="h-5 w-5 text-white" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <p className="text-base font-semibold text-gray-900 leading-relaxed">
                                {suggestion.suggestion ||
                                  ('content' in suggestion
                                    ? (suggestion as any).content
                                    : '')}
                              </p>

                              {/* Rationale */}
                              {!simplified &&
                                'rationale' in suggestion &&
                                suggestion.rationale && (
                                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                                    {suggestion.rationale}
                                  </p>
                                )}
                            </div>
                          </div>

                          {/* Confidence indicator */}
                          {!simplified && suggestion.confidence && (
                            <div className="mt-4 pt-3 border-t border-gray-200/50">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-gray-500">
                                  Confidence
                                </span>
                                <div className="flex-1 h-2 bg-white/80 rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      'h-full rounded-full transition-all duration-500',
                                      config.accentBg,
                                    )}
                                    style={{
                                      width: `${suggestion.confidence * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-gray-700">
                                  {Math.round(suggestion.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
