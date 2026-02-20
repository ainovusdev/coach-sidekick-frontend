'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Clock,
  User,
  Target,
  AlertCircle,
  Brain,
  Award,
  FileText,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  TrendingUp,
  Calendar,
  Sparkles,
} from 'lucide-react'
import {
  PersonaService,
  type PersonaUpdateHistory,
} from '@/services/persona-service'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatDate, formatTime } from '@/lib/date-utils'

interface PersonaHistoryTimelineProps {
  clientId: string
  limit?: number
}

const FIELD_ICONS: Record<string, any> = {
  age_range: User,
  occupation: User,
  location: User,
  family_situation: User,
  primary_goals: Target,
  short_term_goals: Target,
  long_term_goals: Target,
  main_challenges: AlertCircle,
  obstacles: AlertCircle,
  fears: AlertCircle,
  communication_style: Brain,
  learning_style: Brain,
  personality_traits: Brain,
  values: Brain,
  strengths: TrendingUp,
  growth_areas: TrendingUp,
  recurring_themes: TrendingUp,
  triggers: AlertCircle,
  achievements: Award,
  breakthrough_moments: Award,
}

const FIELD_LABELS: Record<string, string> = {
  age_range: 'Age Range',
  occupation: 'Occupation',
  location: 'Location',
  family_situation: 'Family Situation',
  primary_goals: 'Primary Outcomes',
  short_term_goals: 'Short-term Outcomes',
  long_term_goals: 'Long-term Outcomes',
  main_challenges: 'Main Challenges',
  obstacles: 'Obstacles',
  fears: 'Fears',
  communication_style: 'Communication Style',
  learning_style: 'Learning Style',
  personality_traits: 'Personality Traits',
  values: 'Values',
  strengths: 'Strengths',
  growth_areas: 'Growth Areas',
  recurring_themes: 'Recurring Themes',
  triggers: 'Triggers',
  achievements: 'Achievements',
  breakthrough_moments: 'Breakthrough Moments',
}

const FIELD_CATEGORIES: Record<string, string> = {
  age_range: 'Demographics',
  occupation: 'Demographics',
  location: 'Demographics',
  family_situation: 'Demographics',
  primary_goals: 'Outcomes',
  short_term_goals: 'Outcomes',
  long_term_goals: 'Outcomes',
  main_challenges: 'Challenges',
  obstacles: 'Challenges',
  fears: 'Challenges',
  communication_style: 'Personality',
  learning_style: 'Personality',
  personality_traits: 'Personality',
  values: 'Personality',
  strengths: 'Patterns',
  growth_areas: 'Patterns',
  recurring_themes: 'Patterns',
  triggers: 'Patterns',
  achievements: 'Progress',
  breakthrough_moments: 'Progress',
}

const CATEGORY_ICONS: Record<string, any> = {
  Demographics: User,
  Vision: Target,
  Challenges: AlertCircle,
  Personality: Brain,
  Patterns: TrendingUp,
  Progress: Award,
}

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return 'Not set'
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? 'None' : value.join(', ')
  }
  if (typeof value === 'string') {
    return value
  }
  return String(value)
}

interface SessionUpdate {
  sessionId: string | null
  sessionDate: Date
  sessionDateStr: string
  updates: PersonaUpdateHistory[]
  avgConfidence: number
}

