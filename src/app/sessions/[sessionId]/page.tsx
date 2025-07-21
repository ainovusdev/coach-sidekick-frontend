'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { ApiClient } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  params: { sessionId: string }
}) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [sessionData, setSessionData] = useState<SessionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          `/api/meetings/${params.sessionId}/transcript`,
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
  }, [params.sessionId, user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading session details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Session
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-3">
            <Button onClick={() => router.back()}>Go Back</Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
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
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  Session Details
                </h1>
                <Badge className={getStatusColor(session.status)}>
                  {session.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(session.created_at), 'PPP')}
                </div>
                <div className="flex items-center gap-1">
                  <ExternalLink className="h-4 w-4" />
                  {session.meeting_url.replace(/^https?:\/\//, '')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Summary & Analysis */}
          <div className="lg:col-span-1 space-y-6">
            {/* Meeting Summary */}
            {meeting_summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Meeting Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {meeting_summary.duration_minutes && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{meeting_summary.duration_minutes} minutes</span>
                      </div>
                    )}
                    {meeting_summary.final_overall_score && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <span
                          className={`font-medium ${getScoreColor(
                            meeting_summary.final_overall_score,
                          )}`}
                        >
                          {meeting_summary.final_overall_score}/10
                        </span>
                      </div>
                    )}
                    {meeting_summary.total_transcript_entries && (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                        <span>
                          {meeting_summary.total_transcript_entries} messages
                        </span>
                      </div>
                    )}
                    {meeting_summary.total_coaching_suggestions && (
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-gray-400" />
                        <span>
                          {meeting_summary.total_coaching_suggestions}{' '}
                          suggestions
                        </span>
                      </div>
                    )}
                  </div>

                  {meeting_summary.meeting_summary && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Overview
                      </h4>
                      <p className="text-sm text-gray-700">
                        {meeting_summary.meeting_summary}
                      </p>
                    </div>
                  )}

                  {meeting_summary.key_insights &&
                    meeting_summary.key_insights.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Key Insights
                        </h4>
                        <ul className="space-y-1">
                          {meeting_summary.key_insights.map(
                            (insight, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-700 flex items-start gap-2"
                              >
                                <span className="text-purple-600 mt-1">•</span>
                                {insight}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                  {meeting_summary.action_items &&
                    meeting_summary.action_items.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Action Items
                        </h4>
                        <ul className="space-y-1">
                          {meeting_summary.action_items.map((item, index) => (
                            <li
                              key={index}
                              className="text-sm text-gray-700 flex items-start gap-2"
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              {item}
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-purple-600" />
                    Coaching Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {latestAnalysis.overall_score && (
                    <div className="text-center">
                      <div
                        className={`text-3xl font-bold ${getScoreColor(
                          latestAnalysis.overall_score,
                        )}`}
                      >
                        {latestAnalysis.overall_score}/10
                      </div>
                      <p className="text-sm text-gray-600">Overall Score</p>
                    </div>
                  )}

                  {latestAnalysis.conversation_phase && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Conversation Phase
                      </h4>
                      <Badge variant="outline">
                        {latestAnalysis.conversation_phase}
                      </Badge>
                    </div>
                  )}

                  {latestAnalysis.positive_feedback &&
                    latestAnalysis.positive_feedback.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-700 mb-2">
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {latestAnalysis.positive_feedback.map(
                            (feedback, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-700 flex items-start gap-2"
                              >
                                <span className="text-green-600 mt-1">+</span>
                                {feedback}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                  {latestAnalysis.improvement_areas &&
                    latestAnalysis.improvement_areas.length > 0 && (
                      <div>
                        <h4 className="font-medium text-yellow-700 mb-2">
                          Areas for Improvement
                        </h4>
                        <ul className="space-y-1">
                          {latestAnalysis.improvement_areas.map(
                            (area, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-700 flex items-start gap-2"
                              >
                                <span className="text-yellow-600 mt-1">⚠</span>
                                {area}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                  {latestAnalysis.key_suggestions &&
                    latestAnalysis.key_suggestions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-blue-700 mb-2">
                          Suggestions
                        </h4>
                        <ul className="space-y-1">
                          {latestAnalysis.key_suggestions.map(
                            (suggestion, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-700 flex items-start gap-2"
                              >
                                <span className="text-blue-600 mt-1">💡</span>
                                {suggestion}
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Meeting Transcript
                  <span className="text-sm text-gray-500 font-normal">
                    ({transcript.length} messages)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transcript.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No transcript available</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {transcript.map((entry, index) => (
                      <div key={entry.id} className="flex gap-3">
                        <div className="flex-shrink-0">
                          {entry.speaker.toLowerCase().includes('bot') ||
                          entry.speaker.toLowerCase().includes('system') ? (
                            <Bot className="h-6 w-6 text-purple-600 mt-1" />
                          ) : (
                            <User className="h-6 w-6 text-blue-600 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-gray-900">
                              {entry.speaker}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(entry.timestamp), 'HH:mm:ss')}
                            </span>
                            {entry.confidence && (
                              <span className="text-xs text-gray-400">
                                {Math.round(entry.confidence * 100)}% confidence
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {entry.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
