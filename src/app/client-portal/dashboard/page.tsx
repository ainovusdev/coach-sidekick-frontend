'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CommitmentsWidget } from '@/components/commitments/commitments-widget'
import { CurrentSprintWidget } from '@/components/client/current-sprint-widget'
import { DesiredWinsWidget } from '@/components/client/desired-wins-widget'
import { GoalsList } from '@/components/goals/goals-list'
import {
  Calendar,
  Clock,
  TrendingUp,
  FileText,
  ArrowRight,
  User,
} from 'lucide-react'

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
  }>
  stats: {
    total_sessions: number
    completed_tasks: number
    pending_tasks: number
    active_goals: number
    current_streak_days: number
    next_session: string | null
    unread_notifications: number
  }
  upcoming_tasks: Array<any>
  active_goals: Array<any>
  recent_notifications: Array<any>
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
      // FIXED: Use unified auth_token, not old client_auth_token
      const token = localStorage.getItem('auth_token')
      if (!token) {
        // No token - this shouldn't happen as ClientRoute protects this page
        console.error('No auth token found')
        return
      }

      // Call the backend API
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
          // Token invalid - this will be handled by axios interceptor
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    })
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
      <div className="text-center py-12">
        <p className="text-red-600">Error: {error}</p>
        <Button onClick={fetchDashboardData} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p>No data available</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back
          {dashboardData?.client_info?.name
            ? `, ${dashboardData.client_info.name}`
            : ''}
          !
        </h1>
        <p className="text-gray-600 mt-2">
          Track your coaching journey and progress
        </p>
      </div>

      {/* Member Info */}
      {dashboardData?.client_info?.member_since && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-700">
                Email:{' '}
                <span className="font-semibold text-gray-900">
                  {dashboardData.client_info.email}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                Member since{' '}
                {formatMemberSince(dashboardData.client_info.member_since)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Sessions
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {dashboardData?.stats?.total_sessions || 0}
            </div>
            <p className="text-xs text-gray-500">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed Tasks
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {dashboardData?.stats?.completed_tasks || 0}
            </div>
            <p className="text-xs text-gray-500">Tasks done</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Engagement Streak
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {dashboardData?.stats?.current_streak_days || 0} days
            </div>
            <p className="text-xs text-gray-500">Keep it going!</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Outcomes
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {dashboardData?.stats?.active_goals || 0}
            </div>
            <p className="text-xs text-gray-500">In progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Sprint & Active Commitments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <CurrentSprintWidget clientId={dashboardData?.client_info?.id} />
        <CommitmentsWidget
          clientId={dashboardData?.client_info?.id}
          limit={5}
        />
      </div>

      {/* Desired Wins */}
      <div className="mb-8">
        <DesiredWinsWidget
          clientId={dashboardData?.client_info?.id}
          limit={5}
        />
      </div>

      {/* Goals */}
      <div className="mb-8">
        <GoalsList
          clientId={dashboardData?.client_info?.id}
          showCreateButton={false}
        />
      </div>

      {/* Recent Sessions */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900">Recent Sessions</CardTitle>
            <Link href="/client-portal/sessions">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!dashboardData?.recent_sessions ||
          dashboardData.recent_sessions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No sessions yet. Your sessions will appear here after your first
              coaching call.
            </p>
          ) : (
            <div className="space-y-4">
              {dashboardData.recent_sessions.map(session => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatDate(session.date)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Duration: {session.duration_minutes} minutes
                      </p>
                      {session.summary && (
                        <p className="text-sm text-gray-600 mt-1">
                          {session.summary}...
                        </p>
                      )}
                    </div>
                  </div>
                  <Link href={`/client-portal/sessions/${session.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    >
                      View Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {dashboardData?.recent_sessions &&
            dashboardData.recent_sessions.length > 0 && (
              <div className="mt-6">
                <Link href="/client-portal/sessions">
                  <Button className="w-full bg-gray-900 text-white hover:bg-gray-800">
                    View All Sessions
                  </Button>
                </Link>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
