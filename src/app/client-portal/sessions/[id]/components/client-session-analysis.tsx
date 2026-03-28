'use client'

import { Badge } from '@/components/ui/badge'
import {
  Brain,
  Lightbulb,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Zap,
  Target,
} from 'lucide-react'
import { SentimentGauge } from '@/components/sessions/sentiment-gauge'
import { WordCloud } from '@/components/sessions/word-cloud'
import type { ClientSessionDetailData } from '@/hooks/queries/use-client-sessions'

interface ClientSessionAnalysisProps {
  sessionData: ClientSessionDetailData
}

export function ClientSessionAnalysis({
  sessionData,
}: ClientSessionAnalysisProps) {
  const insights = sessionData.insights
  if (!insights) {
    return (
      <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <Brain className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Analysis Available
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Analysis will appear here once your session has been processed.
        </p>
      </div>
    )
  }

  const hasSentiment = insights.sentiment && insights.sentiment.score != null
  const hasTopics =
    (insights.topics?.length ?? 0) > 0 || (insights.keywords?.length ?? 0) > 0
  const hasInsights = (insights.insights?.length ?? 0) > 0
  const suggestions =
    insights.suggestions?.filter((s: any) => s.target !== 'coach_only') ?? []
  const recommendations = insights.recommendations || {}
  const nextSessionFocus = recommendations.next_session_focus || []

  return (
    <div className="space-y-6">
      {/* Sentiment & Topics Row */}
      {(hasSentiment || hasTopics) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sentiment Gauge */}
          {hasSentiment && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Session Pulse
                </h3>
              </div>
              <div className="p-5">
                <SentimentGauge sentiment={insights.sentiment} />
              </div>
            </div>
          )}

          {/* Word Cloud */}
          {hasTopics && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <Brain className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Topics & Keywords
                </h3>
              </div>
              <div className="p-5">
                <WordCloud
                  words={[
                    ...(insights.topics || []),
                    ...(insights.keywords || []),
                  ]}
                  maxWords={20}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Engagement & Emotions Badges */}
      {hasSentiment && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Session Metrics
            </h3>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap gap-3">
              {insights.sentiment.engagement && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Engagement
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize"
                  >
                    {insights.sentiment.engagement}
                  </Badge>
                </div>
              )}
              {insights.sentiment.overall && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Target className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Overall Sentiment
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize"
                  >
                    {insights.sentiment.overall}
                  </Badge>
                </div>
              )}
              {insights.sentiment.emotions &&
                insights.sentiment.emotions.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Emotions
                    </span>
                    <div className="flex gap-1.5">
                      {insights.sentiment.emotions
                        .slice(0, 4)
                        .map((emotion, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {emotion}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Full Insights List */}
      {hasInsights && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              All Insights
            </h3>
            <Badge
              variant="secondary"
              className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs ml-auto"
            >
              {insights.insights!.length}
            </Badge>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.insights!.map((insight, index) => (
                <div
                  key={index}
                  className="relative p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="absolute top-3 right-3">
                    <span className="text-2xl font-bold text-gray-200 dark:text-gray-700">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <Zap className="h-4 w-4 text-gray-500 dark:text-gray-400 mb-2" />
                  <p className="text-sm text-gray-700 dark:text-gray-300 pr-8">
                    {insight}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Suggestions & Next Steps */}
      {(suggestions.length > 0 || nextSessionFocus.length > 0) && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Next Steps & Recommendations
            </h3>
          </div>
          <div className="p-5 space-y-4">
            {/* Next session focus tags */}
            {nextSessionFocus.length > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                  Focus Areas for Next Session
                </span>
                <div className="flex flex-wrap gap-2">
                  {nextSessionFocus.map((focus: string, idx: number) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      {focus}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                {suggestions.map((suggestion: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="h-5 w-5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {suggestion.text || suggestion.suggestion || suggestion}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
