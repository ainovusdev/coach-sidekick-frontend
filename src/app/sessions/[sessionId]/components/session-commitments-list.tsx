'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CommitmentService } from '@/services/commitment-service'
import type { CommitmentStatus } from '@/types/commitment'
import { toast } from 'sonner'
import {
  Target,
  ChevronDown,
  ChevronRight,
  Edit2,
  Save,
  X,
  Circle,
  PlayCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Loader2,
  Check,
  Trash2,
  FileEdit,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface CommitmentItemProps {
  commitment: any
  onUpdate: () => void
}

function CommitmentItem({ commitment, onUpdate }: CommitmentItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isDiscarding, setIsDiscarding] = useState(false)
  const [editData, setEditData] = useState({
    title: commitment.title,
    description: commitment.description || '',
    status: commitment.status,
  })

  const isDraft = commitment.status === 'draft'

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

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await CommitmentService.confirmCommitment(commitment.id)
      toast.success('Commitment accepted')
      onUpdate()
    } catch (error) {
      console.error('Error confirming commitment:', error)
      toast.error('Failed to accept commitment')
    } finally {
      setIsConfirming(false)
    }
  }

  const handleDiscard = async () => {
    setIsDiscarding(true)
    try {
      await CommitmentService.discardCommitment(commitment.id)
      toast.success('Commitment discarded')
      onUpdate()
    } catch (error) {
      console.error('Error discarding commitment:', error)
      toast.error('Failed to discard commitment')
    } finally {
      setIsDiscarding(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await CommitmentService.updateCommitment(commitment.id, {
        status: newStatus as CommitmentStatus,
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
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-blue-600" />
      case 'draft':
        return <FileEdit className="h-4 w-4 text-amber-600" />
      default:
        return <Circle className="h-4 w-4 text-app-secondary" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'in_progress':
        return 'text-blue-700 bg-blue-50 border-blue-200'
      case 'draft':
        return 'text-amber-700 bg-amber-50 border-amber-200'
      default:
        return 'text-app-primary bg-app-surface border-app-border'
    }
  }

  // Draft commitment item - special styling with accept/reject buttons
  if (isDraft) {
    return (
      <div className="border border-amber-200 rounded-lg overflow-hidden bg-amber-50">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 p-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <FileEdit className="h-4 w-4 text-amber-600" />
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 p-0.5 hover:bg-amber-100 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-amber-700" />
              ) : (
                <ChevronRight className="h-4 w-4 text-amber-700" />
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
              <p className="text-sm font-medium flex-1 text-app-primary">
                {commitment.title}
              </p>
            )}

            <Badge
              variant="secondary"
              className="bg-amber-100 text-amber-700 border-amber-200 text-xs"
            >
              Draft
            </Badge>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
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
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleConfirm}
                  disabled={isConfirming || isDiscarding}
                  className="h-7 px-2 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                  title="Accept commitment"
                >
                  {isConfirming ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  disabled={isConfirming || isDiscarding}
                  className="h-7 px-2"
                  title="Edit commitment"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDiscard}
                  disabled={isConfirming || isDiscarding}
                  className="h-7 px-2 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                  title="Discard commitment"
                >
                  {isDiscarding ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-1 space-y-3 border-t border-amber-200 bg-amber-50/50">
            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-app-primary mb-1 block">
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
                <p className="text-sm text-app-secondary">
                  {commitment.description || 'No description'}
                </p>
              )}
            </div>

            {/* Transcript Context for AI-extracted */}
            {commitment.transcript_context && (
              <div>
                <label className="text-xs font-semibold text-app-primary mb-1 block">
                  From Transcript
                </label>
                <p className="text-sm text-app-secondary italic bg-white/50 p-2 rounded border border-amber-100">
                  &ldquo;{commitment.transcript_context}&rdquo;
                </p>
              </div>
            )}

            {/* Additional Info */}
            <div className="flex flex-wrap gap-3 text-xs text-app-secondary">
              {commitment.priority && (
                <span>
                  Priority: <strong>{commitment.priority}</strong>
                </span>
              )}
              {commitment.target_date && (
                <span>
                  Due:{' '}
                  <strong>
                    {format(new Date(commitment.target_date), 'MMM d, yyyy')}
                  </strong>
                </span>
              )}
              {commitment.type && (
                <span>
                  Type: <strong>{commitment.type}</strong>
                </span>
              )}
              {commitment.extraction_confidence && (
                <span>
                  Confidence:{' '}
                  <strong>
                    {Math.round(commitment.extraction_confidence * 100)}%
                  </strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Regular (non-draft) commitment item
  return (
    <div className="border border-app-border rounded-lg overflow-hidden">
      {/* Header - Always Visible */}
      <div className="flex items-center justify-between gap-2 p-3 hover:bg-app-surface transition-colors">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Status Indicator Icon */}
          <div className="flex-shrink-0">
            {getStatusIcon(commitment.status)}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-0.5 hover:bg-app-border rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-app-secondary" />
            ) : (
              <ChevronRight className="h-4 w-4 text-app-secondary" />
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
                'text-sm font-medium flex-1',
                commitment.status === 'completed' &&
                  'line-through text-app-secondary',
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
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-app-border bg-app-surface">
          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-app-primary mb-1 block">
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
              <p className="text-sm text-app-secondary">
                {commitment.description || 'No description'}
              </p>
            )}
          </div>

          {/* Additional Info */}
          <div className="flex flex-wrap gap-3 text-xs text-app-secondary">
            {commitment.priority && (
              <span>
                Priority: <strong>{commitment.priority}</strong>
              </span>
            )}
            {commitment.target_date && (
              <span>
                Due:{' '}
                <strong>
                  {format(new Date(commitment.target_date), 'MMM d, yyyy')}
                </strong>
              </span>
            )}
            {commitment.type && (
              <span>
                Type: <strong>{commitment.type}</strong>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface SessionCommitmentsListProps {
  sessionId: string
  commitments: any[]
  onViewAll?: () => void
  onUpdate: () => void
}

export function SessionCommitmentsList({
  sessionId,
  commitments,
  onViewAll,
  onUpdate,
}: SessionCommitmentsListProps) {
  const [extracting, setExtracting] = useState(false)

  const handleExtractCommitments = async () => {
    setExtracting(true)
    try {
      const extracted = await CommitmentService.extractFromSession(sessionId)
      if (extracted.length > 0) {
        toast.success(
          `Extracted ${extracted.length} commitment${extracted.length > 1 ? 's' : ''} from the session`,
        )
        onUpdate()
      } else {
        toast.info('No new commitments found in the transcript')
      }
    } catch (error) {
      console.error('Error extracting commitments:', error)
      toast.error('Failed to extract commitments from transcript')
    } finally {
      setExtracting(false)
    }
  }

  const draftCount = commitments.filter(c => c.status === 'draft').length
  const confirmedCount = commitments.filter(c => c.status !== 'draft').length

  return (
    <Card className="border-app-border shadow-sm">
      <CardHeader className="border-b border-app-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-app-surface rounded-lg">
              <Target className="h-5 w-5 text-app-secondary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-app-primary">
                Client Commitments
              </h2>
              <p className="text-xs text-app-secondary">
                {commitments.length > 0
                  ? `${draftCount > 0 ? `${draftCount} pending · ` : ''}${confirmedCount} confirmed`
                  : 'Track client action items'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExtractCommitments}
              disabled={extracting}
              variant="outline"
              size="sm"
              className="border-app-border"
            >
              {extracting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Extract
                </>
              )}
            </Button>
            {commitments.length > 0 && onViewAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAll}
                className="text-app-secondary"
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {commitments.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-10 w-10 mx-auto mb-3 text-app-secondary" />
            <p className="text-app-secondary text-sm">No commitments yet</p>
            <p className="text-xs text-app-secondary mt-1">
              Extract from transcript or add manually
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Draft Commitments */}
            {draftCount > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-app-secondary uppercase tracking-wide">
                    Pending Review ({draftCount})
                  </span>
                </div>
                {commitments
                  .filter(c => c.status === 'draft')
                  .map(commitment => (
                    <CommitmentItem
                      key={commitment.id}
                      commitment={commitment}
                      onUpdate={onUpdate}
                    />
                  ))}
              </div>
            )}

            {/* Confirmed Commitments */}
            {confirmedCount > 0 && (
              <div className="space-y-2">
                {draftCount > 0 && (
                  <div className="flex items-center gap-2 pt-2">
                    <span className="w-1.5 h-1.5 bg-app-secondary rounded-full" />
                    <span className="text-xs font-medium text-app-secondary uppercase tracking-wide">
                      Confirmed ({confirmedCount})
                    </span>
                  </div>
                )}
                {commitments
                  .filter(c => c.status !== 'draft')
                  .map(commitment => (
                    <CommitmentItem
                      key={commitment.id}
                      commitment={commitment}
                      onUpdate={onUpdate}
                    />
                  ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
