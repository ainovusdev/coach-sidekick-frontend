'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SprintService } from '@/services/sprint-service'
import { Sprint } from '@/types/sprint'
import {
  Target,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  Play,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

export default function ClientSprintsPage() {
  const router = useRouter()
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get client ID from context (will be set by auth)
    // For now, load from API response
    loadSprints()
  }, [])

  const loadSprints = async () => {
    setLoading(true)
    try {
      // API will automatically filter by current user's client_id
      const data = await SprintService.listSprints()
      setSprints(data)
    } catch (error) {
      console.error('Failed to load sprints:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'planning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-3 w-3" />
      case 'completed':
        return <CheckCircle className="h-3 w-3" />
      case 'planning':
        return <Clock className="h-3 w-3" />
      default:
        return null
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Sprints</h1>
        <p className="text-gray-600 mt-2">
          View your sprint outcomes and track progress over 6-8 week periods
        </p>
      </div>

      {/* Sprint Cards */}
      {sprints.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Sprints Yet
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              Your coach will create sprints to organize your outcomes and
              desired wins
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sprints.map(sprint => {
            const daysRemaining = Math.max(
              0,
              differenceInDays(new Date(sprint.end_date), new Date()),
            )

            return (
              <Card
                key={sprint.id}
                className="hover:shadow-lg transition-shadow cursor-pointer border-gray-200"
                onClick={() =>
                  router.push(`/client-portal/sprints/${sprint.id}`)
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Sprint {sprint.sprint_number}
                        </Badge>
                        <Badge
                          className={`text-xs ${getStatusColor(sprint.status)}`}
                        >
                          {getStatusIcon(sprint.status)}
                          <span className="ml-1">{sprint.status}</span>
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{sprint.title}</CardTitle>
                      {sprint.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {sprint.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold text-gray-900">
                        {sprint.progress_percentage || 0}%
                      </span>
                    </div>
                    <Progress
                      value={sprint.progress_percentage || 0}
                      className="h-2"
                    />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-gray-400" />
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {sprint.target_count || 0}
                        </div>
                        <div className="text-gray-500 text-xs">
                          Desired Wins
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {sprint.duration_weeks || 0}w
                        </div>
                        <div className="text-gray-500 text-xs">Duration</div>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                    <span>{format(new Date(sprint.start_date), 'MMM d')}</span>
                    <TrendingUp className="h-3 w-3" />
                    <span>
                      {format(new Date(sprint.end_date), 'MMM d, yyyy')}
                    </span>
                  </div>

                  {/* Days Remaining */}
                  {sprint.status === 'active' && (
                    <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        {daysRemaining} days remaining
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
