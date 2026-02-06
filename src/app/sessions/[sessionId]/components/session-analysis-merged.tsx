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
    label: 'Planning & Goal Setting',
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

function getScoreLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 8) return 'high'
  if (score >= 6) return 'medium'
  return 'low'
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
      {/* Session Insights Section */}
      {insights && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-app-surface rounded-lg">
              <Brain className="h-5 w-5 text-app-secondary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-app-primary">
                Session Insights
              </h2>
              <p className="text-sm text-app-secondary">
                AI analysis of conversation patterns
              </p>
            </div>
          </div>

          {/* Topics & Sentiment Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-app-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-app-secondary" />
                  <h3 className="text-sm font-semibold text-app-primary">
                    Topics & Keywords
                  </h3>
                </div>
              </CardHeader>
              <CardContent>
                <WordCloud
                  words={[...insights.topics, ...insights.keywords]}
                  className="min-h-[200px]"
                />
              </CardContent>
            </Card>

            <Card className="border-app-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-app-secondary" />
                  <h3 className="text-sm font-semibold text-app-primary">
                    Sentiment Analysis
                  </h3>
                </div>
              </CardHeader>
              <CardContent>
                <SentimentGauge sentiment={insights.sentiment} />
              </CardContent>
            </Card>
          </div>

          {/* Key Insights */}
          {insights.insights.length > 0 && (
            <Card className="border-app-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-app-secondary" />
                  <h3 className="text-sm font-semibold text-app-primary">
                    Key Insights
                  </h3>
                  <span className="text-xs text-app-secondary bg-app-surface px-2 py-0.5 rounded-full">
                    {insights.insights.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {insights.insights.map((insight, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 p-3 bg-app-surface rounded-lg"
                    >
                      <span className="flex-shrink-0 w-5 h-5 bg-app-primary text-white rounded text-xs flex items-center justify-center font-medium">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-app-secondary leading-relaxed">
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
              {insights.patterns.thinking_patterns &&
                insights.patterns.thinking_patterns.length > 0 && (
                  <Card className="border-app-border shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-app-secondary" />
                        <h3 className="text-sm font-semibold text-app-primary">
                          Thinking Patterns
                        </h3>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {insights.patterns.thinking_patterns.map(
                          (pattern, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 p-2"
                            >
                              <span className="w-1.5 h-1.5 bg-app-secondary rounded-full mt-2 flex-shrink-0" />
                              <p className="text-sm text-app-secondary">
                                {pattern}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

              <Card className="border-app-border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-app-secondary" />
                    <h3 className="text-sm font-semibold text-app-primary">
                      Strengths & Challenges
                    </h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.patterns?.strengths &&
                      insights.patterns.strengths.length > 0 && (
                        <div>
                          <p className="text-xs text-app-secondary uppercase tracking-wider font-medium mb-2">
                            Strengths
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {insights.patterns.strengths.map(
                              (strength, idx) => (
                                <Badge
                                  key={idx}
                                  className="bg-app-primary text-white hover:bg-app-primary/90"
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
                          <p className="text-xs text-app-secondary uppercase tracking-wider font-medium mb-2">
                            Challenges
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {insights.patterns.obstacles.map(
                              (obstacle, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="border-app-border text-app-secondary"
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
            <Card className="border-app-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-app-secondary" />
                  <h3 className="text-sm font-semibold text-app-primary">
                    Next Session Recommendations
                  </h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {insights.recommendations.next_session_focus?.map(
                    (focus, idx) => (
                      <div
                        key={idx}
                        className="flex gap-2 p-3 bg-app-surface rounded-lg"
                      >
                        <ArrowRight className="h-4 w-4 text-app-secondary mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-app-secondary">{focus}</p>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Coaching Performance Section */}
      {coaching && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 pt-6 border-t border-app-border">
            <div className="p-2 bg-app-surface rounded-lg">
              <BarChart3 className="h-5 w-5 text-app-secondary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-app-primary">
                Coaching Performance
              </h2>
              <p className="text-sm text-app-secondary">
                ICF competencies and GO LIVE methodology
              </p>
            </div>
          </div>

          {/* Overall Performance */}
          <Card className="border-app-border shadow-sm bg-app-surface">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {overallScore !== undefined && (
                  <div className="text-center p-4 bg-white rounded-xl border border-app-border">
                    <div className="text-4xl font-bold text-app-primary mb-1">
                      {overallScore.toFixed(1)}
                      <span className="text-xl text-app-secondary">/10</span>
                    </div>
                    <p className="text-xs text-app-secondary uppercase tracking-wider font-medium mb-3">
                      Overall Score
                    </p>
                    <Progress value={overallScore * 10} className="h-1.5" />
                  </div>
                )}

                <div className="text-center p-4 bg-white rounded-xl border border-app-border">
                  <div className="text-4xl font-bold text-app-primary mb-1">
                    {(coaching.sentiment.score * 10).toFixed(1)}
                    <span className="text-xl text-app-secondary">/10</span>
                  </div>
                  <p className="text-xs text-app-secondary uppercase tracking-wider font-medium mb-2">
                    Sentiment
                  </p>
                  <Badge className="bg-app-primary text-white">
                    {coaching.sentiment.overall}
                  </Badge>
                </div>

                <div className="text-center p-4 bg-white rounded-xl border border-app-border">
                  <Badge
                    variant="outline"
                    className="text-lg px-4 py-2 border-app-border mb-2"
                  >
                    {coaching.sentiment.engagement}
                  </Badge>
                  <p className="text-xs text-app-secondary uppercase tracking-wider font-medium mb-2">
                    Engagement
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {coaching.sentiment.emotions.map((emotion, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs bg-app-surface text-app-secondary"
                      >
                        {emotion}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ICF Competencies */}
          <Card className="border-app-border shadow-sm">
            <CardHeader className="pb-3">
              <h3 className="text-sm font-semibold text-app-primary">
                ICF Coaching Competencies
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {coachingMetrics.map(metric => {
                  const score = coaching.coaching_scores[
                    metric.key as keyof typeof coaching.coaching_scores
                  ] as number
                  const level = getScoreLevel(score)
                  const Icon = metric.icon
                  return (
                    <div
                      key={metric.key}
                      className="p-3 bg-app-surface rounded-lg border border-app-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-app-secondary" />
                          <span className="text-sm text-app-primary">
                            {metric.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              level === 'high'
                                ? 'bg-green-500'
                                : level === 'medium'
                                  ? 'bg-app-secondary'
                                  : 'bg-app-secondary'
                            }`}
                          />
                          <span className="font-semibold text-sm text-app-primary">
                            {score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <Progress value={score * 10} className="h-1" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* GO LIVE Values */}
          <Card className="border-app-border shadow-sm">
            <CardHeader className="pb-3">
              <h3 className="text-sm font-semibold text-app-primary">
                GO LIVE Values
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {goliveValues.map(value => {
                  const score =
                    coaching.go_live_scores[
                      value.key as keyof typeof coaching.go_live_scores
                    ]
                  const level = getScoreLevel(score)
                  const Icon = value.icon
                  return (
                    <div
                      key={value.key}
                      className="text-center p-4 bg-app-surface rounded-xl"
                    >
                      <div className="w-10 h-10 mx-auto bg-white border border-app-border rounded-full flex items-center justify-center mb-3">
                        <Icon className="h-5 w-5 text-app-secondary" />
                      </div>
                      <h4 className="text-xs font-medium text-app-secondary mb-2">
                        {value.label}
                      </h4>
                      <div className="flex items-center justify-center gap-1.5 mb-2">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            level === 'high'
                              ? 'bg-green-500'
                              : level === 'medium'
                                ? 'bg-app-secondary'
                                : 'bg-app-secondary'
                          }`}
                        />
                        <span className="text-lg font-bold text-app-primary">
                          {score.toFixed(1)}
                        </span>
                      </div>
                      <Progress value={score * 10} className="h-1" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Suggestions */}
          {coaching.suggestions && coaching.suggestions.length > 0 && (
            <Card className="border-app-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-app-secondary" />
                  <h3 className="text-sm font-semibold text-app-primary">
                    Coaching Suggestions
                  </h3>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {coaching.suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-3 bg-app-surface rounded-lg"
                    >
                      <CheckCircle2 className="h-4 w-4 text-app-secondary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-app-secondary">
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
        <Card className="border-dashed border-2 border-app-border">
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 bg-app-surface rounded-xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-6 w-6 text-app-secondary" />
            </div>
            <h3 className="text-base font-semibold text-app-primary mb-2">
              No Analysis Available
            </h3>
            <p className="text-sm text-app-secondary max-w-sm mx-auto">
              Generate AI analysis to see insights and coaching performance
              metrics.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
