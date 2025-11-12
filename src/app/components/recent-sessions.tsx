import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import {
  MessageSquare,
  ArrowRight,
  Clock,
  AlertCircle,
  FileText,
  Lock,
  Calendar,
  Video,
  Activity,
} from 'lucide-react'
import { usePermissions } from '@/contexts/permission-context'

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs font-medium">
            Completed
          </Badge>
        )
      case 'in_progress':
      case 'recording':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-medium animate-pulse">
            Recording
          </Badge>
        )
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 text-xs font-medium">
            Error
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-xs font-medium">
            {status.replace('_', ' ')}
          </Badge>
        )
    }
  }

  const getPlatformIcon = (url: string | null | undefined) => {
    if (!url) return <Video className="h-4 w-4" />
    if (url.includes('zoom.us')) {
      return (
        <div className="h-4 w-4 flex items-center justify-center">
          <span className="text-blue-600 font-bold text-xs">Z</span>
        </div>
      )
    }
    if (url.includes('meet.google.com')) {
      return (
        <div className="h-4 w-4 flex items-center justify-center">
          <span className="text-green-600 font-bold text-xs">G</span>
        </div>
      )
    }
    if (url.includes('teams.microsoft.com')) {
      return (
        <div className="h-4 w-4 flex items-center justify-center">
          <span className="text-purple-600 font-bold text-xs">T</span>
        </div>
      )
    }
    return <Video className="h-4 w-4" />
  }

  const getPlatformName = (url: string | null | undefined) => {
    if (!url) return 'Meeting'
    if (url.includes('zoom.us')) return 'Zoom'
    if (url.includes('meet.google.com')) return 'Google Meet'
    if (url.includes('teams.microsoft.com')) return 'Teams'
    return 'Meeting'
  }

  const SessionCardModern = ({ session }: { session: any }) => {
    const summary = session.meeting_summaries
    const createdAt = new Date(session.created_at)
    const durationMinutes =
      summary?.duration_minutes ||
      (session.duration_seconds
        ? Math.ceil(session.duration_seconds / 60)
        : null)
    const clientName =
      session.client_name || session.metadata?.client_name || null
    const meetingSummary = summary?.meeting_summary || session.summary

    return (
      <div
        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-900 hover:shadow-sm transition-all duration-200 cursor-pointer"
        onClick={() => onViewDetails && onViewDetails(session.id)}
      >
        <div className="flex items-start gap-4">
          {/* Left Icon Section */}
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
              {session.status === 'completed' ? (
                <FileText className="h-5 w-5 text-gray-700" />
              ) : session.status === 'recording' ||
                session.status === 'in_progress' ? (
                <Activity className="h-5 w-5 text-gray-900 animate-pulse" />
              ) : (
                <MessageSquare className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-base">
                    {clientName || 'Session'}
                  </h3>
                  {getStatusBadge(session.status)}
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <div className="flex items-center gap-1">
                    {getPlatformIcon(session.meeting_url)}
                    <span>{getPlatformName(session.meeting_url)}</span>
                  </div>
                  {durationMinutes && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{durationMinutes} min</span>
                      </div>
                    </>
                  )}
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(createdAt, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Content */}
            {isViewer ? (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Lock className="h-3.5 w-3.5" />
                  <span className="italic">
                    Content restricted for viewer role
                  </span>
                </div>
              </div>
            ) : meetingSummary ? (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                  {meetingSummary}
                </p>
              </div>
            ) : session.status === 'completed' ? (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500 italic">
                  Processing summary...
                </p>
              </div>
            ) : session.status === 'in_progress' ||
              session.status === 'recording' ? (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-gray-900 rounded-full animate-pulse" />
                  <p className="text-sm text-gray-900 font-medium">
                    Live recording in progress
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  const onViewDetails = (sessionId: string) => {
    router.push(`/sessions/${sessionId}`)
  }

  return (
    <Card className="bg-white border border-gray-200">
      {/* Header */}
      <CardHeader className="border-b border-gray-200 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Sessions
            </h2>
            {totalSessions > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Showing {Math.min(5, totalSessions)} of {totalSessions} sessions
              </p>
            )}
          </div>
          {totalSessions > 5 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/sessions')}
              className="border-gray-300 hover:bg-gray-50 flex-shrink-0"
            >
              View All
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="p-6">
        {historyError && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mb-4">
              <AlertCircle className="h-7 w-7 text-red-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Failed to load sessions
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Something went wrong while fetching your sessions
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefetch}
              className="border-gray-300"
            >
              Try Again
            </Button>
          </div>
        )}

        {historyLoading && !meetingHistory && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded-md w-1/3 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded-md w-1/2 animate-pulse" />
                    <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!historyLoading &&
          !historyError &&
          meetingHistory?.meetings.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <MessageSquare className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                No sessions yet
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Start your first coaching session to see it here
              </p>
              <Button
                onClick={() => router.push('/')}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                Start Recording
                <Video className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

        {meetingHistory && meetingHistory.meetings.length > 0 && (
          <div className="space-y-3">
            {meetingHistory.meetings.map((session: any) => (
              <SessionCardModern key={session.id} session={session} />
            ))}

            {/* Stats Summary */}
            {meetingHistory.meetings.length >= 3 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Session Summary</span>
                  <div className="flex items-center gap-4 text-gray-500">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-900">
                        {
                          meetingHistory.meetings.filter(
                            (s: any) => s.status === 'completed',
                          ).length
                        }
                      </span>
                      <span>completed</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-900">
                        {
                          meetingHistory.meetings.filter(
                            (s: any) =>
                              s.status === 'in_progress' ||
                              s.status === 'recording',
                          ).length
                        }
                      </span>
                      <span>active</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
