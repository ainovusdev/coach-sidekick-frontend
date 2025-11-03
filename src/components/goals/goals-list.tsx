'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Goal } from '@/services/goal-service'
import { useGoals } from '@/hooks/queries/use-goals'
import { GoalFormModal } from './goal-form-modal'
import { Target, Plus, Edit, Trophy, Pause, X, Loader2 } from 'lucide-react'

interface GoalsListProps {
  clientId: string
  onRefresh?: () => void
  showCreateButton?: boolean
}

/**
 * Goals List - Now using TanStack Query
 *
 * Benefits:
 * - Goals cached and shown instantly
 * - Automatic background refresh
 * - Shared cache with other goal components
 */
export function GoalsList({
  clientId,
  onRefresh,
  showCreateButton = true,
}: GoalsListProps) {
  // Use TanStack Query for goals
  const { data: goals = [], isLoading: loading, refetch } = useGoals(clientId)

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  const handleGoalCreated = () => {
    refetch()
    onRefresh?.()
  }

  const handleEditClick = (goal: Goal) => {
    setSelectedGoal(goal)
    setModalMode('edit')
    setIsGoalModalOpen(true)
  }

  const handleCreateClick = () => {
    setSelectedGoal(null)
    setModalMode('create')
    setIsGoalModalOpen(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Target className="h-4 w-4 text-green-600" />
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />
      case 'achieved':
        return <Trophy className="h-4 w-4 text-blue-600" />
      case 'abandoned':
        return <X className="h-4 w-4 text-gray-400" />
      default:
        return <Target className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'achieved':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'abandoned':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      career: 'bg-purple-100 text-purple-800',
      personal: 'bg-pink-100 text-pink-800',
      health: 'bg-green-100 text-green-800',
      financial: 'bg-yellow-100 text-yellow-800',
      relationship: 'bg-red-100 text-red-800',
      education: 'bg-blue-100 text-blue-800',
      general: 'bg-gray-100 text-gray-800',
    }
    return colors[category.toLowerCase()] || colors.general
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

  return (
    <>
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Desired outcomes
            </CardTitle>
            {showCreateButton && (
              <Button size="sm" onClick={handleCreateClick}>
                <Plus className="h-4 w-4 mr-2" />
                New Outcome
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No goals set yet</p>
              {showCreateButton && (
                <Button variant="outline" onClick={handleCreateClick}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Goal
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map(goal => (
                <div
                  key={goal.id}
                  className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-purple-100 rounded-lg mt-0.5">
                        {getStatusIcon(goal.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            {goal.title}
                          </h4>
                        </div>
                        {goal.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {goal.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(goal.category)}>
                            {goal.category}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={getStatusColor(goal.status)}
                          >
                            {getStatusIcon(goal.status)}
                            <span className="ml-1">{goal.status}</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {showCreateButton && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(goal)}
                        className="ml-2"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Progress */}
                  {goal.status === 'active' && (
                    <div className="ml-14">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-gray-900">
                          {goal.progress}%
                        </span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goal Form Modal */}
      <GoalFormModal
        open={isGoalModalOpen}
        onOpenChange={setIsGoalModalOpen}
        clientId={clientId}
        goal={selectedGoal}
        mode={modalMode}
        onSuccess={handleGoalCreated}
      />
    </>
  )
}
