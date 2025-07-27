'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { ApiClient } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  Target,
  TrendingUp,
  User,
  Bot,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  Activity,
  ChevronRight,
  Zap,
  Trophy,
  Brain,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface TranscriptEntry {
  id: string
  speaker: string
  text: string
  timestamp: string
  confidence: number | null
  created_at: string
}

interface CoachingAnalysis {
  id: string
  overall_score: number | null
  conversation_phase: string | null
  key_suggestions: string[] | null
  improvement_areas: string[] | null
  positive_feedback: string[] | null
  analysis_data: any
  created_at: string
}

interface MeetingSummary {
  id: string
  duration_minutes: number | null
  total_transcript_entries: number | null
  total_coaching_suggestions: number | null
  final_overall_score: number | null
  final_conversation_phase: string | null
  key_insights: string[] | null
  action_items: string[] | null
  meeting_summary: string | null
  created_at: string
}

interface SessionDetails {
  session: {
    id: string
    bot_id: string
    meeting_url: string
    status: string
    created_at: string
    updated_at: string
    metadata: any
  }
  transcript: TranscriptEntry[]
  coaching_analyses: CoachingAnalysis[]
  meeting_summary: MeetingSummary | null
}

export default function SessionDetailsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [sessionData, setSessionData] = useState<SessionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const resolvedParams = React.use(params)

  // Redirect to auth if not authenticated
  if (!authLoading && !user) {
    router.push('/auth')
    return null
  }

  useEffect(() => {
    if (!user || authLoading) return

    const fetchSessionDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await ApiClient.get(
          `/api/meetings/${resolvedParams.sessionId}/transcript`,
        )

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Session not found')
          }
          throw new Error('Failed to load session details')
        }

        const data = await response.json()
        setSessionData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchSessionDetails()
  }, [resolvedParams.sessionId, user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
            <div className="absolute inset-2 animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 animation-delay-150"></div>
            <div className="absolute inset-4 animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600 animation-delay-300"></div>
          </div>
          <p className="text-gray-600 font-medium animate-pulse">Loading session details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 border border-red-100">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Error Loading Session
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => router.back()}
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="border-2 hover:bg-gray-50 transition-all duration-200"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Session not found
          </h1>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const { session, transcript, coaching_analyses, meeting_summary } =
    sessionData
  const latestAnalysis = coaching_analyses[coaching_analyses.length - 1]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-200 shadow-green-100/50'
      case 'in_progress':
        return 'bg-gradient-to-r from-blue-50 to-sky-50 text-blue-800 border-blue-200 shadow-blue-100/50'
      case 'error':
        return 'bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-red-200 shadow-red-100/50'
      default:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-800 border-gray-200 shadow-gray-100/50'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-amber-600'
    return 'text-red-600'
  }

  const getScoreGradient = (score: number) => {
    if (score >= 8) return 'from-green-500 to-emerald-500'
    if (score >= 6) return 'from-amber-500 to-orange-500'
    return 'from-red-500 to-rose-500'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
              className="hover:bg-gray-100/80 transition-all duration-200 -ml-2 sm:ml-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Session Details
                </h1>
                <Badge className={`${getStatusColor(session.status)} px-3 py-1 text-xs font-semibold shadow-sm`}>
                  <Activity className="w-3 h-3 mr-1" />
                  {session.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">{format(new Date(session.created_at), 'PPP')}</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5">
                  <ExternalLink className="h-4 w-4 text-blue-500" />
                  <span className="font-medium truncate max-w-xs">
                    {session.meeting_url.replace(/^https?:\/\//, '')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Summary & Analysis */}
          <div className="lg:col-span-1 space-y-6">
            {/* Meeting Summary */}
            {meeting_summary && (
              <Card className="hover:shadow-xl transition-shadow duration-300 border-gray-100 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg text-white shadow-lg">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold">
                      Meeting Summary
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 relative">
                  <div className="grid grid-cols-2 gap-3">
                    {meeting_summary.duration_minutes && (
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3 border border-purple-200/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-purple-600" />
                          <span className="text-xs font-medium text-purple-600">Duration</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">{meeting_summary.duration_minutes} min</span>
                      </div>
                    )}
                    {meeting_summary.final_overall_score && (
                      <div className={`bg-gradient-to-br ${getScoreGradient(meeting_summary.final_overall_score)} p-3 rounded-xl text-white`}>
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-xs font-medium">Score</span>
                        </div>
                        <span className="text-lg font-bold">
                          {meeting_summary.final_overall_score}/10
                        </span>
                      </div>
                    )}
                    {meeting_summary.total_transcript_entries && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 border border-blue-200/50">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-600">Messages</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">
                          {meeting_summary.total_transcript_entries}
                        </span>
                      </div>
                    )}
                    {meeting_summary.total_coaching_suggestions && (
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-3 border border-amber-200/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="h-4 w-4 text-amber-600" />
                          <span className="text-xs font-medium text-amber-600">Suggestions</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">
                          {meeting_summary.total_coaching_suggestions}
                        </span>
                      </div>
                    )}
                  </div>

                  {meeting_summary.meeting_summary && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/50">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-500" />
                        Overview
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {meeting_summary.meeting_summary}
                      </p>
                    </div>
                  )}

                  {meeting_summary.key_insights &&
                    meeting_summary.key_insights.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-amber-500" />
                          Key Insights
                        </h4>
                        <ul className="space-y-2">
                          {meeting_summary.key_insights.map(
                            (insight, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-700 flex items-start gap-3 bg-amber-50/50 rounded-lg p-2.5 border border-amber-100"
                              >
                                <ChevronRight className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <span className="leading-relaxed">{insight}</span>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                  {meeting_summary.action_items &&
                    meeting_summary.action_items.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Action Items
                        </h4>
                        <ul className="space-y-2">
                          {meeting_summary.action_items.map((item, index) => (
                            <li
                              key={index}
                              className="text-sm text-gray-700 flex items-start gap-3 bg-green-50/50 rounded-lg p-2.5 border border-green-100 hover:border-green-200 transition-colors duration-200"
                            >
                              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <CheckCircle2 className="h-3 w-3 text-white" />
                              </div>
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            {/* Coaching Analysis */}
            {latestAnalysis && (
              <Card className="hover:shadow-xl transition-shadow duration-300 border-gray-100 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg text-white shadow-lg">
                      <Target className="h-5 w-5" />
                    </div>
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">
                      Coaching Analysis
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 relative">
                  {latestAnalysis.overall_score && (
                    <div className="text-center py-4">
                      <div className="relative inline-flex items-center justify-center">
                        <div className={`absolute inset-0 bg-gradient-to-br ${getScoreGradient(latestAnalysis.overall_score)} rounded-full blur-xl opacity-30 animate-pulse`} />
                        <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${getScoreGradient(latestAnalysis.overall_score)} p-1`}>
                          <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                            <div className={`text-3xl font-bold ${getScoreColor(latestAnalysis.overall_score)}`}>
                              {latestAnalysis.overall_score}
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-3 font-medium">Overall Score</p>
                      <Progress 
                        value={latestAnalysis.overall_score * 10} 
                        className="h-2 mt-2" 
                      />
                    </div>
                  )}

                  {latestAnalysis.conversation_phase && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200/50">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-indigo-500" />
                        Conversation Phase
                      </h4>
                      <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 px-3 py-1 shadow-md">
                        {latestAnalysis.conversation_phase}
                      </Badge>
                    </div>
                  )}

                  {latestAnalysis.positive_feedback &&
                    latestAnalysis.positive_feedback.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </div>
                          Strengths
                        </h4>
                        <ul className="space-y-2">
                          {latestAnalysis.positive_feedback.map(
                            (feedback, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-700 flex items-start gap-3 bg-green-50/50 rounded-lg p-2.5 border border-green-100 hover:border-green-200 transition-all duration-200 hover:shadow-sm"
                              >
                                <span className="text-green-600 font-bold text-lg leading-4">+</span>
                                <span className="leading-relaxed">{feedback}</span>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                  {latestAnalysis.improvement_areas &&
                    latestAnalysis.improvement_areas.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                          </div>
                          Areas for Improvement
                        </h4>
                        <ul className="space-y-2">
                          {latestAnalysis.improvement_areas.map(
                            (area, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-700 flex items-start gap-3 bg-amber-50/50 rounded-lg p-2.5 border border-amber-100 hover:border-amber-200 transition-all duration-200 hover:shadow-sm"
                              >
                                <span className="text-amber-600 text-lg leading-4">!</span>
                                <span className="leading-relaxed">{area}</span>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                  {latestAnalysis.key_suggestions &&
                    latestAnalysis.key_suggestions.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-blue-600" />
                          </div>
                          Suggestions
                        </h4>
                        <ul className="space-y-2">
                          {latestAnalysis.key_suggestions.map(
                            (suggestion, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-700 flex items-start gap-3 bg-blue-50/50 rounded-lg p-2.5 border border-blue-100 hover:border-blue-200 transition-all duration-200 hover:shadow-sm"
                              >
                                <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span className="leading-relaxed">{suggestion}</span>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Transcript */}
          <div className="lg:col-span-2">
            <Card className="hover:shadow-xl transition-shadow duration-300 border-gray-100 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white shadow-lg">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Meeting Transcript
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                    {transcript.length} messages
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {transcript.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-10 w-10 text-gray-300" />
                    </div>
                    <p className="text-lg font-medium text-gray-400">No transcript available</p>
                    <p className="text-sm text-gray-400 mt-1">Messages will appear here once the meeting starts</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="p-6 space-y-4">
                      {transcript.map((entry, index) => {
                        const isBot = entry.speaker.toLowerCase().includes('bot') || 
                                     entry.speaker.toLowerCase().includes('system')
                        return (
                          <div 
                            key={entry.id} 
                            className={`flex gap-3 p-4 rounded-xl transition-all duration-200 hover:shadow-md ${
                              isBot ? 'bg-purple-50/50 hover:bg-purple-50' : 'bg-blue-50/50 hover:bg-blue-50'
                            }`}
                          >
                            <div className="flex-shrink-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                                isBot 
                                  ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                                  : 'bg-gradient-to-br from-blue-500 to-blue-600'
                              }`}>
                                {isBot ? (
                                  <Bot className="h-5 w-5 text-white" />
                                ) : (
                                  <User className="h-5 w-5 text-white" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <span className="font-semibold text-sm text-gray-900">
                                  {entry.speaker}
                                </span>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                  {format(new Date(entry.timestamp), 'HH:mm:ss')}
                                </span>
                                {entry.confidence && (
                                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                                    {Math.round(entry.confidence * 100)}% confidence
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {entry.text}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
