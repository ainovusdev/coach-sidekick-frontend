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
              onClick: onRefetch
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
  )
}