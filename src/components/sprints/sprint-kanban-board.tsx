'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CommitmentKanbanCard } from '@/components/commitments/commitment-kanban-card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Circle, PlayCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CommitmentService } from '@/services/commitment-service'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'
import type { CommitmentStatus } from '@/types/commitment'

interface SprintKanbanBoardProps {
  commitments: any[]
  clientId: string
  targets?: any[] // Available targets for looking up titles
  onCommitmentClick?: (commitment: any) => void
  onCommitmentUpdate?: () => void
}

interface KanbanColumnProps {
  title: string
  icon: React.ReactNode
  commitments: any[]
  columnStatus: string
  targets?: any[]
  onCommitmentClick?: (commitment: any) => void
  onDrop?: (commitmentId: string, newStatus: string) => void
  emptyMessage: string
  iconColor: string
  headerBgColor: string
}

function KanbanColumn({
  title,
  icon,
  commitments,
  columnStatus,
  targets,
  onCommitmentClick,
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
          isDragOver && 'bg-primary/5',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <ScrollArea className="h-[500px]">
          <div className="p-3 space-y-3">
            {commitments.length > 0 ? (
              commitments.map(commitment => (
                <CommitmentKanbanCard
                  key={commitment.id}
                  commitment={commitment}
                  targets={targets}
                  onClick={() => onCommitmentClick?.(commitment)}
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

export function SprintKanbanBoard({
  commitments,
  clientId,
  targets = [],
  onCommitmentClick,
  onCommitmentUpdate,
}: SprintKanbanBoardProps) {
  const queryClient = useQueryClient()

  const handleDrop = async (commitmentId: string, newStatus: string) => {
    const statusLabels: Record<string, string> = {
      active: 'Committed',
      in_progress: 'In Progress',
      completed: 'Done',
    }

    // Optimistic update: Update UI immediately
    const queryKey = queryKeys.commitments.list({ client_id: clientId })

    // Get current data from cache
    const previousData = queryClient.getQueryData(queryKey)

    // Optimistically update the cache
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old?.commitments) return old

      return {
        ...old,
        commitments: old.commitments.map((c: any) =>
          c.id === commitmentId ? { ...c, status: newStatus } : c,
        ),
      }
    })

    // Show immediate feedback
    toast.success(`Moved to ${statusLabels[newStatus]}`)

    // Update in background
    try {
      await CommitmentService.updateCommitment(commitmentId, {
        status: newStatus as CommitmentStatus,
      })
      // Success - data is already updated optimistically
      onCommitmentUpdate?.()
    } catch (error) {
      console.error('Error updating commitment:', error)
      // Rollback on error
      queryClient.setQueryData(queryKey, previousData)
      toast.error('Failed to update commitment - changes reverted')
    }
  }

  // Filter commitments by status into 3 columns
  const committedCommitments = commitments.filter(
    c => c.status === 'active' || c.status === 'draft',
  )

  const inProgressCommitments = commitments.filter(
    c => c.status === 'in_progress',
  )

  const doneCommitments = commitments.filter(c => c.status === 'completed')

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Committed Column */}
      <KanbanColumn
        title="Committed"
        icon={<Circle className="h-4 w-4" />}
        commitments={committedCommitments}
        columnStatus="active"
        targets={targets}
        onCommitmentClick={onCommitmentClick}
        onDrop={handleDrop}
        emptyMessage="No committed items"
        iconColor="text-gray-600"
        headerBgColor="bg-gray-50"
      />

      {/* In Progress Column */}
      <KanbanColumn
        title="In Progress"
        icon={<PlayCircle className="h-4 w-4" />}
        commitments={inProgressCommitments}
        columnStatus="in_progress"
        targets={targets}
        onCommitmentClick={onCommitmentClick}
        onDrop={handleDrop}
        emptyMessage="No items in progress"
        iconColor="text-blue-600"
        headerBgColor="bg-blue-50"
      />

      {/* Done Column */}
      <KanbanColumn
        title="Done"
        icon={<CheckCircle2 className="h-4 w-4" />}
        commitments={doneCommitments}
        columnStatus="completed"
        targets={targets}
        onCommitmentClick={onCommitmentClick}
        onDrop={handleDrop}
        emptyMessage="No completed commitments"
        iconColor="text-green-600"
        headerBgColor="bg-green-50"
      />
    </div>
  )
}
