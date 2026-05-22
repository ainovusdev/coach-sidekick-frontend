'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Bot,
  Sparkles,
} from 'lucide-react'
import { formatTime } from '@/lib/date-utils'

interface ConversationSegment {
  speaker: 'coach' | 'client' | 'assistant'
  text: string
  timestamp?: string
  relevance?: number
}

interface AnalysisConversation {
  id: string
  segments: ConversationSegment[]
  summary?: string
  relevance_score?: number
  analysis_reason?: string
  key_moments?: string[]
  timestamp?: string
}

interface AnalysisConversationsCardProps {
  conversations?: AnalysisConversation[]
  loading?: boolean
  compact?: boolean
}

export function AnalysisConversationsCard({
  conversations,
  loading = false,
  compact = false,
}: AnalysisConversationsCardProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [isCardExpanded, setIsCardExpanded] = useState(true)

  if (loading) {
    return (
      <Card className="h-auto">
        <CardHeader className={compact ? 'pb-2 py-2' : 'pb-3'}>
          <h3
            className={
              compact
                ? 'text-xs font-medium flex items-center gap-1'
                : 'text-sm font-medium flex items-center gap-2'
            }
          >
            <MessageSquare
              className={compact ? 'h-3 w-3 text-ink-3' : 'h-4 w-4 text-ink-3'}
            />
            Analysis Context
          </h3>
        </CardHeader>
        <CardContent className={compact ? 'pt-0' : ''}>
          <div className="animate-pulse space-y-2">
            <div className="h-3 bg-surface-3 rounded w-full"></div>
            <div className="h-3 bg-surface-3 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!conversations || conversations.length === 0) {
    return (
      <Card className="h-auto">
        <CardHeader className={compact ? 'pb-2 py-2' : 'pb-3'}>
          <h3
            className={
              compact
                ? 'text-xs font-medium flex items-center gap-1'
                : 'text-sm font-medium flex items-center gap-2'
            }
          >
            <MessageSquare
              className={compact ? 'h-3 w-3 text-ink-3' : 'h-4 w-4 text-ink-3'}
            />
            Analysis Context
          </h3>
        </CardHeader>
        <CardContent className={compact ? 'pt-0' : ''}>
          <p className="text-xs text-ink-3">
            No conversation context from recent analysis
          </p>
        </CardContent>
      </Card>
    )
  }

  const getSpeakerIcon = (speaker: string) => {
    switch (speaker) {
      case 'coach':
        return <User className="h-3 w-3 text-ds-accent" />
      case 'client':
        return <User className="h-3 w-3 text-forest" />
      case 'assistant':
        return <Bot className="h-3 w-3 text-indigo" />
      default:
        return <User className="h-3 w-3 text-ink-4" />
    }
  }

  const getSpeakerLabel = (speaker: string) => {
    switch (speaker) {
      case 'coach':
        return 'Coach'
      case 'client':
        return 'Client'
      case 'assistant':
        return 'AI Assistant'
      default:
        return speaker
    }
  }

  const getRelevanceColor = (score?: number) => {
    if (!score) return 'bg-surface-3 text-ink-2'
    if (score > 0.8) return 'bg-forest-bg text-forest'
    if (score > 0.6) return 'bg-amber-token-bg text-amber-token'
    return 'bg-surface-3 text-ink-2'
  }

  return (
    <Card className="h-auto">
      <CardHeader
        className={`${compact ? 'pb-2 py-2' : 'pb-3'} cursor-pointer hover:bg-paper transition-colors`}
        onClick={() => setIsCardExpanded(!isCardExpanded)}
      >
        <div className="flex items-center justify-between">
          <h3
            className={
              compact
                ? 'text-xs font-medium flex items-center gap-1'
                : 'text-sm font-medium flex items-center gap-2'
            }
          >
            <Sparkles
              className={
                compact ? 'h-3 w-3 text-indigo' : 'h-4 w-4 text-indigo'
              }
            />
            Analysis Context
            {conversations.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {conversations.length} segments
              </Badge>
            )}
          </h3>
          {isCardExpanded ? (
            <ChevronUp className="h-3 w-3 text-ink-4" />
          ) : (
            <ChevronDown className="h-3 w-3 text-ink-4" />
          )}
        </div>
      </CardHeader>

      {isCardExpanded && (
        <CardContent className={compact ? 'space-y-2 pt-0' : 'space-y-3'}>
          {conversations
            .slice(0, compact ? 2 : 5)
            .map((conversation, index) => {
              const isExpanded = expandedIndex === index

              return (
                <div
                  key={conversation.id || index}
                  className="border rounded-lg hover:bg-paper transition-colors"
                >
                  <div
                    className="p-3 cursor-pointer"
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        {conversation.analysis_reason && (
                          <p className="text-xs text-ink-3 mb-1">
                            {conversation.analysis_reason}
                          </p>
                        )}
                        {conversation.relevance_score && (
                          <Badge
                            className={`text-xs ${getRelevanceColor(conversation.relevance_score)}`}
                          >
                            {Math.round(conversation.relevance_score * 100)}%
                            relevant
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {conversation.timestamp && (
                          <div className="flex items-center gap-1 text-xs text-ink-4">
                            <Clock className="h-3 w-3" />
                            {formatTime(conversation.timestamp)}
                          </div>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3 text-ink-4" />
                        ) : (
                          <ChevronDown className="h-3 w-3 text-ink-4" />
                        )}
                      </div>
                    </div>

                    {/* Summary or preview */}
                    {!isExpanded && conversation.summary && (
                      <p className="text-xs text-ink-3 line-clamp-2">
                        {conversation.summary}
                      </p>
                    )}

                    {/* Key moments badges */}
                    {!isExpanded &&
                      conversation.key_moments &&
                      conversation.key_moments.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {conversation.key_moments
                            .slice(0, 3)
                            .map((moment, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs py-0 px-1"
                              >
                                {moment}
                              </Badge>
                            ))}
                        </div>
                      )}
                  </div>

                  {/* Expanded conversation segments */}
                  {isExpanded && (
                    <div className="border-t px-3 py-2 space-y-2 bg-paper">
                      {conversation.segments.map((segment, segIndex) => (
                        <div key={segIndex} className="flex items-start gap-2">
                          <div className="mt-0.5">
                            {getSpeakerIcon(segment.speaker)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-medium text-ink-2">
                                {getSpeakerLabel(segment.speaker)}
                              </span>
                              {segment.timestamp && (
                                <span className="text-xs text-ink-4">
                                  {segment.timestamp}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-ink-3">{segment.text}</p>
                          </div>
                        </div>
                      ))}

                      {/* Key moments in expanded view */}
                      {conversation.key_moments &&
                        conversation.key_moments.length > 0 && (
                          <div className="mt-3 pt-2 border-t">
                            <h4 className="text-xs font-medium text-ink-2 mb-1">
                              Key Moments:
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {conversation.key_moments.map((moment, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {moment}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )
            })}

          {conversations.length > (compact ? 2 : 5) && (
            <p className="text-xs text-ink-3 text-center">
              +{conversations.length - (compact ? 2 : 5)} more conversation
              segments
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}
