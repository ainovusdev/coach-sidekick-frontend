'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SprintKanbanBoard } from '@/components/sprints/sprint-kanban-board'
import { useGoals } from '@/hooks/queries/use-goals'
import { useTargets } from '@/hooks/queries/use-targets'
import { useSprints } from '@/hooks/queries/use-sprints'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import {
  Target,
  Plus,
  ChevronRight,
  ChevronDown,
  Zap,
  Calendar,
  Edit2,
  Trash2,
  MoreVertical,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface GoalsTreeViewProps {
  clientId: string
  onCreateNew: () => void
  onCreateGoal?: () => void
  onCreateSprint?: () => void
  onCreateOutcome?: () => void
  onCreateCommitment?: () => void
  onCommitmentClick?: (commitment: any) => void
  onEditGoal?: (goal: any) => void
  onDeleteGoal?: (goal: any) => void
  onEditOutcome?: (outcome: any) => void
  onDeleteOutcome?: (outcome: any) => void
  onCompleteOutcome?: (outcome: any) => void
  onEditSprint?: (sprint: any) => void
  onDeleteSprint?: (sprint: any) => void
  onCompleteSprint?: (sprint: any) => void
}

interface TreeNodeProps {
  type: 'goal' | 'outcome' | 'sprint'
  data: any
  level: number
  isSelected: boolean
  isExpanded: boolean
  onToggle?: () => void
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onComplete?: () => void
  children?: React.ReactNode
}

function TreeNode({
  type,
  data,
  level,
  isSelected,
  isExpanded,
  onToggle,
  onClick,
  onEdit,
  onDelete,
  onComplete,
  children,
}: TreeNodeProps) {
  const hasChildren = !!children
  const indent = level * 16

  const getIcon = () => {
    switch (type) {
      case 'goal':
        return <Target className="h-4 w-4 text-gray-600" />
      case 'outcome':
        return <Zap className="h-4 w-4 text-blue-600" />
      case 'sprint':
        return <Calendar className="h-4 w-4 text-green-600" />
    }
  }

  const getStatusColor = () => {
    if (!data.status) return ''
    switch (data.status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors',
          isSelected && 'bg-primary/10 border border-primary/20',
        )}
        style={{ paddingLeft: `${indent + 12}px` }}
        onClick={onClick}
      >
        {/* Expand/Collapse Chevron */}
        {hasChildren && (
          <button
            onClick={e => {
              e.stopPropagation()
              onToggle?.()
            }}
            className="flex-shrink-0 p-0.5 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            )}
          </button>
        )}

        {!hasChildren && <div className="w-5" />}

        {/* Icon */}
        <div className="flex-shrink-0">{getIcon()}</div>

        {/* Title */}
        <span className="flex-1 text-sm font-medium text-gray-900 truncate">
          {data.title}
        </span>

        {/* Status Indicator (Green dot for active) */}
        {data.status === 'active' && (
          <div className="w-2 h-2 rounded-full bg-green-500" title="Active" />
        )}
        {data.status && data.status !== 'active' && (
          <Badge variant="outline" className={cn('text-xs', getStatusColor())}>
            {data.status}
          </Badge>
        )}

        {/* Actions Menu */}
        {(onEdit || onDelete || onComplete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <button className="flex-shrink-0 p-1 hover:bg-gray-200 rounded">
                <MoreVertical className="h-4 w-4 text-gray-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onComplete && data.status !== 'completed' && (
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation()
                    onComplete()
                  }}
                  className="text-green-600 focus:text-green-600"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation()
                    onEdit()
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit{' '}
                  {type === 'goal'
                    ? 'Vision'
                    : type === 'outcome'
                      ? 'Outcome'
                      : 'Sprint'}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete{' '}
                  {type === 'goal'
                    ? 'Vision'
                    : type === 'outcome'
                      ? 'Outcome'
                      : 'Sprint'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && <div>{children}</div>}
    </div>
  )
}

