'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Target,
  TrendingUp,
  Heart,
  Shield,
  Eye,
  Zap,
  Brain,
  MessageSquare,
  Users,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  BarChart3,
} from 'lucide-react'
import type { CoachingAnalysis } from '@/services/analysis-service'

interface FullCoachingAnalysisProps {
  analysis: CoachingAnalysis
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
  {
    key: 'growth',
    label: 'Growth',
    icon: TrendingUp,
    color: 'from-gray-700 to-gray-900',
  },
  {
    key: 'ownership',
    label: 'Ownership',
    icon: Shield,
    color: 'from-gray-700 to-gray-900',
  },
  {
    key: 'love',
    label: 'Love',
    icon: Heart,
    color: 'from-gray-700 to-gray-900',
  },
  {
    key: 'integrity',
    label: 'Integrity',
    icon: Shield,
    color: 'from-gray-700 to-gray-900',
  },
  {
    key: 'vision',
    label: 'Vision',
    icon: Eye,
    color: 'from-gray-700 to-gray-900',
  },
  {
    key: 'energy',
    label: 'Energy',
    icon: Zap,
    color: 'from-gray-700 to-gray-900',
  },
]

function getScoreColor(score: number): string {
  if (score >= 8) return 'text-gray-900'
  if (score >= 6) return 'text-gray-700'
  return 'text-gray-500'
}

function getScoreBackground(score: number): string {
  if (score >= 8) return 'bg-gray-50 border-gray-300'
  if (score >= 6) return 'bg-gray-50 border-gray-200'
  return 'bg-white border-gray-200'
}

function getSentimentColor(sentiment: string): string {
  switch (sentiment.toLowerCase()) {
    case 'positive':
      return 'bg-gray-100 text-gray-900 font-medium'
    case 'negative':
      return 'bg-white text-gray-600 border border-gray-200'
    default:
      return 'bg-gray-50 text-gray-700'
  }
}

export default function FullCoachingAnalysis({
  analysis,
}: FullCoachingAnalysisProps) {
  const overallScore =
    analysis.coaching_scores.overall ||
    Object.values(analysis.coaching_scores).reduce(
      (sum, score) => sum + (typeof score === 'number' ? score : 0),
      0,
    ) / 12

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Overall Performance
            </h3>
          </div>
          <Badge
            className={`${getSentimentColor(analysis.sentiment.overall)} font-medium`}
          >
            {analysis.sentiment.overall}
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overall Score */}
          <div className="text-center p-4 bg-white rounded-lg border border-gray-100">
            <div className="text-3xl font-bold mb-2">
              <span className={getScoreColor(overallScore)}>
                {overallScore.toFixed(1)}
              </span>
              <span className="text-gray-300 text-xl">/10</span>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              Overall Score
            </p>
            <Progress value={overallScore * 10} className="mt-3 h-1.5" />
          </div>

          {/* Sentiment Score */}
          <div className="text-center p-4 bg-white rounded-lg border border-gray-100">
            <div className="text-3xl font-bold mb-2">
              <span className={getScoreColor(analysis.sentiment.score * 10)}>
                {(analysis.sentiment.score * 10).toFixed(1)}
              </span>
              <span className="text-gray-300 text-xl">/10</span>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              Sentiment
            </p>
            <Progress
              value={analysis.sentiment.score * 100}
              className="mt-3 h-1.5"
            />
          </div>

          {/* Engagement */}
          <div className="text-center p-4 bg-white rounded-lg border border-gray-100">
            <div className="mb-2">
              <Badge
                variant="outline"
                className="px-3 py-1.5 text-sm font-medium border-gray-200"
              >
                {analysis.sentiment.engagement}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
              Engagement
            </p>
            <div className="flex flex-wrap gap-1 justify-center">
              {analysis.sentiment.emotions.map((emotion, idx) => (
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
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="coaching" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100/50 p-1 rounded-lg">
          <TabsTrigger
            value="coaching"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Coaching Scores
          </TabsTrigger>
          <TabsTrigger
            value="golive"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            GO LIVE Values
          </TabsTrigger>
          <TabsTrigger
            value="suggestions"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Suggestions
          </TabsTrigger>
          <TabsTrigger
            value="insights"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            AI Insights
          </TabsTrigger>
        </TabsList>

        {/* Coaching Scores Tab */}
        <TabsContent value="coaching" className="mt-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Coaching Competencies
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coachingMetrics.map(metric => {
                const score = analysis.coaching_scores[
                  metric.key as keyof typeof analysis.coaching_scores
                ] as number
                const Icon = metric.icon
                return (
                  <div
                    key={metric.key}
                    className={`p-4 rounded-lg border ${getScoreBackground(score)}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-white/80 rounded">
                          <Icon className="h-3.5 w-3.5 text-gray-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
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
          </div>
        </TabsContent>

        {/* GO LIVE Values Tab */}
        <TabsContent value="golive" className="mt-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              GO LIVE Values Alignment
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {goliveValues.map(value => {
                const score =
                  analysis.go_live_scores[
                    value.key as keyof typeof analysis.go_live_scores
                  ]
                const Icon = value.icon
                return (
                  <div
                    key={value.key}
                    className="text-center p-4 rounded-lg bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-sm transition-shadow"
                  >
                    <div
                      className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${value.color} p-0.5 mb-3`}
                    >
                      <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                        <Icon className="h-7 w-7 text-gray-700" />
                      </div>
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm mb-2">
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
          </div>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="mt-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">
                Coaching Suggestions
              </h3>
            </div>
            <ul className="space-y-3">
              {analysis.suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <CheckCircle2 className="h-4 w-4 text-gray-700 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 leading-relaxed">
                    {suggestion}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="mt-6 space-y-4">
          {analysis.personal_ai_suggestions &&
            analysis.personal_ai_suggestions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Brain className="h-5 w-5 text-gray-700" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Personal AI Insights
                  </h3>
                </div>
                <ul className="space-y-3">
                  {analysis.personal_ai_suggestions.map((insight, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-3.5 bg-white rounded-lg border border-gray-200"
                    >
                      <AlertCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 leading-relaxed">
                        {insight}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">
              Analysis Details
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Version:</span>
                <span className="font-medium text-gray-700">
                  {analysis.analysis_version}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Processing:</span>
                <span className="font-medium text-gray-700">
                  {analysis.processing_time_ms}ms
                </span>
              </div>
              <div className="col-span-2 flex justify-between">
                <span className="text-gray-500">Analyzed:</span>
                <span className="font-medium text-gray-700">
                  {new Date(analysis.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
