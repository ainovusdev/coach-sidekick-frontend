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
import ClientHeader from './components/client-header'
import ClientStats from './components/client-stats'
import { SessionsTab } from './components/sessions-tab'
import { SprintsTab } from './components/sprints-tab'
import { ClientPersonaModern } from './components/client-persona-modern'
import { ClientModals } from './components/client-modals'
import { useClientData } from './hooks/use-client-data'
import { useClientModals } from './hooks/use-client-modals'
import {
  User,
  MessageSquare,
  Target,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  Trash2,
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
  const completedSessions =
    sessions?.filter(s => s.status === 'completed').length || 0
  const avgDuration = stats?.total_duration_minutes
    ? Math.round(stats.total_duration_minutes / (stats.total_sessions || 1))
    : 0

  return (
    <ProtectedRoute loadingMessage="Loading client details...">
      <PageLayout>
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
          {/* Header with Back Button and Client Profile */}
          <ClientHeader
            client={client}
            isViewer={isViewer}
            totalSessions={totalSessions}
            avgDuration={avgDuration}
            showPersona={modalState.showPersona}
            onBack={() => router.push('/clients')}
            onTogglePersona={() =>
              modalState.setShowPersona(!modalState.showPersona)
            }
            onInvite={() => modalState.setIsInviteModalOpen(true)}
            onUpload={() => modalState.setIsManualSessionModalOpen(true)}
            onEdit={() => modalState.setIsEditModalOpen(true)}
            onDelete={() => setShowDeleteDialog(true)}
          />

          {/* Client Persona Display */}
          {modalState.showPersona && (
            <div className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ClientPersonaModern clientId={client.id} />
              </div>
            </div>
          )}

          {/* Stats Overview */}
          <ClientStats
            stats={stats}
            avgDuration={avgDuration}
            completedSessions={completedSessions}
          />

          {/* Main Content Area with Tabs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Tabs defaultValue="sessions" className="space-y-6">
              <TabsList className="bg-gray-50 p-1 rounded-lg">
                <TabsTrigger
                  value="sessions"
                  className="data-[state=active]:bg-white"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Sessions
                </TabsTrigger>
                <TabsTrigger
                  value="sprints"
                  className="data-[state=active]:bg-white"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Sprints & Outcomes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sessions" className="space-y-4">
                <SessionsTab
                  sessions={sessions}
                  client={client}
                  isViewer={isViewer}
                  onAddSession={() =>
                    modalState.setIsManualSessionModalOpen(true)
                  }
                />
              </TabsContent>

              <TabsContent value="sprints" className="space-y-6">
                <SprintsTab
                  client={client}
                  selectedTargetId={modalState.selectedTargetId}
                  onRefresh={refetch}
                  onCreateSprint={() => modalState.setIsSprintModalOpen(true)}
                  onTargetClick={modalState.setSelectedTargetId}
                  onEditCommitment={commitment => {
                    modalState.setEditingCommitment(commitment)
                    modalState.setShowCommitmentForm(true)
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
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
