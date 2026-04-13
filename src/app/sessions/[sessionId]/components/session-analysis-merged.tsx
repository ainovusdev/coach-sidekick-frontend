'use client'

import React, { useState } from 'react'
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
  ChevronDown,
  ChevronUp,
  Award,
  Star,
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

type ScoreLevel = 'sophisticated' | 'effective' | 'developing' | 'ineffective'

const coachingMetrics = [
  {
    key: 'maximum_value',
    label: 'Maximum Value',
    icon: Target,
    description: 'Is max value established and does it drive the session?',
    levels: {
      ineffective: 'Max value is never established in the call.',
      developing: 'Max value is vaguely explored with little direction.',
      effective:
        'Max value is established with high participation; some drift may occur.',
      sophisticated:
        'Max value drives full participation from both coach and client. Client reports creating max value.',
    },
  },
  {
    key: 'intuitive_fence',
    label: 'Intuitive Fence',
    icon: Eye,
    description:
      "Does the coach explore whether the client's vision is inside or outside their comfort zone?",
    levels: {
      ineffective: "Coach does not inquire about the client's Intuitive Fence.",
      developing:
        'Coach helps identify the gap and explore new occurrences to close it.',
      effective:
        "Coach's questions help the client discover what they are capable of.",
      sophisticated:
        'Questions create an encounter with new ways of being related to accomplishing max value.',
    },
  },
  {
    key: 'integrity',
    label: 'Integrity',
    icon: Shield,
    description:
      'Are commitments specific, time-bound, and designed to grow — not just to keep?',
    levels: {
      ineffective:
        'Little to no clear commitment. Actionable insights are missed.',
      developing:
        'Commitments are mostly to keep; little coaching is done around them.',
      effective:
        'Specific, time-bound commitments toward achieving maximum value.',
      sophisticated:
        'Commitments designed not only to keep but to grow. Coach tests commitments before client gives their word.',
    },
  },
  {
    key: 'inquiry_vs_insight',
    label: 'Inquiry vs Insight',
    icon: MessageSquare,
    description:
      'Talk-time ratio, question quality, and effective use of silence.',
    levels: {
      ineffective: 'Coach does most of the talking during the session.',
      developing: 'Coach and client split the coaching time roughly 50/50.',
      effective:
        "Coach's speech is predominantly open-ended questions (>60%). Questions invite new occurrences.",
      sophisticated:
        "Powerful questions and silence are the coach's key tools. Client discovers insights leading to actions.",
    },
  },
  {
    key: 'listening',
    label: 'Listening',
    icon: Users,
    description:
      'Level 1, 2, or 3 listening — words, body language, intuition.',
    levels: {
      ineffective:
        "Coach appears inattentive to the client's words, tone, and body language. (Level 1)",
      developing:
        'Coach is listening to respond — thinking about the next thing to say. (Level 1)',
      effective:
        'Coach is focused on what the client is saying, noticing facial expressions and body language. (Level 2/3)',
      sophisticated:
        'Coach practices global listening: all verbal and non-verbal aspects of communication. (Level 3)',
    },
  },
  {
    key: 'reinvention',
    label: 'Reinvention',
    icon: Sparkles,
    description:
      'Past-focused vs generative future. Ways of being vs things to do.',
    levels: {
      ineffective:
        'Conversation is focused on the past; coach does not move into generative future.',
      developing: 'Session focuses on things to do instead of ways to be.',
      effective:
        'Coach creates space to examine current mental frameworks, leading to new frameworks and results.',
      sophisticated:
        'Coach guides the conversation to explore new ways of being to accomplish maximum value.',
    },
  },
  {
    key: 'energy',
    label: 'Energy',
    icon: Zap,
    description: 'Trust, natural flow, and intentional energy diversity.',
    levels: {
      ineffective:
        'Energies are "off" with a discernible experience of mistrust.',
      developing:
        'Coach shows up prepared and ready. The call might feel overly structured.',
      effective:
        'Inviting, neutral, and curious energy. Natural flow with transitions.',
      sophisticated:
        "Coach intentionally plays diverse energies to draw out client's full participation.",
    },
  },
  {
    key: 'disruption',
    label: 'Disruption',
    icon: Brain,
    description:
      'Challenging narratives, stories, and excuses without bailing out.',
    levels: {
      ineffective:
        "Coach tolerates client's reasons, narratives, and excuses without leveraging them.",
      developing:
        'Coach points out potential disruption topics but does not hold the space.',
      effective:
        'Coach disrupts client narratives, stories, excuses, and occurrences directly.',
      sophisticated:
        'Coach strategically disrupts. Does not "bail out" — advocates for client to choose resourcefulness.',
    },
  },
]

