'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageLayout from '@/components/layout/page-layout'
import { CoachRoute } from '@/components/auth/coach-route'
import { usePermissions } from '@/contexts/permission-context'
import { useAuth } from '@/contexts/auth-context'
import { useDashboardData } from './hooks/use-dashboard-data'
import RecentClients from './components/recent-clients'
import RecentSessions from './components/recent-sessions'
import StartRecording from './components/start-recording'
import SystemStatus from './components/system-status'
import { MyCommitments } from './components/my-commitments'
import ClientModal from '@/components/clients/client-modal'
import { ManualSessionModal } from '@/components/sessions/manual-session-modal'
import { Eye, Plus, PlayCircle, FileText } from 'lucide-react'
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
            {/* Personalized Welcome Header */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome, {firstName}!
              </h1>
              <p className="text-gray-600 text-lg">
                Let&apos;s set up your coaching workspace in just 2 steps.
              </p>
            </div>

            {/* Getting Started Card */}
            <Card className="border-gray-200 mb-6">
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-gray-900">
                    Getting Started
                  </CardTitle>
                  <Badge variant="outline" className="text-gray-600">
                    2 steps
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Step 1: Create Client */}
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 text-white text-sm font-semibold flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">
                        Create Your First Client
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Add a client to organize their coaching journey, track
                        sessions, and monitor progress.
                      </p>
                      <Button
                        onClick={() => setIsClientModalOpen(true)}
                        className="bg-gray-900 hover:bg-gray-800 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Client
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-gray-200" />

                  {/* Step 2: Start Session (Disabled until client is created) */}
                  <div className="flex items-start gap-4 opacity-50">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-400 text-sm font-semibold flex-shrink-0">
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
                          className="text-gray-400 border-gray-200"
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Start Live Session
                        </Button>
                        <Button
                          variant="outline"
                          disabled
                          className="text-gray-400 border-gray-200"
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">
              Welcome back! Manage your clients and coaching sessions.
            </p>
          </div>

          {/* Viewer Mode Message */}
          {!canCreateMeeting && (
            <Card className="border-gray-200 mb-8">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-full">
                    <Eye className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Viewer Mode
                    </h3>
                    <p className="text-sm text-gray-600">
                      You have read-only access to view assigned clients and
                      their sessions.
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-gray-100 border-gray-300 text-gray-700 ml-auto"
                  >
                    View Only Access
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

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
                <Card className="border-gray-200 flex flex-col w-full">
                  <CardHeader className="border-b border-gray-200 pb-3">
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
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Button
                        onClick={() => setIsManualSessionModalOpen(true)}
                        variant="outline"
                        size="sm"
                        className="w-full border-gray-300 hover:bg-gray-50"
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

          {/* My Commitments Section (Coach Action Items) */}
          <MyCommitments />

          {/* Bottom Section: Recent Sessions (Full Width) */}
          <RecentSessions
            meetingHistory={meetingHistory}
            historyLoading={historyLoading}
            historyError={historyError}
            totalSessions={totalSessions}
            onRefetch={refetch}
          />

          <SystemStatus />
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
      </PageLayout>
    </CoachRoute>
  )
}
