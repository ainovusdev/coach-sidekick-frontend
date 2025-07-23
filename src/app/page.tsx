'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useMeetingHistory } from '@/hooks/use-meeting-history'
import { ApiClient } from '@/lib/api-client'
import { MeetingForm } from '@/components/meeting-form'
import PageLayout from '@/components/page-layout'
import { SessionCard } from '@/components/session-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  RefreshCw,
  MessageSquare,
  Target,
  TrendingUp,
  Calendar,
  ArrowRight,
  UserCheck,
  Zap,
  Activity,
  CheckCircle2,
  PlayCircle,
} from 'lucide-react'

export default function CoachDashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const {
    data: meetingHistory,
    loading: historyLoading,
    error: historyError,
    refetch,
  } = useMeetingHistory(5)
  const [loading, setLoading] = useState(false)

  // Redirect to auth if not authenticated
  if (!authLoading && !user) {
    router.push('/auth')
    return null
  }

  if (authLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="mt-3 text-slate-600 font-medium">
              Loading dashboard...
            </p>
          </div>
        </div>
      </PageLayout>
    )
  }

  const handleCreateBot = async (meetingUrl: string, clientId?: string) => {
    setLoading(true)
    try {
      const response = await ApiClient.post('/api/recall/create-bot', {
        meeting_url: meetingUrl,
        client_id: clientId,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          `Failed to create bot: ${
            errorData.error || errorData.details || response.statusText
          }`,
        )
      }

      const bot = await response.json()

      if (!bot.id) {
        throw new Error('Bot was created but no ID was returned')
      }

      router.push(`/meeting/${bot.id}`)
    } catch (error) {
      alert(
        `Failed to create bot: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      )
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats from meeting history
  const totalSessions = meetingHistory?.meetings.length || 0
  const completedSessions =
    meetingHistory?.meetings.filter(s => s.status === 'completed').length || 0
  const activeSessions =
    meetingHistory?.meetings.filter(s => s.status === 'recording').length || 0
  const avgScore = (() => {
    const sessions = meetingHistory?.meetings || []
    const sessionsWithScores = sessions.filter(
      s => s.meeting_summaries?.final_overall_score,
    )
    if (sessionsWithScores.length === 0) return 0
    const total = sessionsWithScores.reduce(
      (acc, s) => acc + (s.meeting_summaries?.final_overall_score || 0),
      0,
    )
    return Math.round((total / sessionsWithScores.length) * 10) / 10
  })()
  const totalCoachingTips =
    meetingHistory?.meetings.reduce(
      (acc, s) => acc + (s.meeting_summaries?.total_coaching_suggestions || 0),
      0,
    ) || 0

  return (
    <PageLayout>
      {/* Enhanced Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-900">
                    {totalSessions}
                  </p>
                  <p className="text-sm font-medium text-blue-600">
                    Total Sessions
                  </p>
                </div>
                <div className="p-4 bg-blue-500 rounded-2xl shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs">
                <TrendingUp className="h-3 w-3 text-blue-500 mr-1" />
                <span className="text-blue-600 font-medium">All time</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-900">
                    {completedSessions}
                  </p>
                  <p className="text-sm font-medium text-green-600">
                    Completed
                  </p>
                </div>
                <div className="p-4 bg-green-500 rounded-2xl shadow-lg">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs">
                <Activity className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">
                  {activeSessions > 0 && `${activeSessions} active`}
                  {activeSessions === 0 && 'Ready for new'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-purple-900">
                    {avgScore > 0 ? avgScore : '—'}
                  </p>
                  <p className="text-sm font-medium text-purple-600">
                    Avg Score
                  </p>
                </div>
                <div className="p-4 bg-purple-500 rounded-2xl shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs">
                <Target className="h-3 w-3 text-purple-500 mr-1" />
                <span className="text-purple-600 font-medium">Performance</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-orange-900">
                    {totalCoachingTips}
                  </p>
                  <p className="text-sm font-medium text-orange-600">
                    AI Insights
                  </p>
                </div>
                <div className="p-4 bg-orange-500 rounded-2xl shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs">
                <Zap className="h-3 w-3 text-orange-500 mr-1" />
                <span className="text-orange-600 font-medium">Generated</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Primary Action - Start New Session */}
          <div className="lg:col-span-1">
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 via-white to-purple-50 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-slate-800">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <PlayCircle className="h-5 w-5 text-white" />
                  </div>
                  Start New Session
                </CardTitle>
                <p className="text-sm text-slate-600 font-medium">
                  Enter your meeting URL to begin real-time AI coaching analysis
                </p>
              </CardHeader>
              <CardContent>
                <MeetingForm onSubmit={handleCreateBot} loading={loading} />
              </CardContent>
            </Card>

            {/* Enhanced Quick Actions */}
            <Card className="mt-6 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base text-slate-800">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-between hover:bg-blue-50 hover:border-blue-200 group transition-all duration-200"
                  onClick={() => router.push('/clients')}
                >
                  <div className="flex items-center">
                    <UserCheck className="h-4 w-4 mr-3 text-blue-600" />
                    <span className="font-medium">Manage Clients</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between hover:bg-purple-50 hover:border-purple-200 group transition-all duration-200"
                  onClick={() => router.push('/sessions')}
                >
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-3 text-purple-600" />
                    <span className="font-medium">View All Sessions</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between hover:bg-green-50 hover:border-green-200 group transition-all duration-200"
                  onClick={refetch}
                  disabled={historyLoading}
                >
                  <div className="flex items-center">
                    <RefreshCw
                      className={`h-4 w-4 mr-3 text-green-600 ${
                        historyLoading ? 'animate-spin' : ''
                      }`}
                    />
                    <span className="font-medium">Refresh Data</span>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Recent Sessions */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-slate-800">
                    <Clock className="h-5 w-5 text-slate-600" />
                    Recent Sessions
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-700 font-medium"
                  >
                    Last {Math.min(5, totalSessions)} sessions
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {historyError && (
                  <div className="text-center py-12">
                    <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <MessageSquare className="h-6 w-6 text-red-600" />
                    </div>
                    <p className="text-sm font-medium text-red-600 mb-3">
                      Failed to load sessions
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refetch}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Try Again
                    </Button>
                  </div>
                )}

                {historyLoading && !meetingHistory && (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className="h-24 bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl animate-pulse"
                      />
                    ))}
                  </div>
                )}

                {!historyLoading &&
                  !historyError &&
                  meetingHistory?.meetings.length === 0 && (
                    <div className="text-center py-16">
                      <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                        <MessageSquare className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        No sessions yet
                      </h3>
                      <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto">
                        Start your first coaching session to see analytics and
                        insights powered by AI
                      </p>
                      <div className="flex items-center justify-center text-xs text-slate-500">
                        <Zap className="h-3 w-3 mr-1" />
                        Ready for real-time analysis
                      </div>
                    </div>
                  )}

                {meetingHistory && meetingHistory.meetings.length > 0 && (
                  <div className="space-y-4">
                    {meetingHistory.meetings.map(session => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        onViewDetails={sessionId => {
                          router.push(`/sessions/${sessionId}`)
                        }}
                      />
                    ))}

                    {meetingHistory.meetings.length >= 5 && (
                      <div className="text-center pt-6 border-t border-slate-100">
                        <Button
                          variant="outline"
                          onClick={() => router.push('/sessions')}
                          className="flex items-center gap-2 hover:bg-slate-50 font-medium"
                        >
                          View All {totalSessions} Sessions
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced System Status */}
        <Card className="mt-8 bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
          <CardContent className="py-6">
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-green-700">
                    AI Analysis Engine
                  </span>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Online
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-blue-700">
                    Transcription Service
                  </span>
                </div>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  Ready
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-purple-700">
                    Coaching Intelligence
                  </span>
                </div>
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
