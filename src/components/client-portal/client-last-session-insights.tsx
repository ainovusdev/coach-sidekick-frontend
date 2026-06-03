'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { CommitmentService } from '@/services/commitment-service'
import { commitmentTypeLabels } from '@/types/commitment'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import {
  TrendingUp,
  FileText,
  Target as TargetIcon,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Circle,
  PlayCircle,
  CheckCircle2,
} from 'lucide-react'
import { formatDate, formatRelativeTime } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface SessionData {
  id: string
  date: string
  duration_minutes: number
  status: string
  summary?: string | null
  key_topics?: string[]
  score?: number
  action_items?: string[]
}

interface ClientLastSessionInsightsProps {
  session: SessionData | null
}

function SessionCommitmentItem({
  commitment,
  onUpdate,
}: {
  commitment: any
  onUpdate: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    try {
      await CommitmentService.updateCommitment(commitment.id, {
        status: newStatus as any,
      })
      const statusLabels: Record<string, string> = {
        active: 'Committed',
        in_progress: 'In Progress',
        completed: 'Done',
      }
      toast.success(`Commitment moved to ${statusLabels[newStatus]}`)
      onUpdate()
    } catch {
      toast.error('Failed to update commitment')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-forest" />
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-ds-accent" />
      default:
        return <Circle className="h-4 w-4 text-ink-3 " />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-forest bg-forest-bg border-forest '
      case 'in_progress':
        return 'text-ds-accent bg-ds-accent-bg border-ds-accent '
      default:
        return 'text-ink-2 bg-paper border-line '
    }
  }

  return (
    <div className="border border-line rounded-lg overflow-hidden">
      <div className="flex items-center justify-between gap-2 p-3 hover:bg-paper transition-colors">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {getStatusIcon(commitment.status)}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-0.5 hover:bg-surface-3 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-ink-3 " />
            ) : (
              <ChevronRight className="h-4 w-4 text-ink-3 " />
            )}
          </button>
          <p
            className={cn(
              'text-sm font-medium flex-1 ',
              commitment.status === 'completed' && 'line-through text-ink-3 ',
            )}
          >
            {commitment.title}
          </p>
        </div>
        <Select value={commitment.status} onValueChange={handleStatusChange}>
          <SelectTrigger
            className={cn(
              'h-8 w-[130px] text-xs border',
              getStatusColor(commitment.status),
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">
              <div className="flex items-center gap-2">
                <Circle className="h-3 w-3" />
                Committed
              </div>
            </SelectItem>
            <SelectItem value="in_progress">
              <div className="flex items-center gap-2">
                <PlayCircle className="h-3 w-3" />
                In Progress
              </div>
            </SelectItem>
            <SelectItem value="completed">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3" />
                Done
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-line bg-paper ">
          {commitment.description && (
            <p className="text-sm text-ink-3 ">{commitment.description}</p>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-ink-3 ">
            {commitment.priority && (
              <span>
                Priority: <strong>{commitment.priority}</strong>
              </span>
            )}
            {commitment.target_date && (
              <span>
                Due:{' '}
                <strong>
                  {formatDate(commitment.target_date, 'MMM d, yyyy')}
                </strong>
              </span>
            )}
            {commitment.type && (
              <span>
                Type:{' '}
                <strong>
                  {commitmentTypeLabels[commitment.type] || commitment.type}
                </strong>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function ClientLastSessionInsights({
  session,
}: ClientLastSessionInsightsProps) {
  const queryClient = useQueryClient()
  const [showAllActionItems, setShowAllActionItems] = useState(false)

  const { data: commitments, refetch: refetchCommitments } = useCommitments(
    session?.id ? { session_id: session.id } : undefined,
    { enabled: !!session?.id },
  )

  if (!session) {
    return (
      <Card className="border-line ">
        <CardContent className="py-8 text-center">
          <FileText className="h-10 w-10 text-ink-2 mx-auto mb-3" />
          <h3 className="font-medium text-ink mb-1 text-sm">No sessions yet</h3>
          <p className="text-xs text-ink-3 ">
            Your coaching sessions will appear here after your first call.
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleCommitmentUpdate = () => {
    refetchCommitments()
    queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })
  }

  return (
    <Card className="border-line ">
      <CardHeader className="pb-3 border-b border-line ">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-ink-3 " />
            Last Session Insights
          </CardTitle>
          <Link href={`/client-portal/sessions/${session.id}`}>
            <Button variant="ghost" size="sm" className="text-xs h-7">
              View Details
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Session Info */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-ink ">
              {formatDate(session.date, 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-xs text-ink-3 mt-0.5">
              {formatRelativeTime(session.date)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-surface-3 text-ink-2 text-xs"
            >
              <Clock className="h-3 w-3 mr-1" />
              {session.duration_minutes} min
            </Badge>
            {session.score && (
              <Badge
                variant="secondary"
                className="bg-surface-3 text-ink-2 text-xs"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {session.score}/10
              </Badge>
            )}
          </div>
        </div>

        {/* Summary */}
        {session.summary && (
          <p className="text-sm text-ink-3 leading-relaxed">
            {session.summary}
          </p>
        )}

        {/* Key Topics */}
        {session.key_topics && session.key_topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {session.key_topics.slice(0, 4).map((topic, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="text-xs border-line text-ink-3 "
              >
                {topic}
              </Badge>
            ))}
          </div>
        )}

        {/* Session Commitments */}
        {commitments?.commitments && commitments.commitments.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-ink-2 mb-3 flex items-center gap-2">
              <TargetIcon className="h-4 w-4" />
              Commitments from This Session ({commitments.commitments.length})
            </h4>
            <div className="space-y-2">
              {commitments.commitments.map((commitment: any) => (
                <SessionCommitmentItem
                  key={commitment.id}
                  commitment={commitment}
                  onUpdate={handleCommitmentUpdate}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action Items / Next Session Focus */}
        {session.action_items && session.action_items.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-ink mb-2 flex items-center gap-2">
              <TargetIcon className="h-4 w-4 text-primary" />
              Next Session Focus
            </h4>
            <ul className="space-y-1.5">
              {(showAllActionItems
                ? session.action_items
                : session.action_items.slice(0, 3)
              ).map((item: string, index: number) => (
                <li
                  key={index}
                  className="text-sm text-ink-2 flex items-start gap-2"
                >
                  <span className="text-primary mt-0.5">&#8594;</span>
                  <span>{item}</span>
                </li>
              ))}
              {session.action_items.length > 3 && (
                <li>
                  <button
                    type="button"
                    onClick={() => setShowAllActionItems(prev => !prev)}
                    className="ml-5 text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    {showAllActionItems ? (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-3 w-3" />+
                        {session.action_items.length - 3} more items
                      </>
                    )}
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
