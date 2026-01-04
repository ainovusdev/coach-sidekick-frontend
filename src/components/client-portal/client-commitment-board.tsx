'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  Circle,
  PlayCircle,
  CheckCircle2,
  Calendar,
  TrendingUp,
  MoreVertical,
  Edit,
  Trash2,
  AlertCircle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Commitment } from '@/types/commitment'
import { format, isPast, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { ClientCommitmentService } from '@/services/client-commitment-service'

interface ClientCommitmentBoardProps {
  commitments: Commitment[]
  onCommitmentClick?: (commitment: Commitment) => void
  onEdit?: (commitment: Commitment) => void
  onDelete?: (commitment: Commitment) => void
  onStatusChange?: () => void
  setCommitments?: React.Dispatch<React.SetStateAction<Commitment[]>>
}

interface KanbanColumnProps {
  title: string
  icon: React.ReactNode
  commitments: Commitment[]
  columnStatus: string
  onCommitmentClick?: (commitment: Commitment) => void
  onEdit?: (commitment: Commitment) => void
  onDelete?: (commitment: Commitment) => void
  onDrop?: (commitmentId: string, newStatus: string) => void
  emptyMessage: string
  iconColor: string
  headerBgColor: string
}

function CommitmentCard({
  commitment,
  onClick,
  onEdit,
  onDelete,
}: {
  commitment: Commitment
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  const isOverdue =
    commitment.target_date &&
    isPast(parseISO(commitment.target_date)) &&
    commitment.status !== 'completed'

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'action':
        return 'bg-blue-50 text-blue-700'
      case 'habit':
        return 'bg-purple-50 text-purple-700'
      case 'milestone':
        return 'bg-green-50 text-green-700'
      case 'learning':
        return 'bg-yellow-50 text-yellow-700'
      default:
        return 'bg-gray-50 text-gray-700'
    }
  }

  // Check if this is a client-created commitment
  const isClientCreated = commitment.metadata?.created_by === 'client'

  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('commitmentId', commitment.id)
      }}
      className={cn(
        'bg-white border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group',
        isOverdue && 'border-red-200 bg-red-50/30',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap gap-1">
          <Badge
            variant="secondary"
            className={cn('text-xs', getTypeColor(commitment.type))}
          >
            {commitment.type}
          </Badge>
          {commitment.priority !== 'medium' && (
            <Badge
              variant="outline"
              className={cn('text-xs', getPriorityColor(commitment.priority))}
            >
              {commitment.priority}
            </Badge>
          )}
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.()}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onClick?.()}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Update Progress
            </DropdownMenuItem>
            {isClientCreated && (
              <DropdownMenuItem
                onClick={() => onDelete?.()}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
        {commitment.title}
      </h4>

      {commitment.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
          {commitment.description}
        </p>
      )}

      {/* Progress bar */}
      {commitment.status !== 'completed' &&
        commitment.progress_percentage > 0 && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{commitment.progress_percentage}%</span>
            </div>
            <Progress
              value={commitment.progress_percentage}
              className="h-1.5"
            />
          </div>
        )}

      {/* Target date */}
      {commitment.target_date && (
        <div
          className={cn(
            'flex items-center gap-1 text-xs',
            isOverdue ? 'text-red-600' : 'text-gray-500',
          )}
        >
          <Calendar className="h-3 w-3" />
          <span>{format(parseISO(commitment.target_date), 'MMM d')}</span>
        </div>
      )}
    </div>
  )
}

