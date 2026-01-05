'use client'

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Brain,
  Target,
  TrendingUp,
  Heart,
  Shield,
  Eye,
  Zap,
  MessageSquare,
  Users,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Lightbulb,
  ArrowRight,
} from 'lucide-react'
import type {
  SessionInsights,
  CoachingAnalysis,
} from '@/services/analysis-service'
import { WordCloud } from '@/components/sessions/word-cloud'
import { SentimentGauge } from '@/components/sessions/sentiment-gauge'

interface SessionAnalysisMergedProps {
  insights?: SessionInsights
  coaching?: CoachingAnalysis
}

const coachingMetrics = [
  { key: 'active_listening', label: 'Active Listening', icon: Users },
  {
    key: 'powerful_questions',
    label: 'Powerful Questions',
    icon: MessageSquare,
  },
  {
    key: 'direct_communication',
    label: 'Direct Communication',
    icon: MessageSquare,
  },
  { key: 'creating_awareness', label: 'Creating Awareness', icon: Brain },
  { key: 'designing_actions', label: 'Designing Actions', icon: Target },
  {
    key: 'planning_goal_setting',
    label: 'Planning & Vision Setting',
    icon: Target,
  },
  { key: 'managing_progress', label: 'Managing Progress', icon: TrendingUp },
  { key: 'trust_intimacy', label: 'Trust & Intimacy', icon: Heart },
  { key: 'coaching_presence', label: 'Coaching Presence', icon: Users },
  { key: 'self_management', label: 'Self Management', icon: Shield },
  {
    key: 'establishing_agreement',
    label: 'Establishing Agreement',
    icon: CheckCircle2,
  },
  { key: 'accountability', label: 'Accountability', icon: Target },
]

const goliveValues = [
  { key: 'growth', label: 'Growth', icon: TrendingUp },
  { key: 'ownership', label: 'Ownership', icon: Shield },
  { key: 'love', label: 'Love', icon: Heart },
  { key: 'integrity', label: 'Integrity', icon: Shield },
  { key: 'vision', label: 'Vision', icon: Eye },
  { key: 'energy', label: 'Energy', icon: Zap },
]

function getScoreColor(score: number): string {
  if (score >= 8) return 'text-black'
  if (score >= 6) return 'text-gray-600'
  return 'text-gray-400'
}

function getScoreBackground(score: number): string {
  if (score >= 8) return 'bg-gray-50 border-black'
  if (score >= 6) return 'bg-gray-50 border-gray-300'
  return 'bg-white border-gray-200'
}

