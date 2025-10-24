'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { SprintService } from '@/services/sprint-service'
import { GoalService } from '@/services/goal-service'
import { TargetFormModal } from './target-form-modal'
import { SprintDetail, Target } from '@/types/sprint'
import {
  Target as TargetIcon,
  Plus,
  CheckCircle,
  Circle,
  Link2,
  Loader2,
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface SprintTargetsManagerProps {
  clientId: string
  onRefresh?: () => void
}

export function SprintTargetsManager({
  clientId,
  onRefresh,
}: SprintTargetsManagerProps) {
  const [sprint, setSprint] = useState<SprintDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false)
  const [availableGoals, setAvailableGoals] = useState<
    Array<{ id: string; title: string }>
  >([])
  const [groupedTargets, setGroupedTargets] = useState<
    Record<string, Target[]>
  >({})

  useEffect(() => {
    if (clientId) {
      loadCurrentSprint()
      loadGoals()
    }
  }, [clientId])

  const loadGoals = async () => {
    try {
      // Load all goals for this client
      const goals = await GoalService.listGoals(clientId)
      setAvailableGoals(goals.map(g => ({ id: g.id, title: g.title })))
    } catch (error) {
      console.error('Failed to load goals:', error)
    }
  }

  const loadCurrentSprint = async () => {
    setLoading(true)
    try {
      const data = await SprintService.getCurrentSprint(clientId)
      if (data) {
        setSprint(data)

        // Group targets by goal
        if (data.targets) {
          const grouped = data.targets.reduce(
            (acc, target) => {
              const goalId = target.goal_id
              if (!acc[goalId]) {
                acc[goalId] = []
              }
              acc[goalId].push(target)
              return acc
            },
            {} as Record<string, Target[]>,
          )
          setGroupedTargets(grouped)
        }
      }
    } catch (error) {
      console.error('Failed to load current sprint:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  if (!sprint) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <TargetIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No active sprint</p>
          <p className="text-sm text-gray-500 mt-2">
            Create a sprint first to add desired wins
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sprint Desired Wins & Outcomes</CardTitle>
            <Button
              size="sm"
              onClick={() => setIsTargetModalOpen(true)}
              disabled={availableGoals.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Desired Win
            </Button>
          </div>
          {availableGoals.length === 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Create outcomes first before adding desired wins
            </p>
          )}
        </CardHeader>
        <CardContent>
          {Object.entries(groupedTargets).length === 0 ? (
            <div className="text-center py-8">
              <TargetIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                No desired wins in this sprint yet
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setIsTargetModalOpen(true)}
                disabled={availableGoals.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Desired Win
              </Button>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {Object.entries(groupedTargets).map(([goalId, targets]) => {
                const goalTitle = targets[0]?.goal_title || 'Outcome'
                const goalProgress =
                  targets.reduce((sum, t) => sum + t.progress_percentage, 0) /
                  targets.length

                return (
                  <AccordionItem key={goalId} value={goalId}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <TargetIcon className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-900">
                              {goalTitle}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>{targets.length} desired wins</span>
                              <span>•</span>
                              <span>{Math.round(goalProgress)}% complete</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-32">
                          <Progress value={goalProgress} className="h-2" />
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pl-14 pr-4">
                        {targets.map(target => (
                          <Card key={target.id} className="border-gray-200">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {target.status === 'completed' ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-gray-400" />
                                    )}
                                    <h4 className="font-medium text-gray-900">
                                      {target.title}
                                    </h4>
                                  </div>
                                  {target.description && (
                                    <p className="text-sm text-gray-600 ml-6">
                                      {target.description}
                                    </p>
                                  )}
                                </div>
                                <Badge
                                  className={
                                    target.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }
                                >
                                  {target.status}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-4 ml-6">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-gray-600">
                                      Progress
                                    </span>
                                    <span className="font-medium">
                                      {target.progress_percentage}%
                                    </span>
                                  </div>
                                  <Progress
                                    value={target.progress_percentage}
                                    className="h-1.5"
                                  />
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Link2 className="h-4 w-4" />
                                  <span>
                                    {target.commitment_count || 0} commitments
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Target Form Modal */}
      {sprint && (
        <TargetFormModal
          open={isTargetModalOpen}
          onOpenChange={setIsTargetModalOpen}
          sprintId={sprint.id}
          goals={availableGoals}
          onSuccess={() => {
            loadCurrentSprint()
            onRefresh?.()
          }}
        />
      )}
    </>
  )
}