export function GoalsTreeView({
  clientId,
  onCreateNew,
  onCreateGoal,
  onCreateSprint,
  onCreateOutcome,
  onCreateCommitment,
  onCommitmentClick,
  onEditGoal,
  onDeleteGoal,
  onEditOutcome,
  onDeleteOutcome,
  onCompleteOutcome,
  onEditSprint,
  onDeleteSprint,
  onCompleteSprint,
}: GoalsTreeViewProps) {
  const queryClient = useQueryClient()
  const [expandedGoalIds, setExpandedGoalIds] = useState<Set<string>>(new Set())
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedNodeType, setSelectedNodeType] = useState<
    'goal' | 'outcome' | 'sprint' | null
  >(null)

  // Fetch all data
  const { data: goals = [], isLoading: goalsLoading } = useGoals(clientId)
  const { data: allTargets = [], isLoading: targetsLoading } = useTargets()
  const { data: allSprints = [], isLoading: sprintsLoading } = useSprints({
    client_id: clientId,
  })
  const { data: commitmentsData, isLoading: commitmentsLoading } =
    useCommitments({
      client_id: clientId,
    })

  const allCommitments = commitmentsData?.commitments || []
  const isLoading =
    goalsLoading || targetsLoading || sprintsLoading || commitmentsLoading

  // Filter targets by client (through goals)
  const clientTargets = useMemo(() => {
    const goalIds = goals.map((g: any) => g.id)
    return allTargets.filter((t: any) =>
      // Check if any of the target's goals match client goals
      t.goal_ids?.some((gid: string) => goalIds.includes(gid)),
    )
  }, [allTargets, goals])

  // Filter commitments based on selected node
  const filteredCommitments = useMemo(() => {
    if (!selectedNodeId || !selectedNodeType) {
      return allCommitments // Show all if nothing selected
    }

    if (selectedNodeType === 'goal') {
      // Show commitments for this goal (via outcomes ONLY)
      // Get all outcomes that are linked to this goal (check goal_ids array)
      const goalTargetIds = clientTargets
        .filter((t: any) => t.goal_ids?.includes(selectedNodeId))
        .map((t: any) => t.id)

      return allCommitments.filter((c: any) => {
        const linkedViaOutcome = c.target_links?.some((link: any) =>
          goalTargetIds.includes(link.target_id),
        )
        const isUnlinked = !c.target_links || c.target_links.length === 0
        return linkedViaOutcome || isUnlinked
      })
    }

    if (selectedNodeType === 'outcome') {
      // Show commitments for this outcome
      return allCommitments.filter((c: any) =>
        c.target_links?.some((link: any) => link.target_id === selectedNodeId),
      )
    }

    if (selectedNodeType === 'sprint') {
      // Show commitments for this sprint (via outcomes ONLY)
      // Get all outcomes that are linked to this sprint (check sprint_ids array)
      const sprintTargetIds = clientTargets
        .filter((t: any) => t.sprint_ids?.includes(selectedNodeId))
        .map((t: any) => t.id)

      return allCommitments.filter((c: any) => {
        const linkedViaOutcome = c.target_links?.some((link: any) =>
          sprintTargetIds.includes(link.target_id),
        )
        return linkedViaOutcome
      })
    }

    return allCommitments
  }, [allCommitments, selectedNodeId, selectedNodeType, clientTargets])

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

  const handleNodeClick = (id: string, type: 'goal' | 'outcome' | 'sprint') => {
    setSelectedNodeId(id)
    setSelectedNodeType(type)
  }

  const handleCommitmentUpdate = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.commitments.all,
    })
    queryClient.invalidateQueries({
      queryKey: queryKeys.targets.all,
    })
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-96" />
        <Skeleton className="h-96 lg:col-span-2" />
      </div>
    )
  }

  // Empty state
  if (goals.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Vision Yet
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Create your first vision to get started with the tree view.
            </p>
            <Button onClick={onCreateNew} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Vision
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getFilterDescription = () => {
    if (!selectedNodeId) return 'All commitments'
    if (selectedNodeType === 'goal') {
      const goal = goals.find((g: any) => g.id === selectedNodeId)
      return `Commitments for vision: ${goal?.title}`
    }
    if (selectedNodeType === 'outcome') {
      const outcome = clientTargets.find((t: any) => t.id === selectedNodeId)
      return `Commitments for: ${outcome?.title}`
    }
    if (selectedNodeType === 'sprint') {
      const sprint = allSprints.find((s: any) => s.id === selectedNodeId)
      return `Commitments for: ${sprint?.title}`
    }
    return 'All commitments'
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Vision & Progress (Tree View)
        </h3>
        <Button variant="outline" size="sm" onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          New
        </Button>
      </div>

      {/* Split Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Panel: Goals & Sprints */}
        <Card className="border-gray-200">
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="p-3 space-y-6">
                {/* Vision Section */}
                <div className="pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-3 px-2">
                    <span>VISION</span>
                    {onCreateGoal && (
                      <button
                        onClick={onCreateGoal}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Add new vision"
                      >
                        <Plus className="h-3.5 w-3.5 text-gray-600 cursor-pointer" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {goals.map((goal: any) => {
                      const goalOutcomes = clientTargets.filter((t: any) =>
                        t.goal_ids?.includes(goal.id),
                      )

                      return (
                        <TreeNode
                          key={goal.id}
                          type="goal"
                          data={goal}
                          level={0}
                          isSelected={
                            selectedNodeId === goal.id &&
                            selectedNodeType === 'goal'
                          }
                          isExpanded={expandedGoalIds.has(goal.id)}
                          onToggle={() => toggleGoal(goal.id)}
                          onClick={() => handleNodeClick(goal.id, 'goal')}
                          onEdit={() => onEditGoal?.(goal)}
                          onDelete={() => onDeleteGoal?.(goal)}
                        >
                          {goalOutcomes.map((outcome: any) => (
                            <TreeNode
                              key={outcome.id}
                              type="outcome"
                              data={outcome}
                              level={1}
                              isSelected={
                                selectedNodeId === outcome.id &&
                                selectedNodeType === 'outcome'
                              }
                              isExpanded={false}
                              onClick={() =>
                                handleNodeClick(outcome.id, 'outcome')
                              }
                              onEdit={() => onEditOutcome?.(outcome)}
                              onDelete={() => onDeleteOutcome?.(outcome)}
                              onComplete={() => onCompleteOutcome?.(outcome)}
                            />
                          ))}
                        </TreeNode>
                      )
                    })}
                  </div>
                </div>

                {/* Outcomes Section - with Sprint Badges */}
                <div className="pb-4 border-b">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-3 px-2">
                    <span>OUTCOMES</span>
                    {onCreateOutcome && (
                      <button
                        onClick={onCreateOutcome}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Add new outcome"
                      >
                        <Plus className="h-3.5 w-3.5 text-gray-600 cursor-pointer" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {clientTargets.map((outcome: any) => {
                      // Get sprints linked to this outcome
                      const linkedSprints = allSprints.filter((s: any) =>
                        outcome.sprint_ids?.includes(s.id),
                      )

                      return (
                        <div key={outcome.id}>
                          <TreeNode
                            type="outcome"
                            data={outcome}
                            level={0}
                            isSelected={
                              selectedNodeId === outcome.id &&
                              selectedNodeType === 'outcome'
                            }
                            isExpanded={false}
                            onClick={() =>
                              handleNodeClick(outcome.id, 'outcome')
                            }
                            onEdit={() => onEditOutcome?.(outcome)}
                            onDelete={() => onDeleteOutcome?.(outcome)}
                            onComplete={() => onCompleteOutcome?.(outcome)}
                          />
                          {/* Sprint badges below the outcome */}
                          {linkedSprints.length > 0 && (
                            <div className="flex flex-wrap gap-1 pl-9 pb-1">
                              {linkedSprints.map((sprint: any) => (
                                <Badge
                                  key={sprint.id}
                                  variant={
                                    sprint.status === 'active'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                  className={cn(
                                    'text-[10px] px-1.5 py-0 cursor-pointer hover:opacity-80',
                                    sprint.status === 'active' &&
                                      'bg-blue-100 text-blue-800',
                                  )}
                                  onClick={() =>
                                    handleNodeClick(sprint.id, 'sprint')
                                  }
                                >
                                  <Calendar className="h-2.5 w-2.5 mr-0.5" />
                                  {sprint.title}
                                  {sprint.status === 'active' && (
                                    <span className="ml-0.5 w-1 h-1 rounded-full bg-green-500" />
                                  )}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Sprint Timeline - Simplified */}
                <div className="pb-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-3 px-2">
                    <span>SPRINT TIMELINE</span>
                    {onCreateSprint && (
                      <button
                        onClick={onCreateSprint}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Add new sprint"
                      >
                        <Plus className="h-3.5 w-3.5 text-gray-600 cursor-pointer" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {allSprints.map((sprint: any) => {
                      const outcomeCount = clientTargets.filter((t: any) =>
                        t.sprint_ids?.includes(sprint.id),
                      ).length

                      return (
                        <div
                          key={sprint.id}
                          className={cn(
                            'flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors',
                            selectedNodeId === sprint.id &&
                              selectedNodeType === 'sprint' &&
                              'bg-primary/10 border border-primary/20',
                          )}
                          onClick={() => handleNodeClick(sprint.id, 'sprint')}
                        >
                          <Calendar
                            className={cn(
                              'h-4 w-4',
                              sprint.status === 'active'
                                ? 'text-green-600'
                                : 'text-gray-400',
                            )}
                          />
                          <span className="flex-1 text-sm font-medium text-gray-900 truncate">
                            {sprint.title}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">
                            {outcomeCount} outcome
                            {outcomeCount !== 1 ? 's' : ''}
                          </Badge>
                          {sprint.status === 'active' && (
                            <div
                              className="w-2 h-2 rounded-full bg-green-500"
                              title="Active"
                            />
                          )}
                          {/* Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={e => e.stopPropagation()}
                            >
                              <button className="flex-shrink-0 p-1 hover:bg-gray-200 rounded">
                                <MoreVertical className="h-4 w-4 text-gray-600" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {sprint.status !== 'completed' && (
                                <DropdownMenuItem
                                  onClick={e => {
                                    e.stopPropagation()
                                    onCompleteSprint?.(sprint)
                                  }}
                                  className="text-green-600 focus:text-green-600"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Mark Complete
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={e => {
                                  e.stopPropagation()
                                  onEditSprint?.(sprint)
                                }}
                              >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit Sprint
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={e => {
                                  e.stopPropagation()
                                  onDeleteSprint?.(sprint)
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Sprint
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Panel: Commitments Kanban */}
        <div className="lg:col-span-2">
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold mb-1">
                    Commitments ({filteredCommitments.length})
                  </CardTitle>
                  <p className="text-xs text-gray-600">
                    {getFilterDescription()}
                  </p>
                </div>
                {selectedNodeId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedNodeId(null)
                      setSelectedNodeType(null)
                    }}
                    className="text-xs"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredCommitments.length > 0 ? (
                <SprintKanbanBoard
                  commitments={filteredCommitments}
                  clientId={clientId}
                  targets={clientTargets}
                  onCommitmentClick={onCommitmentClick}
                  onCommitmentUpdate={handleCommitmentUpdate}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  {onCreateCommitment && (
                    <Button onClick={onCreateCommitment} size="lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Commitment
                    </Button>
                  )}
                  {selectedNodeId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedNodeId(null)
                        setSelectedNodeType(null)
                      }}
                      className="mt-4 text-xs"
                    >
                      or show all commitments
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