export function SessionAnalysisMerged({
  insights,
  coaching,
}: SessionAnalysisMergedProps) {
  const overallScore = coaching
    ? coaching.coaching_scores.overall ||
      Object.values(coaching.coaching_scores).reduce(
        (sum, score) => sum + (typeof score === 'number' ? score : 0),
        0,
      ) / 12
    : undefined

  return (
    <div className="space-y-8">
      {/* Section 1: Session Insights */}
      {insights && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-black mb-1">
              Session Insights
            </h2>
            <p className="text-sm text-gray-500">
              AI-generated analysis of conversation patterns and themes
            </p>
          </div>

          {/* Insights Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Topics & Keywords */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <h3 className="text-sm font-semibold text-black flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Topics & Keywords
                </h3>
              </CardHeader>
              <CardContent>
                <WordCloud
                  words={[...insights.topics, ...insights.keywords]}
                  className="min-h-[200px]"
                />
              </CardContent>
            </Card>

            {/* Sentiment */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <h3 className="text-sm font-semibold text-black flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Sentiment Analysis
                </h3>
              </CardHeader>
              <CardContent>
                <SentimentGauge sentiment={insights.sentiment} />
              </CardContent>
            </Card>
          </div>

          {/* Key Insights */}
          {insights.insights.length > 0 && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <h3 className="text-sm font-semibold text-black flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Key Insights
                </h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.insights.map((insight, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {insight}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Patterns */}
          {insights.patterns && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Thinking Patterns */}
              {insights.patterns.thinking_patterns &&
                insights.patterns.thinking_patterns.length > 0 && (
                  <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="pb-4">
                      <h3 className="text-sm font-semibold text-black flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Thinking Patterns
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {insights.patterns.thinking_patterns.map(
                          (pattern, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-black rounded-full mt-2" />
                              <p className="text-sm text-gray-700">{pattern}</p>
                            </div>
                          ),
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Strengths & Obstacles */}
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <h3 className="text-sm font-semibold text-black flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Strengths & Challenges
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.patterns?.strengths &&
                      insights.patterns.strengths.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                            Strengths
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {insights.patterns.strengths.map(
                              (strength, idx) => (
                                <Badge
                                  key={idx}
                                  className="bg-black text-white hover:bg-gray-800"
                                >
                                  {strength}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {insights.patterns?.obstacles &&
                      insights.patterns.obstacles.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                            Obstacles
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {insights.patterns.obstacles.map(
                              (obstacle, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="border-gray-300 text-gray-600"
                                >
                                  {obstacle}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recommendations */}
          {insights.recommendations && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <h3 className="text-sm font-semibold text-black flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Recommendations for Next Session
                </h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.recommendations.next_session_focus?.map(
                    (focus, idx) => (
                      <div
                        key={idx}
                        className="flex gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-black transition-colors"
                      >
                        <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700">{focus}</p>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Section 2: Coaching Performance */}
      {coaching && (
        <div className="space-y-6">
          <div className="pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-black mb-1">
              Coaching Performance
            </h2>
            <p className="text-sm text-gray-500">
              Evaluation based on ICF competencies and GO LIVE methodology
            </p>
          </div>

          {/* Overall Performance Card */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Overall Score */}
                {overallScore !== undefined && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-3xl font-bold mb-2">
                      <span className={getScoreColor(overallScore)}>
                        {overallScore.toFixed(1)}
                      </span>
                      <span className="text-gray-300 text-xl">/10</span>
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                      Overall Score
                    </p>
                    <Progress value={overallScore * 10} className="mt-3 h-2" />
                  </div>
                )}

                {/* Sentiment */}
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-3xl font-bold mb-2">
                    <span
                      className={getScoreColor(coaching.sentiment.score * 10)}
                    >
                      {(coaching.sentiment.score * 10).toFixed(1)}
                    </span>
                    <span className="text-gray-300 text-xl">/10</span>
                  </div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                    Sentiment
                  </p>
                  <Badge className="bg-black text-white hover:bg-black">
                    {coaching.sentiment.overall}
                  </Badge>
                </div>

                {/* Engagement */}
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="mb-2">
                    <Badge
                      variant="outline"
                      className="px-3 py-1.5 text-sm border-gray-300"
                    >
                      {coaching.sentiment.engagement}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                    Engagement
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {coaching.sentiment.emotions.map((emotion, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs bg-gray-100 text-gray-600"
                      >
                        {emotion}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coaching Competencies */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <h3 className="text-base font-semibold text-black">
                ICF Coaching Competencies
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coachingMetrics.map(metric => {
                  const score = coaching.coaching_scores[
                    metric.key as keyof typeof coaching.coaching_scores
                  ] as number
                  const Icon = metric.icon
                  return (
                    <div
                      key={metric.key}
                      className={`p-4 rounded-lg border ${getScoreBackground(score)}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-white rounded">
                            <Icon className="h-3.5 w-3.5 text-black" />
                          </div>
                          <span className="text-sm font-medium text-black">
                            {metric.label}
                          </span>
                        </div>
                        <span
                          className={`font-bold text-sm ${getScoreColor(score)}`}
                        >
                          {score.toFixed(1)}
                        </span>
                      </div>
                      <Progress value={score * 10} className="h-1.5" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* GO LIVE Values */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <h3 className="text-base font-semibold text-black">
                GO LIVE Values Alignment
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {goliveValues.map(value => {
                  const score =
                    coaching.go_live_scores[
                      value.key as keyof typeof coaching.go_live_scores
                    ]
                  const Icon = value.icon
                  return (
                    <div
                      key={value.key}
                      className="text-center p-4 rounded-lg bg-gray-50 border border-gray-100 hover:shadow-sm transition-shadow"
                    >
                      <div className="w-14 h-14 mx-auto rounded-full bg-black p-0.5 mb-3">
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                          <Icon className="h-6 w-6 text-black" />
                        </div>
                      </div>
                      <h4 className="font-medium text-black text-sm mb-2">
                        {value.label}
                      </h4>
                      <div className="text-xl font-bold mb-2">
                        <span className={getScoreColor(score)}>
                          {score.toFixed(1)}
                        </span>
                        <span className="text-gray-300 text-base">/10</span>
                      </div>
                      <Progress value={score * 10} className="h-1.5" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Suggestions */}
          {coaching.suggestions && coaching.suggestions.length > 0 && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <h3 className="text-base font-semibold text-black flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Coaching Suggestions
                </h3>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {coaching.suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <CheckCircle2 className="h-4 w-4 text-black mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 leading-relaxed">
                        {suggestion}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!insights && !coaching && (
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="py-16 text-center">
            <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Analysis Available
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Generate AI analysis to see comprehensive insights and coaching
              performance metrics.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
