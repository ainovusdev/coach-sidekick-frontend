'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useMeetingHistory } from '@/hooks/use-meeting-history'
import { useDebounceCallback } from '@/hooks/use-debounce'
import { MeetingService } from '@/services/meeting-service'
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
  ArrowRight,
  UserCheck,
  Zap,
  PlayCircle,
  AlertCircle,
} from 'lucide-react'

export default function CoachDashboard() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const {
    data: meetingHistory,
    loading: historyLoading,
    error: historyError,
    refetch,
  } = useMeetingHistory(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateBotImpl = async (meetingUrl: string, clientId?: string) => {
    // Prevent multiple submissions
    if (loading) {
      console.log('Already loading, ignoring duplicate submission')
      return
    }

    console.log('Creating bot for URL:', meetingUrl, 'ClientID:', clientId)
    setLoading(true)
    setError(null) // Clear any previous errors

    try {
      // Create bot via backend API
      const response = await MeetingService.createBot({
        meeting_url: meetingUrl,
        client_id: clientId,
        recording_mode: 'raw_transcript',
        bot_name: 'Coach Sidekick Assistant',
      })

      console.log('Bot created successfully:', response)

      if (!response.id) {
        throw new Error('Bot was created but no ID was returned')
      }

      // Small delay to ensure state is consistent before navigation
      await new Promise(resolve => setTimeout(resolve, 100))
      router.push(`/meeting/${response.id}`)
    } catch (error) {
      console.error('Error creating bot:', error)
      setLoading(false) // Reset loading state immediately on error

      // Set error state for display in UI
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create bot'
      setError(errorMessage)
    }
  }

  // Create debounced callback at component level
  const debouncedCreateBot = useDebounceCallback(handleCreateBotImpl, 1000)

  // Redirect to auth if not authenticated
  if (!authLoading && !isAuthenticated) {
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

  // Calculate stats from meeting history
  const totalSessions = meetingHistory?.meetings.length || 0

  return (
    <PageLayout>
      {/* Enhanced Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <MeetingForm onSubmit={debouncedCreateBot} loading={loading} />
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </p>
                  </div>
                )}
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
