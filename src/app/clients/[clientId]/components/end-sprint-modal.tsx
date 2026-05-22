'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { SprintService } from '@/services/sprint-service'
import { toast } from 'sonner'
import { formatDate } from '@/lib/date-utils'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { queryKeys } from '@/lib/query-client'

interface EndSprintModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sprint: any
  unfinishedCommitments?: any[]
  onSuccess?: () => void
}

export function EndSprintModal({
  open,
  onOpenChange,
  sprint,
  unfinishedCommitments = [],
  onSuccess,
}: EndSprintModalProps) {
  const queryClient = useQueryClient()
  const [isEnding, setIsEnding] = useState(false)

  const handleEndSprint = async () => {
    setIsEnding(true)
    try {
      // Update sprint status to completed
      await SprintService.updateSprint(sprint.id, {
        status: 'completed',
      })

      // Invalidate sprint queries to refresh data
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sprints.all,
      })

      toast.success('Sprint Ended', {
        description: 'The sprint has been marked as completed',
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error ending sprint:', error)
      toast.error('Failed to end sprint')
    } finally {
      setIsEnding(false)
    }
  }

  if (!sprint) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-token-bg rounded-full">
              <AlertTriangle className="h-5 w-5 text-amber-token" />
            </div>
            <AlertDialogTitle>End Sprint</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4">
            <p>
              Are you sure you want to end{' '}
              <strong>
                {sprint.title || `Sprint ${sprint.sprint_number}`}
              </strong>
              ?
            </p>

            <div className="bg-paper rounded-lg p-3 text-sm text-ink-2">
              <p>
                <strong>Sprint Period:</strong>{' '}
                {formatDate(sprint.start_date, 'MMM d, yyyy')} -{' '}
                {formatDate(sprint.end_date, 'MMM d, yyyy')}
              </p>
              <p className="mt-1">
                <strong>Duration:</strong> {sprint.duration_weeks} weeks
              </p>
            </div>

            {unfinishedCommitments.length > 0 && (
              <div className="bg-amber-token-bg border border-amber-token rounded-lg p-3">
                <p className="text-sm font-semibold text-amber-token mb-2">
                  Unfinished Commitments ({unfinishedCommitments.length})
                </p>
                <p className="text-sm text-amber-token mb-2">
                  The following commitments are not yet completed:
                </p>
                <ul className="text-sm text-amber-token space-y-1 ml-4">
                  {unfinishedCommitments.slice(0, 5).map((commitment: any) => (
                    <li key={commitment.id} className="list-disc">
                      {commitment.title}
                    </li>
                  ))}
                  {unfinishedCommitments.length > 5 && (
                    <li className="list-none text-amber-token font-medium">
                      +{unfinishedCommitments.length - 5} more...
                    </li>
                  )}
                </ul>
                <p className="text-xs text-amber-token mt-2">
                  These commitments will be unlinked from this sprint and can be
                  added to future sprints.
                </p>
              </div>
            )}

            <p className="text-sm text-ink-3">
              This action will mark the sprint as completed. You can create a
              new sprint after ending this one.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isEnding}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEndSprint}
            disabled={isEnding}
            className="bg-amber-token hover:bg-amber-token text-ink-on-dark"
          >
            {isEnding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ending Sprint...
              </>
            ) : (
              'End Sprint'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
