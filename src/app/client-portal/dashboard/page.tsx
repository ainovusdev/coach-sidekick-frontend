'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CommitmentsWidget } from '@/components/commitments/commitments-widget'
import { ActiveSessionsCard } from '@/components/client-portal/active-sessions-card'
import { useClientOutcomes } from '@/hooks/queries/use-client-outcomes'
import { Progress } from '@/components/ui/progress'
import {
  Clock,
  TrendingUp,
  ArrowRight,
  FileText,
  Flame,
  ChevronRight,
  Target,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface DashboardData {
  client_info: {
    id: string
    name: string
    email: string
    coach_id: string
    member_since: string | null
  }
  recent_sessions: Array<{
    id: string
    date: string
    duration_minutes: number
    status: string
    summary?: string | null
    key_topics?: string[]
    score?: number
  }>
  stats: {
    total_sessions: number
    completed_tasks: number
    pending_tasks: number
    active_goals: number
    current_streak_days: number
    next_session: string | null
    unread_notifications: number
    sessions_this_month?: number
    completion_rate?: number
  }
  upcoming_tasks: Array<any>
  active_goals: Array<any>
  recent_notifications: Array<any>
  coach_name?: string
}

export default function ClientDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { data: outcomes } = useClientOutcomes()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.error('No auth token found')
        return
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${apiUrl}/client/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Unauthorized - token may be expired')
          return
        }
        throw new Error('Failed to fetch dashboard')
      }

      const data = await response.json()
      setDashboardData(data)
    } catch (err: any) {
      console.error('Dashboard fetch error:', err)
      setError(err.message || 'Failed to load dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    )
  }

  const lastSession = dashboardData.recent_sessions?.[0]
  const completionRate =
    dashboardData.stats?.completion_rate ||
    (dashboardData.stats?.completed_tasks > 0
      ? Math.round(
          (dashboardData.stats.completed_tasks /
            (dashboardData.stats.completed_tasks +
              dashboardData.stats.pending_tasks)) *
            100,
        )
      : 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">
            {getGreeting()}
          </p>
          <h1 className="text-3xl font-bold text-gray-900">
            {dashboardData.client_info?.name || 'Welcome back'}
          </h1>
          <p className="text-gray-500 mt-1">
            Track your coaching journey and progress
          </p>
        </div>

        {/* Inline Stats */}
        <div className="flex items-center gap-6 md:gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {dashboardData.stats?.total_sessions || 0}
            </p>
            <p className="text-xs text-gray-500">Sessions</p>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {dashboardData.stats?.completed_tasks || 0}
            </p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {dashboardData.stats?.active_goals || 0}
            </p>
            <p className="text-xs text-gray-500">Outcomes</p>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {completionRate}%
            </p>
            <p className="text-xs text-gray-500">Success</p>
          </div>
          {dashboardData.stats?.current_streak_days > 0 && (
            <>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-gray-600" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData.stats.current_streak_days}
                  </p>
                  <p className="text-xs text-gray-500">Day Streak</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Active Sessions Banner */}
      <div className="mb-6">
        <ActiveSessionsCard />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column - Last Session & Sprint */}
        <div className="lg:col-span-2 space-y-6">
          {/* Last Session Card */}
          {lastSession ? (
            <Card className="border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    Last Session
                  </CardTitle>
                  <Link href={`/client-portal/sessions/${lastSession.id}`}>
                    <Button variant="ghost" size="sm">
                      View Details
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(lastSession.date), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(lastSession.date), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-gray-700"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {lastSession.duration_minutes} min
                    </Badge>
                    {lastSession.score && (
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-gray-700"
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {lastSession.score}/10
                      </Badge>
                    )}
                  </div>
                </div>

                {lastSession.summary && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Summary
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                      {lastSession.summary}
                    </p>
                  </div>
                )}

                {lastSession.key_topics &&
                  lastSession.key_topics.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Key Topics
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {lastSession.key_topics
                          .slice(0, 4)
                          .map((topic, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs border-gray-200 text-gray-600"
                            >
                              {topic}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-gray-200">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">
                  No sessions yet
                </h3>
                <p className="text-sm text-gray-500">
                  Your coaching sessions will appear here after your first call.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Commitments & Outcomes */}
        <div className="space-y-6">
          <CommitmentsWidget
            clientId={dashboardData.client_info?.id}
            limit={5}
          />

          {/* Outcomes Summary Widget */}
          {outcomes &&
            outcomes.length > 0 &&
            (() => {
              const activeOuts = outcomes.filter(o => o.status === 'active')
              const completedOuts = outcomes.filter(
                o => o.status === 'completed',
              )
              const avgProgress =
                outcomes.length > 0
                  ? Math.round(
                      outcomes.reduce((s, o) => s + o.progress_percentage, 0) /
                        outcomes.length,
                    )
                  : 0
              return (
                <Card className="border-gray-200">
                  <CardHeader className="border-b border-gray-100 pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Target className="h-4 w-4 text-gray-600" />
                        My Outcomes
                      </CardTitle>
                      <Link href="/client-portal/outcomes">
                        <Button variant="ghost" size="sm" className="text-xs">
                          View All
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-center flex-1">
                        <p className="text-xl font-bold text-gray-900">
                          {activeOuts.length}
                        </p>
                        <p className="text-xs text-gray-500">Active</p>
                      </div>
                      <div className="h-8 w-px bg-gray-200" />
                      <div className="text-center flex-1">
                        <p className="text-xl font-bold text-gray-900">
                          {completedOuts.length}
                        </p>
                        <p className="text-xs text-gray-500">Completed</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span className="font-medium">{avgProgress}%</span>
                      </div>
                      <Progress value={avgProgress} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              )
            })()}
        </div>
      </div>

      {/* Recent Sessions */}
      {dashboardData.recent_sessions &&
        dashboardData.recent_sessions.length > 1 && (
          <Card className="border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Recent Sessions
                </CardTitle>
                <Link href="/client-portal/sessions">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.recent_sessions.slice(1, 4).map(session => (
                  <Link
                    key={session.id}
                    href={`/client-portal/sessions/${session.id}`}
                  >
                    <div className="group p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(session.date), 'MMM d, yyyy')}
                        </p>
                        <Badge
                          variant="secondary"
                          className="text-xs bg-gray-100 text-gray-600"
                        >
                          {session.duration_minutes} min
                        </Badge>
                      </div>
                      {session.summary && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {session.summary}
                        </p>
                      )}
                      <div className="flex items-center justify-end mt-3">
                        <span className="text-xs text-gray-500 group-hover:text-gray-700 font-medium">
                          View details
                          <ChevronRight className="h-3 w-3 inline ml-0.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  )
}
