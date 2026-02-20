'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { usePermissions } from '@/contexts/permission-context'
import { ProtectedRoute } from '@/components/auth/protected-route'
import PageLayout from '@/components/layout/page-layout'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { OverviewTab } from './components/overview-tab'
import { SessionsChatTab } from './components/sessions-chat-tab'
import { GoalsTreeView } from './components/goals-tree-view'
import { ClientModals } from './components/client-modals'
import { EmptyStateWelcome } from './components/empty-state-welcome'
import { useClientData } from './hooks/use-client-data'
import { useClientModals } from './hooks/use-client-modals'
import { GoalService } from '@/services/goal-service'
import { TargetService } from '@/services/target-service'
import { SprintService } from '@/services/sprint-service'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { toast } from 'sonner'
import {
  User,
  LayoutDashboard,
  MessageSquare,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  Trash2,
  Mic,
  Target,
  Trophy,
  BookOpen,
} from 'lucide-react'
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
import { ClientService } from '@/services/client-service'
import { ClientWinsTimeline } from '@/components/wins/client-wins-timeline'
import { ClientResourcesTab } from './components/client-resources-tab'

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { userId } = useAuth()
  const permissions = usePermissions()
  const isViewer = permissions.isViewer()
  const router = useRouter()
  const [clientId, setClientId] = useState<string | null>(null)
  const { client, sessions, loading, error, refetch } = useClientData(
    clientId,
    userId!,
  )
  const modalState = useClientModals()
  const queryClient = useQueryClient()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteGoalDialog, setShowDeleteGoalDialog] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState<any>(null)
  const [isDeletingGoal, setIsDeletingGoal] = useState(false)
  const [showDeleteOutcomeDialog, setShowDeleteOutcomeDialog] = useState(false)
  const [outcomeToDelete, setOutcomeToDelete] = useState<any>(null)
  const [isDeletingOutcome, setIsDeletingOutcome] = useState(false)
  const [showDeleteSprintDialog, setShowDeleteSprintDialog] = useState(false)
  const [sprintToDelete, setSprintToDelete] = useState<any>(null)
  const [isDeletingSprint, setIsDeletingSprint] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    params.then(({ clientId }) => {
      setClientId(clientId)
    })
  }, [params])

  const handleDelete = async () => {
    if (!client?.id) return

    setIsDeleting(true)
    try {
      await ClientService.deleteClient(client.id)
      // Keep dialog open during navigation
      router.push('/clients')
      // Dialog will close when component unmounts
    } catch (error) {
      console.error('Error deleting client:', error)
      setShowDeleteDialog(false)
      setIsDeleting(false)
    }
  }

  const handleDeleteGoal = async () => {
    if (!goalToDelete?.id) return

    setIsDeletingGoal(true)
    try {
      await GoalService.deleteGoal(goalToDelete.id)

      // Invalidate goals query to refresh tree view
      queryClient.invalidateQueries({
        queryKey: queryKeys.goals.all,
      })

      toast.success('Vision Deleted', {
        description: `"${goalToDelete.title}" has been deleted successfully`,
      })

      setShowDeleteGoalDialog(false)
      setGoalToDelete(null)
    } catch (error) {
      console.error('Error deleting goal:', error)
      toast.error('Failed to delete vision', {
        description: 'Please try again later',
      })
    } finally {
      setIsDeletingGoal(false)
    }
  }

  const handleDeleteOutcome = async () => {
    if (!outcomeToDelete?.id) return

    setIsDeletingOutcome(true)
    try {
      await TargetService.deleteTarget(outcomeToDelete.id)

      queryClient.invalidateQueries({
        queryKey: queryKeys.targets.all,
      })

      toast.success('Outcome Deleted', {
        description: `"${outcomeToDelete.title}" has been deleted successfully`,
      })

      setShowDeleteOutcomeDialog(false)
      setOutcomeToDelete(null)
    } catch (error) {
      console.error('Error deleting outcome:', error)
      toast.error('Failed to delete outcome', {
        description: 'Please try again later',
      })
    } finally {
      setIsDeletingOutcome(false)
    }
  }

  const handleDeleteSprint = async () => {
    if (!sprintToDelete?.id) return

    setIsDeletingSprint(true)
    try {
      await SprintService.deleteSprint(sprintToDelete.id)

      queryClient.invalidateQueries({
        queryKey: queryKeys.sprints.all,
      })

      toast.success('Sprint Deleted', {
        description: `"${sprintToDelete.title}" has been deleted successfully`,
      })

      setShowDeleteSprintDialog(false)
      setSprintToDelete(null)
    } catch (error) {
      console.error('Error deleting sprint:', error)
      toast.error('Failed to delete sprint', {
        description: 'Please try again later',
      })
    } finally {
      setIsDeletingSprint(false)
    }
  }

  const handleCompleteOutcome = async (outcome: any) => {
    if (!outcome?.id) return

    try {
      await TargetService.updateTarget(outcome.id, { status: 'completed' })

      queryClient.invalidateQueries({
        queryKey: queryKeys.targets.all,
      })

      toast.success('Outcome Completed', {
        description: `"${outcome.title}" has been marked as complete`,
      })
    } catch (error) {
      console.error('Error completing outcome:', error)
      toast.error('Failed to complete outcome', {
        description: 'Please try again later',
      })
    }
  }

  const handleCompleteSprint = async (sprint: any) => {
    if (!sprint?.id) return

    try {
      await SprintService.updateSprint(sprint.id, { status: 'completed' })

      queryClient.invalidateQueries({
        queryKey: queryKeys.sprints.all,
      })

      toast.success('Sprint Completed', {
        description: `"${sprint.title}" has been marked as complete`,
      })
    } catch (error) {
      console.error('Error completing sprint:', error)
      toast.error('Failed to complete sprint', {
        description: 'Please try again later',
      })
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <LoadingState message="Loading client details..." />
      </PageLayout>
    )
  }

  if (error || !client) {
    return (
      <ProtectedRoute loadingMessage="Loading client details...">
        <PageLayout>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <EmptyState
              icon={User}
              title="Client Not Found"
              description={error || 'The requested client could not be found.'}
              action={{
                label: 'Back to Clients',
                onClick: () => router.push('/clients'),
                icon: ArrowLeft,
              }}
            />
          </div>
        </PageLayout>
      </ProtectedRoute>
    )
  }

  const stats = client.client_session_stats?.[0]
  const totalSessions = sessions?.length || 0
  const avgDuration = stats?.total_duration_minutes
    ? Math.round(stats.total_duration_minutes / (stats.total_sessions || 1))
    : 0

  // Check if client has no sessions
  const hasNoSessions = totalSessions === 0

  return (
    <ProtectedRoute loadingMessage="Loading client details...">
      <PageLayout>
        <div className="min-h-screen bg-white">
          {/* Simple Back Link */}
          <div className="border-b border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/clients')}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Clients
              </Button>
            </div>
          </div>

          {/* Conditional Rendering: Empty State or Full Interface */}
          {hasNoSessions && !isViewer ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <EmptyStateWelcome
                client={client}
                onStartSession={() =>
                  modalState.setIsStartSessionModalOpen(true)
                }
                onAddPastSession={() =>
                  modalState.setIsManualSessionModalOpen(true)
                }
                onSetGoals={() => modalState.setIsGoalModalOpen(true)}
              />
            </div>
          ) : (
            <>
              {/* Main Content Area with Tabs */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <TabsList className="bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
                      <TabsTrigger
                        value="overview"
                        className="data-[state=active]:bg-black data-[state=active]:text-white rounded-lg"
                      >
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Overview
                      </TabsTrigger>
                      <TabsTrigger
                        value="sessions"
                        className="data-[state=active]:bg-black data-[state=active]:text-white rounded-lg"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Sessions & Chat
                      </TabsTrigger>
                      <TabsTrigger
                        value="goals"
                        className="data-[state=active]:bg-black data-[state=active]:text-white rounded-lg"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Vision & Progress
                      </TabsTrigger>
                      <TabsTrigger
                        value="wins"
                        className="data-[state=active]:bg-black data-[state=active]:text-white rounded-lg"
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Wins
                      </TabsTrigger>
                      <TabsTrigger
                        value="resources"
                        className="data-[state=active]:bg-black data-[state=active]:text-white rounded-lg"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Resources
                      </TabsTrigger>
                    </TabsList>

                    {!isViewer && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            modalState.setIsStartSessionModalOpen(true)
                          }
                          className="bg-primary hover:bg-primary/90 text-white"
                        >
                          <Mic className="h-4 w-4 mr-2" />
                          Start Live Session
                        </Button>
                      </div>
                    )}
                  </div>

                  <TabsContent value="overview" className="space-y-4">
                    <OverviewTab
                      client={client}
                      sessions={sessions}
                      stats={stats}
                      totalSessions={totalSessions}
                      avgDuration={avgDuration}
                      onEditClient={() => modalState.setIsEditModalOpen(true)}
                      onInviteClient={() =>
                        modalState.setIsInviteModalOpen(true)
                      }
                      onDeleteClient={() => setShowDeleteDialog(true)}
                      onCreateCommitment={() => {
                        modalState.setEditingCommitment(null)
                        modalState.setShowCommitmentForm(true)
                      }}
                      onEditCommitment={commitment => {
                        modalState.setEditingCommitment(commitment)
                        modalState.setShowCommitmentForm(true)
                      }}
                      onViewResources={() => setActiveTab('resources')}
                      onShareResource={() => setActiveTab('resources')}
                      isViewer={isViewer}
                    />
                  </TabsContent>

                  <TabsContent value="sessions" className="space-y-4">
                    <SessionsChatTab
                      sessions={sessions}
                      client={client}
                      isViewer={isViewer}
                      onAddSession={() =>
                        modalState.setIsManualSessionModalOpen(true)
                      }
                      onRefresh={refetch}
                    />
                  </TabsContent>

                  <TabsContent value="goals" className="space-y-6">
                    {/* Tree View Only */}
                    <GoalsTreeView
                      clientId={client.id}
                      onCreateNew={() =>
                        modalState.setIsUnifiedCreateModalOpen(true)
                      }
                      onCreateGoal={() => modalState.setIsGoalModalOpen(true)}
                      onCreateSprint={() =>
                        modalState.setIsSprintModalOpen(true)
                      }
                      onCreateOutcome={() =>
                        modalState.setIsOutcomeModalOpen(true)
                      }
                      onCreateCommitment={() => {
                        modalState.setEditingCommitment(null)
                        modalState.setShowCommitmentForm(true)
                      }}
                      onCommitmentClick={commitment => {
                        modalState.setEditingCommitment(commitment)
                        modalState.setShowCommitmentForm(true)
                      }}
                      onEditGoal={goal => {
                        modalState.setEditingGoal(goal)
                        modalState.setIsGoalModalOpen(true)
                      }}
                      onDeleteGoal={goal => {
                        setGoalToDelete(goal)
                        setShowDeleteGoalDialog(true)
                      }}
                      onEditOutcome={_outcome => {
                        // TODO: Add edit mode support to TargetFormModal
                        toast.info('Edit Outcome', {
                          description:
                            'Edit functionality coming soon. For now, you can delete and recreate.',
                        })
                      }}
                      onDeleteOutcome={outcome => {
                        setOutcomeToDelete(outcome)
                        setShowDeleteOutcomeDialog(true)
                      }}
                      onCompleteOutcome={handleCompleteOutcome}
                      onEditSprint={_sprint => {
                        toast.info('Edit Sprint', {
                          description:
                            'Edit functionality coming soon. For now, you can delete and recreate.',
                        })
                      }}
                      onDeleteSprint={sprint => {
                        setSprintToDelete(sprint)
                        setShowDeleteSprintDialog(true)
                      }}
                      onCompleteSprint={handleCompleteSprint}
                    />
                  </TabsContent>

                  <TabsContent value="wins" className="space-y-6">
                    <ClientWinsTimeline clientId={client.id} />
                  </TabsContent>

                  <TabsContent value="resources" className="space-y-6">
                    <ClientResourcesTab
                      clientId={client.id}
                      clientName={client.name}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </div>

        {/* Modals */}
        <ClientModals
          client={client}
          isEditModalOpen={modalState.isEditModalOpen}
          setIsEditModalOpen={modalState.setIsEditModalOpen}
          isManualSessionModalOpen={modalState.isManualSessionModalOpen}
          setIsManualSessionModalOpen={modalState.setIsManualSessionModalOpen}
          isInviteModalOpen={modalState.isInviteModalOpen}
          setIsInviteModalOpen={modalState.setIsInviteModalOpen}
          isSprintModalOpen={modalState.isSprintModalOpen}
          setIsSprintModalOpen={modalState.setIsSprintModalOpen}
          isStartSessionModalOpen={modalState.isStartSessionModalOpen}
          setIsStartSessionModalOpen={modalState.setIsStartSessionModalOpen}
          isGoalModalOpen={modalState.isGoalModalOpen}
          setIsGoalModalOpen={modalState.setIsGoalModalOpen}
          isOutcomeModalOpen={modalState.isOutcomeModalOpen}
          setIsOutcomeModalOpen={modalState.setIsOutcomeModalOpen}
          isUnifiedCreateModalOpen={modalState.isUnifiedCreateModalOpen}
          setIsUnifiedCreateModalOpen={modalState.setIsUnifiedCreateModalOpen}
          isEndSprintModalOpen={modalState.isEndSprintModalOpen}
          setIsEndSprintModalOpen={modalState.setIsEndSprintModalOpen}
          endingSprint={modalState.endingSprint}
          setEndingSprint={modalState.setEndingSprint}
          editingGoal={modalState.editingGoal}
          setEditingGoal={modalState.setEditingGoal}
          showCommitmentForm={modalState.showCommitmentForm}
          setShowCommitmentForm={modalState.setShowCommitmentForm}
          editingCommitment={modalState.editingCommitment}
          setEditingCommitment={modalState.setEditingCommitment}
          onRefresh={refetch}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={showDeleteDialog}
          onOpenChange={open => {
            // Prevent closing while deleting
            if (!isDeleting) {
              setShowDeleteDialog(open)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <AlertDialogTitle>Delete Client</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="space-y-3">
                <p>
                  Are you sure you want to delete{' '}
                  <strong>{client?.name}</strong>?
                </p>
                <p className="text-sm text-red-600 font-medium">
                  This action cannot be undone. This will permanently delete:
                </p>
                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                  <li>• All coaching sessions and transcripts</li>
                  <li>• Session insights and analysis</li>
                  <li>• Client persona and knowledge base</li>
                  <li>• Sprints, commitments, and tasks</li>
                  <li>• Portal invitations and access</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Client
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Vision Confirmation Dialog */}
        <AlertDialog
          open={showDeleteGoalDialog}
          onOpenChange={open => {
            if (!isDeletingGoal) {
              setShowDeleteGoalDialog(open)
              if (!open) setGoalToDelete(null)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <AlertDialogTitle>Delete Vision</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="space-y-3">
                <p>
                  Are you sure you want to delete the vision{' '}
                  <span className="font-semibold text-gray-900">
                    &quot;{goalToDelete?.title}&quot;
                  </span>
                  ?
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Deleting this vision will unlink it
                    from any associated outcomes. The outcomes themselves will
                    remain and stay linked to their sprints and commitments.
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  This action cannot be undone.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingGoal}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={e => {
                  e.preventDefault()
                  handleDeleteGoal()
                }}
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

        {/* Delete Outcome Confirmation Dialog */}
        <AlertDialog
          open={showDeleteOutcomeDialog}
          onOpenChange={open => {
            if (!isDeletingOutcome) {
              setShowDeleteOutcomeDialog(open)
              if (!open) setOutcomeToDelete(null)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <AlertDialogTitle>Delete Outcome</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="space-y-3">
                <p>
                  Are you sure you want to delete the outcome{' '}
                  <span className="font-semibold text-gray-900">
                    &quot;{outcomeToDelete?.title}&quot;
                  </span>
                  ?
                </p>
                <p className="text-sm text-gray-600">
                  This action cannot be undone. This will also delete all
                  associated commitments for this outcome.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingOutcome}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={e => {
                  e.preventDefault()
                  handleDeleteOutcome()
                }}
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

        {/* Delete Sprint Confirmation Dialog */}
        <AlertDialog
          open={showDeleteSprintDialog}
          onOpenChange={open => {
            if (!isDeletingSprint) {
              setShowDeleteSprintDialog(open)
              if (!open) setSprintToDelete(null)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <AlertDialogTitle>Delete Sprint</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="space-y-3">
                <p>
                  Are you sure you want to delete the sprint{' '}
                  <span className="font-semibold text-gray-900">
                    &quot;{sprintToDelete?.title}&quot;
                  </span>
                  ?
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Deleting this sprint will unlink it
                    from any associated outcomes. The outcomes themselves will
                    remain.
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  This action cannot be undone.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingSprint}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={e => {
                  e.preventDefault()
                  handleDeleteSprint()
                }}
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
      </PageLayout>
    </ProtectedRoute>
  )
}
