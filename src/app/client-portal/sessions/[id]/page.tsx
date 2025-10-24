'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  MessageSquare,
  FileText,
  CheckCircle2,
  ListTodo,
  BookOpen,
} from 'lucide-react'
import { NotesList } from '@/components/session-notes/notes-list'

interface SessionDetail {
  session: {
    id: string
    started_at: string | null
    ended_at: string | null
    duration_minutes: number
    status: string
    summary: string | null
    key_topics: string[]
    action_items: any[]
    coach: {
      id: string
      name: string
      email: string
    } | null
  }
  transcript: Array<{
    speaker: string
    text: string
    timestamp: string
  }>
  tasks: Array<{
    id: string
    title: string
    description: string
    status: string
    priority: string
    due_date: string | null
    comment_count: number
  }>
  materials: Array<{
    id: string
    title: string
    description: string
    material_type: string
    file_url: string
  }>
  insights: {
    summary: string
    topics: string[]
    keywords: string[]
    sentiment: {
      overall: string
      score: number
      emotions: string[]
      engagement: string
    }
    insights: string[]
    action_items: string[]
    effectiveness: any
    patterns: any
    recommendations: any
  } | null
  analysis: {
    coaching_scores: any
    go_live_scores: any
    sentiment: any
    engagement: string
    suggestions: any
  } | null
}

