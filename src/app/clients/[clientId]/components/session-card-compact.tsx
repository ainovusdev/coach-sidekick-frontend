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
        return (
          <CheckCircle2 className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        )
      case 'in_progress':
      case 'recording':
        return (
          <Circle className="h-4 w-4 text-gray-900 dark:text-white animate-pulse" />
        )
      case 'error':
        return (
          <AlertCircle className="h-4 w-4 text-gray-800 dark:text-gray-200" />
        )
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusText = status.replace('_', ' ')
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white text-xs">
            {statusText}
          </Badge>
        )
      case 'in_progress':
      case 'recording':
        return (
          <Badge className="bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 border-gray-800 dark:border-gray-200 text-xs animate-pulse">
            {statusText}
          </Badge>
        )
      case 'error':
        return (
          <Badge className="bg-gray-700 dark:bg-gray-300 text-white dark:text-gray-900 border-gray-700 dark:border-gray-300 text-xs">
            {statusText}
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 text-xs">
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
  const formattedDate = formatDate(session.created_at, 'MMM d, yyyy')

  return (
    <div className="space-y-3">
      {/* Header Row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon(session.status)}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {session.title || `${platformName} - ${formattedDate}`}
              </span>
              {showClient && clientName && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {clientName}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="h-3 w-3" />
                <span>
                  {formatDate(session.created_at, 'EEEE')} •{' '}
                  {formatRelativeTime(session.created_at)}
                </span>
              </div>
              {durationMinutes && (
                <>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
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
              className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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
          <div className="p-3 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  Summary
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">
                  {meetingSummary}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : session.status === 'completed' ? (
        <div className="pl-7">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              Processing summary...
            </p>
          </div>
        </div>
      ) : session.status === 'in_progress' || session.status === 'recording' ? (
        <div className="pl-7">
          <div className="p-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg">
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
