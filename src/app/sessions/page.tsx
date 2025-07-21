'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useMeetingHistory } from '@/hooks/use-meeting-history'
import { SessionCard } from '@/components/session-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  History,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react'

export default function SessionsHistoryPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 10

  const {
    data: meetingHistory,
    loading: historyLoading,
    error: historyError,
    refetch,
    fetchMore,
  } = useMeetingHistory(pageSize)

  // Redirect to auth if not authenticated
  if (!authLoading && !user) {
    router.push('/auth')
    return null
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
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

  const totalSessions = meetingHistory?.meetings.length || 0
  const hasNextPage = meetingHistory?.pagination.hasMore || false
  const hasPrevPage = currentPage > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <History className="h-6 w-6 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  Session History
                </h1>
              </div>
              <p className="text-sm text-gray-600">
                View all your coaching sessions and analyze your progress
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentPage(0)
                refetch()
              }}
              disabled={historyLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${historyLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <History className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalSessions}
                  </p>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Completed
                  </Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {meetingHistory?.meetings.filter(
                      s => s.status === 'completed',
                    ).length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    In Progress
                  </Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {meetingHistory?.meetings.filter(
                      s => s.status === 'in_progress',
                    ).length || 0}
                  </p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    Average
                  </Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {(() => {
                      const sessions = meetingHistory?.meetings || []
                      const sessionsWithScores = sessions.filter(
                        s => s.meeting_summaries?.final_overall_score,
                      )
                      if (sessionsWithScores.length === 0) return '0.0'
                      const total = sessionsWithScores.reduce(
                        (acc, s) =>
                          acc + (s.meeting_summaries?.final_overall_score || 0),
                        0,
                      )
                      return (total / sessionsWithScores.length).toFixed(1)
                    })()}
                  </p>
                  <p className="text-sm text-gray-600">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-gray-600" />
                All Sessions
              </CardTitle>

              {/* Pagination Info */}
              <div className="text-sm text-gray-600">
                Page {currentPage + 1}
                {totalSessions > 0 && (
                  <span> • Showing {totalSessions} sessions</span>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Error State */}
            {historyError && (
              <div className="text-center py-8">
                <div className="text-red-600 mb-4">
                  <p className="font-medium">Failed to load sessions</p>
                  <p className="text-sm">{historyError}</p>
                </div>
                <Button variant="outline" onClick={refetch}>
                  Try Again
                </Button>
              </div>
            )}

            {/* Loading State */}
            {historyLoading && !meetingHistory && (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="space-y-3">
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!historyLoading && !historyError && totalSessions === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No sessions yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start your first coaching session to see it here
                </p>
                <Button onClick={() => router.push('/')}>
                  Start New Session
                </Button>
              </div>
            )}

            {/* Sessions Grid */}
            {meetingHistory && totalSessions > 0 && (
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
              </div>
            )}

            {/* Pagination */}
            {meetingHistory &&
              totalSessions > 0 &&
              (hasPrevPage || hasNextPage) && (
                <div className="flex items-center justify-between pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePrevPage}
                    disabled={!hasPrevPage || historyLoading}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <span className="text-sm text-gray-600">
                    Page {currentPage + 1}
                  </span>

                  <Button
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={!hasNextPage || historyLoading}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
