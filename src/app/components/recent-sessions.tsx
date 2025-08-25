import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import { EmptyState } from '@/components/ui/empty-state'
import { SessionCard } from '@/components/sessions/session-card'
import { MessageSquare, ArrowRight } from 'lucide-react'

interface RecentSessionsProps {
  meetingHistory: any
  historyLoading: boolean
  historyError: string | null
  totalSessions: number
  onRefetch: () => void
}

export default function RecentSessions({
  meetingHistory,
  historyLoading,
  historyError,
  totalSessions,
  onRefetch,
}: RecentSessionsProps) {
  const router = useRouter()

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <SectionHeader
          title="Recent Sessions"
          subtitle={totalSessions > 0 ? `Showing last ${Math.min(5, totalSessions)} of ${totalSessions} total` : undefined}
        />
      </CardHeader>
      <CardContent>
        {historyError && (
          <EmptyState
            icon={MessageSquare}
            title="Failed to load sessions"
            action={{
              label: 'Try Again',
              onClick: onRefetch
            }}
          />
        )}

        {historyLoading && !meetingHistory && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-24 bg-gray-100 rounded-xl animate-pulse"
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
            {meetingHistory.meetings.map((session: any) => (
              <SessionCard
                key={session.id}
                session={session}
                onViewDetails={sessionId => {
                  router.push(`/sessions/${sessionId}`)
                }}
              />
            ))}

            {meetingHistory.meetings.length >= 5 && (
              <div className="text-center pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => router.push('/sessions')}
                  className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-medium transition-all duration-200"
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
  )
}