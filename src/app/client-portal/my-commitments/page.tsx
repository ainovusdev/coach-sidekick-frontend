'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  ClientCommitmentService,
  ClientCommitmentCreate,
  ClientCommitmentUpdate,
} from '@/services/client-commitment-service'
import { Commitment } from '@/types/commitment'
import {
  useClientOutcomes,
  useClientGoals,
  useCreateClientOutcome,
} from '@/hooks/queries/use-client-outcomes'
import { ClientOutcomeCard } from '@/components/client-portal/client-outcome-card'
import { CommitmentProgressModal } from '@/components/commitments/commitment-progress-modal'
import { ClientCommitmentForm } from '@/components/client-portal/client-commitment-form'
import { CommitmentKanbanBoard } from '@/components/commitments/commitment-kanban-board'
import {
  Target,
  CheckCircle,
  TrendingUp,
  Plus,
  LayoutGrid,
  List,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type ViewMode = 'board' | 'list'

export default function MyCommitmentsPage() {
  const [loading, setLoading] = useState(true)
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('board')
  const [selectedCommitment, setSelectedCommitment] =
    useState<Commitment | null>(null)
  const [progressModalOpen, setProgressModalOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [commitmentToDelete, setCommitmentToDelete] =
    useState<Commitment | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [outcomesExpanded, setOutcomesExpanded] = useState(false)
  const [createOutcomeDialogOpen, setCreateOutcomeDialogOpen] = useState(false)
  const [newOutcomeTitle, setNewOutcomeTitle] = useState('')
  const [newOutcomeDescription, setNewOutcomeDescription] = useState('')
  const [selectedGoalId, setSelectedGoalId] = useState('')
  const [collapsedGoals, setCollapsedGoals] = useState<Set<string>>(new Set())
  const { data: allOutcomes } = useClientOutcomes()
  const { data: goals } = useClientGoals()
  const createOutcome = useCreateClientOutcome()

  // Build a map of outcome ID → title for badge display
  const outcomeMap: Record<string, string> = {}
  if (allOutcomes) {
    for (const o of allOutcomes) {
      outcomeMap[o.id] = o.title
    }
  }

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
    if (!newOutcomeTitle.trim() || !selectedGoalId) return
    await createOutcome.mutateAsync({
      title: newOutcomeTitle.trim(),
      description: newOutcomeDescription.trim() || undefined,
      goal_id: selectedGoalId,
    })
    setNewOutcomeTitle('')
    setNewOutcomeDescription('')
    setSelectedGoalId('')
    setCreateOutcomeDialogOpen(false)
  }

  // Group outcomes by vision (goal)
  const outcomesList = allOutcomes || []
  const groupedByGoal: Record<string, typeof outcomesList> = {}
  const ungroupedOutcomes: typeof outcomesList = []
  for (const outcome of outcomesList) {
    if (outcome.goal_titles?.length > 0) {
      const goalTitle = outcome.goal_titles[0]
      if (!groupedByGoal[goalTitle]) groupedByGoal[goalTitle] = []
      groupedByGoal[goalTitle].push(outcome)
    } else {
      ungroupedOutcomes.push(outcome)
    }
  }

  useEffect(() => {
    loadCommitments()
  }, [])

  const loadCommitments = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await ClientCommitmentService.listCommitments()
      setCommitments(response.commitments || [])
    } catch (err) {
      console.error('Failed to load commitments:', err)
      setError('Failed to load commitments')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCommitment = async (
    data: ClientCommitmentCreate | ClientCommitmentUpdate,
  ) => {
    try {
      await ClientCommitmentService.createCommitment(
        data as ClientCommitmentCreate,
      )
      toast.success('Commitment created!')
      await loadCommitments()
    } catch (err) {
      console.error('Failed to create commitment:', err)
      toast.error('Failed to create commitment')
      throw err
    }
  }

  const handleUpdateCommitment = async (
    data: ClientCommitmentCreate | ClientCommitmentUpdate,
  ) => {
    if (!selectedCommitment) return
    try {
      await ClientCommitmentService.updateCommitment(
        selectedCommitment.id,
        data as ClientCommitmentUpdate,
      )
      toast.success('Commitment updated!')
      await loadCommitments()
    } catch (err) {
      console.error('Failed to update commitment:', err)
      toast.error('Failed to update commitment')
      throw err
    }
  }

  const handleUpdateProgress = async (data: any) => {
    if (!selectedCommitment) return
    try {
      await ClientCommitmentService.updateProgress(selectedCommitment.id, data)
      toast.success('Progress updated!')
      await loadCommitments()
      setProgressModalOpen(false)
    } catch (err) {
      console.error('Failed to update progress:', err)
      toast.error('Failed to update progress')
    }
  }

  const handleDeleteCommitment = async () => {
    if (!commitmentToDelete) return
    try {
      await ClientCommitmentService.deleteCommitment(commitmentToDelete.id)
      toast.success('Commitment deleted')
      setDeleteDialogOpen(false)
      setCommitmentToDelete(null)
      await loadCommitments()
    } catch (err) {
      console.error('Failed to delete commitment:', err)
      toast.error('Failed to delete commitment')
    }
  }

  const openProgressModal = (commitment: Commitment) => {
    setSelectedCommitment(commitment)
    setProgressModalOpen(true)
  }

  const openEditModal = (commitment: Commitment) => {
    setSelectedCommitment(commitment)
    setFormModalOpen(true)
  }

  const openCreateModal = () => {
    setSelectedCommitment(null)
    setFormModalOpen(true)
  }

  const confirmDelete = (commitment: Commitment) => {
    setCommitmentToDelete(commitment)
    setDeleteDialogOpen(true)
  }

  // Stats
  const activeCommitments = commitments.filter(c => c.status === 'active')
  const completedCommitments = commitments.filter(c => c.status === 'completed')
  const atRiskCommitments = commitments.filter(
    c =>
      c.status === 'active' &&
      c.target_date &&
      new Date(c.target_date) < new Date(),
  )
  const avgProgress =
    activeCommitments.length > 0
      ? Math.round(
          activeCommitments.reduce((sum, c) => sum + c.progress_percentage, 0) /
            activeCommitments.length,
        )
      : 0

  if (loading) {
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
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadCommitments} variant="outline">
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
          <h1 className="text-3xl font-bold text-gray-900">My Commitments</h1>
          <p className="text-gray-600 mt-2">
            Track and manage your personal commitments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCommitments}
            className="border-gray-300"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Add Commitment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {activeCommitments.length}
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
                  {completedCommitments.length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {atRiskCommitments.length}
                </div>
                <div className="text-sm text-gray-600">At Risk</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {avgProgress}%
                </div>
                <div className="text-sm text-gray-600">Avg Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collapsible Outcomes Section */}
      {outcomesList.length > 0 && (
        <div className="mb-8">
          <button
            onClick={() => setOutcomesExpanded(!outcomesExpanded)}
            className="flex items-center gap-2 group w-full"
          >
            {outcomesExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            )}
            <h2 className="text-lg font-semibold text-gray-900">My Outcomes</h2>
            <Badge variant="secondary" className="text-xs">
              {outcomesList.length}
            </Badge>
            <div className="flex-1" />
            <span
              onClick={e => {
                e.stopPropagation()
                setCreateOutcomeDialogOpen(true)
              }}
              className="text-sm text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Outcome
            </span>
          </button>

          {outcomesExpanded && (
            <div className="mt-4 space-y-6">
              {Object.entries(groupedByGoal).map(
                ([goalTitle, goalOutcomes]) => (
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
                          <ClientOutcomeCard
                            key={outcome.id}
                            outcome={outcome}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ),
              )}

              {ungroupedOutcomes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Other Outcomes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ungroupedOutcomes.map(outcome => (
                      <ClientOutcomeCard key={outcome.id} outcome={outcome} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">All Commitments</h2>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === 'board' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('board')}
            className={viewMode === 'board' ? '' : 'hover:bg-white'}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Board
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? '' : 'hover:bg-white'}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
        </div>
      </div>

      {/* Content */}
      {commitments.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Commitments Yet
            </h3>
            <p className="text-gray-600 text-center max-w-md mb-6">
              Create your first commitment to start tracking your outcomes and
              progress
            </p>
            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Commitment
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'board' ? (
        <CommitmentKanbanBoard
          commitments={commitments}
          outcomeMap={outcomeMap}
          onCommitmentClick={openProgressModal}
          onEdit={openEditModal}
          onDelete={confirmDelete}
          onDrop={async (commitmentId, newStatus) => {
            const statusLabels: Record<string, string> = {
              active: 'To Do',
              in_progress: 'In Progress',
              completed: 'Done',
            }
            const commitment = commitments.find(c => c.id === commitmentId)
            if (!commitment || commitment.status === newStatus) return
            const previousCommitments = [...commitments]
            setCommitments(prev =>
              prev.map(c =>
                c.id === commitmentId
                  ? {
                      ...c,
                      status: newStatus as Commitment['status'],
                      progress_percentage:
                        newStatus === 'completed' ? 100 : c.progress_percentage,
                    }
                  : c,
              ),
            )
            toast.success(`Moved to ${statusLabels[newStatus]}`)
            try {
              await ClientCommitmentService.updateCommitment(commitmentId, {
                status: newStatus as any,
                progress_percentage:
                  newStatus === 'completed' ? 100 : undefined,
              })
              loadCommitments()
            } catch (error) {
              console.error('Error updating commitment:', error)
              setCommitments(previousCommitments)
              toast.error('Failed to update commitment - changes reverted')
            }
          }}
        />
      ) : (
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="bg-gray-50">
            <TabsTrigger value="active">
              Active ({activeCommitments.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedCommitments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3">
            {activeCommitments.length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No active commitments</p>
                </CardContent>
              </Card>
            ) : (
              activeCommitments.map(commitment => (
                <Card
                  key={commitment.id}
                  className="border-gray-200 hover:shadow-sm transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{commitment.type}</Badge>
                          {commitment.priority !== 'medium' && (
                            <Badge variant="outline">
                              {commitment.priority}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          {commitment.title}
                        </h3>
                        {commitment.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {commitment.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(commitment)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openProgressModal(commitment)}
                        >
                          Update Progress
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {completedCommitments.length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No completed commitments yet</p>
                </CardContent>
              </Card>
            ) : (
              completedCommitments.map(commitment => (
                <Card
                  key={commitment.id}
                  className="border-gray-200 opacity-80"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {commitment.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                          <Badge variant="secondary">{commitment.type}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Modals */}
      <ClientCommitmentForm
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        commitment={selectedCommitment}
        onSubmit={
          selectedCommitment ? handleUpdateCommitment : handleCreateCommitment
        }
      />

      {selectedCommitment && (
        <CommitmentProgressModal
          commitment={selectedCommitment}
          open={progressModalOpen}
          onOpenChange={setProgressModalOpen}
          onSubmit={handleUpdateProgress}
        />
      )}

      {/* Create Outcome Dialog */}
      <Dialog
        open={createOutcomeDialogOpen}
        onOpenChange={setCreateOutcomeDialogOpen}
      >
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
                value={newOutcomeTitle}
                onChange={e => setNewOutcomeTitle(e.target.value)}
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
                value={newOutcomeDescription}
                onChange={e => setNewOutcomeDescription(e.target.value)}
                placeholder="Describe what success looks like..."
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setCreateOutcomeDialogOpen(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOutcome}
              disabled={
                !newOutcomeTitle.trim() ||
                !selectedGoalId ||
                createOutcome.isPending
              }
              className="bg-gray-900 hover:bg-gray-800"
            >
              {createOutcome.isPending ? 'Creating...' : 'Create Outcome'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Commitment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{commitmentToDelete?.title}
              &rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCommitment}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
