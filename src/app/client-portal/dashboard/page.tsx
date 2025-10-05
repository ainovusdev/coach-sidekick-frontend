'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
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
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuth()
    fetchDashboardData()
  }, [])

  const checkAuth = () => {
    const token = localStorage.getItem('client_auth_token')
    if (!token) {
      router.push('/client-portal/auth/login')
    }
  }

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('client_auth_token')
      if (!token) {
        router.push('/client-portal/auth/login')
        return
      }

      // Call the backend API directly
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
          router.push('/client-portal/auth/login')
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
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Welcome back
          {dashboardData?.client_info?.name
            ? `, ${dashboardData.client_info.name}`
            : ''}
          !
        </h1>
        <p className="text-zinc-400 mt-2">
          Track your coaching journey and progress
        </p>
      </div>

      {/* Member Info */}
      {dashboardData?.client_info?.member_since && (
        <div className="mb-6 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-zinc-400" />
            <div>
              <p className="text-sm text-zinc-300">
                Email:{' '}
                <span className="font-semibold text-white">
                  {dashboardData.client_info.email}
                </span>
              </p>
              <p className="text-xs text-zinc-500">
                Member since{' '}
                {formatMemberSince(dashboardData.client_info.member_since)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Total Sessions
            </CardTitle>
            <Calendar className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {dashboardData?.stats?.total_sessions || 0}
            </div>
            <p className="text-xs text-zinc-500">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Completed Tasks
            </CardTitle>
            <Clock className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {dashboardData?.stats?.completed_tasks || 0}
            </div>
            <p className="text-xs text-zinc-500">Tasks done</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Engagement Streak
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {dashboardData?.stats?.current_streak_days || 0} days
            </div>
            <p className="text-xs text-zinc-500">Keep it going!</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Active Goals
            </CardTitle>
            <FileText className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {dashboardData?.stats?.active_goals || 0}
            </div>
            <p className="text-xs text-zinc-500">In progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Recent Sessions</CardTitle>
            <Link href="/client-portal/sessions">
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
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
            <p className="text-center text-zinc-500 py-8">
              No sessions yet. Your sessions will appear here after your first
              coaching call.
            </p>
          ) : (
            <div className="space-y-4">
              {dashboardData.recent_sessions.map(session => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border border-zinc-800 rounded-xl hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <FileText className="h-5 w-5 text-zinc-500" />
                    <div>
                      <p className="font-medium text-white">
                        {formatDate(session.date)}
                      </p>
                      <p className="text-sm text-zinc-500">
                        Duration: {session.duration_minutes} minutes
                      </p>
                      {session.summary && (
                        <p className="text-sm text-zinc-400 mt-1">
                          {session.summary}...
                        </p>
                      )}
                    </div>
                  </div>
                  <Link href={`/client-portal/sessions/${session.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
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
                  <Button className="w-full bg-white text-black hover:bg-zinc-200">
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
