'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Brain,
  Target,
  MessageSquare, 
  Lightbulb, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Users,
  Clock,
  FileText,
  Sparkles,
  ArrowRight,
  BarChart3,
  Zap
} from 'lucide-react'
import { type SessionInsights } from '@/services/analysis-service'
import { WordCloud } from './word-cloud'
import { SentimentGauge } from './sentiment-gauge'

interface SessionInsightsModernProps {
  insights: SessionInsights
}

export function SessionInsightsModern({ insights }: SessionInsightsModernProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'recommendations'>('overview')
  
  // Calculate effectiveness color
  const getEffectivenessColor = (score: number) => {
    if (score >= 8) return 'from-gray-800 to-gray-900'
    if (score >= 6) return 'from-gray-600 to-gray-700'
    return 'from-gray-400 to-gray-500'
  }
  
  return (
    <div className="space-y-6">
      {/* Hero Summary Card */}
      <Card className="bg-gradient-to-br from-gray-50 to-white border-gray-200 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Brain className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Session Overview</h3>
                <p className="text-sm text-gray-500">AI-generated insights from your coaching session</p>
              </div>
            </div>
            {insights.effectiveness && (
              <div className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${getEffectivenessColor(insights.effectiveness.score)} text-white text-sm font-medium`}>
                {insights.effectiveness.score}/10 Effectiveness
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed mb-4">{insights.summary}</p>
          
          {/* Quick Stats */}
          {insights.metadata && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
              {insights.metadata.word_count && (
                <div className="text-center">
                  <FileText className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900">{insights.metadata.word_count.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Words</p>
                </div>
              )}
              {insights.metadata.speaker_balance && (
                <div className="text-center">
                  <Users className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-gray-900">{insights.metadata.speaker_balance}</p>
                  <p className="text-xs text-gray-500">Balance</p>
                </div>
              )}
              {insights.metadata.session_phase && (
                <div className="text-center">
                  <Clock className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-gray-900 capitalize">{insights.metadata.session_phase.split('/').join(' → ')}</p>
                  <p className="text-xs text-gray-500">Phase</p>
                </div>
              )}
              {insights.metadata.coaching_style && (
                <div className="text-center">
                  <Sparkles className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-gray-900 capitalize">{insights.metadata.coaching_style}</p>
                  <p className="text-xs text-gray-500">Style</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('overview')}
          className={activeTab === 'overview' ? 'bg-gray-900 text-white' : 'text-gray-700'}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={activeTab === 'patterns' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('patterns')}
          className={activeTab === 'patterns' ? 'bg-gray-900 text-white' : 'text-gray-700'}
        >
          <Target className="h-4 w-4 mr-2" />
          Patterns
        </Button>
        <Button
          variant={activeTab === 'recommendations' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('recommendations')}
          className={activeTab === 'recommendations' ? 'bg-gray-900 text-white' : 'text-gray-700'}
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Next Steps
        </Button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Topics Word Cloud */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Topics & Keywords
              </h4>
            </CardHeader>
            <CardContent>
              <WordCloud 
                words={[...insights.topics, ...insights.keywords]} 
                className="min-h-[200px]"
              />
            </CardContent>
          </Card>
          
          {/* Sentiment Analysis */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Sentiment Analysis
              </h4>
            </CardHeader>
            <CardContent>
              <SentimentGauge sentiment={insights.sentiment} />
            </CardContent>
          </Card>
          
          {/* Key Insights */}
          {insights.insights.length > 0 && (
            <Card className="border-gray-200 lg:col-span-2">
              <CardHeader className="pb-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Key Insights
                </h4>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.insights.map((insight, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-700">
                          {idx + 1}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Action Items */}
          {insights.action_items.length > 0 && (
            <Card className="border-gray-200 lg:col-span-2">
              <CardHeader className="pb-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Action Items
                </h4>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {insights.action_items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-3.5 w-3.5 text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{item}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {activeTab === 'patterns' && insights.patterns && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Thinking Patterns */}
          {insights.patterns.thinking_patterns && insights.patterns.thinking_patterns.length > 0 && (
            <Card className="border-gray-200">
              <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Thinking Patterns
                </h4>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {insights.patterns.thinking_patterns.map((pattern, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5" />
                      <p className="text-sm text-gray-700">{pattern}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Language Patterns */}
          {insights.patterns.language_patterns && insights.patterns.language_patterns.length > 0 && (
            <Card className="border-gray-200">
              <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Language Patterns
                </h4>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {insights.patterns.language_patterns.map((pattern, idx) => (
                    <div key={idx} className="p-2 bg-gray-50 rounded text-sm text-gray-700 italic">
                      {pattern}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Strengths & Obstacles */}
          <Card className="border-gray-200 lg:col-span-2">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                {insights.patterns.strengths && insights.patterns.strengths.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-4 w-4 text-gray-700" />
                      <h5 className="font-semibold text-gray-900">Strengths</h5>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {insights.patterns.strengths.map((strength, idx) => (
                        <Badge key={idx} className="bg-gray-100 text-gray-700 border-gray-300">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Obstacles */}
                {insights.patterns.obstacles && insights.patterns.obstacles.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4 text-gray-600" />
                      <h5 className="font-semibold text-gray-900">Obstacles</h5>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {insights.patterns.obstacles.map((obstacle, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-gray-50 text-gray-600">
                          {obstacle}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {activeTab === 'recommendations' && insights.recommendations && (
        <div className="space-y-6">
          {/* Next Session Focus */}
          {insights.recommendations.next_session_focus && insights.recommendations.next_session_focus.length > 0 && (
            <Card className="border-gray-200">
              <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Next Session Focus Areas
                </h4>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.recommendations.next_session_focus.map((focus, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                      <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">{focus}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Follow-up Questions */}
          {insights.recommendations.follow_up_questions && insights.recommendations.follow_up_questions.length > 0 && (
            <Card className="border-gray-200">
              <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Powerful Questions for Next Session
                </h4>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {insights.recommendations.follow_up_questions.map((question, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border-l-4 border-gray-400">
                      <p className="text-sm text-gray-700 italic">&ldquo;{question}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Suggested Resources */}
          {insights.recommendations.suggested_resources && insights.recommendations.suggested_resources.length > 0 && (
            <Card className="border-gray-200">
              <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Suggested Resources
                </h4>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2">
                  {insights.recommendations.suggested_resources.map((resource, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span className="text-sm text-gray-700">{resource}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}