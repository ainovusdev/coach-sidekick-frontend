import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import {
  MessageSquare,
  ArrowRight,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  FileText,
  Lock,
  Calendar,
  Video,
  Sparkles,
  TrendingUp,
  Activity,
  Eye,
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

  const _getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'in_progress':
      case 'recording':
        return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

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
    const coachName = session.coach_name || session.metadata?.coach_name || null // NEW
    const meetingSummary = summary?.meeting_summary || session.summary

    return (
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-start gap-4">
            {/* Left Icon Section */}
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center">
                {session.status === 'completed' ? (
                  <FileText className="h-6 w-6 text-gray-700" />
                ) : session.status === 'recording' ||
                  session.status === 'in_progress' ? (
                  <Activity className="h-6 w-6 text-blue-600 animate-pulse" />
                ) : (
                  <MessageSquare className="h-6 w-6 text-gray-500" />
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Header Row */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {clientName || 'Session'}
                    </h3>
                    {getStatusBadge(session.status)}
                  </div>
                  {/* NEW: Coach and Client info row */}
                  <div className="flex items-center gap-2 mb-2">
                    {coachName && (
                      <span className="text-xs text-gray-600 bg-blue-50 px-2 py-0.5 rounded">
                        <span className="font-medium">Coach:</span> {coachName}
                      </span>
                    )}
                    {clientName && (
                      <span className="text-xs text-gray-600 bg-purple-50 px-2 py-0.5 rounded">
                        <span className="font-medium">Client:</span>{' '}
                        {clientName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      {getPlatformIcon(session.meeting_url)}
                      <span>{getPlatformName(session.meeting_url)}</span>
                    </div>
                    {durationMinutes && (
                      <>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{durationMinutes} min</span>
                        </div>
                      </>
                    )}
                    <span className="text-gray-300">•</span>
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
                <div className="mt-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                      {meetingSummary}
                    </p>
                  </div>
                </div>
              ) : session.status === 'completed' ? (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-500 italic">
                    Processing summary...
                  </p>
                </div>
              ) : session.status === 'in_progress' ||
                session.status === 'recording' ? (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
                    <p className="text-sm text-blue-700 font-medium">
                      Live recording in progress
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Action Button */}
              {onViewDetails && (
                <div className="mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(session.id)}
                    className="text-xs hover:bg-gray-100 text-gray-700 hover:text-gray-900 font-medium group/btn"
                  >
                    <Eye className="h-3 w-3 mr-1.5" />
                    View Details
                    <ArrowRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-200" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const onViewDetails = (sessionId: string) => {
    router.push(`/sessions/${sessionId}`)
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-gray-900 rounded-lg">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                Recent Sessions
              </h2>
            </div>
            {totalSessions > 0 && (
              <p className="text-sm text-gray-600 ml-11">
                Showing {Math.min(5, totalSessions)} of {totalSessions} total
                sessions
              </p>
            )}
          </div>
          {totalSessions > 5 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/sessions')}
              className="border-gray-300 hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-200"
            >
              View All
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
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
              <div key={i} className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl animate-pulse" />
                <div className="relative bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-200 rounded-md w-1/3 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded-md w-1/2 animate-pulse" />
                      <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                    </div>
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
              <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Session Activity
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
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
                    <span className="text-gray-300">•</span>
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