export default function ClientSessionDetailPage() {
  const params = useParams()
  const sessionId = params.id as string

  const [sessionData, setSessionData] = useState<SessionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuth()
    if (sessionId) {
      fetchSessionDetail()
    }
  }, [sessionId])

  const checkAuth = () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
    }
  }

  const fetchSessionDetail = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        return
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${apiUrl}/client/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          return
        }
        if (response.status === 404) {
          setError('Session not found')
          return
        }
        throw new Error('Failed to fetch session')
      }

      const data = await response.json()
      setSessionData(data)
    } catch (err: any) {
      console.error('Session fetch error:', err)
      setError(err.message || 'Failed to load session')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const _getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'text-green-500'
      case 'negative':
        return 'text-red-500'
      case 'neutral':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto py-12">
          <Alert
            variant="destructive"
            className="bg-red-950 border-red-800 text-red-300"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Link href="/client-portal/sessions">
            <Button className="mt-4 bg-white text-black hover:bg-zinc-200">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sessions
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!sessionData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600">Session not found</p>
          <Link href="/client-portal/sessions">
            <Button className="mt-4 bg-white text-black hover:bg-zinc-200">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sessions
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/client-portal/sessions">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Button>
        </Link>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Session Summary
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-gray-700">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  <Calendar className="h-4 w-4 text-gray-700" />
                  <span className="text-sm font-medium">
                    {sessionData.session.started_at
                      ? formatDate(sessionData.session.started_at)
                      : 'Date not available'}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  <Clock className="h-4 w-4 text-gray-700" />
                  <span className="text-sm font-medium">
                    {sessionData.session.duration_minutes || 0} min
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="border-gray-300 text-gray-700 px-3 py-1 capitalize"
                >
                  {sessionData.session.status}
                </Badge>
              </div>
            </div>
            {sessionData.session.coach && (
              <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                <div className="h-12 w-12 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold text-lg">
                  {sessionData.session.coach.name?.charAt(0).toUpperCase() ||
                    'C'}
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500 mb-1">Your Coach</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {sessionData.session.coach.name}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Tasks Assigned</p>
                <p className="text-lg font-bold text-gray-900">
                  {sessionData.tasks?.length || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Materials Shared</p>
                <p className="text-lg font-bold text-gray-900">
                  {sessionData.materials?.length || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <ListTodo className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Key Topics</p>
                <p className="text-lg font-bold text-gray-900">
                  {sessionData.session.key_topics?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 bg-white border-gray-200">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="transcript"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
          >
            Transcript
          </TabsTrigger>
          <TabsTrigger
            value="insights"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
          >
            Insights
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
          >
            Notes
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
          >
            Tasks
          </TabsTrigger>
          <TabsTrigger
            value="materials"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
          >
            Materials
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {sessionData.session.status === 'processing' && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Session Processing
                    </p>
                    <p className="text-xs text-yellow-700">
                      This session is still being processed. Details will appear
                      once the session is complete.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session Summary */}
          {sessionData.session.summary && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  What We Covered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {sessionData.session.summary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action Items */}
          {sessionData.session.action_items &&
            sessionData.session.action_items.length > 0 && (
              <Card className="bg-white border-gray-200 shadow-sm border-l-4 border-l-gray-900">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-gray-900" />
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Action Items
                    </CardTitle>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Key takeaways and next steps from your session
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {sessionData.session.action_items.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="mt-0.5">
                          <div className="h-6 w-6 rounded-full border-2 border-gray-300 flex items-center justify-center bg-white">
                            <span className="text-xs font-semibold text-gray-600">
                              {index + 1}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm text-gray-900 flex-1 leading-relaxed">
                          {typeof item === 'string'
                            ? item
                            : item.text || item.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

          {/* Key Topics */}
          {sessionData.session?.key_topics &&
            Array.isArray(sessionData.session.key_topics) &&
            sessionData.session.key_topics.length > 0 && (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Topics Discussed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {sessionData.session.key_topics.map((topic, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-gray-100 text-gray-900 border border-gray-300 px-3 py-1.5 text-sm"
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Session Metrics */}
          {sessionData.analysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Session Sentiment
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">
                    Overall emotional tone
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-gray-900 capitalize">
                    {sessionData.analysis.sentiment || 'Not analyzed'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Engagement Level
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">
                    Conversation interaction
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-gray-900 capitalize">
                    {sessionData.analysis.engagement || 'Not analyzed'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Transcript Tab */}
        <TabsContent value="transcript">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Session Transcript
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Full conversation from your coaching session
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              {sessionData.transcript && sessionData.transcript.length > 0 ? (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {sessionData.transcript.map((entry, index) => (
                      <div
                        key={index}
                        className="border-l-4 border-gray-200 pl-4 py-2 hover:border-gray-400 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm text-gray-900">
                            {entry.speaker}
                          </span>
                          <span className="text-xs text-gray-500">
                            {entry.timestamp ? formatTime(entry.timestamp) : ''}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {entry.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-16">
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-900 font-medium mb-1">
                    No transcript available
                  </p>
                  <p className="text-sm text-gray-500">
                    Transcript for this session is not yet available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <NotesList sessionId={sessionId} isClientPortal={true} />
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          {sessionData.insights ? (
            <div className="space-y-4">
              {/* Session Insights */}
              {sessionData.insights.insights &&
                sessionData.insights.insights.length > 0 && (
                  <Card className="bg-white border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-gray-900">
                        Key Insights
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        AI-powered observations from your session
                      </p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {sessionData.insights.insights.map((insight, index) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <TrendingUp className="h-4 w-4 text-gray-900 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-900">
                              {insight}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

              {/* Topics & Keywords */}
              {(sessionData.insights.topics?.length > 0 ||
                sessionData.insights.keywords?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessionData.insights.topics?.length > 0 && (
                    <Card className="bg-white border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-gray-900">Topics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {sessionData.insights.topics.map((topic, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-gray-100 text-gray-900 border-gray-300"
                            >
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {sessionData.insights.keywords?.length > 0 && (
                    <Card className="bg-white border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-gray-900">
                          Keywords
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {sessionData.insights.keywords.map(
                            (keyword, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="border-gray-300 text-gray-900"
                              >
                                {keyword}
                              </Badge>
                            ),
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Coaching Scores */}
              {sessionData.analysis?.coaching_scores &&
                Object.keys(sessionData.analysis.coaching_scores).length >
                  1 && (
                  <Card className="bg-white border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-gray-900">
                        Coaching Scores
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        How your coach performed in key areas
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(
                          sessionData.analysis.coaching_scores,
                        ).map(([key, value]) => {
                          if (key === 'overall') return null
                          return (
                            <div
                              key={key}
                              className="flex justify-between items-center p-2"
                            >
                              <span className="text-sm text-gray-900 capitalize">
                                {key.replace(/_/g, ' ')}
                              </span>
                              <Badge
                                variant="outline"
                                className="border-gray-300 text-gray-900"
                              >
                                {String(value)}/10
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* GO LIVE Scores */}
              {sessionData.analysis?.go_live_scores &&
                Object.keys(sessionData.analysis.go_live_scores).length > 1 && (
                  <Card className="bg-white border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-gray-900">
                        GO LIVE Values
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Alignment with core coaching values
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(
                          sessionData.analysis.go_live_scores,
                        ).map(([key, value]) => {
                          if (key === 'overall') return null
                          return (
                            <div
                              key={key}
                              className="flex justify-between items-center p-2"
                            >
                              <span className="text-sm text-gray-900 capitalize">
                                {key}
                              </span>
                              <Badge
                                variant="outline"
                                className="border-gray-300 text-gray-900"
                              >
                                {String(value)}/10
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Recommendations */}
              {sessionData.insights.recommendations?.follow_up_questions
                ?.length > 0 && (
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">
                      Recommended Follow-up Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {sessionData.insights.recommendations.follow_up_questions.map(
                        (question: string, index: number) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <MessageSquare className="h-4 w-4 text-gray-900 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-900">
                              {question}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="bg-white border-gray-200">
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">
                  Insights for this session are being processed. Check back
                  soon!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Session Tasks
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Tasks assigned during this session
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              {sessionData.tasks && sessionData.tasks.length > 0 ? (
                <div className="space-y-4">
                  {sessionData.tasks.map(task => {
                    const isPending = task.status === 'pending'
                    const isCompleted = task.status === 'completed'
                    const isInProgress = task.status === 'in_progress'

                    return (
                      <div
                        key={task.id}
                        className={`p-4 border-2 rounded-xl transition-all ${
                          isCompleted
                            ? 'border-gray-300 bg-gray-50'
                            : isPending
                              ? 'border-gray-300 bg-white hover:border-gray-400'
                              : 'border-gray-400 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="mt-1">
                            <div
                              className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                                isCompleted
                                  ? 'border-gray-900 bg-gray-900'
                                  : 'border-gray-400 bg-white'
                              }`}
                            >
                              {isCompleted && (
                                <CheckCircle2 className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h4
                                className={`font-semibold text-gray-900 ${
                                  isCompleted
                                    ? 'line-through text-gray-600'
                                    : ''
                                }`}
                              >
                                {task.title}
                              </h4>
                              <Badge
                                variant="outline"
                                className={`capitalize ml-2 ${
                                  isCompleted
                                    ? 'border-gray-400 text-gray-600 bg-gray-100'
                                    : isInProgress
                                      ? 'border-gray-900 text-gray-900 bg-gray-50'
                                      : 'border-gray-400 text-gray-700'
                                }`}
                              >
                                {task.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-3">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs">
                              <Badge
                                variant="outline"
                                className={`capitalize ${
                                  task.priority === 'high'
                                    ? 'border-gray-900 text-gray-900 bg-gray-50'
                                    : 'border-gray-300 text-gray-600'
                                }`}
                              >
                                {task.priority} priority
                              </Badge>
                              {task.due_date && (
                                <div className="flex items-center gap-1 text-gray-600">
                                  <Calendar className="h-3 w-3" />
                                  <span>Due {formatDate(task.due_date)}</span>
                                </div>
                              )}
                              {task.comment_count > 0 && (
                                <div className="flex items-center gap-1 text-gray-600">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{task.comment_count} comments</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-900 font-medium mb-1">No tasks yet</p>
                  <p className="text-sm text-gray-500">
                    Tasks assigned during this session will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Session Materials
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Resources and materials shared by your coach
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              {sessionData.materials && sessionData.materials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessionData.materials.map(material => (
                    <div
                      key={material.id}
                      className="p-4 border-2 border-gray-200 rounded-xl hover:border-gray-400 transition-all group"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                          <FileText className="h-5 w-5 text-gray-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {material.title}
                            </h4>
                          </div>
                          <Badge
                            variant="outline"
                            className="border-gray-300 text-gray-600 text-xs capitalize"
                          >
                            {material.material_type}
                          </Badge>
                        </div>
                      </div>
                      {material.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {material.description}
                        </p>
                      )}
                      {material.file_url && (
                        <a
                          href={material.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-gray-700 underline underline-offset-2"
                        >
                          View Material
                          <ArrowLeft className="h-3 w-3 rotate-180" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-900 font-medium mb-1">
                    No materials shared
                  </p>
                  <p className="text-sm text-gray-500">
                    Resources shared during the session will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
