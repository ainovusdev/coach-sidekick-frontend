'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { SprintKanbanBoard } from '@/components/sprints/sprint-kanban-board'
import { CommitmentKanbanBoard } from '@/components/commitments/commitment-kanban-board'
import { ClientCommitmentService } from '@/services/client-commitment-service'
import { toast } from 'sonner'
import { useGoals } from '@/hooks/queries/use-goals'
import { useTargets } from '@/hooks/queries/use-targets'
import { useSprints } from '@/hooks/queries/use-sprints'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
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
  User,
  Briefcase,
  PanelLeftClose,
  PanelLeftOpen,
  Filter,
  RefreshCw,
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
  clientName?: string
  isClientPortal?: boolean
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
        return <Target className="h-4 w-4 text-gray-600 dark:text-gray-400" />
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
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
    }
  }

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
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
            className="flex-shrink-0 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        )}

        {!hasChildren && <div className="w-5" />}

        {/* Icon */}
        <div className="flex-shrink-0">{getIcon()}</div>

        {/* Title */}
        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate">
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
              <button className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded">
                <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
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
  clientName,
  isClientPortal,
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
  const { user } = useAuth()
  const clientFirstName = clientName?.split(' ')[0] || 'Client'
  const coachLabel = isClientPortal
    ? user?.full_name?.split(' ')[0] || 'Me'
    : 'Me'
  const [expandedGoalIds, setExpandedGoalIds] = useState<Set<string>>(new Set())
  const [expandedOutcomeIds, setExpandedOutcomeIds] = useState<Set<string>>(
    new Set(),
  )
  const [expandedSprintIds, setExpandedSprintIds] = useState<Set<string>>(
    new Set(),
  )
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedNodeType, setSelectedNodeType] = useState<
    'goal' | 'outcome' | 'sprint' | null
  >(null)
  const [assigneeFilter, setAssigneeFilter] = useState<
    'all' | 'client' | 'coach'
  >('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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

  // Filter commitments based on selected node and assignee
  const filteredCommitments = useMemo(() => {
    let filtered = allCommitments

    // First filter by selected node
    if (selectedNodeId && selectedNodeType) {
      if (selectedNodeType === 'goal') {
        // Show commitments for this goal (via outcomes ONLY)
        // Get all outcomes that are linked to this goal (check goal_ids array)
        const goalTargetIds = clientTargets
          .filter((t: any) => t.goal_ids?.includes(selectedNodeId))
          .map((t: any) => t.id)

        filtered = filtered.filter((c: any) => {
          const linkedViaOutcome = c.target_links?.some((link: any) =>
            goalTargetIds.includes(link.target_id),
          )
          const isUnlinked = !c.target_links || c.target_links.length === 0
          return linkedViaOutcome || isUnlinked
        })
      } else if (selectedNodeType === 'outcome') {
        // Show commitments for this outcome
        filtered = filtered.filter((c: any) =>
          c.target_links?.some(
            (link: any) => link.target_id === selectedNodeId,
          ),
        )
      } else if (selectedNodeType === 'sprint') {
        // Show commitments for this sprint (via outcomes ONLY)
        // Get all outcomes that are linked to this sprint (check sprint_ids array)
        const sprintTargetIds = clientTargets
          .filter((t: any) => t.sprint_ids?.includes(selectedNodeId))
          .map((t: any) => t.id)

        filtered = filtered.filter((c: any) => {
          const linkedViaOutcome = c.target_links?.some((link: any) =>
            sprintTargetIds.includes(link.target_id),
          )
          return linkedViaOutcome
        })
      }
    }

    // Then filter by assignee
    if (assigneeFilter === 'coach') {
      filtered = filtered.filter((c: any) => c.is_coach_commitment === true)
    } else if (assigneeFilter === 'client') {
      filtered = filtered.filter((c: any) => !c.is_coach_commitment)
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c: any) => c.status === statusFilter)
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((c: any) => c.priority === priorityFilter)
    }

    return filtered
  }, [
    allCommitments,
    selectedNodeId,
    selectedNodeType,
    clientTargets,
    assigneeFilter,
    statusFilter,
    priorityFilter,
  ])

  const toggleGoal = (goalId: string) => {
    setExpandedGoalIds(prev => {
      const next = new Set(prev)
      if (next.has(goalId)) next.delete(goalId)
      else next.add(goalId)
      return next
    })
  }

  const toggleOutcome = (outcomeId: string) => {
    setExpandedOutcomeIds(prev => {
      const next = new Set(prev)
      if (next.has(outcomeId)) next.delete(outcomeId)
      else next.add(outcomeId)
      return next
    })
  }

  const toggleSprint = (sprintId: string) => {
    setExpandedSprintIds(prev => {
      const next = new Set(prev)
      if (next.has(sprintId)) next.delete(sprintId)
      else next.add(sprintId)
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

  const handleClientPortalDrop = async (
    commitmentId: string,
    newStatus: string,
  ) => {
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
      await ClientCommitmentService.updateCommitment(commitmentId, {
        status: newStatus as any,
      })
      handleCommitmentUpdate()
    } catch (error) {
      console.error('Error updating commitment:', error)
      queryClient.setQueryData(queryKey, previousData)
      toast.error('Failed to update commitment - changes reverted')
    }
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
      <Card className="border-gray-200 dark:border-gray-700">
        <CardContent className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Vision Yet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Vision & Progress (Tree View)
        </h3>
        <Button variant="outline" size="sm" onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          New
        </Button>
      </div>

      {/* Split Panel Layout */}
      <div
        className={cn(
          'grid grid-cols-1 gap-4',
          sidebarCollapsed ? 'lg:grid-cols-1' : 'lg:grid-cols-3',
        )}
      >
        {/* Left Panel: Goals & Sprints */}
        <Card
          className={cn(
            'border-gray-200 dark:border-gray-700',
            sidebarCollapsed && 'hidden',
          )}
        >
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="p-3 space-y-6">
                {/* Vision Section */}
                <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 px-2">
                    <span>VISION</span>
                    {onCreateGoal && (
                      <button
                        onClick={onCreateGoal}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
                        title="Add new vision"
                      >
                        <Plus className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400 cursor-pointer" />
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

                {/* Outcomes Section - with Sprints as children */}
                <div className="pb-4 border-b">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 px-2">
                    <span>META PERFORMANCE OUTCOMES</span>
                    {onCreateOutcome && (
                      <button
                        onClick={onCreateOutcome}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
                        title="Add new meta performance outcome"
                      >
                        <Plus className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400 cursor-pointer" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {clientTargets.map((outcome: any) => {
                      const linkedSprints = allSprints.filter((s: any) =>
                        outcome.sprint_ids?.includes(s.id),
                      )
                      const hasChildren = linkedSprints.length > 0

                      return (
                        <TreeNode
                          key={outcome.id}
                          type="outcome"
                          data={outcome}
                          level={0}
                          isSelected={
                            selectedNodeId === outcome.id &&
                            selectedNodeType === 'outcome'
                          }
                          isExpanded={expandedOutcomeIds.has(outcome.id)}
                          onToggle={
                            hasChildren
                              ? () => toggleOutcome(outcome.id)
                              : undefined
                          }
                          onClick={() => handleNodeClick(outcome.id, 'outcome')}
                          onEdit={() => onEditOutcome?.(outcome)}
                          onDelete={() => onDeleteOutcome?.(outcome)}
                          onComplete={() => onCompleteOutcome?.(outcome)}
                        >
                          {hasChildren
                            ? linkedSprints.map((sprint: any) => (
                                <TreeNode
                                  key={sprint.id}
                                  type="sprint"
                                  data={sprint}
                                  level={1}
                                  isSelected={
                                    selectedNodeId === sprint.id &&
                                    selectedNodeType === 'sprint'
                                  }
                                  isExpanded={false}
                                  onClick={() =>
                                    handleNodeClick(sprint.id, 'sprint')
                                  }
                                  onEdit={() => onEditSprint?.(sprint)}
                                  onDelete={() => onDeleteSprint?.(sprint)}
                                  onComplete={() => onCompleteSprint?.(sprint)}
                                />
                              ))
                            : undefined}
                        </TreeNode>
                      )
                    })}
                  </div>
                </div>

                {/* Sprint Timeline - with Outcomes as children */}
                <div className="pb-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 px-2">
                    <span>SPRINTS</span>
                    {onCreateSprint && (
                      <button
                        onClick={onCreateSprint}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
                        title="Add new sprint"
                      >
                        <Plus className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400 cursor-pointer" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {allSprints.map((sprint: any) => {
                      const sprintOutcomes = clientTargets.filter((t: any) =>
                        t.sprint_ids?.includes(sprint.id),
                      )
                      const hasChildren = sprintOutcomes.length > 0

                      return (
                        <TreeNode
                          key={sprint.id}
                          type="sprint"
                          data={sprint}
                          level={0}
                          isSelected={
                            selectedNodeId === sprint.id &&
                            selectedNodeType === 'sprint'
                          }
                          isExpanded={expandedSprintIds.has(sprint.id)}
                          onToggle={
                            hasChildren
                              ? () => toggleSprint(sprint.id)
                              : undefined
                          }
                          onClick={() => handleNodeClick(sprint.id, 'sprint')}
                          onEdit={() => onEditSprint?.(sprint)}
                          onDelete={() => onDeleteSprint?.(sprint)}
                          onComplete={() => onCompleteSprint?.(sprint)}
                        >
                          {hasChildren
                            ? sprintOutcomes.map((outcome: any) => (
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
                                  onComplete={() =>
                                    onCompleteOutcome?.(outcome)
                                  }
                                />
                              ))
                            : undefined}
                        </TreeNode>
                      )
                    })}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Panel: Commitments Kanban */}
        <div className={cn(!sidebarCollapsed && 'lg:col-span-2')}>
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="h-8 w-8 p-0"
                    title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
                  >
                    {sidebarCollapsed ? (
                      <PanelLeftOpen className="h-4 w-4" />
                    ) : (
                      <PanelLeftClose className="h-4 w-4" />
                    )}
                  </Button>
                  <div>
                    <CardTitle className="text-sm font-semibold mb-1">
                      Commitments ({filteredCommitments.length})
                    </CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {getFilterDescription()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Refresh commitments"
                    onClick={() => {
                      queryClient.invalidateQueries({
                        queryKey: queryKeys.commitments.all,
                      })
                      queryClient.invalidateQueries({
                        queryKey: queryKeys.goals.all,
                      })
                      queryClient.invalidateQueries({
                        queryKey: queryKeys.targets.all,
                      })
                      queryClient.invalidateQueries({
                        queryKey: queryKeys.sprints.all,
                      })
                      toast.success('Refreshed')
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          'h-8 text-xs gap-1.5',
                          (statusFilter !== 'all' ||
                            priorityFilter !== 'all') &&
                            'border-primary text-primary',
                        )}
                      >
                        <Filter className="h-3.5 w-3.5" />
                        Filters
                        {(statusFilter !== 'all' ||
                          priorityFilter !== 'all') && (
                          <Badge
                            variant="secondary"
                            className="h-4 px-1 text-[10px] ml-0.5"
                          >
                            {(statusFilter !== 'all' ? 1 : 0) +
                              (priorityFilter !== 'all' ? 1 : 0)}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="end">
                      <div className="space-y-3">
                        {/* Status Filter */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Status
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { value: 'all', label: 'All', color: '' },
                              {
                                value: 'active',
                                label: 'To Do',
                                color: 'bg-blue-400',
                              },
                              {
                                value: 'in_progress',
                                label: 'In Progress',
                                color: 'bg-yellow-400',
                              },
                              {
                                value: 'completed',
                                label: 'Done',
                                color: 'bg-green-400',
                              },
                            ].map(opt => (
                              <Button
                                key={opt.value}
                                variant={
                                  statusFilter === opt.value
                                    ? 'default'
                                    : 'outline'
                                }
                                size="sm"
                                onClick={() => setStatusFilter(opt.value)}
                                className={cn(
                                  'h-7 text-xs px-2.5',
                                  statusFilter === opt.value
                                    ? opt.value === 'all'
                                      ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                                      : opt.value === 'active'
                                        ? 'bg-blue-600 text-white'
                                        : opt.value === 'in_progress'
                                          ? 'bg-yellow-600 text-white'
                                          : 'bg-green-600 text-white'
                                    : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400',
                                )}
                              >
                                {opt.color && (
                                  <span
                                    className={cn(
                                      'w-1.5 h-1.5 rounded-full mr-1',
                                      opt.color,
                                    )}
                                  />
                                )}
                                {opt.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                        {/* Priority Filter */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Priority
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { value: 'all', label: 'All', color: '' },
                              {
                                value: 'low',
                                label: 'Low',
                                color: 'bg-gray-400',
                              },
                              {
                                value: 'medium',
                                label: 'Medium',
                                color: 'bg-yellow-400',
                              },
                              {
                                value: 'high',
                                label: 'High',
                                color: 'bg-orange-400',
                              },
                              {
                                value: 'urgent',
                                label: 'Urgent',
                                color: 'bg-red-500',
                              },
                            ].map(opt => (
                              <Button
                                key={opt.value}
                                variant={
                                  priorityFilter === opt.value
                                    ? 'default'
                                    : 'outline'
                                }
                                size="sm"
                                onClick={() => setPriorityFilter(opt.value)}
                                className={cn(
                                  'h-7 text-xs px-2.5',
                                  priorityFilter === opt.value
                                    ? opt.value === 'all'
                                      ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                                      : opt.value === 'low'
                                        ? 'bg-gray-600 text-white'
                                        : opt.value === 'medium'
                                          ? 'bg-yellow-600 text-white'
                                          : opt.value === 'high'
                                            ? 'bg-orange-600 text-white'
                                            : 'bg-red-600 text-white'
                                    : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400',
                                )}
                              >
                                {opt.color && (
                                  <span
                                    className={cn(
                                      'w-1.5 h-1.5 rounded-full mr-1',
                                      opt.color,
                                    )}
                                  />
                                )}
                                {opt.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                        {/* Reset */}
                        {(statusFilter !== 'all' ||
                          priorityFilter !== 'all') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-7 text-xs text-gray-500"
                            onClick={() => {
                              setStatusFilter('all')
                              setPriorityFilter('all')
                            }}
                          >
                            Reset filters
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {/* Assignee Filter Buttons */}
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                  Show:
                </span>
                <Button
                  variant={assigneeFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAssigneeFilter('all')}
                  className={cn(
                    'h-7 text-xs px-3',
                    assigneeFilter === 'all'
                      ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800',
                  )}
                >
                  All
                </Button>
                <Button
                  variant={assigneeFilter === 'client' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAssigneeFilter('client')}
                  className={cn(
                    'h-7 text-xs px-3',
                    assigneeFilter === 'client'
                      ? 'bg-slate-600 text-white'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800',
                  )}
                >
                  <User className="h-3 w-3 mr-1" />
                  {isClientPortal ? 'Me' : clientFirstName}
                </Button>
                <Button
                  variant={assigneeFilter === 'coach' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAssigneeFilter('coach')}
                  className={cn(
                    'h-7 text-xs px-3',
                    assigneeFilter === 'coach'
                      ? 'bg-amber-600 text-white'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800',
                  )}
                >
                  <Briefcase className="h-3 w-3 mr-1" />
                  {isClientPortal ? clientFirstName : coachLabel}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredCommitments.length > 0 ? (
                isClientPortal ? (
                  <CommitmentKanbanBoard
                    commitments={filteredCommitments}
                    targets={clientTargets}
                    onDrop={handleClientPortalDrop}
                    onCommitmentClick={onCommitmentClick}
                  />
                ) : (
                  <SprintKanbanBoard
                    commitments={filteredCommitments}
                    clientId={clientId}
                    targets={clientTargets}
                    onCommitmentClick={onCommitmentClick}
                    onCommitmentUpdate={handleCommitmentUpdate}
                  />
                )
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
