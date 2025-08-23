'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useMeetingHistory } from '@/hooks/use-meeting-history'
import { useDebounceCallback } from '@/hooks/use-debounce'
import { MeetingService } from '@/services/meeting-service'
import { ClientService } from '@/services/client-service'
import { MeetingFormSimple } from '@/components/meeting/meeting-form-simple'
import PageLayout from '@/components/layout/page-layout'
import { SessionCard } from '@/components/sessions/session-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { SectionHeader } from '@/components/ui/section-header'
import { ClientCard } from '@/components/ui/client-card'
import { QuickActions } from '@/components/ui/quick-actions'
import { Client } from '@/types/meeting'
import {
  MessageSquare,
  ArrowRight,
  Users,
  AlertCircle,
  Plus,
  Clock,
  RefreshCw,
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
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      if (!isAuthenticated || authLoading) return
      
      try {
        setClientsLoading(true)
        const response = await ClientService.listClients({ per_page: 4 })
        setClients(response.clients)
      } catch (error) {
        console.error('Error fetching clients:', error)
      } finally {
        setClientsLoading(false)
      }
    }

    fetchClients()
  }, [isAuthenticated, authLoading])

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
        <LoadingState message="Loading dashboard..." />
      </PageLayout>
    )
  }

  // Calculate stats from meeting history
  const totalSessions = meetingHistory?.meetings.length || 0

  const quickActions = [
    {
      label: 'Manage Clients',
      icon: Users,
      onClick: () => router.push('/clients')
    },
    {
      label: 'All Sessions',
      icon: Clock,
      onClick: () => router.push('/sessions')
    },
    {
      label: 'Refresh',
      icon: RefreshCw,
      onClick: refetch,
      disabled: historyLoading
    }
  ]

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader 
          title="Dashboard"
          description="Manage your coaching sessions and clients"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Clients and Sessions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Clients */}
            <Card className="border-neutral-200">
              <CardHeader>
                <SectionHeader
                  title="Recent Clients"
                  action={{
                    label: 'View All',
                    onClick: () => router.push('/clients')
                  }}
                />
              </CardHeader>
              <CardContent>
                {clientsLoading ? (
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="h-20 bg-neutral-100 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                ) : clients.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No clients yet"
                    action={{
                      label: 'Add Client',
                      onClick: () => router.push('/clients'),
                      icon: Plus
                    }}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {clients.map(client => (
                      <ClientCard
                        key={client.id}
                        name={client.name}
                        notes={client.notes}
                        onClick={() => router.push(`/clients/${client.id}`)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card className="border-neutral-200">
              <CardHeader>
                <SectionHeader
                  title="Recent Sessions"
                  subtitle={totalSessions > 0 ? `Last ${Math.min(5, totalSessions)}` : undefined}
                />
              </CardHeader>
              <CardContent>
                {historyError && (
                  <EmptyState
                    icon={MessageSquare}
                    title="Failed to load sessions"
                    action={{
                      label: 'Try Again',
                      onClick: refetch
                    }}
                  />
                )}

                {historyLoading && !meetingHistory && (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className="h-20 bg-neutral-100 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                )}

                {!historyLoading &&
                  !historyError &&
                  meetingHistory?.meetings.length === 0 && (
                    <EmptyState
                      icon={MessageSquare}
                      title="No sessions yet"
                      description="Start your first coaching session."
                    />
                  )}

                {meetingHistory && meetingHistory.meetings.length > 0 && (
                  <div className="space-y-3">
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
                      <div className="text-center pt-4 border-t border-neutral-100">
                        <Button
                          variant="outline"
                          onClick={() => router.push('/sessions')}
                          className="border-neutral-300 hover:bg-neutral-50 text-neutral-700"
                        >
                          View All Sessions
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Start New Session */}
          <div className="lg:col-span-1">
            <Card className="border-neutral-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-neutral-900">
                  Start Recording
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MeetingFormSimple onSubmit={debouncedCreateBot} loading={loading} />
                {error && (
                  <div className="mt-4 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                    <p className="text-sm text-neutral-600 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <QuickActions actions={quickActions} />

          </div>
        </div>

        {/* System Status - Minimal */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-neutral-900 rounded-full"></div>
            <span>System Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-neutral-900 rounded-full"></div>
            <span>AI Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-neutral-900 rounded-full"></div>
            <span>Transcription Active</span>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}