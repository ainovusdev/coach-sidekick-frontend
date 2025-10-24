'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Trophy, CheckCircle, Circle, Loader2, ArrowRight } from 'lucide-react'
import { SprintService } from '@/services/sprint-service'
import { TargetService } from '@/services/target-service'
import { Target } from '@/types/sprint'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface DesiredWinsWidgetProps {
  clientId?: string
  limit?: number
}

export function DesiredWinsWidget({
  clientId,
  limit = 5,
}: DesiredWinsWidgetProps) {
  const [loading, setLoading] = useState(true)
  const [targets, setTargets] = useState<Target[]>([])

  useEffect(() => {
    if (clientId) {
      loadTargets()
    }
  }, [clientId])

  const loadTargets = async () => {
    try {
      setLoading(true)

      // Get current sprint
      if (!clientId) return

      const currentSprint = await SprintService.getCurrentSprint(clientId)

      if (currentSprint) {
        // Fetch active targets for current sprint
        const sprintTargets = await TargetService.listTargets({
          sprint_id: currentSprint.id,
          status: 'active',
        })
        setTargets(sprintTargets.slice(0, limit))
      }
    } catch (error) {
      console.error('Failed to load targets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string, progress: number) => {
    if (status === 'completed' || progress === 100) {
      return <CheckCircle className="w-4 h-4 text-green-600" />
    }
    return <Circle className="w-4 h-4 text-gray-400" />
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
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Trophy className="h-5 w-5 text-yellow-600" />
            My Desired Wins
          </CardTitle>
          {targets.length > 0 && (
            <Link href="/client-portal/sprints">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                View Sprint
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : targets.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No active desired wins yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Your coach will help you set targets during your sessions
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {targets.map(target => (
              <div
                key={target.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-2 flex-1">
                    {getStatusIcon(target.status, target.progress_percentage)}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {target.title}
                      </h4>
                      {target.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {target.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className={`text-xs ${getStatusColor(target.status)}`}>
                    {target.status}
                  </Badge>
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium text-gray-900">
                      {target.progress_percentage}%
                    </span>
                  </div>
                  <Progress
                    value={target.progress_percentage}
                    className="h-1.5"
                  />
                </div>

                {/* Commitments */}
                {target.commitment_count !== undefined &&
                  target.commitment_count > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {target.completed_commitment_count || 0} of{' '}
                      {target.commitment_count} commitments
                    </div>
                  )}
              </div>
            ))}

            {targets.length >= limit && (
              <div className="pt-2">
                <Link href="/client-portal/sprints">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    View All Desired Wins
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
