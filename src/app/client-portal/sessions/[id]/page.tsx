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

  const getSentimentColor = (sentiment: string) => {
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
      <div className="mb-8">
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

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Session Details
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-700">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    {sessionData.session.started_at
                      ? formatDate(sessionData.session.started_at)
                      : 'Date not available'}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    {sessionData.session.duration_minutes || 0} minutes
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`${
                    sessionData.session.status === 'completed'
                      ? 'bg-green-50 text-green-700 border-green-300'
                      : sessionData.session.status === 'processing'
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                        : 'bg-blue-50 text-blue-700 border-blue-300'
                  } px-3 py-1`}
                >
                  {sessionData.session.status}
                </Badge>
              </div>
            </div>
            {sessionData.session.coach && (
              <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-sm">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                  {sessionData.session.coach.name?.charAt(0).toUpperCase() ||
                    'C'}
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500">Coach</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {sessionData.session.coach.name}
                  </p>
                </div>
              </div>
            )}
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
        <TabsContent value="overview" className="space-y-4">
          {sessionData.session.status === 'processing' && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-yellow-500">
                      Session Processing
                    </p>
                    <p className="text-xs text-yellow-600/80">
                      This session is still being processed. Details will appear
                      once the session is complete.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Session Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {sessionData.session.summary ||
                  'Summary will be available after the session is completed'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">
                Key Topics Discussed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessionData.session?.key_topics &&
              Array.isArray(sessionData.session.key_topics) &&
              sessionData.session.key_topics.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {sessionData.session.key_topics.map((topic, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No topics identified
                </p>
              )}
            </CardContent>
          </Card>

          {sessionData.analysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Session Sentiment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p
                    className={`text-2xl font-bold ${getSentimentColor(sessionData.analysis.sentiment)}`}
                  >
                    {sessionData.analysis.sentiment || 'Not analyzed'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    Engagement Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-purple-700">
                    {sessionData.analysis.engagement || 'Not analyzed'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Transcript Tab */}
        <TabsContent value="transcript">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">
                Session Transcript
              </CardTitle>
              <p className="text-sm text-gray-600">
                Full conversation from your coaching session
              </p>
            </CardHeader>
            <CardContent>
              {sessionData.transcript && sessionData.transcript.length > 0 ? (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {sessionData.transcript.map((entry, index) => (
                      <div
                        key={index}
                        className="border-l-2 border-gray-300 pl-4 py-2 hover:border-white transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-gray-900">
                            {entry.speaker}
                          </span>
                          <span className="text-xs text-gray-500">
                            {entry.timestamp ? formatTime(entry.timestamp) : ''}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{entry.text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Transcript not available for this session
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
                            <TrendingUp className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">
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
                              className="bg-gray-50 text-gray-700 border-gray-300"
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
                                className="border-gray-300 text-gray-600"
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
                              <span className="text-sm text-gray-700 capitalize">
                                {key.replace(/_/g, ' ')}
                              </span>
                              <Badge
                                variant="outline"
                                className="border-gray-300 text-gray-700"
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
                              <span className="text-sm text-gray-700 capitalize">
                                {key}
                              </span>
                              <Badge
                                variant="outline"
                                className="border-gray-300 text-gray-700"
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
                            <MessageSquare className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">
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
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Session Tasks</CardTitle>
              <p className="text-sm text-gray-600">
                Tasks assigned during this session
              </p>
            </CardHeader>
            <CardContent>
              {sessionData.tasks && sessionData.tasks.length > 0 ? (
                <div className="space-y-3">
                  {sessionData.tasks.map(task => (
                    <div
                      key={task.id}
                      className="p-4 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {task.title}
                        </h4>
                        <Badge
                          variant="outline"
                          className="border-gray-300 text-gray-700"
                        >
                          {task.status}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <Badge
                          variant="outline"
                          className="border-gray-300 text-gray-600"
                        >
                          {task.priority}
                        </Badge>
                        {task.due_date && (
                          <span>Due: {formatDate(task.due_date)}</span>
                        )}
                        {task.comment_count > 0 && (
                          <span>{task.comment_count} comments</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No tasks assigned in this session
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Session Materials</CardTitle>
              <p className="text-sm text-gray-600">
                Resources shared during this session
              </p>
            </CardHeader>
            <CardContent>
              {sessionData.materials && sessionData.materials.length > 0 ? (
                <div className="space-y-3">
                  {sessionData.materials.map(material => (
                    <div
                      key={material.id}
                      className="p-4 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <h4 className="font-semibold text-gray-900">
                            {material.title}
                          </h4>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-gray-300 text-gray-700"
                        >
                          {material.material_type}
                        </Badge>
                      </div>
                      {material.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {material.description}
                        </p>
                      )}
                      {material.file_url && (
                        <a
                          href={material.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300 underline"
                        >
                          View Material
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No materials shared in this session
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