const goliveValues = [
  { key: 'growth', label: 'Growth', icon: TrendingUp },
  { key: 'ownership', label: 'Ownership', icon: Shield },
  { key: 'love', label: 'Love', icon: Heart },
  { key: 'integrity', label: 'Integrity', icon: Shield },
  { key: 'vision', label: 'Vision', icon: Eye },
  { key: 'energy', label: 'Energy', icon: Zap },
]

function getScoreLevel(score: number): ScoreLevel {
  if (score >= 9) return 'sophisticated'
  if (score >= 7) return 'effective'
  if (score >= 4) return 'developing'
  return 'ineffective'
}

function getScoreLevelLabel(level: ScoreLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1)
}

function getScoreLevelColor(level: ScoreLevel) {
  switch (level) {
    case 'sophisticated':
      return {
        badge:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
        progress: 'bg-emerald-500',
        border: 'border-emerald-200 dark:border-emerald-800',
        bg: 'bg-emerald-50 dark:bg-emerald-950/20',
        dot: 'bg-emerald-500',
      }
    case 'effective':
      return {
        badge:
          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        progress: 'bg-blue-500',
        border: 'border-blue-200 dark:border-blue-800',
        bg: 'bg-blue-50 dark:bg-blue-950/20',
        dot: 'bg-blue-500',
      }
    case 'developing':
      return {
        badge:
          'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        progress: 'bg-amber-500',
        border: 'border-amber-200 dark:border-amber-800',
        bg: 'bg-amber-50 dark:bg-amber-950/20',
        dot: 'bg-amber-500',
      }
    case 'ineffective':
      return {
        badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        progress: 'bg-red-400',
        border: 'border-red-200 dark:border-red-800',
        bg: 'bg-red-50 dark:bg-red-950/20',
        dot: 'bg-red-400',
      }
  }
}

