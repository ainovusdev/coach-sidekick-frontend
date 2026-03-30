import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatRelativeTime } from '@/lib/date-utils'
import {
  MessageSquare,
  ArrowRight,
  AlertCircle,
  Lock,
  Video,
  Clock,
  User,
} from 'lucide-react'
import { usePermissions } from '@/contexts/permission-context'
import { cn } from '@/lib/utils'

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
  const permissions = usePermissions()
  const isViewer = permissions.isViewer()

  const onViewDetails = (sessionId: string) => {
    router.push(`/sessions/${sessionId}`)
  }

  const SessionRow = ({ session }: { session: any }) => {
    const summary = session.meeting_summaries
    const durationMinutes =
      summary?.duration_minutes ||
      (session.duration_seconds
        ? Math.ceil(session.duration_seconds / 60)
        : null)
    const clientName =
      session.client_name || session.metadata?.client_name || null
    const meetingSummary = summary?.meeting_summary || session.summary
    const isLive =
      session.status === 'in_progress' || session.status === 'recording'
    const isCompleted = session.status === 'completed'
    const isError = session.status === 'error'

    const statusDot = isLive
      ? 'bg-emerald-500'
      : isCompleted
        ? 'bg-gray-900 dark:bg-white'
        : isError
          ? 'bg-red-500'
          : 'bg-amber-500'

    return (
      <div
        className="flex items-start gap-4 px-5 py-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
        onClick={() => onViewDetails(session.id)}
      >
        {/* Client avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          {/* Status dot */}
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900',
              statusDot,
            )}
          />
          {/* Live ping */}
          {isLive && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {clientName || 'Coaching Session'}
            </h4>
            {isLive && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                Live
              </span>
            )}
          </div>

          {/* Meta line */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{formatDate(session.created_at, 'MMM d')}</span>
            <span className="text-gray-300 dark:text-gray-600">&middot;</span>
            <span>{formatRelativeTime(session.created_at)}</span>
            {durationMinutes && (
              <>
                <span className="text-gray-300 dark:text-gray-600">
                  &middot;
                </span>
                <span className="inline-flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {durationMinutes}m
                </span>
              </>
            )}
          </div>

          {/* Summary — single line */}
          {!isViewer && meetingSummary && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              {meetingSummary}
            </p>
          )}
          {isViewer && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Content restricted
            </p>
          )}
          {!isViewer && !meetingSummary && isCompleted && (
            <p className="text-xs text-gray-400 italic mt-1">
              Processing summary...
            </p>
          )}
          {isLive && !meetingSummary && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              Recording in progress
            </p>
          )}
        </div>

        {/* Arrow */}
        <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    )
  }

  return (
    <Card className="border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <CardHeader className="pb-0 pt-5 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 dark:bg-white rounded-lg">
              <Video className="h-4 w-4 text-white dark:text-gray-900" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Recent Sessions
              </h3>
              {totalSessions > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {totalSessions} total session{totalSessions !== 1 && 's'}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/sessions')}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="p-0 mt-4">
        {historyError && (
          <div className="text-center py-10 px-5">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Failed to load sessions
            </p>
            <Button variant="outline" size="sm" onClick={onRefetch}>
              Try Again
            </Button>
          </div>
        )}

        {historyLoading && !meetingHistory && (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!historyLoading &&
          !historyError &&
          meetingHistory?.meetings.length === 0 && (
            <div className="text-center py-12 px-5">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                <MessageSquare className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                No sessions yet
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Start your first coaching session to see it here
              </p>
            </div>
          )}

        {meetingHistory && meetingHistory.meetings.length > 0 && (
          <div>
            {meetingHistory.meetings.map((session: any) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
