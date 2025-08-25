'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  TrendingUp,
  Clock
} from 'lucide-react'

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

export function SimilarSessionsCard({ sessions, summaries, compact = false }: SimilarSessionsCardProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const getCertaintyColor = (certainty: number) => {
    if (certainty > 0.85) return 'bg-green-100 text-green-700'
    if (certainty > 0.75) return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-700'
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      })
    } catch {
      return dateString
    }
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card className={compact ? "h-auto" : "h-full"}>
        <CardHeader className={compact ? "pb-2 py-2" : "pb-3"}>
          <h3 className={compact ? "text-xs font-medium flex items-center gap-1" : "text-sm font-medium flex items-center gap-2"}>
            <Clock className={compact ? "h-3 w-3 text-gray-500" : "h-4 w-4 text-gray-500"} />
            {compact ? "Similar Sessions" : "Similar Past Sessions"}
          </h3>
        </CardHeader>
        <CardContent className={compact ? "pt-0" : ""}>
          <p className="text-xs text-gray-500">
            {compact ? "No similar sessions yet" : "No similar sessions found yet. Continue the conversation to build history."}
          </p>
        </CardContent>
      </Card>
    )
  }

  const displaySessions = compact ? sessions.slice(0, 2) : sessions

  return (
    <Card className={compact ? "h-auto" : "h-full"}>
      <CardHeader className={compact ? "pb-2 py-2" : "pb-3"}>
        <h3 className={compact ? "text-xs font-medium flex items-center gap-1" : "text-sm font-medium flex items-center gap-2"}>
          <Clock className={compact ? "h-3 w-3 text-gray-500" : "h-4 w-4 text-gray-500"} />
          {compact ? `Similar (${sessions.length})` : `Similar Past Sessions (${sessions.length})`}
        </h3>
      </CardHeader>
      <CardContent className={compact ? "space-y-2 pt-0" : "space-y-3"}>
        {displaySessions.map((session, index) => {
          const summary = summaries?.find(s => s.session_date === session.session_date)
          const isExpanded = expandedIndex === index
          
          return (
            <div 
              key={index}
              className={compact ? "border rounded p-2 hover:bg-gray-50 transition-colors" : "border rounded-lg p-3 hover:bg-gray-50 transition-colors"}
            >
              <div 
                className="cursor-pointer"
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-xs font-medium">
                      {formatDate(session.session_date)}
                    </span>
                    {session.duration_minutes && (
                      <span className="text-xs text-gray-500">
                        • {session.duration_minutes} min
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getCertaintyColor(session.certainty)}`}>
                      {Math.round(session.certainty * 100)}% match
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Topics */}
                {((session.topics?.length ?? 0) > 0 || (session.key_topics?.length ?? 0) > 0) && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(session.key_topics || session.topics).slice(0, 3).map((topic, i) => (
                      <Badge key={i} variant="outline" className="text-xs py-0 px-1">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Relevance reason or summary preview */}
                <p className="text-xs text-gray-600 line-clamp-2">
                  {summary?.relevance_reason || 
                   session.relevance_reason || 
                   session.summary || 
                   session.content_preview.slice(0, 100)}...
                </p>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  {/* Key points from summary */}
                  {summary?.key_points && (summary.key_points.length ?? 0) > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Key Points:</h4>
                      <ul className="space-y-1">
                        {summary.key_points.map((point, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                            <span className="text-gray-400 mt-0.5">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action items if available */}
                  {session.action_items && (session.action_items.length ?? 0) > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Action Items:</h4>
                      <ul className="space-y-1">
                        {session.action_items.slice(0, 3).map((item, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                            <TrendingUp className="h-3 w-3 text-green-500 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Full content preview */}
                  {session.content_preview && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Conversation Preview:</h4>
                      <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        {session.content_preview}
                      </p>
                    </div>
                  )}

                  {/* Sentiment indicator */}
                  {session.sentiment && (
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        Sentiment: <span className="font-medium">{session.sentiment}</span>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}