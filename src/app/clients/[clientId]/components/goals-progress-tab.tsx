'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SprintKanbanBoard } from '@/components/sprints/sprint-kanban-board'
import { useGoals } from '@/hooks/queries/use-goals'
import { useTargets } from '@/hooks/queries/use-targets'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import {
  Target,
  Plus,
  Calendar,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Edit,
  Archive,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface GoalsProgressTabProps {
  clientId: string
  onCreateGoal: () => void
  onCreateOutcome: () => void
  onEditGoal?: (goal: any) => void
  onArchiveGoal?: (goal: any) => void
  onCommitmentClick?: (commitment: any) => void
}

interface OutcomeCardProps {
  outcome: any
}

function OutcomeCard({ outcome }: OutcomeCardProps) {
  // Get sprint info if available
  const sprintInfo = outcome.sprint

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h5 className="text-sm font-semibold text-gray-900 mb-1">
            {outcome.title}
          </h5>
          {outcome.description && (
            <p className="text-xs text-gray-600 line-clamp-2">
              {outcome.description}
            </p>
          )}
          {/* Sprint Info */}
          {sprintInfo && (
            <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
              <Calendar className="h-3 w-3" />
              <span className="font-medium">{sprintInfo.title}</span>
              <span>•</span>
              <span>{sprintInfo.status}</span>
              {sprintInfo.end_date && (
                <>
                  <span>•</span>
                  <span>
                    {differenceInDays(
                      new Date(sprintInfo.end_date),
                      new Date(),
                    )}
                    d left
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        <Badge
          variant="outline"
          className={cn(
            'text-xs flex-shrink-0',
            outcome.status === 'completed'
              ? 'bg-green-100 text-green-700 border-green-200'
              : outcome.status === 'active'
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-gray-100 text-gray-700 border-gray-200',
          )}
        >
          {outcome.status}
        </Badge>
      </div>
    </div>
  )
}

interface GoalAccordionItemProps {
  goal: any
  outcomes: any[]
  commitments: any[]
  isExpanded: boolean
  onToggle: () => void
  onEditGoal?: (goal: any) => void
  onArchiveGoal?: (goal: any) => void
  onCreateOutcome?: () => void
  onCommitmentClick?: (commitment: any) => void
  clientId: string
}

function GoalAccordionItem({
  goal,
  outcomes,
  commitments,
  isExpanded,
  onToggle,
  onEditGoal,
  onArchiveGoal,
  onCreateOutcome,
  onCommitmentClick,
  clientId,
}: GoalAccordionItemProps) {
  const queryClient = useQueryClient()

  // Get all commitments for this goal
  // Includes: 1) Commitments linked via outcomes (correct way)
  //           2) Commitments with direct goal_id (legacy/fallback)
  const goalCommitments = useMemo(() => {
    const targetIds = outcomes.map((o: any) => o.id)

    // Debug logging
    console.log('Goal Commitments Debug:', {
      goalId: goal.id,
      goalTitle: goal.title,
      outcomesCount: outcomes.length,
      targetIds,
      totalCommitments: commitments.length,
      allCommitments: commitments.map((c: any) => ({
        id: c.id,
        title: c.title,
        goal_id: c.goal_id,
        sprint_id: c.sprint_id,
        target_links: c.target_links,
      })),
      commitmentsWithTargetLinks: commitments.filter(
        (c: any) => c.target_links?.length > 0,
      ).length,
      commitmentsWithGoalId: commitments.filter(
        (c: any) => c.goal_id === goal.id,
      ).length,
      filteredCommitments: commitments
        .filter((c: any) => {
          const linkedViaOutcome = c.target_links?.some((link: any) =>
            targetIds.includes(link.target_id),
          )
          const linkedDirectly = c.goal_id === goal.id
          return linkedViaOutcome || linkedDirectly
        })
        .map((c: any) => c.title),
    })

    return commitments.filter((c: any) => {
      // Method 1: Linked via outcomes (correct hierarchy)
      const linkedViaOutcome = c.target_links?.some((link: any) =>
        targetIds.includes(link.target_id),
      )

      // Method 2: Direct goal_id link (fallback for existing data)
      const linkedDirectly = c.goal_id === goal.id

      // Method 3: TEMPORARY - Show unlinked commitments if this is the only/first goal
      // This helps during transition period
      const isUnlinked =
        !c.goal_id && (!c.target_links || c.target_links.length === 0)

      return linkedViaOutcome || linkedDirectly || isUnlinked
    })
  }, [commitments, outcomes, goal.id, goal.title])

  const getStatusColor = () => {
    switch (goal.status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'achieved':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const handleCommitmentUpdate = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.commitments.all,
    })
    queryClient.invalidateQueries({
      queryKey: queryKeys.targets.all,
    })
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      {/* Goal Header - Always Visible */}
      <CardHeader className="pb-4">
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

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-gray-600" />
                <CardTitle className="text-base font-semibold">
                  {goal.title}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={cn('text-xs', getStatusColor())}
                >
                  {goal.status}
                </Badge>
                {goal.target_date && (
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(goal.target_date), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </div>
          </button>

          {/* Actions Menu */}
          <div className="flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditGoal?.(goal)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Goal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onArchiveGoal?.(goal)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Goal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {/* Expanded Content */}
      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Description */}
          {goal.description && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">{goal.description}</p>
            </div>
          )}

          {/* Outcomes Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="h-4 w-4 text-gray-600" />
                Outcomes & Sprints ({outcomes.length})
              </h4>
              {onCreateOutcome && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCreateOutcome}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Outcome
                </Button>
              )}
            </div>

            {outcomes.length > 0 ? (
              <div className="space-y-2">
                {outcomes.map((outcome: any) => (
                  <OutcomeCard key={outcome.id} outcome={outcome} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-sm text-gray-600 mb-2">
                  No outcomes yet for this goal
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCreateOutcome}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Create First Outcome
                </Button>
              </div>
            )}
          </div>

          {/* Commitments Kanban for this Goal */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              All Commitments for This Goal ({goalCommitments.length})
            </h4>

            {goalCommitments.length > 0 ? (
              <SprintKanbanBoard
                commitments={goalCommitments}
                clientId={clientId}
                onCommitmentClick={onCommitmentClick}
                onCommitmentUpdate={handleCommitmentUpdate}
              />
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <CheckCircle2 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  No commitments linked to this goal yet
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Create commitments and link them to this goal&apos;s outcomes
                </p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export function GoalsProgressTab({
  clientId,
  onCreateGoal,
  onCreateOutcome,
  onEditGoal,
  onArchiveGoal,
  onCommitmentClick,
}: GoalsProgressTabProps) {
  const [expandedGoalIds, setExpandedGoalIds] = useState<Set<string>>(new Set())

  // Fetch all data
  const { data: goals = [], isLoading: goalsLoading } = useGoals(clientId)
  const { data: allTargets = [], isLoading: targetsLoading } = useTargets()
  const { data: commitmentsData, isLoading: commitmentsLoading } =
    useCommitments({
      client_id: clientId,
    })

  const allCommitments = commitmentsData?.commitments || []
  const isLoading = goalsLoading || targetsLoading || commitmentsLoading

  // Filter targets by client (through goals)
  const clientTargets = useMemo(() => {
    const goalIds = goals.map((g: any) => g.id)
    return allTargets.filter((t: any) => goalIds.includes(t.goal_id))
  }, [allTargets, goals])

  // Calculate overall stats
  const activeGoals = goals.filter((g: any) => g.status === 'active')
  const totalOutcomes = clientTargets.length
  const totalCommitments = allCommitments.length
  const completedCommitments = allCommitments.filter(
    (c: any) => c.status === 'completed',
  ).length
  const overallProgress =
    totalCommitments > 0
      ? Math.round((completedCommitments / totalCommitments) * 100)
      : 0

  const toggleGoal = (goalId: string) => {
    setExpandedGoalIds(prev => {
      const next = new Set(prev)
      if (next.has(goalId)) {
        next.delete(goalId)
      } else {
        next.add(goalId)
      }
      return next
    })
  }

  // Auto-expand first goal if none expanded
  if (goals.length > 0 && expandedGoalIds.size === 0 && !isLoading) {
    setExpandedGoalIds(new Set([goals[0].id]))
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // Empty state - no goals
  if (goals.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Goals Yet
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Create your first long-term goal, then add outcomes (short-term
              wins) and sprints to organize your work.
            </p>
            <Button onClick={onCreateGoal} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Goals & Progress
          </h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Target className="h-3.5 w-3.5" />
              {activeGoals.length} Active Goals
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" />
              {totalOutcomes} Outcomes
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {totalCommitments} Commitments
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-semibold text-green-600">
              <TrendingUp className="h-3.5 w-3.5" />
              {overallProgress}% Complete
            </span>
          </div>
        </div>

        {/* New Goal Button */}
        <Button variant="outline" size="sm" onClick={onCreateGoal}>
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Goal Accordion */}
      <div className="space-y-3">
        {goals.map((goal: any) => {
          const goalOutcomes = clientTargets.filter(
            (t: any) => t.goal_id === goal.id,
          )
          return (
            <GoalAccordionItem
              key={goal.id}
              goal={goal}
              outcomes={goalOutcomes}
              commitments={allCommitments}
              isExpanded={expandedGoalIds.has(goal.id)}
              onToggle={() => toggleGoal(goal.id)}
              onEditGoal={onEditGoal}
              onArchiveGoal={onArchiveGoal}
              onCreateOutcome={onCreateOutcome}
              onCommitmentClick={onCommitmentClick}
              clientId={clientId}
            />
          )
        })}
      </div>
    </div>
  )
}
