'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCoachingWebSocket } from '@/hooks/use-coaching-websocket'
import { useWebSocket } from '@/contexts/websocket-context'
import {
  usePinnedSuggestions,
  PinnedSuggestion,
} from '@/hooks/use-pinned-suggestions'
import {
  Sparkles,
  AlertCircle,
  Lightbulb,
  Clock,
  Zap,
  MessageCircle,
  ArrowRight,
  Pin,
  PinOff,
  X,
  ChevronDown,
  ChevronUp,
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
  const [pinnedSectionOpen, setPinnedSectionOpen] = useState(true)
  const { isConnected } = useWebSocket()

  // Pinned suggestions management
  const {
    pinnedSuggestions,
    isPinned,
    togglePin,
    unpinSuggestion,
    clearAllPinned,
    pinnedCount,
  } = usePinnedSuggestions(botId)

  // Helper to convert a suggestion to pinnable format
  const toPinnableSuggestion = (
    suggestion: CoachingSuggestion | PersonalAISuggestion,
  ): Omit<PinnedSuggestion, 'pinnedAt'> => ({
    id: suggestion.id,
    suggestion:
      'suggestion' in suggestion
        ? suggestion.suggestion
        : (suggestion as any).content || '',
    rationale: 'rationale' in suggestion ? suggestion.rationale : undefined,
    priority: 'priority' in suggestion ? suggestion.priority : 'medium',
    category: 'category' in suggestion ? suggestion.category : 'general',
    go_live_emoji:
      'go_live_emoji' in suggestion ? suggestion.go_live_emoji : undefined,
    go_live_value:
      'go_live_value' in suggestion ? suggestion.go_live_value : undefined,
  })

  const handleWebSocketMessage = useCallback((message: any) => {
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
    onMeetingState: _state => {},
  })

  if (error && error.includes('OpenAI API key')) {
    return (
      <Card className={cn(className, '')}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-amber-token mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 ">
            OpenAI Configuration Required
          </h3>
          <p className="text-ink-3 text-sm">
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
          bg: 'bg-surface-1 ',
          border: 'border-line ',
          accentBg: 'bg-ink-2 ',
          accentText: 'text-ink-2 ',
          badge: 'bg-ink text-ink-on-dark ',
          icon: Zap,
          label: 'Act Now',
        }
      case 'medium':
        return {
          bg: 'bg-surface-1 ',
          border: 'border-line ',
          accentBg: 'bg-ink-3 ',
          accentText: 'text-ink-2 ',
          badge: 'bg-surface-3 text-ink-2 ',
          icon: MessageCircle,
          label: 'Consider',
        }
      case 'low':
        return {
          bg: 'bg-surface-1 ',
          border: 'border-line ',
          accentBg: 'bg-line ',
          accentText: 'text-ink-3 ',
          badge: 'bg-paper text-ink-3 ',
          icon: Lightbulb,
          label: 'Idea',
        }
      default:
        return {
          bg: 'bg-surface-1 ',
          border: 'border-line ',
          accentBg: 'bg-line ',
          accentText: 'text-ink-3 ',
          badge: 'bg-paper text-ink-3 ',
          icon: Lightbulb,
          label: 'Tip',
        }
    }
  }

  const getTimingConfig = (timing: string) => {
    switch (timing) {
      case 'now':
      case 'immediate':
        return {
          label: 'Use now',
          color: 'bg-surface-3 text-ink-2 ',
        }
      case 'next_pause':
        return {
          label: 'Next pause',
          color: 'bg-surface-3 text-ink-3 ',
        }
      case 'next_exchange':
        return {
          label: 'Next exchange',
          color: 'bg-surface-3 text-ink-3 ',
        }
      case 'end_of_call':
        return {
          label: 'End of call',
          color: 'bg-surface-3 text-ink-3 ',
        }
      case 'wait':
        return {
          label: 'When ready',
          color: 'bg-paper text-ink-3 ',
        }
      default:
        return null
    }
  }

  const allSuggestions = [...suggestions, ...personalAISuggestions]

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Card className="h-full flex flex-col bg-surface-1 border-0 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 flex-shrink-0 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ink-2 " />
            <span className="text-sm font-semibold text-ink ">AI Coach</span>
          </div>
          {isConnected ? (
            <span className="flex items-center gap-1.5 text-xs text-ink-3 ">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-forest"></span>
              </span>
              Live
            </span>
          ) : (
            <span className="text-xs text-ink-4">Connecting...</span>
          )}
        </div>

        <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-line rounded-full" />
                    <div className="absolute inset-0 w-16 h-16 border-4 border-line border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-ink-2 ">
                    Analyzing conversation...
                  </p>
                  <p className="text-xs text-ink-3 mt-1">
                    This takes about 30 seconds
                  </p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-vermillion-bg border border-vermillion rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-vermillion flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-vermillion ">
                        Analysis Error
                      </p>
                      <p className="text-sm text-vermillion mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {allSuggestions.length === 0 && !loading && !error && (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <div className="w-20 h-20 bg-surface-3 rounded-3xl flex items-center justify-center mb-5">
                    <Lightbulb className="h-10 w-10 text-ink-3 " />
                  </div>
                  <h3 className="text-base font-bold text-ink mb-2">
                    {waitingForSuggestions
                      ? 'Listening...'
                      : 'Ready for insights'}
                  </h3>
                  <p className="text-sm text-ink-3 text-center max-w-[240px] leading-relaxed">
                    {waitingForSuggestions
                      ? 'AI-powered coaching suggestions will appear as the conversation unfolds'
                      : 'Continue the conversation to receive personalized coaching tips'}
                  </p>
                  {waitingForSuggestions && (
                    <div className="flex items-center gap-2 mt-5 text-sm text-ink-2 bg-surface-3 px-4 py-2 rounded-full font-medium">
                      <Clock className="h-4 w-4" />
                      Updates every 30-60s
                    </div>
                  )}
                </div>
              )}

              {/* Pinned Suggestions Section */}
              {pinnedCount > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => setPinnedSectionOpen(!pinnedSectionOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-paper border border-line rounded-lg hover:bg-surface-3 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Pin className="h-3.5 w-3.5 text-ink-3 " />
                      <span className="text-sm font-semibold text-ink-2 ">
                        Pinned ({pinnedCount})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation()
                          clearAllPinned()
                        }}
                        className="h-6 px-2 text-xs text-ink-3 hover:text-ink-2 hover:bg-surface-3 "
                      >
                        Clear all
                      </Button>
                      {pinnedSectionOpen ? (
                        <ChevronUp className="h-4 w-4 text-ink-3 " />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-ink-3 " />
                      )}
                    </div>
                  </button>

                  {pinnedSectionOpen && (
                    <div className="mt-2 space-y-2">
                      {pinnedSuggestions.map(pinned => (
                        <div
                          key={pinned.id}
                          className="relative flex items-start gap-2 p-3 bg-paper border border-line rounded-xl group"
                        >
                          {pinned.go_live_emoji && (
                            <span className="text-lg flex-shrink-0">
                              {pinned.go_live_emoji}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink-2 leading-relaxed">
                              {pinned.suggestion}
                            </p>
                            {pinned.go_live_value && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-surface-3 text-ink-2 rounded">
                                {pinned.go_live_value}
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => unpinSuggestion(pinned.id)}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-ink-4 hover:text-vermillion hover:bg-vermillion-bg flex-shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
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
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-surface-1/80 text-ink-2 border border-line ">
                                    {suggestion.go_live_value}
                                  </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
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
                              {/* Pin button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation()
                                  togglePin(toPinnableSuggestion(suggestion))
                                }}
                                className={cn(
                                  'h-7 w-7 p-0 rounded-full transition-all',
                                  isPinned(suggestion.id)
                                    ? 'text-ink-2 bg-surface-3 hover:bg-line'
                                    : 'text-ink-4 hover:text-ink-3 hover:bg-surface-3',
                                )}
                                title={
                                  isPinned(suggestion.id)
                                    ? 'Unpin suggestion'
                                    : 'Pin suggestion'
                                }
                              >
                                {isPinned(suggestion.id) ? (
                                  <PinOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Pin className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
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
                                <ArrowRight className="h-5 w-5 text-ink-on-dark" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <p className="text-base font-semibold text-ink leading-relaxed">
                                {suggestion.suggestion ||
                                  ('content' in suggestion
                                    ? (suggestion as any).content
                                    : '')}
                              </p>

                              {/* Rationale */}
                              {!simplified &&
                                'rationale' in suggestion &&
                                suggestion.rationale && (
                                  <p className="text-sm text-ink-3 mt-2 leading-relaxed">
                                    {suggestion.rationale}
                                  </p>
                                )}
                            </div>
                          </div>

                          {/* Confidence indicator */}
                          {!simplified && suggestion.confidence && (
                            <div className="mt-4 pt-3 border-t border-line/50 ">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-ink-3 ">
                                  Confidence
                                </span>
                                <div className="flex-1 h-2 bg-surface-1/80 rounded-full overflow-hidden">
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
                                <span className="text-xs font-bold text-ink-2 ">
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
