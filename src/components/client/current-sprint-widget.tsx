'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { SprintService } from '@/services/sprint-service'
import { SprintDetail } from '@/types/sprint'
import { SprintStatusMenu } from '@/components/sprints/sprint-status-menu'
import { Target, Calendar, TrendingUp, ChevronRight } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

interface CurrentSprintWidgetProps {
  clientId: string
  onRefresh?: () => void
  showStatusMenu?: boolean
}

export function CurrentSprintWidget({
  clientId,
  onRefresh,
  showStatusMenu = false,
}: CurrentSprintWidgetProps) {
  const router = useRouter()
  const [sprint, setSprint] = useState<SprintDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (clientId) {
      loadCurrentSprint()
    }
  }, [clientId])

  const loadCurrentSprint = async () => {
    setLoading(true)
    try {
      const data = await SprintService.getCurrentSprint(clientId)
      setSprint(data)
    } catch (error) {
      console.error('Failed to load current sprint:', error)
      // Don't show error toast - widget will just show "no active sprint"
    } finally {
      setLoading(false)
    }
  }

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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
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
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No active sprint</p>
            <p className="text-sm text-gray-500">
              Your coach will create a sprint to organize your outcomes
            </p>
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
    <Card className="border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Current Sprint
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 border-green-200">
              {sprint.status}
            </Badge>
            {showStatusMenu && (
              <SprintStatusMenu
                sprintId={sprint.id}
                currentStatus={sprint.status as any}
                onStatusChanged={() => {
                  loadCurrentSprint()
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
          <h3 className="font-semibold text-gray-900">{sprint.title}</h3>
          {sprint.description && (
            <p className="text-sm text-gray-600 mt-1">{sprint.description}</p>
          )}
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-semibold text-gray-900">
              {sprint.progress_percentage || 0}%
            </span>
          </div>
          <Progress value={sprint.progress_percentage || 0} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {sprint.target_count || 0}
            </div>
            <div className="text-xs text-gray-600">Desired Wins</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {daysRemaining}
            </div>
            <div className="text-xs text-gray-600">Days Left</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {sprint.duration_weeks || 0}w
            </div>
            <div className="text-xs text-gray-600">Duration</div>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(sprint.start_date), 'MMM d')}</span>
          </div>
          <TrendingUp className="h-3 w-3" />
          <span>{format(new Date(sprint.end_date), 'MMM d, yyyy')}</span>
        </div>

        {/* View Details Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={e => {
            e.stopPropagation()
            // Navigate to client sprint view
            const isClientPortal =
              window.location.pathname.includes('/client-portal')
            if (isClientPortal) {
              router.push(`/client-portal/sprints/${sprint.id}`)
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

        {/* Goals Preview */}
        {sprint.targets && sprint.targets.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-600 mb-2">
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
                        target.status === 'completed'
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                    <span className="text-gray-700 truncate">
                      {target.title}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">
                    {target.progress_percentage}%
                  </span>
                </div>
              ))}
              {sprint.targets.length > 3 && (
                <p className="text-xs text-gray-500 text-center pt-1">
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
