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
      return <Zap className="h-3 w-3 text-forest" />
    if (patternLower.includes('resistance'))
      return <AlertTriangle className="h-3 w-3 text-amber-token" />
    if (patternLower.includes('engagement') || patternLower.includes('engaged'))
      return <CheckCircle className="h-3 w-3 text-ds-accent" />
    if (patternLower.includes('avoidance'))
      return <TrendingDown className="h-3 w-3 text-vermillion" />
    return <Activity className="h-3 w-3 text-ink-3" />
  }

  const getPatternColor = (pattern: string) => {
    const patternLower = pattern.toLowerCase()
    if (patternLower.includes('breakthrough'))
      return 'bg-forest-bg text-forest border-forest'
    if (patternLower.includes('resistance'))
      return 'bg-amber-token-bg text-amber-token border-amber-token'
    if (patternLower.includes('engagement') || patternLower.includes('engaged'))
      return 'bg-ds-accent-bg text-ds-accent border-ds-accent'
    if (patternLower.includes('avoidance'))
      return 'bg-vermillion-bg text-vermillion border-vermillion'
    return 'bg-paper text-ink-2 border-line'
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
          <p className="text-xs text-ink-3">
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
            <span className="text-xs font-medium text-ink-3 uppercase tracking-wider">
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
            <span className="text-xs font-medium text-ink-3 uppercase tracking-wider">
              History
            </span>
            <div className="space-y-1.5">
              {(patternHistory || []).slice(0, 3).map((history, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-ink-4 w-16 flex-shrink-0 text-right">
                    {getTimeAgo(new Date(history.date))}
                  </span>
                  <div className="w-px h-4 bg-surface-3 " />
                  <div className="flex flex-wrap gap-1">
                    {history.patterns.slice(0, 3).map((pattern, j) => (
                      <span
                        key={j}
                        className="flex items-center gap-1 text-ink-3 "
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
            <span className="text-xs font-medium text-ink-3 uppercase tracking-wider">
              Recurring Themes
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(recurringThemes || []).map((theme, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-3 text-ink-2 ${getThemeSize(theme.count)}`}
                >
                  {theme.theme}
                  {theme.count > 1 && (
                    <span className="text-ink-4 ">x{theme.count}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pattern Summary (non-compact, 3+ history entries) */}
        {(patternHistory?.length ?? 0) > 2 && !compact && (
          <div className="border-t pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-paper rounded-lg">
                <TrendingUp className="h-4 w-4 text-forest mx-auto mb-1" />
                <p className="text-xs text-ink-3 ">
                  {countPositivePatterns(patternHistory || [])} positive shifts
                </p>
              </div>
              <div className="text-center p-2 bg-paper rounded-lg">
                <Activity className="h-4 w-4 text-ds-accent mx-auto mb-1" />
                <p className="text-xs text-ink-3 ">
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
