'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ClientGoal } from '@/services/client-dashboard-api'
import { Target, TrendingUp, Pause, Trophy, X } from 'lucide-react'
import { format } from 'date-fns'

interface GoalsWidgetProps {
  goals: ClientGoal[]
}

export function GoalsWidget({ goals }: GoalsWidgetProps) {
  const getStatusIcon = (status: ClientGoal['status']) => {
    switch (status) {
      case 'active':
        return <TrendingUp className="h-4 w-4 text-green-600" />
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

  const getStatusColor = (status: ClientGoal['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'paused':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'achieved':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'abandoned':
        return 'bg-gray-50 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
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

  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Your Outcomes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              No outcomes set yet. Your coach will help you establish outcomes
              in your next session.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Your Outcomes
          </CardTitle>
          <Badge variant="secondary">{goals.length} Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map(goal => (
          <div
            key={goal.id}
            className={`p-4 rounded-lg border ${getStatusColor(goal.status)}`}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  {getStatusIcon(goal.status)}
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">{goal.title}</h4>
                    {goal.description && (
                      <p className="text-xs text-gray-600">
                        {goal.description}
                      </p>
                    )}
                  </div>
                </div>
                <Badge className={`text-xs ${getCategoryColor(goal.category)}`}>
                  {goal.category}
                </Badge>
              </div>

              {/* Progress Bar */}
              {goal.status === 'active' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
              )}

              {/* Target Date */}
              {goal.target_date && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>Target:</span>
                  <span className="font-medium">
                    {format(new Date(goal.target_date), 'MMM d, yyyy')}
                  </span>
                </div>
              )}

              {/* Milestones */}
              {goal.milestones && goal.milestones.length > 0 && (
                <div className="space-y-1 pt-2 border-t">
                  <p className="text-xs font-medium text-gray-600">
                    Milestones:
                  </p>
                  <div className="space-y-1">
                    {goal.milestones
                      .slice(0, 2)
                      .map((milestone: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              milestone.completed
                                ? 'bg-green-500'
                                : 'bg-gray-300'
                            }`}
                          />
                          <span
                            className={`text-xs ${
                              milestone.completed
                                ? 'line-through text-gray-400'
                                : 'text-gray-600'
                            }`}
                          >
                            {milestone.title}
                          </span>
                        </div>
                      ))}
                    {goal.milestones.length > 2 && (
                      <p className="text-xs text-gray-400">
                        +{goal.milestones.length - 2} more milestones
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
