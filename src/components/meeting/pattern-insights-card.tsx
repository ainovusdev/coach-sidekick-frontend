'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle
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
  compact = false
}: PatternInsightsCardProps) {
  
  const getPatternIcon = (pattern: string) => {
    const patternLower = pattern.toLowerCase()
    if (patternLower.includes('breakthrough')) return <Zap className="h-3 w-3 text-green-500" />
    if (patternLower.includes('resistance')) return <AlertTriangle className="h-3 w-3 text-orange-500" />
    if (patternLower.includes('engagement') || patternLower.includes('engaged')) return <CheckCircle className="h-3 w-3 text-blue-500" />
    if (patternLower.includes('avoidance')) return <TrendingDown className="h-3 w-3 text-red-500" />
    return <Activity className="h-3 w-3 text-gray-500" />
  }

  const getPatternColor = (pattern: string) => {
    const patternLower = pattern.toLowerCase()
    if (patternLower.includes('breakthrough')) return 'bg-green-50 text-green-700 border-green-200'
    if (patternLower.includes('resistance')) return 'bg-orange-50 text-orange-700 border-orange-200'
    if (patternLower.includes('engagement') || patternLower.includes('engaged')) return 'bg-blue-50 text-blue-700 border-blue-200'
    if (patternLower.includes('avoidance')) return 'bg-red-50 text-red-700 border-red-200'
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

  if (!currentPatterns?.length && !patternHistory?.length && !recurringThemes?.length) {
    return (
      <Card className={compact ? "h-auto" : "h-full"}>
        <CardHeader className={compact ? "pb-2 py-2" : "pb-3"}>
          <h3 className={compact ? "text-xs font-medium flex items-center gap-1" : "text-sm font-medium flex items-center gap-2"}>
            <Brain className={compact ? "h-3 w-3 text-gray-500" : "h-4 w-4 text-gray-500"} />
            {compact ? "Patterns" : "Pattern Insights"}
          </h3>
        </CardHeader>
        <CardContent className={compact ? "pt-0" : ""}>
          <p className="text-xs text-gray-500">
            {compact ? "No patterns yet" : "Patterns will emerge as the conversation develops."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={compact ? "h-auto" : "h-full overflow-hidden"}>
      <CardHeader className={compact ? "pb-2 py-2" : "pb-3"}>
        <h3 className={compact ? "text-xs font-medium flex items-center gap-1" : "text-sm font-medium flex items-center gap-2"}>
          <Brain className={compact ? "h-3 w-3 text-purple-500" : "h-4 w-4 text-purple-500"} />
          {compact ? "Patterns" : "Pattern Insights"}
        </h3>
      </CardHeader>
      <CardContent className={compact ? "space-y-2 pt-0" : "space-y-4 overflow-y-auto max-h-[600px]"}>
        
        {/* Current Patterns */}
        {(currentPatterns?.length > 0 || insights?.key_patterns?.length > 0) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">Active Patterns</span>
              <Badge variant="secondary" className="text-xs">Now</Badge>
            </div>
            <div className="space-y-1">
              {(insights?.key_patterns || currentPatterns || []).map((pattern, i) => (
                <div key={i} className="flex items-center gap-2">
                  {getPatternIcon(pattern)}
                  <Badge className={`text-xs ${getPatternColor(pattern)}`}>
                    {formatPatternName(pattern)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pattern Evolution */}
        {patternHistory?.length > 0 && !compact && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-gray-700">Pattern Evolution</span>
            <div className="space-y-2">
              {patternHistory.slice(0, 3).map((history, i) => {
                const date = new Date(history.date)
                const timeAgo = getTimeAgo(date)
                
                return (
                  <div key={i} className="border rounded-lg p-2 bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">{timeAgo}</span>
                      {history.dominant_pattern && (
                        <Badge variant="outline" className="text-xs py-0">
                          {formatPatternName(history.dominant_pattern)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {history.patterns.slice(0, 3).map((pattern, j) => (
                        <div key={j} className="flex items-center gap-1">
                          {getPatternIcon(pattern)}
                          <span className="text-xs text-gray-600">
                            {formatPatternName(pattern)}
                          </span>
                          {history.intensity?.[pattern] && (
                            <span className="text-xs text-gray-400">
                              ({Math.round(history.intensity[pattern] * 100)}%)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {history.context && (
                      <p className="text-xs text-gray-500 mt-1">{history.context}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recurring Themes */}
        {recurringThemes?.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-gray-700">Recurring Themes</span>
            <div className="flex flex-wrap gap-2">
              {recurringThemes.map((theme, i) => (
                <div 
                  key={i}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 ${getThemeSize(theme.count)}`}
                >
                  <span className="text-gray-700">{theme.theme}</span>
                  {theme.count > 1 && (
                    <Badge variant="secondary" className="text-xs h-4 px-1">
                      {theme.count}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pattern Insights Summary */}
        {patternHistory?.length > 2 && !compact && (
          <div className="border-t pt-3">
            <div className="space-y-2">
              <span className="text-xs font-medium text-gray-700">Pattern Summary</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <TrendingUp className="h-4 w-4 text-green-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">
                    {countPositivePatterns(patternHistory)} positive shifts
                  </p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <Activity className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">
                    {countUniquePatterns(patternHistory)} unique patterns
                  </p>
                </div>
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function countPositivePatterns(history: PatternHistory[]): number {
  const positiveKeywords = ['breakthrough', 'engaged', 'productive', 'active']
  return history.reduce((count, h) => {
    const hasPositive = h.patterns.some(p => 
      positiveKeywords.some(keyword => p.toLowerCase().includes(keyword))
    )
    return count + (hasPositive ? 1 : 0)
  }, 0)
}

function countUniquePatterns(history: PatternHistory[]): number {
  const unique = new Set<string>()
  history.forEach(h => h.patterns.forEach(p => unique.add(p)))
  return unique.size
}