'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SprintKanbanBoard } from '@/components/sprints/sprint-kanban-board'
import { useSprints } from '@/hooks/queries/use-sprints'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { Target, Plus, Calendar } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

interface SprintKanbanSectionProps {
  clientId: string
  onCreateSprint: () => void
  onEndSprint?: (sprint: any) => void
  onCommitmentClick?: (commitment: any) => void
}

export function SprintKanbanSection({
  clientId,
  onCreateSprint,
  onEndSprint,
  onCommitmentClick,
}: SprintKanbanSectionProps) {
  const queryClient = useQueryClient()

  const { data: activeSprints, isLoading: sprintsLoading } = useSprints({
    client_id: clientId,
    status: 'active',
  })

  const sprintsArray = activeSprints || []
  const currentSprint = sprintsArray[0] // Show the first active sprint
  const hasMultipleActiveSprints = sprintsArray.length > 1

  // Fetch ALL commitments for the client (don't filter by status in query)
  // This ensures we show all commitments regardless of their status
  const { data: commitmentsData, isLoading: commitmentsLoading } =
    useCommitments({
      client_id: clientId,
    })

  const handleCommitmentUpdate = () => {
    // Invalidate commitment queries to refresh the data
    queryClient.invalidateQueries({
      queryKey: queryKeys.commitments.all,
    })
  }

  const isLoading = sprintsLoading || commitmentsLoading

  // Auto-assign all incomplete commitments to current sprint
  // Show all commitments (not just those explicitly linked to sprint)
  const sprintCommitments = currentSprint
    ? commitmentsData?.commitments || []
    : []

  // Debug logging
  console.log('Sprint Kanban Debug:', {
    clientId,
    sprintsArray,
    sprintsArrayLength: sprintsArray.length,
    currentSprint,
    currentSprintId: currentSprint?.id,
    commitmentsData,
    commitmentsDataCommitments: commitmentsData?.commitments,
    commitmentStatuses: commitmentsData?.commitments?.map((c: any) => c.status),
    sprintCommitments,
    sprintCommitmentsCount: sprintCommitments.length,
    isLoading,
    sprintsLoading,
    commitmentsLoading,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // No active sprint
  if (!currentSprint) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-12 text-center">
          <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-900 font-medium mb-2">No Active Sprint</h3>
          <p className="text-gray-500 text-sm mb-4">
            Create a sprint to organize commitments and track progress over a
            defined period.
          </p>
          <Button onClick={onCreateSprint}>
            <Plus className="h-4 w-4 mr-2" />
            Create Sprint
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Calculate sprint progress based on commitment completion
  const totalCommitments = sprintCommitments.length
  const completedCommitments = sprintCommitments.filter(
    (c: any) => c.status === 'completed',
  ).length
  const progressPercentage =
    totalCommitments > 0
      ? Math.round((completedCommitments / totalCommitments) * 100)
      : 0

  // Calculate time-based info
  const startDate = new Date(currentSprint.start_date)
  const endDate = new Date(currentSprint.end_date)
  const today = new Date()
  const totalDays = differenceInDays(endDate, startDate)
  const daysRemaining = differenceInDays(endDate, today)

  return (
    <div className="space-y-4">
      {/* Warning: Multiple Active Sprints */}
      {hasMultipleActiveSprints && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-red-100 rounded">
              <svg
                className="h-5 w-5 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-900 mb-1">
                Multiple Active Sprints Detected
              </h4>
              <p className="text-sm text-red-800">
                You have {sprintsArray.length} active sprints. Only one sprint
                should be active at a time. Please end the extra sprints to
                maintain clarity.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sprint Header */}
      <Card className="border-gray-200">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  {currentSprint.title ||
                    `Sprint ${currentSprint.sprint_number}`}
                </CardTitle>
                <Badge variant="default">Active</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(startDate, 'MMM d')} -{' '}
                    {format(endDate, 'MMM d, yyyy')}
                  </span>
                </div>
                <span>•</span>
                <span>
                  {daysRemaining > 0
                    ? `${daysRemaining} days remaining`
                    : daysRemaining === 0
                      ? 'Last day'
                      : 'Sprint ended'}
                </span>
                <span>•</span>
                <span className="font-medium">
                  Week{' '}
                  {currentSprint.duration_weeks || Math.ceil(totalDays / 7)}
                </span>
              </div>

              {/* Sprint Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Completion Progress</span>
                  <span className="font-semibold">
                    {completedCommitments}/{totalCommitments} (
                    {progressPercentage}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {currentSprint.description && (
                <p className="text-sm text-gray-600 mt-3">
                  {currentSprint.description}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              {onEndSprint && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEndSprint(currentSprint)}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  End Sprint
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Kanban Board */}
      <SprintKanbanBoard
        commitments={sprintCommitments}
        clientId={clientId}
        onCommitmentClick={onCommitmentClick}
        onCommitmentUpdate={handleCommitmentUpdate}
      />
    </div>
  )
}
