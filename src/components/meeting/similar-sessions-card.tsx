'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  ChevronRight,
  Clock,
  Sparkles,
  Target,
  MessageCircle,
  TrendingUp,
  Lightbulb,
  ExternalLink,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDate as formatDateUtil } from '@/lib/date-utils'

interface SimilarSession {
  session_date: string
  session_id?: string
  duration_minutes?: number
  summary?: string
  content_preview: string
  topics: string[]
  sentiment?: string
  certainty: number
  key_topics?: string[]
  action_items?: string[]
  relevance_reason?: string
}

interface SimilarSessionsCardProps {
  sessions: SimilarSession[]
  summaries?: Array<{
    session_date: string
    summary: string
    key_points: string[]
    relevance_reason: string
  }>
  compact?: boolean
}

type SessionSummary = {
  session_date: string
  summary: string
  key_points: string[]
  relevance_reason: string
}

export function SimilarSessionsCard({
  sessions,
  summaries,
  compact = false,
}: SimilarSessionsCardProps) {
  const [selectedSession, setSelectedSession] = useState<{
    session: SimilarSession
    summary?: SessionSummary
  } | null>(null)

  const getMatchColor = (certainty: number) => {
    if (certainty >= 0.85) return ''
    if (certainty >= 0.75) return ''
    return ''
  }

  const getMatchBgColor = (certainty: number) => {
    if (certainty >= 0.85) return 'bg-forest-bg border-forest'
    if (certainty >= 0.75) return 'bg-amber-token-bg border-amber-token'
    return 'bg-paper border-line'
  }

  const getSentimentEmoji = (sentiment?: string) => {
    if (!sentiment) return null
    const lower = sentiment.toLowerCase()
    if (lower.includes('positive') || lower.includes('good')) return '😊'
    if (lower.includes('negative') || lower.includes('difficult')) return '😔'
    if (lower.includes('neutral')) return '😐'
    return '💬'
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffDays = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
      )

      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`

      return formatDateUtil(
        dateString,
        date.getFullYear() !== now.getFullYear() ? 'MMM d, yyyy' : 'MMM d',
      )
    } catch {
      return dateString
    }
  }

  const formatFullDate = (dateString: string) => {
    try {
      return formatDateUtil(dateString, 'EEEE, MMMM d, yyyy')
    } catch {
      return dateString
    }
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card className={compact ? 'h-auto border-0 shadow-none' : 'h-full'}>
        {!compact && (
          <CardHeader className="pb-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-ink-3" />
              Similar Past Sessions
            </h3>
          </CardHeader>
        )}
        <CardContent className={compact ? 'p-0' : ''}>
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center mx-auto mb-3">
              <Clock className="h-6 w-6 text-ink-4" />
            </div>
            <p className="text-sm text-ink-3 font-medium">
              No similar sessions yet
            </p>
            <p className="text-xs text-ink-4 mt-1">
              Continue the conversation to build history
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const displaySessions = compact ? sessions.slice(0, 3) : sessions

  return (
    <>
      <Card className={compact ? 'h-auto border-0 shadow-none' : 'h-full'}>
        {!compact && (
          <CardHeader className="pb-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-ink-3" />
              Similar Past Sessions
              <Badge variant="secondary" className="ml-auto text-xs">
                {sessions.length} found
              </Badge>
            </h3>
          </CardHeader>
        )}
        <CardContent className={compact ? 'p-0 space-y-2' : 'space-y-3'}>
          {displaySessions.map((session, index) => {
            const summary = summaries?.find(
              s => s.session_date === session.session_date,
            )
            const matchPercent = Math.round(session.certainty * 100)

            return (
              <div
                key={index}
                onClick={() => setSelectedSession({ session, summary })}
                className={`
                  group relative cursor-pointer rounded-xl border transition-all duration-200
                  hover:shadow-md hover:border-ds-accent hover:bg-ds-accent-bg/30
                  ${getMatchBgColor(session.certainty)}
                `}
              >
                {/* Match indicator bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl  ${getMatchColor(session.certainty)}`}
                />

                <div className="p-3 pl-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-ink-3">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">
                          {formatDate(session.session_date)}
                        </span>
                      </div>
                      {session.duration_minutes && (
                        <span className="text-xs text-ink-4">
                          • {session.duration_minutes}m
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`
                          px-2 py-0.5 rounded-full text-xs font-semibold text-ink-on-dark
                           ${getMatchColor(session.certainty)}
                        `}
                      >
                        {matchPercent}% match
                      </div>
                      <ChevronRight className="h-4 w-4 text-ink-4 group-hover:text-ds-accent transition-colors" />
                    </div>
                  </div>

                  {/* Topics */}
                  {((session.topics?.length ?? 0) > 0 ||
                    (session.key_topics?.length ?? 0) > 0) && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(session.key_topics || session.topics)
                        .slice(0, 3)
                        .map((topic, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-surface-1/80 text-ink-2 border border-line"
                          >
                            {topic}
                          </span>
                        ))}
                      {(session.key_topics || session.topics).length > 3 && (
                        <span className="text-xs text-ink-4">
                          +{(session.key_topics || session.topics).length - 3}{' '}
                          more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Relevance reason */}
                  <p className="text-xs text-ink-3 line-clamp-2 leading-relaxed">
                    <Sparkles className="h-3 w-3 inline mr-1 text-amber-token" />
                    {summary?.relevance_reason ||
                      session.relevance_reason ||
                      session.summary ||
                      session.content_preview.slice(0, 120)}
                  </p>

                  {/* Quick stats row */}
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-line/50">
                    {session.action_items &&
                      session.action_items.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-ink-3">
                          <Target className="h-3 w-3 text-ds-accent" />
                          {session.action_items.length} commitments
                        </span>
                      )}
                    {session.sentiment && (
                      <span className="flex items-center gap-1 text-xs text-ink-3">
                        {getSentimentEmoji(session.sentiment)}{' '}
                        {session.sentiment}
                      </span>
                    )}
                    {summary?.key_points && summary.key_points.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-ink-3">
                        <Lightbulb className="h-3 w-3 text-amber-token" />
                        {summary.key_points.length} insights
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Show more indicator */}
          {compact && sessions.length > 3 && (
            <div className="text-center pt-1">
              <span className="text-xs text-ink-4">
                +{sessions.length - 3} more sessions
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Detail Modal */}
      <Dialog
        open={selectedSession !== null}
        onOpenChange={open => !open && setSelectedSession(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-3">
              <div
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                   ${selectedSession ? getMatchColor(selectedSession.session.certainty) : ''}
                `}
              >
                <Clock className="h-5 w-5 text-ink-on-dark" />
              </div>
              <div>
                <div className="text-lg font-semibold">
                  Session from{' '}
                  {selectedSession
                    ? formatFullDate(selectedSession.session.session_date)
                    : ''}
                </div>
                <div className="text-sm text-ink-3 font-normal flex items-center gap-2">
                  {selectedSession?.session.duration_minutes && (
                    <span>
                      {selectedSession.session.duration_minutes} minutes
                    </span>
                  )}
                  {selectedSession && (
                    <Badge
                      className={` ${getMatchColor(selectedSession.session.certainty)} text-ink-on-dark border-0`}
                    >
                      {Math.round(selectedSession.session.certainty * 100)}%
                      match
                    </Badge>
                  )}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            {selectedSession && (
              <div className="space-y-5 pb-4">
                {/* Why this is relevant */}
                {(selectedSession.summary?.relevance_reason ||
                  selectedSession.session.relevance_reason) && (
                  <div className=" border border-amber-token rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-amber-token mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Why This Session is Relevant
                    </h4>
                    <p className="text-sm text-amber-token">
                      {selectedSession.summary?.relevance_reason ||
                        selectedSession.session.relevance_reason}
                    </p>
                  </div>
                )}

                {/* Topics */}
                {((selectedSession.session.topics?.length ?? 0) > 0 ||
                  (selectedSession.session.key_topics?.length ?? 0) > 0) && (
                  <div>
                    <h4 className="text-sm font-semibold text-ink-2 mb-2 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-ink-3" />
                      Topics Discussed
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(
                        selectedSession.session.key_topics ||
                        selectedSession.session.topics
                      ).map((topic, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="px-3 py-1 text-sm"
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Points */}
                {selectedSession.summary?.key_points &&
                  selectedSession.summary.key_points.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-ink-2 mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-token" />
                        Key Insights
                      </h4>
                      <div className="space-y-2">
                        {selectedSession.summary.key_points.map((point, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3 bg-paper rounded-lg"
                          >
                            <div className="w-6 h-6 rounded-full bg-amber-token-bg flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-amber-token">
                                {i + 1}
                              </span>
                            </div>
                            <p className="text-sm text-ink-2">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Commitments */}
                {selectedSession.session.action_items &&
                  selectedSession.session.action_items.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-ink-2 mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-ds-accent" />
                        Commitments from This Session
                      </h4>
                      <div className="space-y-2">
                        {selectedSession.session.action_items.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3 bg-ds-accent-bg border border-ds-accent rounded-lg"
                          >
                            <TrendingUp className="h-4 w-4 text-ds-accent mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-ds-accent">
                              {typeof item === 'string'
                                ? item
                                : (item as any).item ||
                                  (item as any).text ||
                                  String(item)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Session Summary */}
                {(selectedSession.summary?.summary ||
                  selectedSession.session.summary) && (
                  <div>
                    <h4 className="text-sm font-semibold text-ink-2 mb-2 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-ink-3" />
                      Session Summary
                    </h4>
                    <p className="text-sm text-ink-3 bg-paper p-4 rounded-lg leading-relaxed">
                      {selectedSession.summary?.summary ||
                        selectedSession.session.summary}
                    </p>
                  </div>
                )}

                {/* Conversation Preview */}
                {selectedSession.session.content_preview && (
                  <div>
                    <h4 className="text-sm font-semibold text-ink-2 mb-2 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-ink-3" />
                      Conversation Preview
                    </h4>
                    <div className="bg-paper p-4 rounded-lg border border-line">
                      <p className="text-sm text-ink-3 italic leading-relaxed">
                        &ldquo;{selectedSession.session.content_preview}&rdquo;
                      </p>
                    </div>
                  </div>
                )}

                {/* Sentiment */}
                {selectedSession.session.sentiment && (
                  <div className="flex items-center gap-3 p-3 bg-paper rounded-lg">
                    <span className="text-2xl">
                      {getSentimentEmoji(selectedSession.session.sentiment)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink-2">
                        Session Sentiment
                      </p>
                      <p className="text-sm text-ink-3">
                        {selectedSession.session.sentiment}
                      </p>
                    </div>
                  </div>
                )}

                {/* View full session link */}
                {selectedSession.session.session_id && (
                  <a
                    href={`/sessions/${selectedSession.session.session_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full p-3 bg-ink hover:bg-ink-2 text-ink-on-dark rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Full Session Details
                  </a>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
