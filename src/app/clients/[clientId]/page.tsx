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
import { GoalsProgressTab } from './components/goals-progress-tab'
import { ClientModals } from './components/client-modals'
import { EmptyStateWelcome } from './components/empty-state-welcome'
import { useClientData } from './hooks/use-client-data'
import { useClientModals } from './hooks/use-client-modals'
import {
  User,
  LayoutDashboard,
  MessageSquare,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  Trash2,
  Mic,
  Upload,
  Target,
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
                <Tabs defaultValue="overview" className="space-y-6">
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
                        Goals & Progress
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
                        <Button
                          onClick={() =>
                            modalState.setIsManualSessionModalOpen(true)
                          }
                          variant="outline"
                          className="border-gray-300 hover:bg-gray-50"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Add Past Session
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
                      onCreateSprint={() =>
                        modalState.setIsSprintModalOpen(true)
                      }
                      onEndSprint={sprint => {
                        modalState.setEndingSprint(sprint)
                        modalState.setIsEndSprintModalOpen(true)
                      }}
                      onEditCommitment={commitment => {
                        modalState.setEditingCommitment(commitment)
                        modalState.setShowCommitmentForm(true)
                      }}
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
                    />
                  </TabsContent>

                  <TabsContent value="goals" className="space-y-6">
                    <GoalsProgressTab
                      clientId={client.id}
                      onCreateGoal={() => {
                        modalState.setEditingGoal(null)
                        modalState.setIsGoalModalOpen(true)
                      }}
                      onCreateOutcome={() => {
                        modalState.setIsOutcomeModalOpen(true)
                      }}
                      onEditGoal={goal => {
                        modalState.setEditingGoal(goal)
                        modalState.setIsGoalModalOpen(true)
                      }}
                      onArchiveGoal={goal => {
                        console.log('Archive goal:', goal)
                      }}
                      onCommitmentClick={commitment => {
                        modalState.setEditingCommitment(commitment)
                        modalState.setShowCommitmentForm(true)
                      }}
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
      </PageLayout>
    </ProtectedRoute>
  )
}
