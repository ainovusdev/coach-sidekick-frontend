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
} from 'lucide-react'
import { MeetingSession } from '@/hooks/use-meeting-history'

interface SessionCardProps {
  session: MeetingSession
  onViewDetails?: (sessionId: string) => void
}

export function SessionCard({ session, onViewDetails }: SessionCardProps) {
  const summary = session.meeting_summaries
  const createdAt = new Date(session.created_at)
  const durationMinutes = summary?.duration_minutes || (session.duration_seconds ? Math.ceil(session.duration_seconds / 60) : null)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'in_progress':
      case 'recording':
        return <Circle className="h-4 w-4 text-blue-600 animate-pulse" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress':
      case 'recording':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPlatformName = (url: string) => {
    if (url.includes('zoom.us')) return 'Zoom'
    if (url.includes('meet.google.com')) return 'Google Meet'
    if (url.includes('teams.microsoft.com')) return 'Microsoft Teams'
    return 'Meeting'
  }

  // Extract client info from metadata
  const clientName = session.client_name || session.metadata?.client_name || null
  const meetingSummary = summary?.meeting_summary || session.summary

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-slate-200 bg-white">
      <CardContent className="p-4 space-y-3">
        {/* Header with status and time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(session.status)}
            <span className="text-sm font-medium text-slate-900">
              {getPlatformName(session.meeting_url)}
              {clientName && ` • ${clientName}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {durationMinutes && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                <span>{durationMinutes}m</span>
              </div>
            )}
            <Badge className={`${getStatusColor(session.status)} text-xs`}>
              {session.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* AI Summary - The main focus */}
        {meetingSummary ? (
          <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-700 mb-1">
                  AI Summary
                </p>
                <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">
                  {meetingSummary}
                </p>
              </div>
            </div>
          </div>
        ) : session.status === 'completed' ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              Summary generation in progress...
            </p>
          </div>
        ) : session.status === 'in_progress' || session.status === 'recording' ? (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              Session in progress • Recording transcripts...
            </p>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-sm text-slate-600">
              Session initialized • Waiting for bot to join...
            </p>
          </div>
        )}

        {/* Footer with time and action */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            {formatDistanceToNow(createdAt, { addSuffix: true })}
          </span>
          {onViewDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetails(session.id)}
              className="text-xs hover:bg-slate-100"
            >
              <Eye className="h-3 w-3 mr-1" />
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
