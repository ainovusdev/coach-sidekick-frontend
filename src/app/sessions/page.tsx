'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useMeetingHistory } from '@/hooks/use-meeting-history'
import { SessionCard } from '@/components/session-card'
import PageLayout from '@/components/page-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiClient } from '@/lib/api-client'
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
  const { user, loading: authLoading } = useAuth()
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
    if (!user || authLoading) return

    const fetchClients = async () => {
      try {
        setLoadingClients(true)
        const response = await ApiClient.get('/api/clients')
        if (response.ok) {
          const data = await response.json()
          setClients(data.clients || [])
        }
      } catch (error) {
        console.error('Failed to fetch clients:', error)
      } finally {
        setLoadingClients(false)
      }
    }

    fetchClients()
  }, [user, authLoading])

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
              Loading sessions...
            </p>
          </div>
        </div>
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
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-lg">
                  <History className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Session History
                  </h1>
                  <p className="text-slate-600 font-medium">
                    Track your coaching progress and performance over time
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
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
            </div>
          </div>

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
        </div>

        {/* Enhanced Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-900">
                    {totalSessions}
                  </p>
                  <p className="text-sm font-medium text-blue-600">
                    {selectedClient
                      ? `${selectedClient.name}'s Sessions`
                      : 'Total Sessions'}
                  </p>
                </div>
                <div className="p-4 bg-blue-500 rounded-2xl shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs">
                <History className="h-3 w-3 text-blue-500 mr-1" />
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
                <Clock className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">
                  {inProgressSessions > 0
                    ? `${inProgressSessions} in progress`
                    : 'Ready for new'}
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
                    Average Score
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
                    {clients.length}
                  </p>
                  <p className="text-sm font-medium text-orange-600">
                    Active Clients
                  </p>
                </div>
                <div className="p-4 bg-orange-500 rounded-2xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs">
                <Users className="h-3 w-3 text-orange-500 mr-1" />
                <span className="text-orange-600 font-medium">Coaching</span>
              </div>
            </CardContent>
          </Card>
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
              <div className="text-center py-12">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Failed to load sessions
                </h3>
                <p className="text-red-600 mb-6">{historyError}</p>
                <Button
                  variant="outline"
                  onClick={refetch}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  Try Again
                </Button>
              </div>
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
              <div className="text-center py-16">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <MessageSquare className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {selectedClient
                    ? `No sessions with ${selectedClient.name}`
                    : 'No sessions yet'}
                </h3>
                <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                  {selectedClient
                    ? `Start your first coaching session with ${selectedClient.name} to see it here.`
                    : 'Start your first coaching session to see analytics and insights powered by AI.'}
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Button onClick={() => router.push('/')}>
                    <Zap className="h-4 w-4 mr-2" />
                    Start New Session
                  </Button>
                  {selectedClient && (
                    <Button
                      variant="outline"
                      onClick={() => handleClientFilter(null)}
                    >
                      View All Sessions
                    </Button>
                  )}
                </div>
              </div>
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
