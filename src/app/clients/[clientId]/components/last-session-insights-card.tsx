'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSessionDetails } from '@/hooks/queries/use-session-details'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { CommitmentService } from '@/services/commitment-service'
import { commitmentTypeLabels } from '@/types/commitment'
import { toast } from 'sonner'
import {
  TrendingUp,
  FileText,
  Target as TargetIcon,
  ExternalLink,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Edit2,
  Save,
  X,
  Circle,
  PlayCircle,
  CheckCircle2,
} from 'lucide-react'
import { formatDate, formatDateOnly } from '@/lib/date-utils'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface LastSessionInsightsCardProps {
  session: any
}

interface CommitmentItemProps {
  commitment: any
  onUpdate: () => void
}

function CommitmentItem({ commitment, onUpdate }: CommitmentItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editData, setEditData] = useState({
    title: commitment.title,
    description: commitment.description || '',
    status: commitment.status,
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await CommitmentService.updateCommitment(commitment.id, editData)
      toast.success('Commitment updated successfully')
      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Error updating commitment:', error)
      toast.error('Failed to update commitment')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditData({
      title: commitment.title,
      description: commitment.description || '',
      status: commitment.status,
    })
    setIsEditing(false)
  }

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
    } catch (error) {
      console.error('Error updating commitment status:', error)
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
      {/* Header - Always Visible */}
      <div className="flex items-center justify-between gap-2 p-3 hover:bg-paper transition-colors">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Status Indicator Icon */}
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

          {isEditing ? (
            <Input
              value={editData.title}
              onChange={e =>
                setEditData({ ...editData, title: e.target.value })
              }
              className="flex-1 h-8 text-sm"
              placeholder="Commitment title"
            />
          ) : (
            <p
              className={cn(
                'text-sm font-medium flex-1 ',
                commitment.status === 'completed' && 'line-through text-ink-3 ',
              )}
            >
              {commitment.title}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Status Selector */}
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

          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSave}
                disabled={isSaving}
                className="h-7 px-2"
              >
                <Save className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-7 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-7 px-2"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-line bg-paper ">
          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-ink-2 mb-1 block">
              Description
            </label>
            {isEditing ? (
              <Textarea
                value={editData.description}
                onChange={e =>
                  setEditData({ ...editData, description: e.target.value })
                }
                className="text-sm min-h-[60px]"
                placeholder="Add description..."
              />
            ) : (
              <p className="text-sm text-ink-3 ">
                {commitment.description || 'No description'}
              </p>
            )}
          </div>

          {/* Additional Info */}
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
                  {formatDateOnly(commitment.target_date, 'MMM d, yyyy')}
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

export function LastSessionInsightsCard({
  session,
}: LastSessionInsightsCardProps) {
  const router = useRouter()
  const [showAllActionItems, setShowAllActionItems] = useState(false)
  const { data: sessionDetails, isLoading: detailsLoading } = useSessionDetails(
    session?.id,
  )
  const {
    data: commitments,
    isLoading: commitmentsLoading,
    refetch: refetchCommitments,
  } = useCommitments({
    session_id: session?.id,
  })

  if (!session) {
    return (
      <Card className="border-line ">
        <CardContent className="p-12 text-center">
          <MessageSquare className="h-12 w-12 text-ink-2 mx-auto mb-4" />
          <h3 className="text-ink font-medium mb-2">No sessions yet</h3>
          <p className="text-ink-3 text-sm">
            Start your first coaching session to see insights here.
          </p>
        </CardContent>
      </Card>
    )
  }

  const isLoading = detailsLoading || commitmentsLoading

  return (
    <Card className="border-line ">
      <CardHeader className="border-b border-line ">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-ink-3 " />
            Last Session Insights
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/sessions/${session.id}`)}
          >
            View Full Session
            <ExternalLink className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-5">
        {/* Simplified Session Info Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-line ">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-ink ">
              {session.title || 'Coaching Session'}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-3 ">
            <span>
              {formatDate(session.started_at || session.created_at, 'MMM d')}
            </span>
            <Badge
              variant={session.status === 'completed' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {session.status}
            </Badge>
            {sessionDetails?.sessionScore !== null &&
              sessionDetails?.sessionScore !== undefined && (
                <div className="flex items-center gap-1 text-sm font-bold text-forest ">
                  <TrendingUp className="h-4 w-4" />
                  {sessionDetails.sessionScore.toFixed(1)}/10
                </div>
              )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <>
            {/* Summary - Check multiple possible locations */}
            {(sessionDetails?.summary ||
              sessionDetails?.meeting_summary?.meeting_summary ||
              session?.summary) && (
              <div>
                <h4 className="text-sm font-semibold text-ink-2 mb-2">
                  Session Summary
                </h4>
                <p className="text-sm text-ink-3 leading-relaxed">
                  {sessionDetails?.summary ||
                    sessionDetails?.meeting_summary?.meeting_summary ||
                    session?.summary}
                </p>
              </div>
            )}

            {/* Commitments Made */}
            {commitments &&
              commitments.commitments &&
              commitments.commitments.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-ink-2 mb-3 flex items-center gap-2">
                    <TargetIcon className="h-4 w-4" />
                    Commitments from This Session (
                    {commitments.commitments.length})
                  </h4>
                  <div className="space-y-2">
                    {commitments.commitments.map((commitment: any) => (
                      <CommitmentItem
                        key={commitment.id}
                        commitment={commitment}
                        onUpdate={refetchCommitments}
                      />
                    ))}
                  </div>
                </div>
              )}

            {/* Next Session Focus */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-ink mb-2 flex items-center gap-2">
                <TargetIcon className="h-4 w-4 text-primary" />
                Next Session Focus
              </h4>
              {session.action_items && session.action_items.length > 0 ? (
                <ul className="space-y-1.5">
                  {(showAllActionItems
                    ? session.action_items
                    : session.action_items.slice(0, 3)
                  ).map((item: string, index: number) => (
                    <li
                      key={index}
                      className="text-sm text-ink-2 flex items-start gap-2"
                    >
                      <span className="text-primary mt-0.5">→</span>
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
              ) : (
                <p className="text-sm text-ink-3 ">
                  Review progress on current commitments and set new goals for
                  next session.
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
