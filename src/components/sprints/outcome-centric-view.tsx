'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  useOutcomesGroupedByGoal,
  useActiveSprintOutcomes,
} from '@/hooks/queries/use-outcomes-grouped'
import { OutcomeCard } from './outcome-card'
import { TargetFormModal } from './target-form-modal'
import { TargetService } from '@/services/target-service'
import { Target } from '@/types/sprint'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'
import {
  Target as TargetIcon,
  ChevronDown,
  ChevronRight,
  Plus,
  Calendar,
  Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { differenceInDays } from 'date-fns'

interface OutcomeCentricViewProps {
  clientId: string
  selectedOutcomeId?: string | null
  onOutcomeClick?: (outcomeId: string | null) => void
  onCreateOutcome?: () => void
  onCreateSprint?: () => void
  onEditOutcome?: (outcome: Target) => void
}

type ViewFilter = 'all' | 'active_sprint'

export function OutcomeCentricView({
  clientId,
  selectedOutcomeId,
  onOutcomeClick,
  onCreateOutcome: _onCreateOutcome,
  onCreateSprint: _onCreateSprint,
  onEditOutcome,
}: OutcomeCentricViewProps) {
  const queryClient = useQueryClient()
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all')
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Use appropriate hook based on filter
  const allData = useOutcomesGroupedByGoal(clientId)
  const activeData = useActiveSprintOutcomes(clientId)

  const data = viewFilter === 'active_sprint' ? activeData : allData
  const { groupedOutcomes, sprints, isLoading } = data

  // Get active sprint info
  const activeSprints = sprints.filter(s => s.status === 'active')
  const currentSprint = activeSprints[0]

  const toggleGoal = (goalId: string) => {
    setExpandedGoals(prev => {
      const next = new Set(prev)
      if (next.has(goalId)) {
        next.delete(goalId)
      } else {
        next.add(goalId)
      }
      return next
    })
  }

  // Expand all by default on first load
  const isGoalExpanded = (goalId: string) => {
    if (expandedGoals.size === 0) {
      return true // Default to expanded
    }
    return expandedGoals.has(goalId)
  }

  const handleCompleteOutcome = async (outcome: Target) => {
    try {
      await TargetService.updateTarget(outcome.id, { status: 'completed' })
      await queryClient.invalidateQueries({ queryKey: queryKeys.targets.all })
      toast.success('Outcome marked as complete')
    } catch (error) {
      console.error('Failed to complete outcome:', error)
      toast.error('Failed to mark outcome as complete')
    }
  }

  const handleDeleteOutcome = async (outcome: Target) => {
    try {
      await TargetService.deleteTarget(outcome.id)
      await queryClient.invalidateQueries({ queryKey: queryKeys.targets.all })
      // Also invalidate sprints in case any were auto-deleted
      await queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all })
      toast.success('Outcome deleted')
    } catch (error) {
      console.error('Failed to delete outcome:', error)
      toast.error('Failed to delete outcome')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-gray-500">
              Loading outcomes...
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TargetIcon className="h-5 w-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">
                Outcomes & Progress
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {/* Filter Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-7 px-3 text-xs',
                    viewFilter === 'all' && 'bg-white shadow-sm',
                  )}
                  onClick={() => setViewFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-7 px-3 text-xs',
                    viewFilter === 'active_sprint' && 'bg-white shadow-sm',
                  )}
                  onClick={() => setViewFilter('active_sprint')}
                >
                  <Filter className="h-3 w-3 mr-1" />
                  Active Sprint
                </Button>
              </div>
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New Outcome
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {groupedOutcomes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TargetIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">
                {viewFilter === 'active_sprint'
                  ? 'No outcomes in active sprint'
                  : 'No outcomes yet'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Outcome
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedOutcomes.map(group => (
                <Collapsible
                  key={group.goal.id}
                  open={isGoalExpanded(group.goal.id)}
                  onOpenChange={() => toggleGoal(group.goal.id)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                      {isGoalExpanded(group.goal.id) ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="font-medium text-sm text-gray-900">
                        {group.goal.title}
                      </span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {group.outcomes.length} outcome
                        {group.outcomes.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2 pt-2 pl-6">
                      {group.outcomes.map(outcome => (
                        <OutcomeCard
                          key={outcome.id}
                          outcome={outcome}
                          sprints={sprints}
                          isSelected={selectedOutcomeId === outcome.id}
                          onClick={() =>
                            onOutcomeClick?.(
                              selectedOutcomeId === outcome.id
                                ? null
                                : outcome.id,
                            )
                          }
                          onEdit={() => onEditOutcome?.(outcome)}
                          onComplete={() => handleCompleteOutcome(outcome)}
                          onDelete={() => handleDeleteOutcome(outcome)}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}

          {/* Active Sprint Info */}
          {currentSprint && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Active: {currentSprint.title}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {(() => {
                    const daysLeft = differenceInDays(
                      new Date(currentSprint.end_date),
                      new Date(),
                    )
                    if (daysLeft < 0) return 'Overdue'
                    if (daysLeft === 0) return 'Ends today'
                    return `${daysLeft} days left`
                  })()}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Outcome Modal */}
      <TargetFormModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        clientId={clientId}
        onSuccess={() => {
          setShowCreateModal(false)
          queryClient.invalidateQueries({ queryKey: queryKeys.targets.all })
        }}
      />
    </>
  )
}
