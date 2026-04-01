'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ActiveSessionsCard } from '@/components/client-portal/active-sessions-card'
import { ClientPortalChat } from '@/components/client-portal/client-portal-chat'
import { ClientLastSessionInsights } from '@/components/client-portal/client-last-session-insights'
import { UpcomingTasksWidget } from '@/components/client-portal/upcoming-tasks-widget'
import { RecentResourcesWidget } from '@/components/client-portal/recent-resources-widget'
import { GoalsTreeView } from '@/app/clients/[clientId]/components/goals-tree-view'
import { GoalFormModal } from '@/components/goals/goal-form-modal'
import { SprintFormModal } from '@/components/sprints/sprint-form-modal'
import { TargetFormModal } from '@/components/sprints/target-form-modal'
import { CommitmentCreatePanel } from '@/components/commitments/commitment-create-panel'
import { CommitmentDetailPanel } from '@/components/commitments/commitment-detail-panel'
import { UnifiedCreationModal } from '@/app/clients/[clientId]/components/unified-creation-modal'
import { GoalService } from '@/services/goal-service'
import { TargetService } from '@/services/target-service'
import { SprintService } from '@/services/sprint-service'
import { useGoals } from '@/hooks/queries/use-goals'
import { useSprints } from '@/hooks/queries/use-sprints'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
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
import {
  ArrowRight,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Trash2,
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
import type { Task } from '@/services/client-dashboard-api'

interface DashboardData {
  client_info: {
    id: string
    name: string
    email: string
    coach_id: string
    member_since: string | null
  }
  recent_sessions: Array<{
    id: string
    date: string
    duration_minutes: number
    status: string
    summary?: string | null
    key_topics?: string[]
    score?: number
    action_items?: string[]
  }>
  stats: {
    total_sessions: number
    completed_tasks: number
    pending_tasks: number
    active_goals: number
    current_streak_days: number
    next_session: string | null
    unread_notifications: number
    sessions_this_month?: number
    completion_rate?: number
  }
  upcoming_tasks: Task[]
  active_goals: Array<any>
  recent_notifications: Array<any>
  coach_name?: string
}

export default function ClientDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  // Modal state
  const [unifiedCreateOpen, setUnifiedCreateOpen] = useState(false)
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [sprintModalOpen, setSprintModalOpen] = useState(false)
  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false)
  const [showCommitmentCreatePanel, setShowCommitmentCreatePanel] =
    useState(false)
  const [editingGoal, setEditingGoal] = useState<any>(null)
  const [editingOutcome, setEditingOutcome] = useState<any>(null)
  const [editingSprint, setEditingSprint] = useState<any>(null)
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<
    string | null
  >(null)

  // Delete dialog state
  const [showDeleteGoalDialog, setShowDeleteGoalDialog] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState<any>(null)
  const [isDeletingGoal, setIsDeletingGoal] = useState(false)
  const [showDeleteOutcomeDialog, setShowDeleteOutcomeDialog] = useState(false)
  const [outcomeToDelete, setOutcomeToDelete] = useState<any>(null)
  const [isDeletingOutcome, setIsDeletingOutcome] = useState(false)
  const [showDeleteSprintDialog, setShowDeleteSprintDialog] = useState(false)
  const [sprintToDelete, setSprintToDelete] = useState<any>(null)
  const [isDeletingSprint, setIsDeletingSprint] = useState(false)

  const clientId = dashboardData?.client_info?.id

  // Fetch goals and sprints for modal forms
  const { data: goals = [] } = useGoals(clientId)
  const { data: sprints = [] } = useSprints(
    clientId ? { client_id: clientId, status: 'active' } : undefined,
  )

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.error('No auth token found')
        return
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
      const viewAsClient = sessionStorage.getItem('view_as_client_id')
      if (viewAsClient) {
        headers['X-View-As-Client'] = viewAsClient
      }
      const response = await fetch(`${apiUrl}/client/dashboard`, { headers })

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Unauthorized - token may be expired')
          return
        }
        throw new Error('Failed to fetch dashboard')
      }

      const data = await response.json()
      setDashboardData(data)
    } catch (err: any) {
      console.error('Dashboard fetch error:', err)
      setError(err.message || 'Failed to load dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // --- Delete / Complete Handlers ---

  const handleDeleteGoal = async () => {
    if (!goalToDelete?.id) return
    setIsDeletingGoal(true)
    try {
      await GoalService.deleteGoal(goalToDelete.id)
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all })
      toast.success('Vision Deleted', {
        description: `"${goalToDelete.title}" has been deleted successfully`,
      })
      setShowDeleteGoalDialog(false)
      setGoalToDelete(null)
    } catch {
      toast.error('Failed to delete vision')
    } finally {
      setIsDeletingGoal(false)
    }
  }

  const handleDeleteOutcome = async () => {
    if (!outcomeToDelete?.id) return
    setIsDeletingOutcome(true)
    try {
      await TargetService.deleteTarget(outcomeToDelete.id)
      queryClient.invalidateQueries({ queryKey: queryKeys.targets.all })
      toast.success('Outcome Deleted', {
        description: `"${outcomeToDelete.title}" has been deleted successfully`,
      })
      setShowDeleteOutcomeDialog(false)
      setOutcomeToDelete(null)
    } catch {
      toast.error('Failed to delete outcome')
    } finally {
      setIsDeletingOutcome(false)
    }
  }

  const handleDeleteSprint = async () => {
    if (!sprintToDelete?.id) return
    setIsDeletingSprint(true)
    try {
      await SprintService.deleteSprint(sprintToDelete.id)
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all })
      toast.success('Sprint Deleted', {
        description: `"${sprintToDelete.title}" has been deleted successfully`,
      })
      setShowDeleteSprintDialog(false)
      setSprintToDelete(null)
    } catch {
      toast.error('Failed to delete sprint')
    } finally {
      setIsDeletingSprint(false)
    }
  }

  const handleCompleteOutcome = async (outcome: any) => {
    if (!outcome?.id) return
    try {
      await TargetService.updateTarget(outcome.id, { status: 'completed' })
      queryClient.invalidateQueries({ queryKey: queryKeys.targets.all })
      toast.success('Outcome Completed', {
        description: `"${outcome.title}" has been marked as complete`,
      })
    } catch {
      toast.error('Failed to complete outcome')
    }
  }

  const handleCompleteSprint = async (sprint: any) => {
    if (!sprint?.id) return
    try {
      await SprintService.updateSprint(sprint.id, { status: 'completed' })
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all })
      toast.success('Sprint Completed', {
        description: `"${sprint.title}" has been marked as complete`,
      })
    } catch {
      toast.error('Failed to complete sprint')
    }
  }

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.goals.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.targets.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No data available</p>
        </div>
      </div>
    )
  }

  const lastSession = dashboardData.recent_sessions?.[0]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">
          {getGreeting()}
        </p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {dashboardData.client_info?.name || 'Welcome back'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Your coaching journey at a glance
          {dashboardData.coach_name && (
            <>
              <span className="mx-2">·</span>
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                Coach: {dashboardData.coach_name}
              </span>
            </>
          )}
          {dashboardData.client_info?.member_since && (
            <>
              <span className="mx-2">·</span>
              <span>
                Member since{' '}
                {formatDate(dashboardData.client_info.member_since, 'MMM yyyy')}
              </span>
            </>
          )}
        </p>
      </div>

      {/* Active Sessions Banner */}
      <div className="mb-6">
        <ActiveSessionsCard />
      </div>

      {/* Vision & Progress Board - Full Width */}
      {clientId && (
        <div className="mb-8">
          <GoalsTreeView
            clientId={clientId}
            clientName={dashboardData?.client_info?.name}
            isClientPortal
            onCreateNew={() => setUnifiedCreateOpen(true)}
            onCreateGoal={() => setGoalModalOpen(true)}
            onCreateSprint={() => setSprintModalOpen(true)}
            onCreateOutcome={() => setOutcomeModalOpen(true)}
            onCreateCommitment={() => {
              setShowCommitmentCreatePanel(true)
            }}
            onCommitmentClick={c => setSelectedCommitmentId(c.id)}
            onEditGoal={goal => {
              setEditingGoal(goal)
              setGoalModalOpen(true)
            }}
            onDeleteGoal={goal => {
              setGoalToDelete(goal)
              setShowDeleteGoalDialog(true)
            }}
            onEditOutcome={outcome => {
              setEditingOutcome(outcome)
              setOutcomeModalOpen(true)
            }}
            onDeleteOutcome={outcome => {
              setOutcomeToDelete(outcome)
              setShowDeleteOutcomeDialog(true)
            }}
            onCompleteOutcome={handleCompleteOutcome}
            onEditSprint={sprint => {
              setEditingSprint(sprint)
              setSprintModalOpen(true)
            }}
            onDeleteSprint={sprint => {
              setSprintToDelete(sprint)
              setShowDeleteSprintDialog(true)
            }}
            onCompleteSprint={handleCompleteSprint}
          />
        </div>
      )}

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left Panel - Coaching Data */}
        <div className="space-y-4">
          {/* Last Session Insights */}
          <ClientLastSessionInsights session={lastSession} />

          {/* Upcoming Commitments */}
          <UpcomingTasksWidget clientId={clientId} />

          {/* Recent Resources */}
          <RecentResourcesWidget />
        </div>

        {/* Right Panel - AI Chat */}
        <div className="lg:sticky lg:top-[80px] lg:self-start">
          <div className="h-[500px] lg:h-[calc(100vh-160px)] lg:min-h-[500px] lg:max-h-[800px]">
            <ClientPortalChat />
          </div>
        </div>
      </div>

      {/* Recent Sessions - Full Width */}
      {dashboardData.recent_sessions &&
        dashboardData.recent_sessions.length > 1 && (
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Recent Sessions
                </CardTitle>
                <Link href="/client-portal/sessions">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.recent_sessions.slice(1, 4).map(session => (
                  <Link
                    key={session.id}
                    href={`/client-portal/sessions/${session.id}`}
                  >
                    <div className="group p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(session.date, 'MMM d, yyyy')}
                        </p>
                        <Badge
                          variant="secondary"
                          className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        >
                          {session.duration_minutes} min
                        </Badge>
                      </div>
                      {session.summary && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {session.summary}
                        </p>
                      )}
                      <div className="flex items-center justify-end mt-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 font-medium">
                          View details
                          <ChevronRight className="h-3 w-3 inline ml-0.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* ===== Modals ===== */}
      {clientId && (
        <>
          <UnifiedCreationModal
            open={unifiedCreateOpen}
            onOpenChange={setUnifiedCreateOpen}
            clientId={clientId}
            goals={goals}
            sprints={sprints}
            onSuccess={invalidateAll}
            onCreateCommitment={() => {
              setUnifiedCreateOpen(false)
              setShowCommitmentCreatePanel(true)
            }}
          />

          <GoalFormModal
            open={goalModalOpen}
            onOpenChange={open => {
              setGoalModalOpen(open)
              if (!open) setEditingGoal(null)
            }}
            clientId={clientId}
            goal={editingGoal}
            mode={editingGoal ? 'edit' : 'create'}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.goals.all })
              setEditingGoal(null)
            }}
          />

          <SprintFormModal
            open={sprintModalOpen}
            onOpenChange={open => {
              setSprintModalOpen(open)
              if (!open) setEditingSprint(null)
            }}
            clientId={clientId}
            sprint={editingSprint}
            mode={editingSprint ? 'edit' : 'create'}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all })
              setEditingSprint(null)
            }}
          />

          <TargetFormModal
            open={outcomeModalOpen}
            onOpenChange={open => {
              setOutcomeModalOpen(open)
              if (!open) setEditingOutcome(null)
            }}
            sprintId={sprints[0]?.id}
            goals={goals.map((g: any) => ({ id: g.id, title: g.title }))}
            target={editingOutcome}
            mode={editingOutcome ? 'edit' : 'create'}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.targets.all })
              setEditingOutcome(null)
            }}
          />

          <CommitmentCreatePanel
            isOpen={showCommitmentCreatePanel}
            onClose={() => setShowCommitmentCreatePanel(false)}
            clientId={clientId}
            onCreated={commitment => {
              setShowCommitmentCreatePanel(false)
              setSelectedCommitmentId(commitment.id)
              invalidateAll()
            }}
          />

          <CommitmentDetailPanel
            commitmentId={selectedCommitmentId}
            clientId={clientId}
            onClose={() => setSelectedCommitmentId(null)}
            onCommitmentUpdate={invalidateAll}
          />
        </>
      )}

      {/* ===== Delete Dialogs ===== */}
      <AlertDialog
        open={showDeleteGoalDialog}
        onOpenChange={open => {
          if (!isDeletingGoal) setShowDeleteGoalDialog(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <AlertDialogTitle>Delete Vision</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{goalToDelete?.title}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingGoal}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGoal}
              disabled={isDeletingGoal}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingGoal ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Vision
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showDeleteOutcomeDialog}
        onOpenChange={open => {
          if (!isDeletingOutcome) setShowDeleteOutcomeDialog(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <AlertDialogTitle>Delete Outcome</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{outcomeToDelete?.title}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingOutcome}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOutcome}
              disabled={isDeletingOutcome}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingOutcome ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Outcome
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showDeleteSprintDialog}
        onOpenChange={open => {
          if (!isDeletingSprint) setShowDeleteSprintDialog(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <AlertDialogTitle>Delete Sprint</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{sprintToDelete?.title}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingSprint}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSprint}
              disabled={isDeletingSprint}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingSprint ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Sprint
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
