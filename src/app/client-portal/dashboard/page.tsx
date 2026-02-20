'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ActiveSessionsCard } from '@/components/client-portal/active-sessions-card'
import { ClientPortalChat } from '@/components/client-portal/client-portal-chat'
import { NextSessionCard } from '@/components/client-portal/next-session-card'
import { UpcomingTasksWidget } from '@/components/client-portal/upcoming-tasks-widget'
import { RecentResourcesWidget } from '@/components/client-portal/recent-resources-widget'
import { ProgressSummaryWidget } from '@/components/client-portal/progress-summary-widget'
import {
  Clock,
  TrendingUp,
  ArrowRight,
  FileText,
  Flame,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  BarChart3,
  Target,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import type { Task } from '@/services/client-dashboard-api'

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
  upcoming_tasks: Task[]
  active_goals: Array<any>
  recent_notifications: Array<any>
  coach_name?: string
}

export default function ClientDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

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
      {/* Header */}
      <div className="mb-6">
        <p className="text-gray-500 text-sm font-medium mb-1">
          {getGreeting()}
        </p>
        <h1 className="text-3xl font-bold text-gray-900">
          {dashboardData.client_info?.name || 'Welcome back'}
        </h1>
        <p className="text-gray-500 mt-1">
          Your coaching journey at a glance
          {dashboardData.coach_name && (
            <>
              <span className="mx-2">·</span>
              <span className="text-gray-600 font-medium">
                Coach: {dashboardData.coach_name}
              </span>
            </>
          )}
          {dashboardData.client_info?.member_since && (
            <>
              <span className="mx-2">·</span>
              <span>
                Member since{' '}
                {format(
                  new Date(dashboardData.client_info.member_since),
                  'MMM yyyy',
                )}
              </span>
            </>
          )}
        </p>
      </div>

      {/* Active Sessions Banner */}
      <div className="mb-6">
        <ActiveSessionsCard />
      </div>

      {/* Stat Cards - 4 column grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Sessions */}
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <CalendarDays className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.stats?.total_sessions || 0}
                </p>
                <p className="text-xs text-gray-500">
                  {dashboardData.stats?.sessions_this_month
                    ? `${dashboardData.stats.sessions_this_month} this month`
                    : 'Sessions'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.stats?.completed_tasks || 0}/
                  {(dashboardData.stats?.completed_tasks || 0) +
                    (dashboardData.stats?.pending_tasks || 0)}
                </p>
                <p className="text-xs text-gray-500">
                  {dashboardData.stats?.pending_tasks
                    ? `${dashboardData.stats.pending_tasks} pending`
                    : 'Tasks'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {completionRate}%
                </p>
                <p className="text-xs text-gray-500">Success rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streak / Active Goals */}
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                {dashboardData.stats?.current_streak_days > 0 ? (
                  <Flame className="h-4 w-4 text-orange-600" />
                ) : (
                  <Target className="h-4 w-4 text-orange-600" />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.stats?.current_streak_days > 0
                    ? dashboardData.stats.current_streak_days
                    : dashboardData.stats?.active_goals || 0}
                </p>
                <p className="text-xs text-gray-500">
                  {dashboardData.stats?.current_streak_days > 0
                    ? 'Day streak'
                    : 'Active goals'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left Panel - Coaching Data */}
        <div className="space-y-4">
          {/* Next Session */}
          <NextSessionCard nextSession={dashboardData.stats?.next_session} />

          {/* Upcoming Tasks */}
          <UpcomingTasksWidget tasks={dashboardData.upcoming_tasks || []} />

          {/* Last Session Card */}
          {lastSession ? (
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    Last Session
                  </CardTitle>
                  <Link href={`/client-portal/sessions/${lastSession.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      View Details
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(lastSession.date), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDistanceToNow(new Date(lastSession.date), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-gray-700 text-xs"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {lastSession.duration_minutes} min
                    </Badge>
                    {lastSession.score && (
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-gray-700 text-xs"
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {lastSession.score}/10
                      </Badge>
                    )}
                  </div>
                </div>

                {lastSession.summary && (
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-3">
                    {lastSession.summary}
                  </p>
                )}

                {lastSession.key_topics &&
                  lastSession.key_topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {lastSession.key_topics.slice(0, 4).map((topic, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs border-gray-200 text-gray-600"
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-gray-200">
              <CardContent className="py-8 text-center">
                <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-1 text-sm">
                  No sessions yet
                </h3>
                <p className="text-xs text-gray-500">
                  Your coaching sessions will appear here after your first call.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Progress Summary (Commitments & Outcomes) */}
          <ProgressSummaryWidget clientId={dashboardData.client_info?.id} />

          {/* Recent Resources */}
          <RecentResourcesWidget />
        </div>

        {/* Right Panel - AI Chat */}
        <div className="lg:sticky lg:top-[80px] lg:self-start">
          <div className="h-[500px] lg:h-[calc(100vh-160px)] lg:min-h-[500px] lg:max-h-[800px]">
            <ClientPortalChat />
          </div>
        </div>
      </div>

      {/* Recent Sessions - Full Width */}
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
