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
      <div className="text-center py-16 bg-paper rounded-xl border border-line ">
        <Brain className="h-12 w-12 text-ink-2 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-ink mb-2">
          No Analysis Available
        </h3>
        <p className="text-sm text-ink-3 ">
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
            <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-line flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-ink-3 " />
                <h3 className="font-semibold text-ink ">Session Pulse</h3>
              </div>
              <div className="p-5">
                <SentimentGauge sentiment={insights.sentiment} />
              </div>
            </div>
          )}

          {/* Word Cloud */}
          {hasTopics && (
            <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-line flex items-center gap-2">
                <Brain className="h-4 w-4 text-ink-3 " />
                <h3 className="font-semibold text-ink ">Topics & Keywords</h3>
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
        <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ink-3 " />
            <h3 className="font-semibold text-ink ">Session Metrics</h3>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap gap-3">
              {insights.sentiment.engagement && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-paper rounded-lg">
                  <TrendingUp className="h-4 w-4 text-ink-3" />
                  <span className="text-sm text-ink-3 ">Engagement</span>
                  <Badge
                    variant="secondary"
                    className="bg-surface-1 text-ink-2 capitalize"
                  >
                    {insights.sentiment.engagement}
                  </Badge>
                </div>
              )}
              {insights.sentiment.overall && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-paper rounded-lg">
                  <Target className="h-4 w-4 text-ink-3" />
                  <span className="text-sm text-ink-3 ">Overall Sentiment</span>
                  <Badge
                    variant="secondary"
                    className="bg-surface-1 text-ink-2 capitalize"
                  >
                    {insights.sentiment.overall}
                  </Badge>
                </div>
              )}
              {insights.sentiment.emotions &&
                insights.sentiment.emotions.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-paper rounded-lg">
                    <span className="text-sm text-ink-3 ">Emotions</span>
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
        <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-ink-3 " />
            <h3 className="font-semibold text-ink ">All Insights</h3>
            <Badge
              variant="secondary"
              className="bg-surface-3 text-ink-3 text-xs ml-auto"
            >
              {insights.insights!.length}
            </Badge>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.insights!.map((insight, index) => (
                <div key={index} className="relative p-4 bg-paper rounded-lg">
                  <div className="absolute top-3 right-3">
                    <span className="text-2xl font-bold text-ink-2 ">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <Zap className="h-4 w-4 text-ink-3 mb-2" />
                  <p className="text-sm text-ink-2 pr-8">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Suggestions & Next Steps */}
      {(suggestions.length > 0 || nextSessionFocus.length > 0) && (
        <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-ink-3 " />
            <h3 className="font-semibold text-ink ">
              Next Steps & Recommendations
            </h3>
          </div>
          <div className="p-5 space-y-4">
            {/* Next session focus tags */}
            {nextSessionFocus.length > 0 && (
              <div>
                <span className="text-xs font-medium text-ink-3 uppercase tracking-wide mb-2 block">
                  Focus Areas for Next Session
                </span>
                <div className="flex flex-wrap gap-2">
                  {nextSessionFocus.map((focus: string, idx: number) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-surface-3 text-ink-2 "
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
                    className="flex items-start gap-3 p-3 bg-paper rounded-lg"
                  >
                    <div className="h-5 w-5 rounded-full bg-ink text-ink-on-dark flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-sm text-ink-2 ">
                      {typeof suggestion === 'string'
                        ? suggestion
                        : suggestion.text ||
                          suggestion.suggestion ||
                          String(suggestion)}
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
