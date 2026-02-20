'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
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
    if (certainty >= 0.85) return 'from-emerald-500 to-green-600'
    if (certainty >= 0.75) return 'from-amber-500 to-yellow-600'
    return 'from-gray-400 to-gray-500'
  }

  const getMatchBgColor = (certainty: number) => {
    if (certainty >= 0.85) return 'bg-emerald-50 border-emerald-200'
    if (certainty >= 0.75) return 'bg-amber-50 border-amber-200'
    return 'bg-gray-50 border-gray-200'
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
              <Clock className="h-4 w-4 text-gray-500" />
              Similar Past Sessions
            </h3>
          </CardHeader>
        )}
        <CardContent className={compact ? 'p-0' : ''}>
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Clock className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 font-medium">
              No similar sessions yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
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
              <Clock className="h-4 w-4 text-gray-500" />
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
                  hover:shadow-md hover:border-blue-200 hover:bg-blue-50/30
                  ${getMatchBgColor(session.certainty)}
                `}
              >
                {/* Match indicator bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b ${getMatchColor(session.certainty)}`}
                />

                <div className="p-3 pl-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">
                          {formatDate(session.session_date)}
                        </span>
                      </div>
                      {session.duration_minutes && (
                        <span className="text-xs text-gray-400">
                          • {session.duration_minutes}m
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`
                          px-2 py-0.5 rounded-full text-xs font-semibold text-white
                          bg-gradient-to-r ${getMatchColor(session.certainty)}
                        `}
                      >
                        {matchPercent}% match
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
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
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-white/80 text-gray-700 border border-gray-200"
                          >
                            {topic}
                          </span>
                        ))}
                      {(session.key_topics || session.topics).length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{(session.key_topics || session.topics).length - 3}{' '}
                          more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Relevance reason */}
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    <Sparkles className="h-3 w-3 inline mr-1 text-amber-500" />
                    {summary?.relevance_reason ||
                      session.relevance_reason ||
                      session.summary ||
                      session.content_preview.slice(0, 120)}
                  </p>

                  {/* Quick stats row */}
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-200/50">
                    {session.action_items &&
                      session.action_items.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Target className="h-3 w-3 text-blue-500" />
                          {session.action_items.length} commitments
                        </span>
                      )}
                    {session.sentiment && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        {getSentimentEmoji(session.sentiment)}{' '}
                        {session.sentiment}
                      </span>
                    )}
                    {summary?.key_points && summary.key_points.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Lightbulb className="h-3 w-3 text-amber-500" />
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
              <span className="text-xs text-gray-400">
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
                  bg-gradient-to-br ${selectedSession ? getMatchColor(selectedSession.session.certainty) : ''}
                `}
              >
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-semibold">
                  Session from{' '}
                  {selectedSession
                    ? formatFullDate(selectedSession.session.session_date)
                    : ''}
                </div>
                <div className="text-sm text-gray-500 font-normal flex items-center gap-2">
                  {selectedSession?.session.duration_minutes && (
                    <span>
                      {selectedSession.session.duration_minutes} minutes
                    </span>
                  )}
                  {selectedSession && (
                    <Badge
                      className={`bg-gradient-to-r ${getMatchColor(selectedSession.session.certainty)} text-white border-0`}
                    >
                      {Math.round(selectedSession.session.certainty * 100)}%
                      match
                    </Badge>
                  )}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4 -mr-4">
            {selectedSession && (
              <div className="space-y-5 pb-4">
                {/* Why this is relevant */}
                {(selectedSession.summary?.relevance_reason ||
                  selectedSession.session.relevance_reason) && (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Why This Session is Relevant
                    </h4>
                    <p className="text-sm text-amber-900">
                      {selectedSession.summary?.relevance_reason ||
                        selectedSession.session.relevance_reason}
                    </p>
                  </div>
                )}

                {/* Topics */}
                {((selectedSession.session.topics?.length ?? 0) > 0 ||
                  (selectedSession.session.key_topics?.length ?? 0) > 0) && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-gray-500" />
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
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        Key Insights
                      </h4>
                      <div className="space-y-2">
                        {selectedSession.summary.key_points.map((point, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-amber-700">
                                {i + 1}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Commitments */}
                {selectedSession.session.action_items &&
                  selectedSession.session.action_items.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        Commitments from This Session
                      </h4>
                      <div className="space-y-2">
                        {selectedSession.session.action_items.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg"
                          >
                            <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-blue-900">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Session Summary */}
                {(selectedSession.summary?.summary ||
                  selectedSession.session.summary) && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-gray-500" />
                      Session Summary
                    </h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg leading-relaxed">
                      {selectedSession.summary?.summary ||
                        selectedSession.session.summary}
                    </p>
                  </div>
                )}

                {/* Conversation Preview */}
                {selectedSession.session.content_preview && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-gray-500" />
                      Conversation Preview
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600 italic leading-relaxed">
                        &ldquo;{selectedSession.session.content_preview}&rdquo;
                      </p>
                    </div>
                  </div>
                )}

                {/* Sentiment */}
                {selectedSession.session.sentiment && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl">
                      {getSentimentEmoji(selectedSession.session.sentiment)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Session Sentiment
                      </p>
                      <p className="text-sm text-gray-500">
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
                    className="flex items-center justify-center gap-2 w-full p-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Full Session Details
                  </a>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
