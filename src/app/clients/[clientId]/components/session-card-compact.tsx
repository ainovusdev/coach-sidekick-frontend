import { useState } from 'react'
import { formatDate, formatRelativeTime } from '@/lib/date-utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  FileText,
  Calendar,
  Activity,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { AnalysisService } from '@/services/analysis-service'
import { toast } from 'sonner'

interface SessionCardCompactProps {
  session: any
  showClient?: boolean
  showReanalyze?: boolean
  onReanalyzeComplete?: () => void
}

export function SessionCardCompact({
  session,
  showClient = true,
  showReanalyze = false,
  onReanalyzeComplete,
}: SessionCardCompactProps) {
  const [isReanalyzing, setIsReanalyzing] = useState(false)
  const summary = session.meeting_summaries?.[0]

  const handleReanalyze = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent navigation to session details

    if (isReanalyzing) return

    setIsReanalyzing(true)
    try {
      await AnalysisService.triggerAnalysis(session.id, true)
      toast.success('Session reanalysis started', {
        description: 'The analysis will be updated shortly.',
      })
      onReanalyzeComplete?.()
    } catch (error) {
      console.error('Failed to trigger reanalysis:', error)
      toast.error('Failed to start reanalysis', {
        description: 'Please try again later.',
      })
    } finally {
      setIsReanalyzing(false)
    }
  }
  const durationMinutes =
    summary?.duration_minutes ||
    (session.duration_seconds ? Math.ceil(session.duration_seconds / 60) : null)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-ink-2 " />
      case 'in_progress':
      case 'recording':
        return <Circle className="h-4 w-4 text-ink animate-pulse" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-ink-2 " />
      default:
        return <Circle className="h-4 w-4 text-ink-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusText = status.replace('_', ' ')
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-ink text-ink-on-dark border-line text-xs">
            {statusText}
          </Badge>
        )
      case 'in_progress':
      case 'recording':
        return (
          <Badge className="bg-ink-2 text-ink-on-dark border-line text-xs animate-pulse">
            {statusText}
          </Badge>
        )
      case 'error':
        return (
          <Badge className="bg-ink-2 text-ink-on-dark border-line text-xs">
            {statusText}
          </Badge>
        )
      default:
        return (
          <Badge className="bg-surface-3 text-ink-2 border-line text-xs">
            {statusText}
          </Badge>
        )
    }
  }

  const getPlatformName = (url: string | null | undefined) => {
    if (!url) return 'Meeting'
    if (url.includes('zoom.us')) return 'Zoom'
    if (url.includes('meet.google.com')) return 'Google Meet'
    if (url.includes('teams.microsoft.com')) return 'Microsoft Teams'
    return 'Meeting'
  }

  const clientName =
    session.client_name || session.metadata?.client_name || null
  const meetingSummary = summary?.meeting_summary || session.summary
  const platformName = getPlatformName(session.meeting_url)
  const sessionDate = session.started_at || session.created_at
  const formattedDate = formatDate(sessionDate, 'MMM d, yyyy')

  return (
    <div className="space-y-3">
      {/* Header Row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon(session.status)}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink ">
                {session.title || `${platformName} - ${formattedDate}`}
              </span>
              {showClient && clientName && (
                <>
                  <span className="text-ink-4">•</span>
                  <span className="text-ink-3 ">{clientName}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1 text-xs text-ink-3 ">
                <Calendar className="h-3 w-3" />
                <span>
                  {formatDate(sessionDate, 'EEEE')} •{' '}
                  {formatRelativeTime(sessionDate)}
                </span>
              </div>
              {durationMinutes && (
                <>
                  <span className="text-ink-4">•</span>
                  <div className="flex items-center gap-1 text-xs text-ink-3 ">
                    <Clock className="h-3 w-3" />
                    <span>{durationMinutes} minutes</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showReanalyze && session.status === 'completed' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReanalyze}
              disabled={isReanalyzing}
              className="h-7 px-2 text-xs text-ink-3 hover:text-ink-2 hover:bg-surface-3 "
              title="Reanalyze session"
            >
              {isReanalyzing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          {getStatusBadge(session.status)}
        </div>
      </div>

      {/* Summary Section */}
      {meetingSummary ? (
        <div className="pl-7">
          <div className="p-3  border border-line rounded-lg">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-ink-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-ink-2 mb-1 uppercase tracking-wider">
                  Summary
                </p>
                <p className="text-sm text-ink-2 leading-relaxed line-clamp-2">
                  {meetingSummary}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : session.status === 'completed' ? (
        <div className="pl-7">
          <div className="p-3 bg-paper border border-line rounded-lg">
            <p className="text-sm text-ink-3 italic">Processing summary...</p>
          </div>
        </div>
      ) : session.status === 'in_progress' || session.status === 'recording' ? (
        <div className="pl-7">
          <div className="p-3 bg-ink text-ink-on-dark rounded-lg">
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
