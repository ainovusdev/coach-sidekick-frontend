'use client'

import { useRouter } from 'next/navigation'
import PageLayout from '@/components/layout/page-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { QuickActions } from '@/components/ui/quick-actions'
import { useDashboardData } from './hooks/use-dashboard-data'
import RecentClients from './components/recent-clients'
import RecentSessions from './components/recent-sessions'
import StartRecording from './components/start-recording'
import SystemStatus from './components/system-status'
import { Users, Clock, RefreshCw } from 'lucide-react'

export default function CoachDashboard() {
  const router = useRouter()

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
    <ProtectedRoute loadingMessage="Loading dashboard...">
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
              <StartRecording
                loading={loading}
                error={error}
                onSubmit={handleCreateBot}
              />

              <QuickActions actions={quickActions} />
            </div>
          </div>

          <SystemStatus />
        </div>
      </PageLayout>
    </ProtectedRoute>
  )
}
