'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User,
  Target,
  AlertCircle,
  Brain,
  Award,
  TrendingUp,
  Calendar,
  Sparkles,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import {
  PersonaService,
  type PersonaUpdateHistory,
} from '@/services/persona-service'
import { cn } from '@/lib/utils'

interface PersonaEvolutionTimelineProps {
  clientId: string
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
  primary_goals: 'Primary Goals',
  short_term_goals: 'Short-term Goals',
  long_term_goals: 'Long-term Goals',
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

const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Demographics: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  Goals: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  Challenges: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  Personality: {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200',
  },
  Patterns: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  Progress: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
  },
}

const FIELD_CATEGORIES: Record<string, string> = {
  age_range: 'Demographics',
  occupation: 'Demographics',
  location: 'Demographics',
  family_situation: 'Demographics',
  primary_goals: 'Goals',
  short_term_goals: 'Goals',
  long_term_goals: 'Goals',
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

interface TimelineEvent {
  date: Date
  month: string
  updates: PersonaUpdateHistory[]
  isImportant: boolean
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return 'Not set'
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None'
    if (value.length > 3)
      return `${value.slice(0, 3).join(', ')} +${value.length - 3} more`
    return value.join(', ')
  }
  if (typeof value === 'string') return value
  return String(value)
}

export function PersonaEvolutionTimeline({
  clientId,
}: PersonaEvolutionTimelineProps) {
  const [history, setHistory] = useState<PersonaUpdateHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        const data = await PersonaService.getPersonaHistory(clientId, 100)
        setHistory(data)
      } catch (error) {
        console.error('Failed to fetch persona history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [clientId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-20 w-0.5" />
            </div>
            <div className="flex-1 pb-8">
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Timeline Yet
            </h3>
            <p className="text-gray-600">
              The persona evolution timeline will appear here as your client
              progresses through coaching sessions.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Group by month
  const monthlyGroups = history.reduce(
    (acc, update) => {
      const date = new Date(update.created_at)
      const monthKey = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
      if (!acc[monthKey]) {
        acc[monthKey] = {
          date,
          month: monthKey,
          updates: [],
          isImportant: false,
        }
      }
      acc[monthKey].updates.push(update)
      return acc
    },
    {} as Record<string, TimelineEvent>,
  )

  // Mark important months (high confidence, multiple changes, or key fields)
  Object.values(monthlyGroups).forEach(event => {
    const avgConfidence =
      event.updates.reduce((sum, u) => sum + u.confidence, 0) /
      event.updates.length
    const hasKeyChanges = event.updates.some(
      u =>
        u.field_name === 'primary_goals' ||
        u.field_name === 'breakthrough_moments' ||
        u.field_name === 'achievements',
    )
    event.isImportant =
      avgConfidence >= 0.8 || event.updates.length >= 5 || hasKeyChanges
  })

  const sortedEvents = Object.values(monthlyGroups).sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  )

  // Calculate stats
  const totalChanges = history.length
  const avgConfidence =
    history.reduce((sum, u) => sum + u.confidence, 0) / history.length

  return (
    <div className="space-y-8">
      {/* Stats Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Persona Evolution</h2>
              <p className="text-gray-300 text-sm">
                Journey of growth and discovery
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold mb-1">{totalChanges}</div>
              <div className="text-sm text-gray-300">Total Changes</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold mb-1">
                {(avgConfidence * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-300">Avg Confidence</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold mb-1">
                {sortedEvents.length}
              </div>
              <div className="text-sm text-gray-300">Months Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {sortedEvents.map((event, eventIdx) => {
          const isLast = eventIdx === sortedEvents.length - 1
          const categoryCount = new Set(
            event.updates.map(u => FIELD_CATEGORIES[u.field_name]),
          ).size

          return (
            <div key={event.month} className="flex gap-6 pb-8 relative">
              {/* Timeline Line */}
              <div className="flex flex-col items-center relative">
                {/* Circle */}
                <div
                  className={cn(
                    'relative z-10 rounded-full flex items-center justify-center',
                    event.isImportant
                      ? 'w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 shadow-lg'
                      : 'w-8 h-8 bg-white border-2 border-gray-300',
                  )}
                >
                  {event.isImportant ? (
                    <Sparkles className="h-5 w-5 text-white" />
                  ) : (
                    <Circle className="h-3 w-3 text-gray-400 fill-gray-400" />
                  )}
                </div>

                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className={cn(
                      'w-0.5 flex-1 absolute top-12',
                      event.isImportant
                        ? 'bg-gradient-to-b from-gray-900 to-gray-300'
                        : 'bg-gray-200',
                    )}
                    style={{ height: 'calc(100% + 2rem)' }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                {/* Month Header */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {event.month}
                    </h3>
                    {event.isImportant && (
                      <Badge className="bg-gradient-to-r from-gray-900 to-gray-700 text-white border-0">
                        Key Milestone
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{event.updates.length} changes</span>
                    <span>•</span>
                    <span>{categoryCount} categories</span>
                  </div>
                </div>

                {/* Changes Grid */}
                <div className="space-y-2">
                  {event.updates.slice(0, 6).map(update => {
                    const Icon = FIELD_ICONS[update.field_name] || Target
                    const label =
                      FIELD_LABELS[update.field_name] || update.field_name
                    const category =
                      FIELD_CATEGORIES[update.field_name] || 'Other'
                    const colors =
                      CATEGORY_COLORS[category] || CATEGORY_COLORS.Progress
                    const isArrayField = Array.isArray(update.new_value)

                    return (
                      <div
                        key={update.id}
                        className={cn(
                          'p-3 rounded-lg border transition-all hover:shadow-md',
                          colors.bg,
                          colors.border,
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'p-1.5 rounded-lg bg-white',
                              colors.border,
                              'border',
                            )}
                          >
                            <Icon className={cn('h-3.5 w-3.5', colors.text)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900">
                                {label}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {category}
                              </Badge>
                              <div
                                className={cn(
                                  'text-xs font-medium px-1.5 py-0.5 rounded ml-auto',
                                  update.confidence >= 0.8
                                    ? 'bg-blue-100 text-blue-700'
                                    : update.confidence >= 0.6
                                      ? 'bg-blue-50 text-blue-600'
                                      : 'bg-gray-100 text-gray-600',
                                )}
                              >
                                {(update.confidence * 100).toFixed(0)}%
                              </div>
                            </div>
                            <div className="text-sm text-gray-700">
                              {isArrayField ? (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Array.isArray(update.new_value) &&
                                    update.new_value
                                      .filter(
                                        (item: string) =>
                                          !update.old_value ||
                                          !Array.isArray(update.old_value) ||
                                          !update.old_value.includes(item),
                                      )
                                      .slice(0, 3)
                                      .map((item: string, idx: number) => (
                                        <Badge
                                          key={idx}
                                          variant="secondary"
                                          className="text-xs bg-white/50"
                                        >
                                          {item}
                                        </Badge>
                                      ))}
                                  {Array.isArray(update.new_value) &&
                                    update.new_value.filter(
                                      (item: string) =>
                                        !update.old_value ||
                                        !Array.isArray(update.old_value) ||
                                        !update.old_value.includes(item),
                                    ).length > 3 && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs bg-white/50"
                                      >
                                        +
                                        {update.new_value.filter(
                                          (item: string) =>
                                            !update.old_value ||
                                            !Array.isArray(update.old_value) ||
                                            !update.old_value.includes(item),
                                        ).length - 3}{' '}
                                        more
                                      </Badge>
                                    )}
                                </div>
                              ) : (
                                <span className="font-medium">
                                  {formatValue(update.new_value)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {event.updates.length > 6 && (
                    <div className="text-center py-2">
                      <Badge variant="outline" className="text-xs">
                        +{event.updates.length - 6} more changes
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Start Marker */}
        <div className="flex gap-6">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="flex-1 pb-4">
            <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-blue-900">
                  Journey Started
                </span>
                <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                  {new Date(
                    history[history.length - 1].created_at,
                  ).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Badge>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                The beginning of persona development
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
