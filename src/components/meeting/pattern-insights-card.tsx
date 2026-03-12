'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/date-utils'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'

interface PatternHistory {
  date: string
  patterns: string[]
  dominant_pattern?: string
  intensity?: Record<string, number>
  context?: string
}

interface RecurringTheme {
  theme: string
  count: number
  last_seen: string
}

interface PatternInsightsCardProps {
  currentPatterns?: string[]
  patternHistory?: PatternHistory[]
  recurringThemes?: RecurringTheme[]
  insights?: {
    key_patterns?: string[]
  }
  compact?: boolean
}

export function PatternInsightsCard({
  currentPatterns,
  patternHistory,
  recurringThemes,
  insights,
  compact = false,
}: PatternInsightsCardProps) {
  const getPatternIcon = (pattern: string) => {
    const patternLower = pattern.toLowerCase()
    if (patternLower.includes('breakthrough'))
      return <Zap className="h-3 w-3 text-green-500" />
    if (patternLower.includes('resistance'))
      return <AlertTriangle className="h-3 w-3 text-orange-500" />
    if (patternLower.includes('engagement') || patternLower.includes('engaged'))
      return <CheckCircle className="h-3 w-3 text-blue-500" />
    if (patternLower.includes('avoidance'))
      return <TrendingDown className="h-3 w-3 text-red-500" />
    return <Activity className="h-3 w-3 text-gray-500" />
  }

  const getPatternColor = (pattern: string) => {
    const patternLower = pattern.toLowerCase()
    if (patternLower.includes('breakthrough'))
      return 'bg-green-50 text-green-700 border-green-200'
    if (patternLower.includes('resistance'))
      return 'bg-orange-50 text-orange-700 border-orange-200'
    if (patternLower.includes('engagement') || patternLower.includes('engaged'))
      return 'bg-blue-50 text-blue-700 border-blue-200'
    if (patternLower.includes('avoidance'))
      return 'bg-red-50 text-red-700 border-red-200'
    return 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const getThemeSize = (count: number) => {
    if (count > 5) return 'text-sm font-medium'
    if (count > 3) return 'text-xs'
    return 'text-xs opacity-75'
  }

  const formatPatternName = (pattern: string) => {
    return pattern.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const allPatterns = insights?.key_patterns || currentPatterns || []
  const hasPatterns = allPatterns.length > 0
  const hasHistory = (patternHistory?.length ?? 0) > 0
  const hasThemes = (recurringThemes?.length ?? 0) > 0

  if (!hasPatterns && !hasHistory && !hasThemes) {
    return (
      <Card className={compact ? 'h-auto border-0 shadow-none' : 'h-full'}>
        <CardContent className={compact ? 'p-0' : 'pt-4'}>
          <p className="text-xs text-gray-500">
            Patterns will emerge as the conversation develops.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={
        compact ? 'h-auto border-0 shadow-none' : 'h-full overflow-hidden'
      }
    >
      <CardContent
        className={
          compact
            ? 'space-y-3 p-0'
            : 'space-y-4 pt-4 overflow-y-auto max-h-[600px]'
        }
      >
        {/* Active Patterns */}
        {hasPatterns && (
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Active
            </span>
            <div className="flex flex-wrap gap-1.5">
              {allPatterns.map((pattern, i) => (
                <div
                  key={i}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${getPatternColor(pattern)}`}
                >
                  {getPatternIcon(pattern)}
                  {formatPatternName(pattern)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pattern Timeline (non-compact only) */}
        {hasHistory && !compact && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              History
            </span>
            <div className="space-y-1.5">
              {(patternHistory || []).slice(0, 3).map((history, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400 w-16 flex-shrink-0 text-right">
                    {getTimeAgo(new Date(history.date))}
                  </span>
                  <div className="w-px h-4 bg-gray-200 dark:bg-gray-600" />
                  <div className="flex flex-wrap gap-1">
                    {history.patterns.slice(0, 3).map((pattern, j) => (
                      <span
                        key={j}
                        className="flex items-center gap-1 text-gray-600 dark:text-gray-400"
                      >
                        {getPatternIcon(pattern)}
                        {formatPatternName(pattern)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recurring Themes */}
        {hasThemes && (
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Recurring Themes
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(recurringThemes || []).map((theme, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ${getThemeSize(theme.count)}`}
                >
                  {theme.theme}
                  {theme.count > 1 && (
                    <span className="text-gray-400 dark:text-gray-500">
                      x{theme.count}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pattern Summary (non-compact, 3+ history entries) */}
        {(patternHistory?.length ?? 0) > 2 && !compact && (
          <div className="border-t dark:border-gray-700 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-500 mx-auto mb-1" />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {countPositivePatterns(patternHistory || [])} positive shifts
                </p>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Activity className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {countUniquePatterns(patternHistory || [])} unique patterns
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours} hours ago`
  if (days < 7) return `${days} days ago`
  return formatDate(date.toISOString(), 'MMM d')
}

function countPositivePatterns(history: PatternHistory[]): number {
  const positiveKeywords = ['breakthrough', 'engaged', 'productive', 'active']
  return history.reduce((count, h) => {
    const hasPositive = h.patterns.some(p =>
      positiveKeywords.some(keyword => p.toLowerCase().includes(keyword)),
    )
    return count + (hasPositive ? 1 : 0)
  }, 0)
}

function countUniquePatterns(history: PatternHistory[]): number {
  const unique = new Set<string>()
  history.forEach(h => h.patterns.forEach(p => unique.add(p)))
  return unique.size
}
