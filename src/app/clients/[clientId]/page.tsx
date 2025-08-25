'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import PageLayout from '@/components/layout/page-layout'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ClientModal from '@/components/clients/client-modal'
import { ManualSessionModal } from '@/components/sessions/manual-session-modal'
import ClientHeader from './components/client-header'
import ClientStats from './components/client-stats'
import SessionsList from './components/sessions-list'
import { ClientPersonaDisplay } from './components/client-persona'
import { ClientChat } from '@/components/clients/client-chat'
import { useClientData } from './hooks/use-client-data'
import { ArrowLeft, User, History, Brain, MessageSquare } from 'lucide-react'

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { isAuthenticated, loading: authLoading, userId } = useAuth()
  const router = useRouter()
  const [clientId, setClientId] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isManualSessionModalOpen, setIsManualSessionModalOpen] = useState(false)
  const { client, sessions, loading, error, refetch } = useClientData(clientId, userId!)

  useEffect(() => {
    params.then(({ clientId }) => {
      setClientId(clientId)
    })
  }, [params])

  useEffect(() => {
    // Redirect to auth if not authenticated
    if (!authLoading && !isAuthenticated) {
      router.push('/auth')
      return
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading || loading) {
    return (
      <PageLayout>
        <LoadingState message="Loading client details..." />
      </PageLayout>
    )
  }

  if (error || !client) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <EmptyState
            icon={User}
            title="Client Not Found"
            description={error || 'The requested client could not be found.'}
            action={{
              label: 'Back to Clients',
              onClick: () => router.push('/clients'),
              icon: ArrowLeft
            }}
          />
        </div>
      </PageLayout>
    )
  }

  const stats = client.client_session_stats?.[0]

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClientHeader 
          client={client} 
          onEditClick={() => setIsEditModalOpen(true)}
          onUploadClick={() => setIsManualSessionModalOpen(true)}
        />

        {stats && <ClientStats stats={stats} />}

        <Tabs defaultValue="sessions" className="mt-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100">
            <TabsTrigger 
              value="sessions"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900"
            >
              <History className="h-4 w-4 mr-2" />
              Sessions
            </TabsTrigger>
            <TabsTrigger 
              value="profile"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900"
            >
              <Brain className="h-4 w-4 mr-2" />
              Client Profile
            </TabsTrigger>
            <TabsTrigger 
              value="chat"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Ask AI
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sessions" className="mt-6">
            <SessionsList 
              sessions={sessions} 
              clientId={client.id} 
              clientName={client.name}
              onUploadClick={() => setIsManualSessionModalOpen(true)}
              onSessionDeleted={refetch}
            />
          </TabsContent>
          
          <TabsContent value="profile" className="mt-6">
            <ClientPersonaDisplay clientId={client.id} />
          </TabsContent>
          
          <TabsContent value="chat" className="mt-6">
            <ClientChat clientId={client.id} clientName={client.name} />
          </TabsContent>
        </Tabs>
      </div>

      <ClientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={refetch}
        client={client}
        mode="edit"
      />

      <ManualSessionModal
        isOpen={isManualSessionModalOpen}
        onClose={() => {
          setIsManualSessionModalOpen(false)
          refetch() // Refresh sessions after creating a new one
        }}
        preselectedClientId={client.id}
      />
    </PageLayout>
  )
}