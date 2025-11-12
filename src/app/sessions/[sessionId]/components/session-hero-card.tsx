'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react'

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

export function SessionHeroCard({
  overallScore,
  sentiment,
  duration,
  wordCount,
  speakerBalance,
  coachingStyle,
}: SessionHeroCardProps) {
  const getScoreDisplay = (score: number) => {
    if (score >= 8) return { color: 'text-black', bg: 'bg-black' }
    if (score >= 6) return { color: 'text-gray-700', bg: 'bg-gray-700' }
    return { color: 'text-gray-400', bg: 'bg-gray-400' }
  }

  const scoreStyle = overallScore ? getScoreDisplay(overallScore) : null

  return (
    <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-8">
        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Overall Score */}
          {overallScore !== undefined && (
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl border border-gray-100">
              <BarChart3 className="h-6 w-6 text-gray-400 mb-3" />
              <div className="text-4xl font-bold mb-1">
                <span className={scoreStyle?.color}>
                  {overallScore.toFixed(1)}
                </span>
                <span className="text-gray-300 text-2xl">/10</span>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                Overall Score
              </p>
            </div>
          )}

          {/* Sentiment */}
          {sentiment && (
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl border border-gray-100">
              <TrendingUp className="h-6 w-6 text-gray-400 mb-3" />
              <Badge className="mb-2 bg-black text-white hover:bg-black">
                {sentiment.overall}
              </Badge>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                Sentiment
              </p>
            </div>
          )}

          {/* Engagement */}
          {sentiment?.engagement && (
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl border border-gray-100">
              <Users className="h-6 w-6 text-gray-400 mb-3" />
              <div className="text-2xl font-bold text-black mb-1">
                {sentiment.engagement}
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                Engagement
              </p>
            </div>
          )}

          {/* Duration or Word Count */}
          <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl border border-gray-100">
            <Clock className="h-6 w-6 text-gray-400 mb-3" />
            <div className="text-2xl font-bold text-black mb-1">
              {duration ||
                (wordCount ? `${(wordCount / 150).toFixed(0)}m` : 'N/A')}
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              {duration ? 'Duration' : 'Est. Duration'}
            </p>
          </div>
        </div>

        {/* Secondary Metrics */}
        {(speakerBalance || coachingStyle || wordCount) && (
          <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-100">
            {speakerBalance && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full">
                <span className="text-xs text-gray-500">Speaker Balance:</span>
                <span className="text-sm font-medium text-black">
                  {speakerBalance}
                </span>
              </div>
            )}
            {coachingStyle && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full">
                <span className="text-xs text-gray-500">Style:</span>
                <span className="text-sm font-medium text-black capitalize">
                  {coachingStyle}
                </span>
              </div>
            )}
            {wordCount && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full">
                <span className="text-xs text-gray-500">Word Count:</span>
                <span className="text-sm font-medium text-black">
                  {wordCount.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
