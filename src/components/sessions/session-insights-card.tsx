'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Target, MessageSquare, Lightbulb, CheckCircle2, AlertCircle } from 'lucide-react'
import { type SessionInsights } from '@/services/analysis-service'

interface SessionInsightsCardProps {
  insights: SessionInsights
}

export function SessionInsightsCard({ insights }: SessionInsightsCardProps) {
  // Calculate sentiment color
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-gray-900'
      case 'negative':
        return 'text-gray-600'
      default:
        return 'text-gray-700'
    }
  }

  // Get effectiveness badge style
  const getEffectivenessStyle = (score: number) => {
    if (score >= 8) return 'bg-gray-900 text-white'
    if (score >= 6) return 'bg-gray-700 text-white'
    return 'bg-gray-500 text-white'
  }

  return (
    <div className="space-y-4">
      {/* Summary Section */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-900">Session Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 leading-relaxed">{insights.summary}</p>
        </CardContent>
      </Card>

      {/* Topics and Keywords */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Topics & Keywords
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Topics */}
          {insights.topics.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Main Topics</p>
              <div className="flex flex-wrap gap-1.5">
                {insights.topics.map((topic, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs border-gray-300 text-gray-700">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Keywords */}
          {insights.keywords.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {insights.keywords.map((keyword, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sentiment and Effectiveness */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Session Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Sentiment */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Sentiment</span>
            <span className={`text-sm font-medium capitalize ${getSentimentColor(insights.sentiment.overall)}`}>
              {insights.sentiment.overall} ({insights.sentiment.score.toFixed(1)}/10)
            </span>
          </div>
          
          {/* Engagement */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Engagement</span>
            <span className="text-sm font-medium capitalize text-gray-700">
              {insights.sentiment.engagement}
            </span>
          </div>
          
          {/* Energy Level */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Energy Level</span>
            <span className="text-sm font-medium capitalize text-gray-700">
              {insights.sentiment.energy_level}
            </span>
          </div>
          
          {/* Effectiveness */}
          {insights.effectiveness && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Effectiveness</span>
                <Badge className={getEffectivenessStyle(insights.effectiveness.score)}>
                  {insights.effectiveness.score}/10
                </Badge>
              </div>
              <p className="text-xs text-gray-600">{insights.effectiveness.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Insights */}
      {insights.insights.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.insights.map((insight, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span className="leading-relaxed">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      {insights.action_items.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.action_items.map((item, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Patterns */}
      {insights.patterns && Object.keys(insights.patterns).length > 0 && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Observed Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.patterns.strengths && insights.patterns.strengths.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Strengths</p>
                <div className="flex flex-wrap gap-1.5">
                  {insights.patterns.strengths.map((strength, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs border-gray-300 text-gray-700">
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {insights.patterns.obstacles && insights.patterns.obstacles.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Obstacles</p>
                <div className="flex flex-wrap gap-1.5">
                  {insights.patterns.obstacles.map((obstacle, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                      {obstacle}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {insights.recommendations && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.recommendations.next_session_focus && insights.recommendations.next_session_focus.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Next Session Focus</p>
                <ul className="space-y-1">
                  {insights.recommendations.next_session_focus.map((focus, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-gray-400">→</span>
                      <span>{focus}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {insights.recommendations.follow_up_questions && insights.recommendations.follow_up_questions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Follow-up Questions</p>
                <ul className="space-y-1">
                  {insights.recommendations.follow_up_questions.map((question, idx) => (
                    <li key={idx} className="text-sm text-gray-700 italic">
                      &quot;{question}&quot;
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      {insights.metadata && (
        <Card className="border-gray-200">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              {insights.metadata.word_count && (
                <div>
                  <span className="text-gray-600">Word Count:</span>
                  <span className="ml-1 font-medium text-gray-700">{insights.metadata.word_count}</span>
                </div>
              )}
              {insights.metadata.speaker_balance && (
                <div>
                  <span className="text-gray-600">Balance:</span>
                  <span className="ml-1 font-medium text-gray-700">{insights.metadata.speaker_balance}</span>
                </div>
              )}
              {insights.metadata.session_phase && (
                <div>
                  <span className="text-gray-600">Phase:</span>
                  <span className="ml-1 font-medium text-gray-700 capitalize">{insights.metadata.session_phase}</span>
                </div>
              )}
              {insights.metadata.coaching_style && (
                <div>
                  <span className="text-gray-600">Style:</span>
                  <span className="ml-1 font-medium text-gray-700 capitalize">{insights.metadata.coaching_style}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}