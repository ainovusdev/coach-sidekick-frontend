'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  Clock,
  Target,
  TrendingUp,
  MessageSquare,
  FileText,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  ChevronRight,
  User,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Zap,
  Hash,
  Quote,
  ExternalLink,
} from 'lucide-react'
import { NotesList } from '@/components/session-notes/notes-list'
import { format, formatDistanceToNow } from 'date-fns'

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
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    transcript: false,
    notes: false,
  })

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetail()
    }
  }, [sessionId])

  const fetchSessionDetail = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${apiUrl}/client/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
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

  if (error || !sessionData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">{error || 'Session not found'}</p>
          <Link href="/client-portal/sessions">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sessions
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const session = sessionData.session
  const hasTranscript =
    sessionData.transcript && sessionData.transcript.length > 0
  const hasTasks = sessionData.tasks && sessionData.tasks.length > 0
  const hasMaterials = sessionData.materials && sessionData.materials.length > 0
  const hasInsights =
    sessionData.insights &&
    (sessionData.insights.insights?.length > 0 ||
      sessionData.insights.topics?.length > 0)
  const completedTasks =
    sessionData.tasks?.filter(t => t.status === 'completed').length || 0
  const totalTasks = sessionData.tasks?.length || 0

  // Get sentiment display
  const getSentimentDisplay = () => {
    if (sessionData.insights?.sentiment?.overall) {
      return sessionData.insights.sentiment.overall
    }
    if (sessionData.analysis?.sentiment) {
      return typeof sessionData.analysis.sentiment === 'string'
        ? sessionData.analysis.sentiment
        : 'Analyzed'
    }
    return null
  }

  const sentimentDisplay = getSentimentDisplay()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Compact Header Bar */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/client-portal/sessions">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Sessions
          </Button>
        </Link>
        <Badge
          variant="secondary"
          className="bg-gray-100 text-gray-600 capitalize"
        >
          {session.status}
        </Badge>
      </div>

      {/* Hero Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Date & Title */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-gray-900 rounded-xl flex flex-col items-center justify-center text-white">
              <span className="text-2xl font-bold">
                {session.started_at
                  ? format(new Date(session.started_at), 'd')
                  : '-'}
              </span>
              <span className="text-xs uppercase tracking-wide opacity-80">
                {session.started_at
                  ? format(new Date(session.started_at), 'MMM')
                  : ''}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {session.started_at
                  ? format(new Date(session.started_at), 'EEEE, MMMM d, yyyy')
                  : 'Session Details'}
              </h1>
              <p className="text-sm text-gray-500">
                {session.started_at &&
                  formatDistanceToNow(new Date(session.started_at), {
                    addSuffix: true,
                  })}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {session.duration_minutes || 0}
              </p>
              <p className="text-xs text-gray-500">Minutes</p>
            </div>
            <div className="h-10 w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {session.key_topics?.length || 0}
              </p>
              <p className="text-xs text-gray-500">Topics</p>
            </div>
            <div className="h-10 w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {session.action_items?.length || 0}
              </p>
              <p className="text-xs text-gray-500">Actions</p>
            </div>
            {session.coach && (
              <>
                <div className="h-10 w-px bg-gray-200" />
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium">
                    {session.coach.name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Coach</p>
                    <p className="text-sm font-medium text-gray-900">
                      {session.coach.name}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Processing Notice */}
      {session.status === 'processing' && (
        <div className="mb-6 p-4 bg-gray-100 border border-gray-200 rounded-xl flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center animate-pulse">
            <Clock className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Session Processing
            </p>
            <p className="text-xs text-gray-500">
              Details will appear once processing is complete.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Section */}
          {session.summary && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Quote className="h-4 w-4 text-gray-500" />
                <h2 className="font-semibold text-gray-900">Session Summary</h2>
              </div>
              <div className="p-5">
                <p className="text-gray-600 leading-relaxed">
                  {session.summary}
                </p>
              </div>
            </div>
          )}

          {/* Commitments / Action Items */}
          {session.action_items && session.action_items.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gray-500" />
                  <h2 className="font-semibold text-gray-900">Commitments</h2>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-600"
                >
                  {session.action_items.length} items
                </Badge>
              </div>
              <div className="divide-y divide-gray-100">
                {session.action_items.map((item, index) => (
                  <div
                    key={index}
                    className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="h-6 w-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-sm text-gray-700 leading-relaxed">
                      {typeof item === 'string'
                        ? item
                        : item.text || item.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Insights */}
          {sessionData.insights?.insights &&
            sessionData.insights.insights.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-gray-500" />
                  <h2 className="font-semibold text-gray-900">Key Insights</h2>
                </div>
                <div className="p-5 space-y-3">
                  {sessionData.insights.insights
                    .slice(0, 4)
                    .map((insight, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <Zap className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{insight}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

          {/* Transcript Preview */}
          {hasTranscript && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('transcript')}
                className="w-full px-5 py-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <h2 className="font-semibold text-gray-900">
                    Conversation Transcript
                  </h2>
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-gray-600 text-xs ml-2"
                  >
                    {sessionData.transcript.length} messages
                  </Badge>
                </div>
                {expandedSections.transcript ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {expandedSections.transcript ? (
                <ScrollArea className="h-[400px]">
                  <div className="p-5 space-y-4">
                    {sessionData.transcript.map((entry, index) => {
                      const isCoach = entry.speaker
                        ?.toLowerCase()
                        .includes('coach')
                      return (
                        <div
                          key={index}
                          className={`flex gap-3 ${isCoach ? '' : 'flex-row-reverse'}`}
                        >
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isCoach
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            <User className="h-4 w-4" />
                          </div>
                          <div
                            className={`max-w-[80%] ${isCoach ? '' : 'text-right'}`}
                          >
                            <div
                              className={`flex items-center gap-2 mb-1 ${isCoach ? '' : 'justify-end'}`}
                            >
                              <span className="text-xs font-medium text-gray-700">
                                {entry.speaker}
                              </span>
                              {entry.timestamp && (
                                <span className="text-xs text-gray-400">
                                  {format(new Date(entry.timestamp), 'h:mm a')}
                                </span>
                              )}
                            </div>
                            <div
                              className={`inline-block px-4 py-2 rounded-2xl text-sm ${
                                isCoach
                                  ? 'bg-gray-100 text-gray-700 rounded-tl-sm'
                                  : 'bg-gray-900 text-white rounded-tr-sm'
                              }`}
                            >
                              {entry.text}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-5">
                  <div className="space-y-2">
                    {sessionData.transcript.slice(0, 3).map((entry, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                            entry.speaker?.toLowerCase().includes('coach')
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {entry.speaker?.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm text-gray-600 truncate flex-1">
                          {entry.text}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => toggleSection('transcript')}
                    className="mt-3 text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1"
                  >
                    View full transcript
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notes Section */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('notes')}
              className="w-full px-5 py-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <h2 className="font-semibold text-gray-900">Session Notes</h2>
              </div>
              {expandedSections.notes ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {expandedSections.notes && (
              <div className="p-5">
                <NotesList sessionId={sessionId} isClientPortal={true} />
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Topics & Keywords Card */}
          {((session.key_topics?.length ?? 0) > 0 ||
            (sessionData.insights?.keywords?.length ?? 0) > 0) && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold text-gray-900">
                  Topics Discussed
                </h3>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  {session.key_topics?.map((topic, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
                {sessionData.insights?.keywords &&
                  sessionData.insights.keywords.length > 0 && (
                    <>
                      <p className="text-xs text-gray-500 mt-4 mb-2">
                        Keywords
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {sessionData.insights.keywords
                          .slice(0, 8)
                          .map((keyword, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 border border-gray-200 text-gray-600 text-xs rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                      </div>
                    </>
                  )}
              </div>
            </div>
          )}

          {/* Session Metrics */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Session Metrics</h3>
            </div>
            <div className="p-5 space-y-4">
              {/* Sentiment */}
              {sentimentDisplay && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-500">Sentiment</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {sentimentDisplay}
                    </span>
                  </div>
                </div>
              )}

              {/* Engagement */}
              {(sessionData.insights?.sentiment?.engagement ||
                sessionData.analysis?.engagement) && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-500">Engagement</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {sessionData.insights?.sentiment?.engagement ||
                        sessionData.analysis?.engagement}
                    </span>
                  </div>
                </div>
              )}

              {/* Task Progress */}
              {totalTasks > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">
                      Tasks Progress
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {completedTasks}/{totalTasks}
                    </span>
                  </div>
                  <Progress
                    value={(completedTasks / totalTasks) * 100}
                    className="h-2"
                  />
                </div>
              )}

              {/* Coaching Scores */}
              {sessionData.analysis?.coaching_scores && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-3">Coaching Scores</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(sessionData.analysis.coaching_scores)
                      .slice(0, 4)
                      .map(([key, value]) => {
                        if (key === 'overall') return null
                        return (
                          <div
                            key={key}
                            className="text-center p-2 bg-gray-50 rounded-lg"
                          >
                            <p className="text-lg font-bold text-gray-900">
                              {String(value)}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {key.replace(/_/g, ' ')}
                            </p>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Empty Metrics State */}
              {!sentimentDisplay &&
                !sessionData.analysis?.engagement &&
                totalTasks === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">
                      Metrics will appear after analysis
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* Tasks Quick View */}
          {hasTasks && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-500" />
                  <h3 className="font-semibold text-gray-900">Tasks</h3>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-600 text-xs"
                >
                  {completedTasks}/{totalTasks} done
                </Badge>
              </div>
              <div className="divide-y divide-gray-100">
                {sessionData.tasks.slice(0, 4).map(task => {
                  const isCompleted = task.status === 'completed'
                  return (
                    <div
                      key={task.id}
                      className="px-5 py-3 flex items-start gap-3"
                    >
                      <div
                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isCompleted
                            ? 'border-gray-900 bg-gray-900'
                            : 'border-gray-300'
                        }`}
                      >
                        {isCompleted && (
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${isCompleted ? 'line-through text-gray-400' : 'text-gray-700'}`}
                        >
                          {task.title}
                        </p>
                        {task.due_date && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Due {format(new Date(task.due_date), 'MMM d')}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
                {sessionData.tasks.length > 4 && (
                  <div className="px-5 py-3 text-center">
                    <span className="text-xs text-gray-500">
                      +{sessionData.tasks.length - 4} more tasks
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Materials Quick View */}
          {hasMaterials && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold text-gray-900">Materials</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {sessionData.materials.slice(0, 3).map(material => (
                  <div key={material.id} className="px-5 py-3">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {material.title}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {material.material_type}
                        </p>
                      </div>
                      {material.file_url && (
                        <a
                          href={material.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emotions */}
          {sessionData.insights?.sentiment?.emotions &&
            sessionData.insights.sentiment.emotions.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <h3 className="font-semibold text-gray-900">
                    Emotions Detected
                  </h3>
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    {sessionData.insights.sentiment.emotions.map(
                      (emotion, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg capitalize"
                        >
                          {emotion}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Empty State for Sessions with No Content */}
      {!session.summary &&
        (!session.action_items || session.action_items.length === 0) &&
        !hasTranscript &&
        !hasTasks &&
        !hasInsights && (
          <div className="mt-6 text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
            <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Session details coming soon
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              This session is still being processed. Check back soon for the
              full summary, transcript, and insights.
            </p>
          </div>
        )}
    </div>
  )
}
