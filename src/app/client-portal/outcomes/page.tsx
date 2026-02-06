'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useClientGoals,
  useClientOutcomes,
  useCreateClientOutcome,
} from '@/hooks/queries/use-client-outcomes'
import { ClientOutcomeCard } from '@/components/client-portal/client-outcome-card'
import {
  Target,
  CheckCircle,
  TrendingUp,
  Plus,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  BarChart3,
} from 'lucide-react'

type StatusFilter = 'all' | 'active' | 'completed' | 'deferred'

export default function OutcomesPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [selectedGoalId, setSelectedGoalId] = useState('')
  const [collapsedGoals, setCollapsedGoals] = useState<Set<string>>(new Set())

  const {
    data: outcomes,
    isLoading,
    error,
    refetch,
  } = useClientOutcomes(
    statusFilter !== 'all' ? { status: statusFilter } : undefined,
  )
  const { data: goals } = useClientGoals()
  const createOutcome = useCreateClientOutcome()

  const toggleGoalCollapse = (goalTitle: string) => {
    setCollapsedGoals(prev => {
      const next = new Set(prev)
      if (next.has(goalTitle)) {
        next.delete(goalTitle)
      } else {
        next.add(goalTitle)
      }
      return next
    })
  }

  const handleCreateOutcome = async () => {
    if (!newTitle.trim() || !selectedGoalId) return

    await createOutcome.mutateAsync({
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      goal_id: selectedGoalId,
    })

    setNewTitle('')
    setNewDescription('')
    setSelectedGoalId('')
    setCreateDialogOpen(false)
  }

  // Compute stats
  const allOutcomes = outcomes || []
  const activeCount = allOutcomes.filter(o => o.status === 'active').length
  const completedCount = allOutcomes.filter(
    o => o.status === 'completed',
  ).length
  const totalCount = allOutcomes.length
  const overallProgress =
    totalCount > 0
      ? Math.round(
          allOutcomes.reduce((sum, o) => sum + o.progress_percentage, 0) /
            totalCount,
        )
      : 0

  // Group outcomes by vision (goal)
  const groupedByGoal: Record<string, typeof allOutcomes> = {}
  const ungrouped: typeof allOutcomes = []
  for (const outcome of allOutcomes) {
    if (outcome.goal_titles.length > 0) {
      const goalTitle = outcome.goal_titles[0]
      if (!groupedByGoal[goalTitle]) groupedByGoal[goalTitle] = []
      groupedByGoal[goalTitle].push(outcome)
    } else {
      ungrouped.push(outcome)
    }
  }

  const statusFilters: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
    { label: 'Deferred', value: 'deferred' },
  ]

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <AlertCircle className="size-12 mx-auto mb-4 text-red-600" />
          <p className="text-gray-600 mb-4">Failed to load outcomes</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Outcomes</h1>
          <p className="text-gray-600 mt-2">
            Track your progress toward your goals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-gray-300"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Outcome
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {totalCount}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {activeCount}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {completedCount}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {overallProgress}%
                </div>
                <div className="text-sm text-gray-600">Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress Bar */}
      {totalCount > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span className="font-medium">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      )}

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2 mb-6">
        {statusFilters.map(filter => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              statusFilter === filter.value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Outcomes Content */}
      {allOutcomes.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Outcomes Yet
            </h3>
            <p className="text-gray-600 text-center max-w-md mb-6">
              Create your first outcome to start tracking progress toward your
              visions
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Outcome
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Grouped by Vision */}
          {Object.entries(groupedByGoal).map(([goalTitle, goalOutcomes]) => (
            <div key={goalTitle}>
              <button
                onClick={() => toggleGoalCollapse(goalTitle)}
                className="flex items-center gap-2 mb-3 group"
              >
                {collapsedGoals.has(goalTitle) ? (
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                )}
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  {goalTitle}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {goalOutcomes.length}
                </Badge>
              </button>
              {!collapsedGoals.has(goalTitle) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {goalOutcomes.map(outcome => (
                    <ClientOutcomeCard key={outcome.id} outcome={outcome} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Ungrouped outcomes */}
          {ungrouped.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Other Outcomes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ungrouped.map(outcome => (
                  <ClientOutcomeCard key={outcome.id} outcome={outcome} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Outcome Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Outcome</DialogTitle>
            <DialogDescription>
              Define a new outcome linked to one of your visions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="outcome-title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="outcome-title"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g., Complete leadership certification"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="outcome-goal">
                Link to Vision <span className="text-red-500">*</span>
              </Label>
              <select
                id="outcome-goal"
                value={selectedGoalId}
                onChange={e => setSelectedGoalId(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="">Select a vision...</option>
                {(goals || []).map(goal => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outcome-description">
                Description <span className="text-gray-400">(optional)</span>
              </Label>
              <Textarea
                id="outcome-description"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Describe what success looks like..."
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOutcome}
              disabled={
                !newTitle.trim() || !selectedGoalId || createOutcome.isPending
              }
              className="bg-gray-900 hover:bg-gray-800"
            >
              {createOutcome.isPending ? 'Creating...' : 'Create Outcome'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
