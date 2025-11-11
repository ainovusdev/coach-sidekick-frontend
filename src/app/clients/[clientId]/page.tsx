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
import { User, MessageSquare, Target, ArrowLeft } from 'lucide-react'

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

  useEffect(() => {
    params.then(({ clientId }) => {
      setClientId(clientId)
    })
  }, [params])

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
      </PageLayout>
    </ProtectedRoute>
  )
}
