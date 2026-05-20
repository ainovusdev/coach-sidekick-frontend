import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import {
  ChevronRight,
  FileText,
  Brain,
  Clock,
  Calendar,
  Trash2,
  MoreVertical,
  Sparkles,
  Loader2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate, formatTime } from '@/lib/date-utils'
import { SessionService } from '@/services/session-service'
import { AnalysisService } from '@/services/analysis-service'
import { toast } from '@/hooks/use-toast'

interface SessionSummary {
  duration_minutes: number
  final_overall_score?: number
  meeting_summary: string
}

interface SessionCardProps {
  session: {
    id: string
    bot_id: string
    status: string
    created_at: string
    started_at?: string
    meeting_summaries?: SessionSummary[]
    summary?: string
    key_topics?: string[]
    action_items?: string[]
    duration_seconds?: number
  }
  onDelete?: () => void
}

export default function SessionCard({ session, onDelete }: SessionCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reanalyzing, setReanalyzing] = useState(false)

  const meetingSummary = session.meeting_summaries?.[0]
  const duration = session.duration_seconds
    ? Math.round(session.duration_seconds / 60)
    : meetingSummary?.duration_minutes

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await SessionService.deleteSession(session.id)
      toast({
        title: 'Session Deleted',
        description: 'The session has been deleted successfully.',
      })
      if (onDelete) {
        onDelete()
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
      toast({
        title: 'Delete Failed',
        description:
          error instanceof Error ? error.message : 'Failed to delete session',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleReanalyze = async () => {
    setReanalyzing(true)
    try {
      await AnalysisService.triggerAnalysis(session.id, true)
      toast({
        title: 'Analysis Complete',
        description: 'Session has been reanalyzed successfully.',
      })
      if (onDelete) {
        // Reuse onDelete callback to refresh the list
        onDelete()
      }
    } catch (error) {
      console.error('Failed to reanalyze session:', error)
      toast({
        title: 'Reanalysis Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to reanalyze session',
        variant: 'destructive',
      })
    } finally {
      setReanalyzing(false)
    }
  }

  return (
    <>
      <div className="bg-surface-1 border-b border-line hover:bg-paper transition-colors relative group">
        <Link href={`/sessions/${session.id}`} className="block p-6">
          <div className="space-y-4">
            {/* Header with date and status */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-surface-3 rounded-lg">
                  <Calendar className="h-4 w-4 text-ink-3" />
                </div>
                <div>
                  <h4 className="font-medium text-ink">
                    {formatDate(session.started_at || session.created_at)}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-ink-3">
                      {formatTime(session.started_at || session.created_at)}
                    </span>
                    {duration && (
                      <>
                        <span className="text-ink-2">•</span>
                        <span className="text-sm text-ink-3 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {duration} min
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ChevronRight className="h-5 w-5 text-ink-4" />
              </div>
            </div>

            {/* Summary Section */}
            {(session.summary || meetingSummary?.meeting_summary) && (
              <div className="bg-paper rounded-lg p-4 border border-line">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-ink-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-ink-2 line-clamp-3">
                      {session.summary || meetingSummary?.meeting_summary}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Key Topics */}
            {session.key_topics && session.key_topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {session.key_topics
                  .slice(0, 5)
                  .map((topic: string, index: number) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-surface-3 text-ink-2 border-0 text-xs"
                    >
                      {topic}
                    </Badge>
                  ))}
                {session.key_topics.length > 5 && (
                  <Badge
                    variant="outline"
                    className="border-line text-ink-3 text-xs"
                  >
                    +{session.key_topics.length - 5} more
                  </Badge>
                )}
              </div>
            )}

            {/* Commitments */}
            {session.action_items && session.action_items.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5 text-ink-3" />
                  <span className="text-xs font-medium text-ink-3 uppercase tracking-wider">
                    Commitments
                  </span>
                </div>
                <ul className="space-y-1">
                  {session.action_items
                    .slice(0, 2)
                    .map((item: string, index: number) => (
                      <li
                        key={index}
                        className="text-sm text-ink-3 flex items-start gap-1.5"
                      >
                        <span className="text-ink-4 mt-0.5">•</span>
                        <span className="line-clamp-1">{item}</span>
                      </li>
                    ))}
                  {session.action_items.length > 2 && (
                    <li className="text-sm text-ink-3 italic">
                      +{session.action_items.length - 2} more commitments
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Score if available */}
            {meetingSummary?.final_overall_score && (
              <div className="flex items-center gap-2 pt-2">
                <div className="px-2.5 py-1 bg-surface-3 rounded-md">
                  <span className="text-xs text-ink-3">Score: </span>
                  <span className="text-sm font-medium text-ink">
                    {meetingSummary.final_overall_score.toFixed(1)}/10
                  </span>
                </div>
              </div>
            )}
          </div>
        </Link>

        {/* Actions Menu - Positioned absolutely */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={e => e.preventDefault()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={e => {
                  e.preventDefault()
                  handleReanalyze()
                }}
                disabled={reanalyzing}
              >
                {reanalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Reanalyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Reanalyze Session
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-vermillion focus:text-vermillion"
                onClick={e => {
                  e.preventDefault()
                  setShowDeleteDialog(true)
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Session"
        description="Are you sure you want to delete this session? This will permanently remove the session, all transcripts, analyses, and associated data. This action cannot be undone."
        confirmText={deleting ? 'Deleting...' : 'Delete Session'}
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  )
}
