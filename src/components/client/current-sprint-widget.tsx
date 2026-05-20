'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { SprintService } from '@/services/sprint-service'
import { useCurrentSprint } from '@/hooks/queries/use-sprints'
import { SprintStatusMenu } from '@/components/sprints/sprint-status-menu'
import {
  Target,
  Calendar,
  TrendingUp,
  ChevronRight,
  CheckCircle,
  Plus,
} from 'lucide-react'
import { differenceInDays } from 'date-fns'
import { formatDate } from '@/lib/date-utils'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'

interface CurrentSprintWidgetProps {
  clientId: string
  onRefresh?: () => void
  showStatusMenu?: boolean
  onCreateSprint?: () => void
}

/**
 * Current Sprint Widget - Now using TanStack Query
 *
 * Benefits:
 * - Sprint data cached and shown instantly
 * - Automatic background refresh
 * - Shared cache with sprint pages
 */
export function CurrentSprintWidget({
  clientId,
  onRefresh,
  showStatusMenu = false,
  onCreateSprint,
}: CurrentSprintWidgetProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Use TanStack Query for current sprint
  const {
    data: sprint,
    isLoading: loading,
    refetch,
  } = useCurrentSprint(clientId)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Current Sprint
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-line"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleFinishSprint = async () => {
    if (!sprint) return

    try {
      await SprintService.updateSprint(sprint.id, { status: 'completed' })
      toast.success('Sprint Completed', {
        description: 'Sprint has been marked as completed',
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all })
      refetch()
      onRefresh?.()
    } catch (error) {
      console.error('Failed to complete sprint:', error)
    }
  }

  if (!sprint) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Current Sprint
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-ink-2 mx-auto mb-4" />
            <p className="text-ink-3 mb-4">No active sprint</p>
            {onCreateSprint && (
              <Button
                onClick={onCreateSprint}
                className="bg-ink hover:bg-ink-2 "
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Sprint
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const daysRemaining = Math.max(
    0,
    differenceInDays(new Date(sprint.end_date), new Date()),
  )

  return (
    <Card className="border-line hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Current Sprint
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              className={
                sprint.status === 'active'
                  ? 'bg-forest-bg text-forest border-forest'
                  : sprint.status === 'completed'
                    ? 'bg-surface-3 text-ink-2 border-line'
                    : 'bg-amber-token-bg text-amber-token border-amber-token'
              }
            >
              {sprint.status}
            </Badge>
            {sprint.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleFinishSprint}
                className="border-forest text-forest hover:bg-forest-bg"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Finish Sprint
              </Button>
            )}
            {onCreateSprint && sprint.status === 'completed' && (
              <Button variant="outline" size="sm" onClick={onCreateSprint}>
                <Plus className="h-4 w-4 mr-1" />
                New Sprint
              </Button>
            )}
            {showStatusMenu && (
              <SprintStatusMenu
                sprintId={sprint.id}
                currentStatus={sprint.status as any}
                onStatusChanged={() => {
                  queryClient.invalidateQueries({
                    queryKey: queryKeys.sprints.all,
                  })
                  refetch()
                  onRefresh?.()
                }}
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sprint Title */}
        <div>
          <h3 className="font-semibold text-ink">{sprint.title}</h3>
          {sprint.description && (
            <p className="text-sm text-ink-3 mt-1">{sprint.description}</p>
          )}
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-ink-3">Overall Progress</span>
            <span className="font-semibold text-ink">
              {sprint.progress_percentage || 0}%
            </span>
          </div>
          <Progress value={sprint.progress_percentage || 0} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-line">
          <div className="text-center">
            <div className="text-lg font-bold text-ink">
              {sprint.target_count || 0}
            </div>
            <div className="text-xs text-ink-3">Desired Wins</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-ink">{daysRemaining}</div>
            <div className="text-xs text-ink-3">Days Left</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-ink">
              {sprint.duration_weeks || 0}w
            </div>
            <div className="text-xs text-ink-3">Duration</div>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center justify-between text-xs text-ink-3 pt-2 border-t border-line">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(sprint.start_date, 'MMM d')}</span>
          </div>
          <TrendingUp className="h-3 w-3" />
          <span>{formatDate(sprint.end_date, 'MMM d, yyyy')}</span>
        </div>

        {/* View Details Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={e => {
            e.stopPropagation()
            // Navigate to commitments view for client portal
            const isClientPortal =
              window.location.pathname.includes('/client-portal')
            if (isClientPortal) {
              router.push('/client-portal/dashboard')
            } else {
              // For coaches, navigate to a sprint details modal or trigger tab switch
              if (window.location.pathname.includes('/clients/')) {
                // Trigger tab switch via custom event or direct DOM manipulation
                const tabTrigger = document.querySelector(
                  '[value="sprints"]',
                ) as HTMLButtonElement
                if (tabTrigger) {
                  tabTrigger.click()
                }
              }
            }
          }}
        >
          View Sprint Details
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>

        {/* Vision Preview */}
        {sprint.targets && sprint.targets.length > 0 && (
          <div className="pt-3 border-t border-line">
            <p className="text-xs font-semibold text-ink-3 mb-2">
              Active Desired Wins ({sprint.completed_target_count || 0}/
              {sprint.target_count || 0} completed)
            </p>
            <div className="space-y-2">
              {sprint.targets.slice(0, 3).map(target => (
                <div
                  key={target.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className={`h-2 w-2 rounded-full flex-shrink-0 ${
                        target.status === 'completed' ? 'bg-forest' : 'bg-line'
                      }`}
                    />
                    <span className="text-ink-2 truncate">{target.title}</span>
                  </div>
                  <span className="text-xs text-ink-3 ml-2">
                    {target.progress_percentage}%
                  </span>
                </div>
              ))}
              {sprint.targets.length > 3 && (
                <p className="text-xs text-ink-3 text-center pt-1">
                  +{sprint.targets.length - 3} more desired wins
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
