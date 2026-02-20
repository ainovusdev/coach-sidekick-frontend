'use client'

import { useQueryClient } from '@tanstack/react-query'
import { CommitmentKanbanBoard } from '@/components/commitments/commitment-kanban-board'
import { CommitmentService } from '@/services/commitment-service'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'
import type { CommitmentStatus } from '@/types/commitment'

interface SprintKanbanBoardProps {
  commitments: any[]
  clientId: string
  targets?: any[]
  onCommitmentClick?: (commitment: any) => void
  onCommitmentUpdate?: () => void
}

/**
 * Coach-specific wrapper around CommitmentKanbanBoard that handles
 * drag-and-drop status updates via CommitmentService + TanStack Query cache.
 */
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
      active: 'To Do',
      in_progress: 'In Progress',
      completed: 'Done',
    }

    const queryKey = queryKeys.commitments.list({ client_id: clientId })
    const previousData = queryClient.getQueryData(queryKey)

    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old?.commitments) return old
      return {
        ...old,
        commitments: old.commitments.map((c: any) =>
          c.id === commitmentId ? { ...c, status: newStatus } : c,
        ),
      }
    })

    toast.success(`Moved to ${statusLabels[newStatus]}`)

    try {
      await CommitmentService.updateCommitment(commitmentId, {
        status: newStatus as CommitmentStatus,
      })
      onCommitmentUpdate?.()
    } catch (error) {
      console.error('Error updating commitment:', error)
      queryClient.setQueryData(queryKey, previousData)
      toast.error('Failed to update commitment - changes reverted')
    }
  }

  return (
    <CommitmentKanbanBoard
      commitments={commitments}
      targets={targets}
      onDrop={handleDrop}
      onCommitmentClick={onCommitmentClick}
    />
  )
}
