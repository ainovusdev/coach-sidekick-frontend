'use client'

import { useRouter } from 'next/navigation'
import PageLayout from '@/components/layout/page-layout'
import { CoachRoute } from '@/components/auth/coach-route' // CHANGED: Use CoachRoute instead of ProtectedRoute
import { usePermissions } from '@/contexts/permission-context'
import { QuickActions } from '@/components/ui/quick-actions'
import { useDashboardData } from './hooks/use-dashboard-data'
import RecentClients from './components/recent-clients'
import RecentSessions from './components/recent-sessions'
import StartRecording from './components/start-recording'
import SystemStatus from './components/system-status'
import { Users, Clock, RefreshCw, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function CoachDashboard() {
  const router = useRouter()
  const permissions = usePermissions()
  const canCreateMeeting = permissions.canCreateMeeting()

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

  const quickActions = [
    {
      label: 'Manage Clients',
      icon: Users,
      onClick: () => router.push('/clients'),
    },
    {
      label: 'All Sessions',
      icon: Clock,
      onClick: () => router.push('/sessions'),
    },
    {
      label: 'Refresh',
      icon: RefreshCw,
      onClick: refetch,
      disabled: historyLoading,
    },
  ]

  return (
    <CoachRoute>
      <PageLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <RecentClients
                clients={clients}
                clientsLoading={clientsLoading}
              />

              <RecentSessions
                meetingHistory={meetingHistory}
                historyLoading={historyLoading}
                historyError={historyError}
                totalSessions={totalSessions}
                onRefetch={refetch}
              />
            </div>

            <div className="lg:col-span-1 space-y-4">
              {canCreateMeeting ? (
                <StartRecording
                  loading={loading}
                  error={error}
                  onSubmit={handleCreateBot}
                />
              ) : (
                <Card className="border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 bg-blue-50 rounded-full mb-3">
                        <Eye className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Viewer Mode
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        You have read-only access to view assigned clients and
                        their sessions.
                      </p>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 border-blue-200 text-blue-700"
                      >
                        View Only Access
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              <QuickActions actions={quickActions} />
            </div>
          </div>

          <SystemStatus />
        </div>
      </PageLayout>
    </CoachRoute>
  )
}
