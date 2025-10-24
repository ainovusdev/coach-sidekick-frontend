'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { SprintService } from '@/services/sprint-service'
import { GoalService } from '@/services/goal-service'
import { SprintDetail, Target } from '@/types/sprint'
import { TargetFormModal } from '@/components/sprints/target-form-modal'
import {
  ArrowLeft,
  Target as TargetIcon,
  CheckCircle,
  Circle,
  Link2,
  Plus,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

export default function ClientSprintDetailPage({
  params,
}: {
  params: Promise<{ sprintId: string }>
}) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const [sprint, setSprint] = useState<SprintDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [groupedTargets, setGroupedTargets] = useState<
    Record<string, Target[]>
  >({})
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false)
  const [availableOutcomes, setAvailableOutcomes] = useState<
    Array<{ id: string; title: string }>
  >([])

  useEffect(() => {
    loadSprint()
    loadOutcomes()
  }, [resolvedParams.sprintId])

  const loadOutcomes = async () => {
    if (!sprint?.client_id) return

    try {
      // Load goals from API
      const goals = await GoalService.listGoals(sprint.client_id)
      setAvailableOutcomes(goals.map(g => ({ id: g.id, title: g.title })))
    } catch (error) {
      console.error('Failed to load goals:', error)
      // Fallback: extract from sprint targets
      if (sprint?.targets) {
        const goalsMap = new Map<string, string>()
        sprint.targets.forEach(target => {
          if (target.goal_title) {
            goalsMap.set(target.goal_id, target.goal_title)
          }
        })
        setAvailableOutcomes(
          Array.from(goalsMap.entries()).map(([id, title]) => ({ id, title })),
        )
      }
    }
  }

  const loadSprint = async () => {
    setLoading(true)
    try {
      const data = await SprintService.getSprint(resolvedParams.sprintId)
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
    } catch (error) {
      console.error('Failed to load sprint:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!sprint) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-600">Sprint not found</p>
      </div>
    )
  }

  const daysRemaining = differenceInDays(new Date(sprint.end_date), new Date())
  const totalDays = differenceInDays(
    new Date(sprint.end_date),
    new Date(sprint.start_date),
  )
  const daysElapsed = totalDays - daysRemaining
  const timeProgress = Math.min(
    100,
    Math.max(0, (daysElapsed / totalDays) * 100),
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/client-portal/sprints')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sprints
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline">Sprint {sprint.sprint_number}</Badge>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                {sprint.status}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{sprint.title}</h1>
            {sprint.description && (
              <p className="text-gray-600 mt-2">{sprint.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {sprint.progress_percentage || 0}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Overall Progress</div>
              <Progress
                value={sprint.progress_percentage || 0}
                className="h-2 mt-3"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {sprint.completed_target_count || 0}/{sprint.target_count || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Desired Wins Completed
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {Math.max(0, daysRemaining)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Days Remaining</div>
              <Progress value={timeProgress} className="h-2 mt-3" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {sprint.duration_weeks || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Week Sprint</div>
              <div className="text-xs text-gray-500 mt-2">
                {format(new Date(sprint.start_date), 'MMM d')} -{' '}
                {format(new Date(sprint.end_date), 'MMM d')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outcomes & Targets */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Outcomes & Desired Wins</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsTargetModalOpen(true)}
              disabled={availableOutcomes.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Target
            </Button>
          </div>
          {availableOutcomes.length === 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Your coach needs to create outcomes before adding desired wins
            </p>
          )}
        </CardHeader>
        <CardContent>
          {Object.entries(groupedTargets).length === 0 ? (
            <div className="text-center py-12">
              <TargetIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                No desired wins in this sprint yet
              </p>
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
      <TargetFormModal
        open={isTargetModalOpen}
        onOpenChange={setIsTargetModalOpen}
        sprintId={resolvedParams.sprintId}
        goals={availableOutcomes}
        onSuccess={() => {
          loadSprint()
          loadOutcomes()
        }}
      />
    </div>
  )
}
