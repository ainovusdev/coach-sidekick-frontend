'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CommitmentKanbanBoard } from '@/components/commitments/commitment-kanban-board'
import { useSprints } from '@/hooks/queries/use-sprints'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { CommitmentService } from '@/services/commitment-service'
import {
  Target,
  Plus,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { format, differenceInDays, isAfter, isBefore } from 'date-fns'
import { toast } from 'sonner'

interface SprintKanbanSectionProps {
  clientId: string
  onCreateSprint: () => void
  onEndSprint?: (sprint: any) => void
  onCommitmentClick?: (commitment: any) => void
}

interface SprintAccordionItemProps {
  sprint: any
  commitments: any[]
  isExpanded: boolean
  onToggle: () => void
  onEndSprint?: (sprint: any) => void
  onCommitmentClick?: (commitment: any) => void
  onCommitmentUpdate: () => void
  clientId: string
}

function SprintAccordionItem({
  sprint,
  commitments,
  isExpanded,
  onToggle,
  onEndSprint,
  onCommitmentClick,
  onCommitmentUpdate,
  clientId,
}: SprintAccordionItemProps) {
  const queryClient = useQueryClient()

  // Calculate sprint stats
  const totalCommitments = commitments.length
  const completedCommitments = commitments.filter(
    (c: any) => c.status === 'completed',
  ).length
  const inProgressCommitments = commitments.filter(
    (c: any) => c.status === 'in_progress',
  ).length
  const progressPercentage =
    totalCommitments > 0
      ? Math.round((completedCommitments / totalCommitments) * 100)
      : 0

  // Date calculations
  const startDate = new Date(sprint.start_date)
  const endDate = new Date(sprint.end_date)
  const today = new Date()
  const daysRemaining = differenceInDays(endDate, today)
  const isUpcoming = isBefore(today, startDate)
  const isEnded = isAfter(today, endDate)

  // Status indicator
  const getStatusBadge = () => {
    if (isUpcoming) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          Upcoming
        </Badge>
      )
    }
    if (isEnded) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
          Ended
        </Badge>
      )
    }
    return (
      <Badge variant="default" className="bg-green-100 text-green-700">
        Active
      </Badge>
    )
  }

  return (
    <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Sprint Header - Always Visible */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <button
            onClick={onToggle}
            className="flex-1 flex items-start gap-3 text-left hover:opacity-70 transition-opacity"
          >
            <div className="flex-shrink-0 mt-1">
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-600" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Title and Status */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  {sprint.title || `Sprint ${sprint.sprint_number}`}
                </CardTitle>
                {getStatusBadge()}
                {/* Goal Badge */}
                {sprint.goal && (
                  <Badge
                    variant="outline"
                    className="bg-gray-50 border-gray-200 text-gray-700 text-xs"
                  >
                    <Target className="h-3 w-3 mr-1" />
                    {sprint.goal.title}
                  </Badge>
                )}
              </div>

              {/* Date Range */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {format(startDate, 'MMM d')} -{' '}
                  {format(endDate, 'MMM d, yyyy')}
                </span>
                {!isUpcoming && !isEnded && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {daysRemaining > 0
                        ? `${daysRemaining}d left`
                        : daysRemaining === 0
                          ? 'Last day'
                          : 'Ended'}
                    </span>
                  </>
                )}
              </div>

              {/* Quick Stats (Collapsed View) */}
              {!isExpanded && (
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    <span>
                      {completedCommitments}/{totalCommitments} Done
                    </span>
                  </div>
                  {inProgressCommitments > 0 && (
                    <>
                      <span>•</span>
                      <span>{inProgressCommitments} In Progress</span>
                    </>
                  )}
                  <span>•</span>
                  <span className="font-medium">{progressPercentage}%</span>
                </div>
              )}
            </div>
          </button>

          {/* Actions */}
          <div className="flex-shrink-0">
            {onEndSprint && !isEnded && (
              <Button
                variant="outline"
                size="sm"
                onClick={e => {
                  e.stopPropagation()
                  onEndSprint(sprint)
                }}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                End Sprint
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Expanded Content */}
      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Commitment Progress</span>
              <span className="font-semibold">
                {completedCommitments}/{totalCommitments} ({progressPercentage}
                %)
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Description */}
          {sprint.description && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              {sprint.description}
            </p>
          )}

          {/* Kanban Board */}
          <CommitmentKanbanBoard
            commitments={commitments}
            onDrop={async (commitmentId, newStatus) => {
              const statusLabels: Record<string, string> = {
                active: 'To Do',
                in_progress: 'In Progress',
                completed: 'Done',
              }
              const queryKey = queryKeys.commitments.list({
                client_id: clientId,
              })
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
                  status: newStatus as any,
                })
                onCommitmentUpdate()
              } catch (error) {
                console.error('Error updating commitment:', error)
                queryClient.setQueryData(queryKey, previousData)
                toast.error('Failed to update commitment - changes reverted')
              }
            }}
            onCommitmentClick={onCommitmentClick}
          />
        </CardContent>
      )}
    </Card>
  )
}

export function SprintKanbanSection({
  clientId,
  onCreateSprint,
  onEndSprint,
  onCommitmentClick,
}: SprintKanbanSectionProps) {
  const queryClient = useQueryClient()
  const [expandedSprintIds, setExpandedSprintIds] = useState<Set<string>>(
    new Set(),
  )

  const { data: activeSprints, isLoading: sprintsLoading } = useSprints({
    client_id: clientId,
    status: 'active',
  })

  // Fetch ALL commitments for the client
  const { data: commitmentsData, isLoading: commitmentsLoading } =
    useCommitments({
      client_id: clientId,
    })

  const handleCommitmentUpdate = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.commitments.all,
    })
  }

  const toggleSprint = (sprintId: string) => {
    setExpandedSprintIds(prev => {
      const next = new Set(prev)
      if (next.has(sprintId)) {
        next.delete(sprintId)
      } else {
        next.add(sprintId)
      }
      return next
    })
  }

  const isLoading = sprintsLoading || commitmentsLoading
  const sprintsArray = activeSprints || []

  // Auto-expand first sprint if none are expanded
  if (sprintsArray.length > 0 && expandedSprintIds.size === 0 && !isLoading) {
    setExpandedSprintIds(new Set([sprintsArray[0].id]))
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // No active sprints
  if (sprintsArray.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Active Sprints
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Create a sprint to organize commitments and track progress over a
              6-8 week period. You can run multiple sprints concurrently.
            </p>
            <Button onClick={onCreateSprint} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Sprint
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get commitments for each sprint
  const getSprintCommitments = (_sprintId: string) => {
    if (!commitmentsData?.commitments) return []
    // For now, show all commitments in each sprint
    // Later we can filter by sprint_id when commitments are linked
    return commitmentsData.commitments
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Active Sprints ({sprintsArray.length})
          </h3>
          <p className="text-sm text-gray-600">
            Organize commitments into time-boxed sprints
          </p>
        </div>
        <Button onClick={onCreateSprint} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Sprint
        </Button>
      </div>

      {/* Sprint Accordion */}
      <div className="space-y-3">
        {sprintsArray.map((sprint: any) => (
          <SprintAccordionItem
            key={sprint.id}
            sprint={sprint}
            commitments={getSprintCommitments(sprint.id)}
            isExpanded={expandedSprintIds.has(sprint.id)}
            onToggle={() => toggleSprint(sprint.id)}
            onEndSprint={onEndSprint}
            onCommitmentClick={onCommitmentClick}
            onCommitmentUpdate={handleCommitmentUpdate}
            clientId={clientId}
          />
        ))}
      </div>
    </div>
  )
}
