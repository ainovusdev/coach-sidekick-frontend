import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { SessionCard } from '@/components/sessions/session-card'
import {
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'

interface SessionsListProps {
  sessions: any[]
  loading: boolean
  error: string | null
  totalSessions: number
  currentPage: number
  pageSize: number
  hasNextPage: boolean
  hasPrevPage: boolean
  selectedClientName?: string
  onNextPage: () => void
  onPrevPage: () => void
  onRefetch: () => void
  onClearFilter?: () => void
}

export default function SessionsList({
  sessions,
  loading,
  error,
  totalSessions,
  currentPage,
  pageSize,
  hasNextPage,
  hasPrevPage,
  selectedClientName,
  onNextPage,
  onPrevPage,
  onRefetch,
  onClearFilter,
}: SessionsListProps) {
  const router = useRouter()

  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader className="border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-slate-800">
            <MessageSquare className="h-5 w-5 text-slate-600" />
            {selectedClientName
              ? `${selectedClientName}'s Sessions`
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
                  onClick={onPrevPage}
                  disabled={!hasPrevPage || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-slate-600 px-2">
                  {currentPage + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNextPage}
                  disabled={!hasNextPage || loading}
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
        {error && (
          <EmptyState
            icon={MessageSquare}
            title="Failed to load sessions"
            description={error}
            action={{
              label: 'Try Again',
              onClick: onRefetch
            }}
            iconClassName="bg-red-100"
          />
        )}

        {/* Loading State */}
        {loading && !sessions.length && (
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
        {!loading && !error && totalSessions === 0 && (
          <EmptyState
            icon={MessageSquare}
            title={selectedClientName
              ? `No sessions with ${selectedClientName}`
              : 'No sessions yet'}
            description={selectedClientName
              ? `Start your first coaching session with ${selectedClientName} to see it here.`
              : 'Start your first coaching session to see analytics and insights powered by AI.'}
            action={{
              label: 'Start New Session',
              onClick: () => router.push('/'),
              icon: Zap
            }}
            secondaryAction={selectedClientName && onClearFilter ? {
              label: 'View All Sessions',
              onClick: onClearFilter,
              variant: 'outline'
            } : undefined}
            className="py-16"
            iconClassName="w-16 h-16 bg-slate-100"
          />
        )}

        {/* Sessions Grid */}
        {!loading && !error && totalSessions > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map(session => (
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
  )
}