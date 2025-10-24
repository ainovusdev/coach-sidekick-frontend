'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Loader2,
  Target as TargetIcon,
  CheckCircle,
  Circle,
  Clock,
} from 'lucide-react'
import { SprintService } from '@/services/sprint-service'
import { TargetService } from '@/services/target-service'
import { useToast } from '@/hooks/use-toast'
import { Sprint, Target } from '@/types/sprint'

export default function TargetsPage() {
  const [loading, setLoading] = useState(true)
  const [currentSprintTargets, setCurrentSprintTargets] = useState<Target[]>([])
  const [allActiveTargets, setAllActiveTargets] = useState<{
    [sprintId: string]: { sprint: Sprint; targets: Target[] }
  }>({})
  const { toast } = useToast()

  useEffect(() => {
    loadTargets()
  }, [])

  const loadTargets = async () => {
    try {
      setLoading(true)

      // Get current sprint
      const currentSprint = await SprintService.getCurrentSprint()

      if (currentSprint) {
        // Fetch targets for current sprint
        const currentTargets = await TargetService.listTargets({
          sprint_id: currentSprint.id,
        })
        setCurrentSprintTargets(currentTargets)
      }

      // Get all active targets across all sprints
      const activeTargets = await TargetService.listTargets({
        status: 'active',
      })

      // Get all sprints to group targets
      const allSprints = await SprintService.listSprints()

      // Group targets by sprint
      const grouped: {
        [sprintId: string]: { sprint: Sprint; targets: Target[] }
      } = {}

      for (const target of activeTargets) {
        const sprint = allSprints.find(s => s.id === target.sprint_id)
        if (sprint) {
          if (!grouped[sprint.id]) {
            grouped[sprint.id] = { sprint, targets: [] }
          }
          grouped[sprint.id].targets.push(target)
        }
      }

      setAllActiveTargets(grouped)
    } catch (error) {
      console.error('Failed to load targets:', error)
      toast({
        title: 'Error',
        description: 'Failed to load targets',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'deferred':
        return 'bg-yellow-100 text-yellow-800'
      case 'abandoned':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Desired Wins</h1>
        <p className="text-gray-600 mt-2">
          Track your progress towards your goals across all sprints
        </p>
      </div>

      {/* Current Sprint Targets */}
      {currentSprintTargets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Current Sprint Targets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentSprintTargets.map(target => (
                <TargetCard key={target.id} target={target} isCurrent={true} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Active Targets Grouped by Sprint */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          All Active Targets by Sprint
        </h2>

        {Object.entries(allActiveTargets)
          .sort(([, a], [, b]) => {
            // Sort by sprint start date descending (newest first)
            return (
              new Date(b.sprint.start_date).getTime() -
              new Date(a.sprint.start_date).getTime()
            )
          })
          .map(([sprintId, { sprint, targets }]) => (
            <Card key={sprintId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{sprint.title}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(sprint.start_date).toLocaleDateString()} -{' '}
                      {new Date(sprint.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={getStatusColor(sprint.status)}>
                    {sprint.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {targets.map(target => (
                    <TargetCard key={target.id} target={target} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

        {Object.keys(allActiveTargets).length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <TargetIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No active targets yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Your coach will help you set targets during your sessions
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function TargetCard({
  target,
  isCurrent = false,
}: {
  target: Target
  isCurrent?: boolean
}) {
  const getStatusIcon = (status: string, progress: number) => {
    if (status === 'completed' || progress === 100) {
      return <CheckCircle className="w-5 h-5 text-green-600" />
    }
    return <Circle className="w-5 h-5 text-gray-400" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'deferred':
        return 'bg-yellow-100 text-yellow-800'
      case 'abandoned':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div
      className={`border rounded-lg p-4 ${isCurrent ? 'border-blue-500 bg-blue-50/50' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          {getStatusIcon(target.status, target.progress_percentage)}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{target.title}</h3>
            {target.description && (
              <p className="text-sm text-gray-600 mt-1">{target.description}</p>
            )}
            {target.goal_title && (
              <p className="text-xs text-gray-500 mt-2">
                Goal: {target.goal_title}
              </p>
            )}
          </div>
        </div>
        <Badge className={getStatusColor(target.status)}>{target.status}</Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-900">
            {target.progress_percentage}%
          </span>
        </div>
        <Progress value={target.progress_percentage} className="h-2" />
      </div>

      {/* Commitment Count */}
      {target.commitment_count !== undefined && target.commitment_count > 0 && (
        <div className="mt-3 text-sm text-gray-600">
          {target.completed_commitment_count || 0} of {target.commitment_count}{' '}
          commitments completed
        </div>
      )}
    </div>
  )
}
