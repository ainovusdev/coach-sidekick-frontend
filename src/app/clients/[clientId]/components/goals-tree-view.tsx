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
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { SprintKanbanBoard } from '@/components/sprints/sprint-kanban-board'
import { CommitmentKanbanBoard } from '@/components/commitments/commitment-kanban-board'
import { ClientCommitmentService } from '@/services/client-commitment-service'
import { toast } from 'sonner'
import { useConfetti } from '@/hooks/use-confetti'
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
  EyeOff,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { VisionDetailPanel } from '@/components/goals/vision-detail-panel'
import { OutcomeDetailPanel } from '@/components/sprints/outcome-detail-panel'
import { SprintDetailPanel } from '@/components/sprints/sprint-detail-panel'

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
  const isCompleted = data.status === 'completed'

  const getIcon = () => {
    switch (type) {
      case 'goal':
        return (
          <Target
            className={cn(
              'h-4 w-4',
              isCompleted ? 'text-ink-4 ' : 'text-ink-3 ',
            )}
          />
        )
      case 'outcome':
        return (
          <Zap
            className={cn(
              'h-4 w-4',
              isCompleted ? 'text-ink-4 ' : 'text-ds-accent',
            )}
          />
        )
      case 'sprint':
        return (
          <Calendar
            className={cn(
              'h-4 w-4',
              isCompleted ? 'text-ink-4 ' : 'text-forest',
            )}
          />
        )
    }
  }

  const getStatusColor = () => {
    if (!data.status) return ''
    switch (data.status) {
      case 'active':
        return 'bg-forest-bg text-forest border-forest '
      case 'completed':
        return 'bg-ds-accent-bg text-ds-accent border-ds-accent '
      case 'paused':
        return 'bg-amber-token-bg text-amber-token border-amber-token '
      default:
        return 'bg-surface-3 text-ink-2 border-line '
    }
  }

  return (
    <div>
      <div
        className={cn(
          'flex items-start gap-2 py-2 px-3 rounded-lg cursor-pointer hover:bg-surface-3 transition-colors',
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
            className="flex-shrink-0 p-0.5 mt-0.5 hover:bg-surface-3 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-ink-3 " />
            ) : (
              <ChevronRight className="h-4 w-4 text-ink-3 " />
            )}
          </button>
        )}

        {!hasChildren && <div className="w-5 mt-0.5" />}

        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

        {/* Title */}
        <span
          className={cn(
            'flex-1 text-sm font-medium break-words min-w-0',
            isCompleted ? 'text-ink-4 line-through' : 'text-ink ',
          )}
        >
          {data.title}
        </span>

        {/* Status Indicator (Green dot for active) */}
        {data.status === 'active' && (
          <div className="w-2 h-2 rounded-full bg-forest" title="Active" />
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
              <button className="flex-shrink-0 p-1 hover:bg-surface-3 rounded">
                <MoreVertical className="h-4 w-4 text-ink-3 " />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onComplete && data.status !== 'completed' && (
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation()
                    onComplete()
                  }}
                  className="text-forest focus:text-forest"
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
                  className="text-vermillion focus:text-vermillion"
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
  const [detailNode, setDetailNode] = useState<{
    type: 'goal' | 'outcome' | 'sprint'
    data: any
  } | null>(null)
  const [assigneeFilter, setAssigneeFilter] = useState<
    'all' | 'client' | 'coach'
  >('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [hideCompletedVisions, setHideCompletedVisions] = useState(false)
  const [hideCompletedOutcomes, setHideCompletedOutcomes] = useState(false)
  const [hideCompletedSprints, setHideCompletedSprints] = useState(false)
  const { fireConfetti } = useConfetti()

  // Fetch all data
  const { data: goals = [], isLoading: goalsLoading } = useGoals(clientId)
  const { data: clientTargets = [], isLoading: targetsLoading } = useTargets({
    client_id: clientId,
  })
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

  // Filter out completed items when toggle is on
  const visibleGoals = useMemo(() => {
    if (!hideCompletedVisions) return goals
    return goals.filter((g: any) => g.status !== 'completed')
  }, [goals, hideCompletedVisions])

  const visibleTargets = useMemo(() => {
    if (!hideCompletedOutcomes) return clientTargets
    return clientTargets.filter((t: any) => t.status !== 'completed')
  }, [clientTargets, hideCompletedOutcomes])

  const visibleSprints = useMemo(() => {
    if (!hideCompletedSprints) return allSprints
    return allSprints.filter((s: any) => s.status !== 'completed')
  }, [allSprints, hideCompletedSprints])

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
    // Filter the commitments kanban (existing behavior)...
    setSelectedNodeId(id)
    setSelectedNodeType(type)
    // ...and open the detail drawer for the clicked entity.
    const data =
      type === 'goal'
        ? goals.find((g: any) => g.id === id)
        : type === 'outcome'
          ? clientTargets.find((t: any) => t.id === id)
          : allSprints.find((s: any) => s.id === id)
    if (data) setDetailNode({ type, data })
  }

  // Commitments associated with a node — reuses the same association rules as
  // `filteredCommitments` (node scope only; no assignee/status/priority filters).
  const getCommitmentsForNode = (
    id: string,
    type: 'goal' | 'outcome' | 'sprint',
  ): any[] => {
    if (type === 'outcome') {
      return allCommitments.filter((c: any) =>
        c.target_links?.some((link: any) => link.target_id === id),
      )
    }
    // goal / sprint: via their linked outcomes (exclude unlinked/orphan commitments)
    const outcomeIds = clientTargets
      .filter((t: any) =>
        type === 'goal' ? t.goal_ids?.includes(id) : t.sprint_ids?.includes(id),
      )
      .map((t: any) => t.id)
    return allCommitments.filter((c: any) =>
      c.target_links?.some((link: any) => outcomeIds.includes(link.target_id)),
    )
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
    if (newStatus === 'completed') {
      fireConfetti({ intensity: 'medium' })
    }

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
      <Card className="border-line ">
        <CardContent className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-surface-3 flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-ink-3 " />
            </div>
            <h3 className="text-lg font-semibold text-ink mb-2">
              No Vision Yet
            </h3>
            <p className="text-sm text-ink-3 mb-6">
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
    <div className="space-y-3 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ink ">
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
          'grid grid-cols-1 gap-4 flex-1 min-h-0',
          sidebarCollapsed ? 'lg:grid-cols-1' : 'lg:grid-cols-3',
        )}
      >
        {/* Left Panel: Goals & Sprints */}
        <Card
          className={cn(
            'border-line flex flex-col min-h-0',
            sidebarCollapsed && 'hidden',
          )}
        >
          <CardContent className="p-0 flex-1 min-h-0">
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="p-3 space-y-6">
                {/* Vision Section */}
                <div className="pb-4 border-b border-line ">
                  <div className="flex items-center justify-between text-xs font-semibold text-ink-2 mb-3 px-2">
                    <span>VISION</span>
                    <div className="flex items-center gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() =>
                              setHideCompletedVisions(!hideCompletedVisions)
                            }
                            className={cn(
                              'p-1 rounded transition-colors',
                              hideCompletedVisions
                                ? 'text-primary bg-primary/10'
                                : 'hover:bg-surface-3 ',
                            )}
                          >
                            {hideCompletedVisions ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5 text-ink-3 " />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          {hideCompletedVisions
                            ? 'Show completed'
                            : 'Hide completed'}
                        </TooltipContent>
                      </Tooltip>
                      {onCreateGoal && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={onCreateGoal}
                              className="p-1 hover:bg-surface-3 rounded transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5 text-ink-3 cursor-pointer" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            Add new vision
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {visibleGoals.map((goal: any) => {
                      const goalOutcomes = visibleTargets.filter((t: any) =>
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
                  <div className="flex items-center justify-between text-xs font-semibold text-ink-2 mb-3 px-2">
                    <span>META PERFORMANCE OUTCOMES</span>
                    <div className="flex items-center gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() =>
                              setHideCompletedOutcomes(!hideCompletedOutcomes)
                            }
                            className={cn(
                              'p-1 rounded transition-colors',
                              hideCompletedOutcomes
                                ? 'text-primary bg-primary/10'
                                : 'hover:bg-surface-3 ',
                            )}
                          >
                            {hideCompletedOutcomes ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5 text-ink-3 " />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          {hideCompletedOutcomes
                            ? 'Show completed'
                            : 'Hide completed'}
                        </TooltipContent>
                      </Tooltip>
                      {onCreateOutcome && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={onCreateOutcome}
                              className="p-1 hover:bg-surface-3 rounded transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5 text-ink-3 cursor-pointer" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            Add new outcome
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {visibleTargets.map((outcome: any) => {
                      const linkedSprints = visibleSprints.filter((s: any) =>
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
                  <div className="flex items-center justify-between text-xs font-semibold text-ink-2 mb-3 px-2">
                    <span>SPRINTS</span>
                    <div className="flex items-center gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() =>
                              setHideCompletedSprints(!hideCompletedSprints)
                            }
                            className={cn(
                              'p-1 rounded transition-colors',
                              hideCompletedSprints
                                ? 'text-primary bg-primary/10'
                                : 'hover:bg-surface-3 ',
                            )}
                          >
                            {hideCompletedSprints ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5 text-ink-3 " />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          {hideCompletedSprints
                            ? 'Show completed'
                            : 'Hide completed'}
                        </TooltipContent>
                      </Tooltip>
                      {onCreateSprint && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={onCreateSprint}
                              className="p-1 hover:bg-surface-3 rounded transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5 text-ink-3 cursor-pointer" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            Add new sprint
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {visibleSprints.map((sprint: any) => {
                      const sprintOutcomes = visibleTargets.filter((t: any) =>
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
        <div
          className={cn('flex flex-col', !sidebarCollapsed && 'lg:col-span-2')}
        >
          <Card className="border-line flex flex-col h-[calc(100vh-220px)]">
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
                    <p className="text-xs text-ink-3 ">
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
                          <span className="text-xs font-medium text-ink-2 ">
                            Status
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { value: 'all', label: 'All', color: '' },
                              {
                                value: 'active',
                                label: 'To Do',
                                color: 'bg-ds-accent',
                              },
                              {
                                value: 'in_progress',
                                label: 'In Progress',
                                color: 'bg-amber-token',
                              },
                              {
                                value: 'completed',
                                label: 'Done',
                                color: 'bg-forest',
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
                                      ? 'bg-ink text-ink-on-dark '
                                      : opt.value === 'active'
                                        ? 'bg-ds-accent text-ink-on-dark'
                                        : opt.value === 'in_progress'
                                          ? 'bg-amber-token text-ink-on-dark'
                                          : 'bg-forest text-ink-on-dark'
                                    : 'border-line text-ink-3 ',
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
                          <span className="text-xs font-medium text-ink-2 ">
                            Priority
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { value: 'all', label: 'All', color: '' },
                              {
                                value: 'low',
                                label: 'Low',
                                color: 'bg-line',
                              },
                              {
                                value: 'medium',
                                label: 'Medium',
                                color: 'bg-amber-token',
                              },
                              {
                                value: 'high',
                                label: 'High',
                                color: 'bg-amber-token',
                              },
                              {
                                value: 'urgent',
                                label: 'Urgent',
                                color: 'bg-vermillion',
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
                                      ? 'bg-ink text-ink-on-dark '
                                      : opt.value === 'low'
                                        ? 'bg-ink-3 text-ink-on-dark'
                                        : opt.value === 'medium'
                                          ? 'bg-amber-token text-ink-on-dark'
                                          : opt.value === 'high'
                                            ? 'bg-amber-token text-ink-on-dark'
                                            : 'bg-vermillion text-ink-on-dark'
                                    : 'border-line text-ink-3 ',
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
                            className="w-full h-7 text-xs text-ink-3"
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
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-line ">
                <span className="text-xs text-ink-3 mr-2">Show:</span>
                <Button
                  variant={assigneeFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAssigneeFilter('all')}
                  className={cn(
                    'h-7 text-xs px-3',
                    assigneeFilter === 'all'
                      ? 'bg-ink text-ink-on-dark '
                      : 'border-line text-ink-3 hover:bg-paper ',
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
                      ? 'bg-ink-3 text-ink-on-dark'
                      : 'border-line text-ink-3 hover:bg-paper ',
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
                      ? 'bg-amber-token text-ink-on-dark'
                      : 'border-line text-ink-3 hover:bg-paper ',
                  )}
                >
                  <Briefcase className="h-3 w-3 mr-1" />
                  {isClientPortal ? clientFirstName : coachLabel}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-y-auto">
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

      {/* Read-only detail drawers opened on row click (Vision / Outcome / Sprint) */}
      {detailNode?.type === 'goal' && (
        <VisionDetailPanel
          goal={detailNode.data}
          linkedOutcomes={clientTargets.filter((t: any) =>
            (t.goal_ids || []).includes(detailNode.data.id),
          )}
          commitments={getCommitmentsForNode(detailNode.data.id, 'goal')}
          onCommitmentClick={
            onCommitmentClick
              ? (c: any) => {
                  setDetailNode(null)
                  onCommitmentClick(c)
                }
              : undefined
          }
          onClose={() => setDetailNode(null)}
          onEdit={
            onEditGoal
              ? () => {
                  onEditGoal(detailNode.data)
                  setDetailNode(null)
                }
              : undefined
          }
          onDelete={
            onDeleteGoal
              ? () => {
                  onDeleteGoal(detailNode.data)
                  setDetailNode(null)
                }
              : undefined
          }
        />
      )}
      {detailNode?.type === 'outcome' && (
        <OutcomeDetailPanel
          outcome={detailNode.data}
          linkedSprints={allSprints.filter((s: any) =>
            (detailNode.data.sprint_ids || []).includes(s.id),
          )}
          commitments={getCommitmentsForNode(detailNode.data.id, 'outcome')}
          onCommitmentClick={
            onCommitmentClick
              ? (c: any) => {
                  setDetailNode(null)
                  onCommitmentClick(c)
                }
              : undefined
          }
          onClose={() => setDetailNode(null)}
          onEdit={
            onEditOutcome
              ? () => {
                  onEditOutcome(detailNode.data)
                  setDetailNode(null)
                }
              : undefined
          }
          onComplete={
            onCompleteOutcome
              ? () => {
                  onCompleteOutcome(detailNode.data)
                  setDetailNode(null)
                }
              : undefined
          }
          onDelete={
            onDeleteOutcome
              ? () => {
                  onDeleteOutcome(detailNode.data)
                  setDetailNode(null)
                }
              : undefined
          }
        />
      )}
      {detailNode?.type === 'sprint' && (
        <SprintDetailPanel
          sprint={detailNode.data}
          commitments={getCommitmentsForNode(detailNode.data.id, 'sprint')}
          onCommitmentClick={
            onCommitmentClick
              ? (c: any) => {
                  setDetailNode(null)
                  onCommitmentClick(c)
                }
              : undefined
          }
          onClose={() => setDetailNode(null)}
          onEdit={
            onEditSprint
              ? () => {
                  onEditSprint(detailNode.data)
                  setDetailNode(null)
                }
              : undefined
          }
          onComplete={
            onCompleteSprint
              ? () => {
                  onCompleteSprint(detailNode.data)
                  setDetailNode(null)
                }
              : undefined
          }
          onDelete={
            onDeleteSprint
              ? () => {
                  onDeleteSprint(detailNode.data)
                  setDetailNode(null)
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