function KanbanColumn({
  title,
  icon,
  commitments,
  columnStatus,
  onCommitmentClick,
  onEdit,
  onDelete,
  onDrop,
  emptyMessage,
  iconColor,
  headerBgColor,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const commitmentId = e.dataTransfer.getData('commitmentId')
    if (commitmentId && onDrop) {
      onDrop(commitmentId, columnStatus)
    }
  }

  return (
    <Card className="border-gray-200 flex flex-col h-full">
      <CardHeader
        className={cn('py-3 pt-4 -mt-2 rounded-t-xl border-b', headerBgColor)}
      >
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className={iconColor}>{icon}</div>
          <span>{title}</span>
          <span className="ml-auto text-xs font-normal text-gray-500">
            ({commitments.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent
        className={cn(
          'p-0 flex-1 transition-colors',
          isDragOver && 'bg-blue-50',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <ScrollArea className="h-[400px]">
          <div className="p-3 space-y-3">
            {commitments.length > 0 ? (
              commitments.map(commitment => (
                <CommitmentCard
                  key={commitment.id}
                  commitment={commitment}
                  onClick={() => onCommitmentClick?.(commitment)}
                  onEdit={() => onEdit?.(commitment)}
                  onDelete={() => onDelete?.(commitment)}
                />
              ))
            ) : (
              <div className="text-center py-8 px-4">
                <p className="text-sm text-gray-500">{emptyMessage}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export function ClientCommitmentBoard({
  commitments,
  onCommitmentClick,
  onEdit,
  onDelete,
  onStatusChange,
  setCommitments,
}: ClientCommitmentBoardProps) {
  const handleDrop = async (commitmentId: string, newStatus: string) => {
    const statusLabels: Record<string, string> = {
      active: 'To Do',
      in_progress: 'In Progress',
      completed: 'Done',
    }

    // Find the commitment being moved
    const commitment = commitments.find(c => c.id === commitmentId)
    if (!commitment || commitment.status === newStatus) return

    // Store previous state for rollback
    const previousCommitments = [...commitments]

    // Optimistic update: Update UI immediately
    if (setCommitments) {
      setCommitments(prev =>
        prev.map(c =>
          c.id === commitmentId
            ? {
                ...c,
                status: newStatus as Commitment['status'],
                progress_percentage:
                  newStatus === 'completed' ? 100 : c.progress_percentage,
              }
            : c,
        ),
      )
    }

    // Show immediate feedback
    toast.success(`Moved to ${statusLabels[newStatus]}`)

    // Update in background
    try {
      await ClientCommitmentService.updateCommitment(commitmentId, {
        status: newStatus as any,
        progress_percentage: newStatus === 'completed' ? 100 : undefined,
      })
      // Success - data is already updated optimistically
      onStatusChange?.()
    } catch (error) {
      console.error('Error updating commitment:', error)
      // Rollback on error
      if (setCommitments) {
        setCommitments(previousCommitments)
      }
      toast.error('Failed to update commitment - changes reverted')
    }
  }

  // Filter commitments by status
  // Note: Status types are 'draft' | 'active' | 'completed' | 'abandoned'
  const todoCommitments = commitments.filter(
    c => c.status === 'active' || c.status === 'draft',
  )
  // No 'in_progress' status exists - this column will be empty
  const inProgressCommitments: typeof commitments = []
  const doneCommitments = commitments.filter(c => c.status === 'completed')

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* To Do Column */}
      <KanbanColumn
        title="To Do"
        icon={<Circle className="h-4 w-4" />}
        commitments={todoCommitments}
        columnStatus="active"
        onCommitmentClick={onCommitmentClick}
        onEdit={onEdit}
        onDelete={onDelete}
        onDrop={handleDrop}
        emptyMessage="No commitments yet. Create one to get started!"
        iconColor="text-gray-600"
        headerBgColor="bg-gray-50"
      />

      {/* In Progress Column */}
      <KanbanColumn
        title="In Progress"
        icon={<PlayCircle className="h-4 w-4" />}
        commitments={inProgressCommitments}
        columnStatus="in_progress"
        onCommitmentClick={onCommitmentClick}
        onEdit={onEdit}
        onDelete={onDelete}
        onDrop={handleDrop}
        emptyMessage="Drag commitments here when you start working on them"
        iconColor="text-blue-600"
        headerBgColor="bg-blue-50"
      />

      {/* Done Column */}
      <KanbanColumn
        title="Done"
        icon={<CheckCircle2 className="h-4 w-4" />}
        commitments={doneCommitments}
        columnStatus="completed"
        onCommitmentClick={onCommitmentClick}
        onEdit={onEdit}
        onDelete={onDelete}
        onDrop={handleDrop}
        emptyMessage="Completed commitments will appear here"
        iconColor="text-green-600"
        headerBgColor="bg-green-50"
      />
    </div>
  )
}
