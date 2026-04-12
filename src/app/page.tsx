'use client'

import { useState, useMemo } from 'react'
import { useMyCommitments } from '@/hooks/queries/use-commitments'
import { useRouter } from 'next/navigation'
import PageLayout from '@/components/layout/page-layout'
import { CoachRoute } from '@/components/auth/coach-route'
import { usePermissions } from '@/contexts/permission-context'
import { useAuth } from '@/contexts/auth-context'
import { useDashboardData } from './hooks/use-dashboard-data'
import { useSessions } from '@/hooks/queries/use-sessions'
import RecentClients from './components/recent-clients'
import RecentSessions from './components/recent-sessions'
import LiveSessionBanner from './components/live-session-banner'
import StartRecording from './components/start-recording'
import { AttentionNeeded } from './components/attention-needed'
import ClientModal from '@/components/clients/client-modal'
import { ManualSessionModal } from '@/components/sessions/manual-session-modal'
import { ScheduleSessionModal } from '@/components/sessions/schedule-session-modal'
import { StartStandaloneGroupSessionModal } from '@/components/group-session/start-standalone-group-session-modal'
import { UpcomingSessions } from '@/components/dashboard/upcoming-sessions'
import {
  Eye,
  Plus,
  PlayCircle,
  FileText,
  Users,
  CalendarClock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function CoachDashboard() {
  const router = useRouter()
  const permissions = usePermissions()
  const { user } = useAuth()
  const canCreateMeeting = permissions.canCreateMeeting()
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isManualSessionModalOpen, setIsManualSessionModalOpen] =
    useState(false)
  const [isGroupSessionModalOpen, setIsGroupSessionModalOpen] = useState(false)
  const [isScheduleSessionModalOpen, setIsScheduleSessionModalOpen] =
    useState(false)

  // Get first name for personalized greeting
  const firstName = user?.full_name?.split(' ')[0] || 'there'

  const {
    meetingHistory,
    historyLoading,
    historyError,
    clients,
    clientsLoading,
    loading,
    error,
    totalSessions,
    debouncedCreateBot,
    refetch,
  } = useDashboardData()

  // Commitments data for contextual greeting
  const { data: myCommitmentsData } = useMyCommitments()

  // Contextual greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const { overdueCount, staleClientCount } = useMemo(() => {
    const now = new Date()
    const overdueCount = (myCommitmentsData?.commitments ?? []).filter(
      c =>
        c.status !== 'completed' &&
        c.status !== 'abandoned' &&
        c.target_date &&
        new Date(c.target_date) < now,
    ).length

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const staleClientCount = clients.filter(c => {
      if (c.is_my_client === false) return false
      if (!c.last_session_date) return false
      return new Date(c.last_session_date) < thirtyDaysAgo
    }).length

    return { overdueCount, staleClientCount }
  }, [myCommitmentsData, clients])

  // Dedicated query for active sessions - independent of the paginated recent sessions list
  const { data: activeSessionsData } = useSessions(
    { status: 'active' },
    { staleTime: 30 * 1000 }, // 30s - refresh frequently for live sessions
  )

  const activeSessions = useMemo(() => {
    if (!activeSessionsData?.sessions) return []
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    return activeSessionsData.sessions
      .filter((s: any) => new Date(s.created_at) >= twoHoursAgo)
      .map((s: any) => ({
        id: s.id,
        bot_id: s.bot_id,
        client_name: s.client_name || s.client?.name || null,
        coach_name: s.coach_name || null,
        is_group_session: s.is_group_session || false,
        participant_count: s.participant_count || null,
        created_at: s.created_at,
      }))
  }, [activeSessionsData])

  const handleCreateBot = async (meetingUrl: string, clientId?: string) => {
    try {
      const botId = await debouncedCreateBot(meetingUrl, clientId)
      if (botId) {
        router.push(`/meeting/${botId}`)
      }
    } catch (error) {
      console.error('Bot creation failed:', error)
    }
  }

  // Determine if this is a new coach (no clients and no sessions)
  const isNewCoach =
    !clientsLoading && clients.length === 0 && totalSessions === 0

  // Show empty state with guidance for new coaches
  if (isNewCoach && canCreateMeeting) {
    return (
      <CoachRoute>
        <PageLayout>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Live Session Banner - show even for new coaches */}
            <LiveSessionBanner sessions={activeSessions} />

            {/* Personalized Welcome Header */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome, {firstName}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Let&apos;s set up your coaching workspace in just 2 steps.
              </p>
            </div>

            {/* Getting Started Card */}
            <Card className="border-gray-200 dark:border-gray-700 mb-6">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-gray-900 dark:text-white">
                    Getting Started
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="text-gray-600 dark:text-gray-400"
                  >
                    2 steps
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Step 1: Create Client */}
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                        Create Your First Client
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Add a client to organize their coaching journey, track
                        sessions, and monitor progress.
                      </p>
                      <Button
                        onClick={() => setIsClientModalOpen(true)}
                        className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Client
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700" />

                  {/* Step 2: Start Session (Disabled until client is created) */}
                  <div className="flex items-start gap-4 opacity-50">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400 text-sm font-semibold flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-500 mb-1">
                        Record a Session
                      </h3>
                      <p className="text-sm text-gray-400 mb-3">
                        Join a live meeting or upload a past session to get
                        AI-powered insights.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          disabled
                          className="text-gray-400 border-gray-200 dark:border-gray-700"
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Start Live Session
                        </Button>
                        <Button
                          variant="outline"
                          disabled
                          className="text-gray-400 border-gray-200 dark:border-gray-700"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Add Past Session
                        </Button>
                      </div>
                      {/* Explanation for disabled step */}
                      <p className="text-xs text-gray-400 mt-2">
                        Complete Step 1 first to unlock this step
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Client Modal */}
          <ClientModal
            isOpen={isClientModalOpen}
            onClose={() => setIsClientModalOpen(false)}
            onSuccess={() => {
              refetch()
            }}
            mode="create"
          />
        </PageLayout>
      </CoachRoute>
    )
  }

  // Regular dashboard for existing coaches
  return (
    <CoachRoute>
      <PageLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {greeting}, {firstName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {overdueCount > 0 || staleClientCount > 0 ? (
                <>
                  {overdueCount > 0 && (
                    <span>
                      {overdueCount} overdue item{overdueCount !== 1 && 's'}
                    </span>
                  )}
                  {overdueCount > 0 && staleClientCount > 0 && ' and '}
                  {staleClientCount > 0 && (
                    <span>
                      {staleClientCount} client
                      {staleClientCount !== 1 && 's'} need
                      {staleClientCount === 1 && 's'} follow-up
                    </span>
                  )}
                </>
              ) : (
                'All caught up. Manage your clients and coaching sessions.'
              )}
            </p>
          </div>

          {/* Viewer Mode Message */}
          {!canCreateMeeting && (
            <Card className="border-gray-200 dark:border-gray-700 mb-8">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <Eye className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Viewer Mode
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You have read-only access to view assigned clients and
                      their sessions.
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 ml-auto"
                  >
                    View Only Access
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Live Session Banner */}
          <LiveSessionBanner sessions={activeSessions} />

          {/* Upcoming Scheduled Sessions */}
          {canCreateMeeting && <UpcomingSessions />}

          {/* Top Section: Clients (2/3) and Start Session (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 lg:items-stretch">
            {/* Left: Clients (2/3 width) */}
            <div className="lg:col-span-2 flex">
              <RecentClients
                clients={clients}
                clientsLoading={clientsLoading}
              />
            </div>

            {/* Right: Start Session (1/3 width) */}
            {canCreateMeeting && (
              <div className="lg:col-span-1 flex">
                <Card className="border-gray-200 dark:border-gray-700 flex flex-col w-full">
                  <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-3">
                    <CardTitle className="text-base font-semibold">
                      Start Session
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <StartRecording
                      loading={loading}
                      error={error}
                      onSubmit={handleCreateBot}
                    />
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                      <Button
                        onClick={() => setIsGroupSessionModalOpen(true)}
                        variant="outline"
                        size="sm"
                        className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Start Group Session
                      </Button>
                      <Button
                        onClick={() => setIsScheduleSessionModalOpen(true)}
                        variant="outline"
                        size="sm"
                        className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <CalendarClock className="h-4 w-4 mr-2" />
                        Schedule Session
                      </Button>
                      <Button
                        onClick={() => setIsManualSessionModalOpen(true)}
                        variant="outline"
                        size="sm"
                        className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Add Past Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Attention Needed Alerts */}
          <AttentionNeeded clients={clients} />

          {/* Bottom Section: Recent Sessions (Full Width) */}
          <RecentSessions
            meetingHistory={meetingHistory}
            historyLoading={historyLoading}
            historyError={historyError}
            totalSessions={totalSessions}
            onRefetch={refetch}
          />
        </div>

        {/* Client Modal */}
        <ClientModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onSuccess={() => {
            refetch()
          }}
          mode="create"
        />

        {/* Manual Session Modal */}
        <ManualSessionModal
          isOpen={isManualSessionModalOpen}
          onClose={() => setIsManualSessionModalOpen(false)}
        />

        {/* Schedule Session Modal */}
        <ScheduleSessionModal
          isOpen={isScheduleSessionModalOpen}
          onClose={() => setIsScheduleSessionModalOpen(false)}
        />

        {/* Group Session Modal */}
        <StartStandaloneGroupSessionModal
          open={isGroupSessionModalOpen}
          onOpenChange={setIsGroupSessionModalOpen}
        />
      </PageLayout>
    </CoachRoute>
  )
}