function MetricCard({
  metric,
  score,
  justification,
}: {
  metric: (typeof coachingMetrics)[number]
  score: number
  justification?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const level = getScoreLevel(score)
  const colors = getScoreLevelColor(level)
  const Icon = metric.icon
  const levelDescription = metric.levels[level]

  return (
    <div
      className={`rounded-xl border ${colors.border} ${colors.bg} transition-all`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg border border-app-border mt-0.5">
              <Icon className="h-4 w-4 text-app-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-app-primary">
                  {metric.label}
                </span>
                <Badge
                  className={`text-[10px] px-1.5 py-0 h-5 font-medium ${colors.badge}`}
                >
                  {getScoreLevelLabel(level)}
                </Badge>
              </div>
              <p className="text-xs text-app-secondary mt-0.5 leading-relaxed">
                {metric.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-lg font-bold text-app-primary tabular-nums">
              {score.toFixed(1)}
            </span>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-app-secondary" />
            ) : (
              <ChevronDown className="h-4 w-4 text-app-secondary" />
            )}
          </div>
        </div>
        <div className="mt-3">
          <Progress value={score * 10} className="h-1.5" />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0">
          {/* Justification - why this score was given */}
          {justification && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-app-border p-3 mt-1 mb-2">
              <p className="text-xs font-medium text-app-secondary uppercase tracking-wider mb-1.5">
                Why this score
              </p>
              <p className="text-sm text-app-primary leading-relaxed">
                {justification}
              </p>
            </div>
          )}

          {/* Current rubric level */}
          <div
            className={`rounded-lg border p-3 ${justification ? '' : 'mt-1'} ${colors.border} ${colors.bg}`}
          >
            <p className="text-xs font-medium text-app-secondary uppercase tracking-wider mb-1.5">
              Current Level: {getScoreLevelLabel(level)}
            </p>
            <p className="text-sm text-app-primary leading-relaxed">
              {levelDescription}
            </p>
          </div>
          <div className="mt-2 space-y-1">
            {(
              [
                'ineffective',
                'developing',
                'effective',
                'sophisticated',
              ] as const
            ).map(l => {
              const isActive = l === level
              return (
                <div
                  key={l}
                  className={`flex items-start gap-2 px-2 py-1.5 rounded text-xs ${
                    isActive
                      ? 'bg-white dark:bg-gray-800 font-medium text-app-primary'
                      : 'text-app-secondary/70'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                      isActive
                        ? getScoreLevelColor(l).dot
                        : 'bg-app-secondary/30'
                    }`}
                  />
                  <span>
                    <span className="font-medium">{getScoreLevelLabel(l)}</span>
                    {' — '}
                    {metric.levels[l]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function SessionAnalysisMerged({
  insights,
  coaching,
}: SessionAnalysisMergedProps) {
  const overallScore = coaching?.coaching_scores
    ? coaching.coaching_scores.overall ||
      (() => {
        const numericValues = Object.values(coaching.coaching_scores).filter(
          (v): v is number => typeof v === 'number',
        )
        return numericValues.length > 0
          ? numericValues.reduce((sum, score) => sum + score, 0) /
              numericValues.length
          : 0
      })()
    : undefined

  const overallLevel = overallScore ? getScoreLevel(overallScore) : undefined
  const overallColors = overallLevel
    ? getScoreLevelColor(overallLevel)
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
                      <span className="flex-shrink-0 w-5 h-5 bg-app-primary text-app-background rounded text-xs flex items-center justify-center font-medium">
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
                                  className="bg-app-primary text-app-background hover:bg-app-primary/90"
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
      {coaching &&
        coaching.coaching_scores &&
        coaching.go_live_scores &&
        coaching.sentiment && (
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
                  Meta Performance Framework and GO LIVE methodology
                </p>
              </div>
            </div>

            {/* Overall Score + Assessment */}
            <Card className="border-app-border shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-3">
                  {/* Overall Score */}
                  {overallScore !== undefined &&
                    overallColors &&
                    overallLevel && (
                      <div
                        className={`p-6 ${overallColors.bg} border-b lg:border-b-0 lg:border-r border-app-border`}
                      >
                        <div className="text-center">
                          <div className="text-5xl font-bold text-app-primary mb-1">
                            {overallScore.toFixed(1)}
                            <span className="text-2xl text-app-secondary font-normal">
                              /10
                            </span>
                          </div>
                          <Badge
                            className={`${overallColors.badge} text-xs font-medium mb-3`}
                          >
                            {getScoreLevelLabel(overallLevel)}
                          </Badge>
                          <p className="text-xs text-app-secondary uppercase tracking-wider font-medium mt-2">
                            Overall Score
                          </p>
                          <Progress
                            value={overallScore * 10}
                            className="h-2 mt-3"
                          />
                        </div>

                        {/* Quick stats */}
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg border border-app-border">
                            <p className="text-sm font-semibold text-app-primary">
                              {coaching.sentiment.overall}
                            </p>
                            <p className="text-[10px] text-app-secondary uppercase">
                              Sentiment
                            </p>
                          </div>
                          <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg border border-app-border">
                            <p className="text-sm font-semibold text-app-primary">
                              {coaching.sentiment.engagement}
                            </p>
                            <p className="text-[10px] text-app-secondary uppercase">
                              Engagement
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Assessment + Strengths/Growth */}
                  <div className="lg:col-span-2 p-6 space-y-5">
                    {/* Overall Assessment */}
                    {coaching.overall_assessment && (
                      <div>
                        <h4 className="text-xs text-app-secondary uppercase tracking-wider font-medium mb-2">
                          Session Assessment
                        </h4>
                        <p className="text-sm text-app-primary leading-relaxed">
                          {coaching.overall_assessment}
                        </p>
                      </div>
                    )}

                    {/* Strengths + Areas for Growth */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {coaching.key_strengths &&
                        coaching.key_strengths.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <Award className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              <h4 className="text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-medium">
                                Key Strengths
                              </h4>
                            </div>
                            <div className="space-y-1.5">
                              {coaching.key_strengths.map((s, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900/30"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                                    {s}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {coaching.areas_for_growth &&
                        coaching.areas_for_growth.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <TrendingUp className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                              <h4 className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider font-medium">
                                Areas for Growth
                              </h4>
                            </div>
                            <div className="space-y-1.5">
                              {coaching.areas_for_growth.map((a, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-100 dark:border-amber-900/30"
                                >
                                  <ArrowRight className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                    {a}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Breakthrough Moments */}
                    {coaching.breakthrough_moments &&
                      coaching.breakthrough_moments.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Star className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                            <h4 className="text-xs text-purple-700 dark:text-purple-400 uppercase tracking-wider font-medium">
                              Breakthrough Moments
                            </h4>
                          </div>
                          <div className="space-y-1.5">
                            {coaching.breakthrough_moments.map((m, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 p-2 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-100 dark:border-purple-900/30"
                              >
                                <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-purple-800 dark:text-purple-300 leading-relaxed">
                                  {m}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Emotions */}
                    {coaching.sentiment.emotions.length > 0 && (
                      <div>
                        <h4 className="text-xs text-app-secondary uppercase tracking-wider font-medium mb-2">
                          Detected Emotions
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
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
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meta Performance Criteria */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-semibold text-app-primary">
                  Meta Performance Criteria
                </h3>
                <span className="text-xs text-app-secondary">
                  Click any criterion to see the full rubric
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {coachingMetrics.map(metric => {
                  const score =
                    (coaching.coaching_scores[
                      metric.key as keyof typeof coaching.coaching_scores
                    ] as number) ?? 0
                  const justification =
                    coaching.score_justifications?.[metric.key]
                  return (
                    <MetricCard
                      key={metric.key}
                      metric={metric}
                      score={score}
                      justification={justification}
                    />
                  )
                })}
              </div>
            </div>

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
                      ] ?? 0
                    const level = getScoreLevel(score)
                    const colors = getScoreLevelColor(level)
                    const Icon = value.icon
                    return (
                      <div
                        key={value.key}
                        className={`text-center p-4 rounded-xl ${colors.bg} border ${colors.border}`}
                      >
                        <div className="w-10 h-10 mx-auto bg-white dark:bg-gray-800 border border-app-border rounded-full flex items-center justify-center mb-3">
                          <Icon className="h-5 w-5 text-app-secondary" />
                        </div>
                        <h4 className="text-xs font-medium text-app-secondary mb-1">
                          {value.label}
                        </h4>
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <span className="text-lg font-bold text-app-primary">
                            {score.toFixed(1)}
                          </span>
                        </div>
                        <Badge
                          className={`text-[10px] px-1.5 py-0 h-4 ${colors.badge}`}
                        >
                          {getScoreLevelLabel(level)}
                        </Badge>
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
                          {typeof suggestion === 'string'
                            ? suggestion
                            : (suggestion as any).suggestion ||
                              (suggestion as any).text ||
                              String(suggestion)}
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