export function PersonaHistoryTimeline({
  clientId,
  limit = 50,
}: PersonaHistoryTimelineProps) {
  const [history, setHistory] = useState<PersonaUpdateHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(
    new Set(),
  )

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        const data = await PersonaService.getPersonaHistory(clientId, limit)
        setHistory(data)
      } catch (error) {
        console.error('Failed to fetch persona history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [clientId, limit])

  const toggleSession = (sessionKey: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev)
      if (next.has(sessionKey)) {
        next.delete(sessionKey)
      } else {
        next.add(sessionKey)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="border border-gray-200 rounded-lg p-4 bg-white"
          >
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No History Yet
        </h3>
        <p className="text-gray-500">
          Persona updates will appear here as sessions are analyzed
        </p>
      </div>
    )
  }

  // Group updates by session
  const sessionGroups = history.reduce(
    (acc, update) => {
      const sessionKey = update.session_id || 'manual'
      if (!acc[sessionKey]) {
        acc[sessionKey] = {
          sessionId: update.session_id || null,
          sessionDate: new Date(update.created_at),
          sessionDateStr: update.created_at,
          updates: [],
          avgConfidence: 0,
        }
      }
      acc[sessionKey].updates.push(update)
      return acc
    },
    {} as Record<string, SessionUpdate>,
  )

  // Calculate average confidence for each session
  Object.values(sessionGroups).forEach(group => {
    const totalConfidence = group.updates.reduce(
      (sum, u) => sum + u.confidence,
      0,
    )
    group.avgConfidence = totalConfidence / group.updates.length
  })

  // Sort by date descending
  const sortedSessions = Object.entries(sessionGroups).sort(
    ([, a], [, b]) => b.sessionDate.getTime() - a.sessionDate.getTime(),
  )

  return (
    <div className="space-y-3">
      {sortedSessions.map(([sessionKey, group]) => {
        const isExpanded = expandedSessions.has(sessionKey)

        // Group updates by category
        const categorizedUpdates = group.updates.reduce(
          (acc, update) => {
            const category = FIELD_CATEGORIES[update.field_name] || 'Other'
            if (!acc[category]) {
              acc[category] = []
            }
            acc[category].push(update)
            return acc
          },
          {} as Record<string, PersonaUpdateHistory[]>,
        )

        const categories = Object.keys(categorizedUpdates)

        return (
          <Card key={sessionKey} className="border-gray-200 overflow-hidden">
            {/* Session Header - Clickable */}
            <button
              onClick={() => toggleSession(sessionKey)}
              className={cn(
                'w-full p-4 flex items-center gap-4 transition-colors',
                'hover:bg-gray-50 text-left',
                isExpanded && 'bg-gray-50',
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0 p-2.5 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Session Analysis
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {group.updates.length} changes
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(group.sessionDateStr, 'MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(group.sessionDateStr)}
                  </span>
                  <span className="flex items-center gap-1">
                    {categories.length} categories
                  </span>
                </div>
              </div>

              {/* Confidence & Expand */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div
                  className={cn(
                    'text-xs font-medium px-2.5 py-1 rounded-md',
                    group.avgConfidence >= 0.8
                      ? 'bg-blue-100 text-blue-700'
                      : group.avgConfidence >= 0.6
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-gray-100 text-gray-600',
                  )}
                >
                  {(group.avgConfidence * 100).toFixed(0)}% avg
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-200 bg-white">
                <div className="p-4 space-y-4">
                  {/* Session Link */}
                  {group.sessionId && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-900 font-medium">
                          View session transcript
                        </span>
                      </div>
                      <Link
                        href={`/sessions/${group.sessionId}`}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        onClick={e => e.stopPropagation()}
                      >
                        Open
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )}

                  {/* Changes by Category */}
                  <div className="space-y-4">
                    {Object.entries(categorizedUpdates).map(
                      ([category, updates]) => {
                        const CategoryIcon =
                          CATEGORY_ICONS[category] || FileText

                        return (
                          <div key={category} className="space-y-2">
                            {/* Category Header */}
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                              <CategoryIcon className="h-4 w-4 text-gray-600" />
                              <h4 className="text-sm font-semibold text-gray-900">
                                {category}
                              </h4>
                              <Badge
                                variant="outline"
                                className="text-xs ml-auto"
                              >
                                {updates.length}{' '}
                                {updates.length === 1 ? 'change' : 'changes'}
                              </Badge>
                            </div>

                            {/* Field Changes */}
                            <div className="space-y-2">
                              {updates.map(update => {
                                const Icon =
                                  FIELD_ICONS[update.field_name] || FileText
                                const label =
                                  FIELD_LABELS[update.field_name] ||
                                  update.field_name
                                const isArrayField = Array.isArray(
                                  update.new_value,
                                )

                                return (
                                  <div
                                    key={update.id}
                                    className="flex items-start gap-2 py-1.5"
                                  >
                                    {/* Icon */}
                                    <Icon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                      {/* Label and Confidence on same line */}
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-gray-700">
                                          {label}
                                        </span>
                                        <div
                                          className={cn(
                                            'text-xs font-medium px-1.5 py-0.5 rounded',
                                            update.confidence >= 0.8
                                              ? 'bg-blue-100 text-blue-700'
                                              : update.confidence >= 0.6
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'bg-gray-100 text-gray-600',
                                          )}
                                        >
                                          {(update.confidence * 100).toFixed(0)}
                                          %
                                        </div>
                                      </div>

                                      {/* Values - Compact Layout */}
                                      {isArrayField ? (
                                        <div className="space-y-1">
                                          {/* Removed items inline */}
                                          {update.old_value &&
                                            Array.isArray(update.old_value) &&
                                            update.old_value.length > 0 && (
                                              <div className="flex flex-wrap gap-1 items-center">
                                                <span className="text-xs text-gray-500 font-medium mr-1">
                                                  Previous:
                                                </span>
                                                {update.old_value.map(
                                                  (
                                                    item: string,
                                                    idx: number,
                                                  ) => (
                                                    <Badge
                                                      key={idx}
                                                      variant="secondary"
                                                      className="text-xs bg-gray-100 text-gray-600 border-gray-300 line-through opacity-75"
                                                    >
                                                      {item}
                                                    </Badge>
                                                  ),
                                                )}
                                              </div>
                                            )}

                                          {/* Added items inline */}
                                          <div className="flex flex-wrap gap-1 items-center">
                                            <span className="text-xs text-gray-700 font-medium mr-1">
                                              {update.old_value &&
                                              Array.isArray(update.old_value) &&
                                              update.old_value.length > 0
                                                ? 'Added:'
                                                : 'New:'}
                                            </span>
                                            {Array.isArray(update.new_value) &&
                                              update.new_value
                                                .filter(
                                                  (item: string) =>
                                                    !update.old_value ||
                                                    !Array.isArray(
                                                      update.old_value,
                                                    ) ||
                                                    !update.old_value.includes(
                                                      item,
                                                    ),
                                                )
                                                .map(
                                                  (
                                                    item: string,
                                                    idx: number,
                                                  ) => (
                                                    <Badge
                                                      key={idx}
                                                      variant="secondary"
                                                      className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                                    >
                                                      {item}
                                                    </Badge>
                                                  ),
                                                )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-sm">
                                          {formatValue(update.old_value) !==
                                            'Not set' && (
                                            <span className="text-gray-500 line-through mr-2">
                                              {formatValue(update.old_value)}
                                            </span>
                                          )}
                                          <span className="font-medium text-gray-900">
                                            {formatValue(update.new_value)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      },
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
