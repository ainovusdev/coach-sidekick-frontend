import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  FileText,
  Calendar,
  Activity
} from 'lucide-react'

interface SessionCardCompactProps {
  session: any
  showClient?: boolean
}

export function SessionCardCompact({ session, showClient = true }: SessionCardCompactProps) {
  const summary = session.meeting_summaries?.[0]
  const createdAt = new Date(session.created_at)
  const durationMinutes = summary?.duration_minutes || (session.duration_seconds ? Math.ceil(session.duration_seconds / 60) : null)

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

  const getStatusBadge = (status: string) => {
    const statusText = status.replace('_', ' ')
    switch (status) {
      case 'completed':
        return <Badge className="bg-gray-900 text-white border-gray-900 text-xs">{statusText}</Badge>
      case 'in_progress':
      case 'recording':
        return <Badge className="bg-gray-800 text-white border-gray-800 text-xs animate-pulse">{statusText}</Badge>
      case 'error':
        return <Badge className="bg-gray-700 text-white border-gray-700 text-xs">{statusText}</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs">{statusText}</Badge>
    }
  }

  const getPlatformName = (url: string | null | undefined) => {
    if (!url) return 'Meeting'
    if (url.includes('zoom.us')) return 'Zoom'
    if (url.includes('meet.google.com')) return 'Google Meet'
    if (url.includes('teams.microsoft.com')) return 'Microsoft Teams'
    return 'Meeting'
  }

  const clientName = session.client_name || session.metadata?.client_name || null
  const meetingSummary = summary?.meeting_summary || session.summary

  return (
    <div className="space-y-3">
      {/* Header Row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon(session.status)}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                {getPlatformName(session.meeting_url)}
              </span>
              {showClient && clientName && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{clientName}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
              </div>
              {durationMinutes && (
                <>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{durationMinutes} minutes</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {getStatusBadge(session.status)}
      </div>

      {/* Summary Section */}
      {meetingSummary ? (
        <div className="pl-7">
          <div className="p-3 bg-gradient-to-b from-gray-50 to-white border border-gray-200 rounded-lg">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                  Summary
                </p>
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                  {meetingSummary}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : session.status === 'completed' ? (
        <div className="pl-7">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 italic">
              Processing summary...
            </p>
          </div>
        </div>
      ) : session.status === 'in_progress' || session.status === 'recording' ? (
        <div className="pl-7">
          <div className="p-3 bg-gray-900 text-white rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 animate-pulse" />
              <p className="text-sm font-medium">
                Live Session • Recording in progress
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}