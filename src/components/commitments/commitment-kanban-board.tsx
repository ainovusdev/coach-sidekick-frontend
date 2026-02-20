'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CommitmentKanbanCard } from '@/components/commitments/commitment-kanban-card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Circle, PlayCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Commitment } from '@/types/commitment'

interface CommitmentKanbanBoardProps {
  commitments: Commitment[]
  targets?: any[]
  outcomeMap?: Record<string, string>
  onDrop?: (commitmentId: string, newStatus: string) => void
  onCommitmentClick?: (commitment: Commitment) => void
  onEdit?: (commitment: Commitment) => void
  onDelete?: (commitment: Commitment) => void
}

interface KanbanColumnProps {
  title: string
  icon: React.ReactNode
  commitments: Commitment[]
  columnStatus: string
  targets?: any[]
  outcomeMap?: Record<string, string>
  onCommitmentClick?: (commitment: Commitment) => void
  onEdit?: (commitment: Commitment) => void
  onDelete?: (commitment: Commitment) => void
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
  outcomeMap,
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
                  outcomeMap={outcomeMap}
                  onClick={() => onCommitmentClick?.(commitment)}
                  onEdit={onEdit ? () => onEdit(commitment) : undefined}
                  onDelete={onDelete ? () => onDelete(commitment) : undefined}
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

export function CommitmentKanbanBoard({
  commitments,
  targets = [],
  outcomeMap,
  onDrop,
  onCommitmentClick,
  onEdit,
  onDelete,
}: CommitmentKanbanBoardProps) {
  const todoCommitments = commitments.filter(
    c => c.status === 'active' || c.status === 'draft',
  )

  const inProgressCommitments = commitments.filter(
    c => (c.status as string) === 'in_progress',
  )

  const doneCommitments = commitments.filter(c => c.status === 'completed')

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <KanbanColumn
        title="To Do"
        icon={<Circle className="h-4 w-4" />}
        commitments={todoCommitments}
        columnStatus="active"
        targets={targets}
        outcomeMap={outcomeMap}
        onCommitmentClick={onCommitmentClick}
        onEdit={onEdit}
        onDelete={onDelete}
        onDrop={onDrop}
        emptyMessage="No commitments yet. Create one to get started!"
        iconColor="text-gray-600"
        headerBgColor="bg-gray-50"
      />

      <KanbanColumn
        title="In Progress"
        icon={<PlayCircle className="h-4 w-4" />}
        commitments={inProgressCommitments}
        columnStatus="in_progress"
        targets={targets}
        outcomeMap={outcomeMap}
        onCommitmentClick={onCommitmentClick}
        onEdit={onEdit}
        onDelete={onDelete}
        onDrop={onDrop}
        emptyMessage="Drag commitments here when you start working on them"
        iconColor="text-blue-600"
        headerBgColor="bg-blue-50"
      />

      <KanbanColumn
        title="Done"
        icon={<CheckCircle2 className="h-4 w-4" />}
        commitments={doneCommitments}
        columnStatus="completed"
        targets={targets}
        outcomeMap={outcomeMap}
        onCommitmentClick={onCommitmentClick}
        onEdit={onEdit}
        onDelete={onDelete}
        onDrop={onDrop}
        emptyMessage="Completed commitments will appear here"
        iconColor="text-green-600"
        headerBgColor="bg-green-50"
      />
    </div>
  )
}
