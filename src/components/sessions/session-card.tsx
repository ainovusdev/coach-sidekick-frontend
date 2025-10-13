import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Eye,
  FileText,
  Lock,
} from 'lucide-react'
import { MeetingSession } from '@/hooks/use-meeting-history'
import { usePermissions, PermissionGate } from '@/contexts/permission-context'

interface SessionCardProps {
  session: MeetingSession
  onViewDetails?: (sessionId: string) => void
}

export function SessionCard({ session, onViewDetails }: SessionCardProps) {
  const permissions = usePermissions()
  const summary = session.meeting_summaries
  const createdAt = new Date(session.created_at)
  const durationMinutes =
    summary?.duration_minutes ||
    (session.duration_seconds ? Math.ceil(session.duration_seconds / 60) : null)

  // Check if user is a viewer (restricted access)
  const isViewer = permissions.isViewer()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-gray-700" />
      case 'in_progress':
      case 'recording':
        return <Circle className="h-4 w-4 text-gray-900 animate-pulse" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-gray-800" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-gray-900 text-white border-gray-900'
      case 'in_progress':
      case 'recording':
        return 'bg-gray-800 text-white border-gray-800'
      case 'error':
        return 'bg-gray-700 text-white border-gray-700'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPlatformName = (url: string | null | undefined) => {
    if (!url) return 'Meeting'
    if (url.includes('zoom.us')) return 'Zoom'
    if (url.includes('meet.google.com')) return 'Google Meet'
    if (url.includes('teams.microsoft.com')) return 'Microsoft Teams'
    return 'Meeting'
  }

  // Extract client and coach info from metadata or session
  const clientName =
    session.client_name || session.metadata?.client_name || null
  const coachName = session.coach_name || session.metadata?.coach_name || null
  const meetingSummary = summary?.meeting_summary || session.summary

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white hover:border-gray-300">
      <CardContent className="p-4 space-y-3">
        {/* Header with status and time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            {getStatusIcon(session.status)}
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900">
                {getPlatformName(session.meeting_url)}
              </span>
              {/* NEW: Coach and Client info */}
              {(coachName || clientName) && (
                <span className="text-xs text-gray-500">
                  {coachName && (
                    <span className="font-medium">Coach: {coachName}</span>
                  )}
                  {coachName && clientName && <span className="mx-1">•</span>}
                  {clientName && (
                    <span className="font-medium">Client: {clientName}</span>
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {durationMinutes && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Clock className="h-3 w-3" />
                <span className="font-medium">{durationMinutes}m</span>
              </div>
            )}
            <Badge className={`${getStatusColor(session.status)} text-xs`}>
              {session.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* AI Summary - The main focus */}
        {isViewer ? (
          // Viewers see restricted message instead of actual content
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Lock className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Restricted Access
                </p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Session content is not available with viewer permissions
                </p>
              </div>
            </div>
          </div>
        ) : meetingSummary ? (
          <div className="p-4 bg-gradient-to-b from-gray-50 to-white border border-gray-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="h-4 w-4 text-gray-700" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">
                  Session Summary
                </p>
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                  {meetingSummary}
                </p>
              </div>
            </div>
          </div>
        ) : session.status === 'completed' ? (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-sm text-gray-600 font-medium">
              Processing summary...
            </p>
          </div>
        ) : session.status === 'in_progress' ||
          session.status === 'recording' ? (
          <div className="p-4 bg-gray-900 text-white rounded-xl">
            <p className="text-sm font-medium">
              Live Session • Recording in progress
            </p>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-sm text-gray-600">Initializing session...</p>
          </div>
        )}

        {/* Footer with time and action */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500 font-medium">
            {formatDistanceToNow(createdAt, { addSuffix: true })}
          </span>
          {onViewDetails && (
            <PermissionGate
              resource="sessions"
              action="view"
              fallback={
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="text-xs text-gray-400 font-medium cursor-not-allowed"
                >
                  <Lock className="h-3 w-3 mr-1" />
                  Restricted
                </Button>
              }
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(session.id)}
                className="text-xs hover:bg-gray-100 text-gray-700 hover:text-gray-900 font-medium"
              >
                <Eye className="h-3 w-3 mr-1" />
                View Details
              </Button>
            </PermissionGate>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
