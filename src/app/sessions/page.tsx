'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useMeetingHistory } from '@/hooks/use-meeting-history'
import { SessionCard } from '@/components/sessions/session-card'
import PageLayout from '@/components/layout/page-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { ClientService } from '@/services/client-service'
import {
  History,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  Zap,
  MessageSquare,
  X,
  User,
} from 'lucide-react'

interface Client {
  id: string
  name: string
  email?: string
  company?: string
}

export default function SessionsHistoryPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const pageSize = 12

  const {
    data: meetingHistory,
    loading: historyLoading,
    error: historyError,
    refetch,
    fetchMore,
  } = useMeetingHistory(pageSize)

  // Fetch clients for filtering
  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    const fetchClients = async () => {
      try {
        setLoadingClients(true)
        const response = await ClientService.listClients()
        setClients(response.clients || [])
      } catch (error) {
        console.error('Failed to fetch clients:', error)
      } finally {
        setLoadingClients(false)
      }
    }

    fetchClients()
  }, [isAuthenticated, authLoading])

  // Redirect to auth if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/auth')
    return null
  }

  if (authLoading) {
    return (
      <PageLayout>
        <LoadingState message="Loading sessions..." />
      </PageLayout>
    )
  }

  const handleNextPage = () => {
    const newOffset = (currentPage + 1) * pageSize
    fetchMore(newOffset)
    setCurrentPage(currentPage + 1)
  }

  const handlePrevPage = () => {
    const newOffset = Math.max(0, (currentPage - 1) * pageSize)
    fetchMore(newOffset)
    setCurrentPage(Math.max(0, currentPage - 1))
  }

  const handleClientFilter = (clientId: string | null) => {
    setSelectedClientId(clientId)
    setCurrentPage(0)
    // In a real implementation, you'd pass this filter to the API
    // For now, we'll filter client-side
    refetch()
  }

  // Filter sessions by selected client
  const filteredSessions = selectedClientId
    ? meetingHistory?.meetings.filter(
        session => session.metadata?.client_id === selectedClientId,
      ) || []
    : meetingHistory?.meetings || []

  const totalSessions = filteredSessions.length
  const completedSessions = filteredSessions.filter(
    s => s.status === 'completed',
  ).length
  const inProgressSessions = filteredSessions.filter(
    s => s.status === 'in_progress' || s.status === 'recording',
  ).length
  const avgScore = (() => {
    const sessionsWithScores = filteredSessions.filter(
      s => s.meeting_summaries?.final_overall_score,
    )
    if (sessionsWithScores.length === 0) return 0
    const total = sessionsWithScores.reduce(
      (acc, s) => acc + (s.meeting_summaries?.final_overall_score || 0),
      0,
    )
    return Math.round((total / sessionsWithScores.length) * 10) / 10
  })()

  const hasNextPage = meetingHistory?.pagination.hasMore || false
  const hasPrevPage = currentPage > 0
  const selectedClient = clients.find(c => c.id === selectedClientId)

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Session History"
          description="Track your coaching progress and performance over time"
          icon={History}
          iconVariant="gradient"
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentPage(0)
                refetch()
              }}
              disabled={historyLoading}
              className="flex items-center gap-2 border-slate-300 hover:bg-slate-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${historyLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          }
        />

          {/* Client Filter */}
          <div className="mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  Filter by client:
                </span>
              </div>

              {!loadingClients && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant={selectedClientId === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleClientFilter(null)}
                    className="text-xs"
                  >
                    All Clients
                  </Button>
                  {clients.map(client => (
                    <Button
                      key={client.id}
                      variant={
                        selectedClientId === client.id ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => handleClientFilter(client.id)}
                      className="text-xs"
                    >
                      <User className="h-3 w-3 mr-1" />
                      {client.name}
                    </Button>
                  ))}
                </div>
              )}

              {selectedClient && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleClientFilter(null)}
                  className="text-slate-500 hover:text-slate-700 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear filter
                </Button>
              )}
            </div>

            {selectedClient && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Showing sessions for: {selectedClient.name}
                  </span>
                  {selectedClient.company && (
                    <span className="text-xs text-blue-600">
                      • {selectedClient.company}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

        {/* Enhanced Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={selectedClient ? `${selectedClient.name}'s Sessions` : 'Total Sessions'}
            value={totalSessions}
            icon={Calendar}
            variant="blue"
            footer={
              <>
                <History className="h-3 w-3 mr-1" />
                <span className="font-medium">All time</span>
              </>
            }
          />

          <StatCard
            title="Completed"
            value={completedSessions}
            icon={CheckCircle2}
            variant="green"
            footer={
              <>
                <Clock className="h-3 w-3 mr-1" />
                <span className="font-medium">
                  {inProgressSessions > 0
                    ? `${inProgressSessions} in progress`
                    : 'Ready for new'}
                </span>
              </>
            }
          />

          <StatCard
            title="Average Score"
            value={avgScore > 0 ? avgScore : '—'}
            icon={Target}
            variant="purple"
            footer={
              <>
                <Target className="h-3 w-3 mr-1" />
                <span className="font-medium">Performance</span>
              </>
            }
          />

          <StatCard
            title="Active Clients"
            value={clients.length}
            icon={Users}
            variant="orange"
            footer={
              <>
                <Users className="h-3 w-3 mr-1" />
                <span className="font-medium">Coaching</span>
              </>
            }
          />
        </div>

        {/* Sessions List */}
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <MessageSquare className="h-5 w-5 text-slate-600" />
                {selectedClient
                  ? `${selectedClient.name}'s Sessions`
                  : 'All Sessions'}
              </CardTitle>

              {/* Pagination Info */}
              <div className="flex items-center gap-4">
                <div className="text-sm text-slate-600">
                  {totalSessions > 0 && (
                    <span>
                      Showing {Math.min(pageSize, totalSessions)} of{' '}
                      {totalSessions}
                    </span>
                  )}
                </div>
                {(hasPrevPage || hasNextPage) && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={!hasPrevPage || historyLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-slate-600 px-2">
                      {currentPage + 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={!hasNextPage || historyLoading}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Error State */}
            {historyError && (
              <EmptyState
                icon={MessageSquare}
                title="Failed to load sessions"
                description={historyError}
                action={{
                  label: 'Try Again',
                  onClick: refetch
                }}
                iconClassName="bg-red-100"
              />
            )}

            {/* Loading State */}
            {historyLoading && !meetingHistory && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="border border-slate-200">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-6 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <div className="flex gap-4">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-8 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!historyLoading && !historyError && totalSessions === 0 && (
              <EmptyState
                icon={MessageSquare}
                title={selectedClient
                  ? `No sessions with ${selectedClient.name}`
                  : 'No sessions yet'}
                description={selectedClient
                  ? `Start your first coaching session with ${selectedClient.name} to see it here.`
                  : 'Start your first coaching session to see analytics and insights powered by AI.'}
                action={{
                  label: 'Start New Session',
                  onClick: () => router.push('/'),
                  icon: Zap
                }}
                secondaryAction={selectedClient ? {
                  label: 'View All Sessions',
                  onClick: () => handleClientFilter(null),
                  variant: 'outline'
                } : undefined}
                className="py-16"
                iconClassName="w-16 h-16 bg-slate-100"
              />
            )}

            {/* Sessions Grid */}
            {!historyLoading && !historyError && totalSessions > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSessions.map(session => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onViewDetails={sessionId => {
                      router.push(`/sessions/${sessionId}`)
                    }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
