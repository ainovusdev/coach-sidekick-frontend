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
} from 'lucide-react'
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
      default:
        return <Circle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'in_progress':
        return 'text-blue-700 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header - Always Visible */}
      <div className="flex items-center justify-between gap-2 p-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Status Indicator Icon */}
          <div className="flex-shrink-0">
            {getStatusIcon(commitment.status)}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-0.5 hover:bg-gray-200 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600" />
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
                  'line-through text-gray-500',
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
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-gray-100 bg-gray-50">
          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">
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
              <p className="text-sm text-gray-600">
                {commitment.description || 'No description'}
              </p>
            )}
          </div>

          {/* Additional Info */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
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
  commitments,
  onViewAll,
  onUpdate,
}: SessionCommitmentsListProps) {
  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Target className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-black">
                Client Commitments
              </h2>
              <p className="text-sm text-gray-500">
                {commitments.length} total commitments
              </p>
            </div>
          </div>
          {commitments.length > 0 && onViewAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="hover:bg-gray-50"
            >
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {commitments.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-600">No commitments yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Commitments from coaching sessions will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {commitments.map(commitment => (
              <CommitmentItem
                key={commitment.id}
                commitment={commitment}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
