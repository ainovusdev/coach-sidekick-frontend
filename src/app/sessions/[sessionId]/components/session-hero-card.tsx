'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Users, Clock, Mic2, MessageSquare } from 'lucide-react'

interface SessionHeroCardProps {
  overallScore?: number
  sentiment?: {
    overall: string
    score: number
    engagement: string
  }
  duration?: string
  wordCount?: number
  speakerBalance?: string
  coachingStyle?: string
}

// Circular Progress Component - Monochromatic
function CircularProgress({
  value,
  max = 10,
  size = 120,
  strokeWidth = 8,
}: {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = (value / max) * 100
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-app-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className="stroke-app-primary transition-all duration-700 ease-out"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-app-primary">
          {value.toFixed(1)}
        </span>
        <span className="text-xs text-app-secondary">/ {max}</span>
      </div>
    </div>
  )
}

export function SessionHeroCard({
  overallScore,
  sentiment,
  duration,
  wordCount,
  speakerBalance,
  coachingStyle,
}: SessionHeroCardProps) {
  const hasMetrics = overallScore !== undefined || sentiment

  if (!hasMetrics) return null

  return (
    <Card className="border-app-border shadow-sm">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Hero Score */}
          {overallScore !== undefined && (
            <div className="flex flex-col items-center justify-center lg:pr-8 lg:border-r border-app-border">
              <CircularProgress
                value={overallScore}
                size={130}
                strokeWidth={10}
              />
              <div className="mt-4 text-center">
                <p className="text-sm font-semibold text-app-primary">
                  Overall Score
                </p>
                <p className="text-xs text-app-secondary">ICF Competencies</p>
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Sentiment */}
              {sentiment && (
                <div className="p-5 bg-app-surface rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-app-secondary" />
                    <span className="text-xs font-medium text-app-secondary uppercase tracking-wider">
                      Sentiment
                    </span>
                  </div>
                  <Badge className="bg-app-primary text-white hover:bg-app-primary/90">
                    {sentiment.overall}
                  </Badge>
                </div>
              )}

              {/* Engagement */}
              {sentiment?.engagement && (
                <div className="p-5 bg-app-surface rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-app-secondary" />
                    <span className="text-xs font-medium text-app-secondary uppercase tracking-wider">
                      Engagement
                    </span>
                  </div>
                  <p className="text-xl font-bold text-app-primary">
                    {sentiment.engagement}
                  </p>
                </div>
              )}

              {/* Duration */}
              <div className="p-5 bg-app-surface rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-app-secondary" />
                  <span className="text-xs font-medium text-app-secondary uppercase tracking-wider">
                    {duration ? 'Duration' : 'Est. Duration'}
                  </span>
                </div>
                <p className="text-xl font-bold text-app-primary">
                  {duration ||
                    (wordCount ? `${Math.round(wordCount / 150)}m` : 'N/A')}
                </p>
              </div>
            </div>

            {/* Secondary Metrics */}
            {(speakerBalance || coachingStyle || wordCount) && (
              <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-app-border">
                {speakerBalance && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-app-background rounded-full border border-app-border">
                    <Mic2 className="h-3.5 w-3.5 text-app-secondary" />
                    <span className="text-xs text-app-secondary">Balance:</span>
                    <span className="text-xs font-medium text-app-primary">
                      {speakerBalance}
                    </span>
                  </div>
                )}
                {coachingStyle && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-app-background rounded-full border border-app-border">
                    <span className="text-xs text-app-secondary">Style:</span>
                    <span className="text-xs font-medium text-app-primary capitalize">
                      {coachingStyle}
                    </span>
                  </div>
                )}
                {wordCount && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-app-background rounded-full border border-app-border">
                    <MessageSquare className="h-3.5 w-3.5 text-app-secondary" />
                    <span className="text-xs font-medium text-app-primary">
                      {wordCount.toLocaleString()} words
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
