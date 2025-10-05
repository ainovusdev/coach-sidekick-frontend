'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { usePermissions } from '@/contexts/permission-context'
import { ProtectedRoute } from '@/components/auth/protected-route'
import PageLayout from '@/components/layout/page-layout'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import ClientModal from '@/components/clients/client-modal'
import { ManualSessionModal } from '@/components/sessions/manual-session-modal'
import { ClientInvitationModal } from '@/components/clients/client-invitation-modal'
import { ClientChatUnified } from './components/client-chat-unified'
import { SessionCardCompact } from './components/session-card-compact'
import { ClientPersonaModern } from './components/client-persona-modern'
import { useClientData } from './hooks/use-client-data'
import { getClientInitials, formatDate } from './utils/client-utils'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  User,
  Edit,
  Upload,
  Calendar,
  Clock,
  Activity,
  MessageSquare,
  TrendingUp,
  Brain,
  Plus,
  Lock,
  Eye,
  Send,
  UserCheck,
} from 'lucide-react'

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isManualSessionModalOpen, setIsManualSessionModalOpen] =
    useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [showPersona, setShowPersona] = useState(false)
  const { client, sessions, loading, error, refetch } = useClientData(
    clientId,
    userId!,
  )

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
          <div className="border-b border-gray-200 bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/clients')}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Clients
              </Button>

              {/* Client Profile Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-6">
                  <Avatar className="h-16 w-16 bg-gray-900 border-2 border-gray-200 shadow-md">
                    <AvatarFallback className="bg-gray-900 text-white text-xl font-bold">
                      {getClientInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {client.name}
                    </h1>
                    {client.notes && (
                      <p className="text-sm text-gray-600 max-w-2xl mt-1">
                        {client.notes}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-gray-700"
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Added {formatDate(client.created_at)}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-gray-700"
                      >
                        <Activity className="h-3 w-3 mr-1" />
                        {totalSessions} Sessions
                      </Badge>
                      {avgDuration > 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-gray-100 text-gray-700"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {avgDuration.toFixed(0)}m avg
                        </Badge>
                      )}
                      {client.invitation_status === 'accepted' && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          Portal Active
                        </Badge>
                      )}
                      {client.invitation_status === 'invited' && (
                        <Badge
                          variant="secondary"
                          className="bg-purple-100 text-purple-700"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Invited
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPersona(!showPersona)}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    {showPersona ? 'Hide' : 'View'} Persona
                  </Button>
                  {!isViewer && (
                    <>
                      {client.invitation_status !== 'accepted' && (
                        <Button
                          variant="outline"
                          onClick={() => setIsInviteModalOpen(true)}
                          className="border-purple-300 hover:bg-purple-50 text-purple-700"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {client.invitation_status === 'invited'
                            ? 'Resend Invite'
                            : 'Invite to Portal'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setIsManualSessionModalOpen(true)}
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                      <Button
                        onClick={() => setIsEditModalOpen(true)}
                        className="bg-gray-900 hover:bg-gray-800 text-white"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </>
                  )}
                  {isViewer && (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 border-blue-200 text-blue-700 px-3 py-2"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View Only Access
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Client Persona Display */}
          {showPersona && (
            <div className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ClientPersonaModern clientId={client.id} />
              </div>
            </div>
          )}

          {/* Stats Overview */}
          {stats && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                          Total Sessions
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.total_sessions}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                          Total Time
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.total_duration_minutes}m
                        </p>
                      </div>
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <Clock className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                          Avg Duration
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {avgDuration}m
                        </p>
                      </div>
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                          Completed
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {completedSessions}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <Activity className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sessions List - Left Side */}
              <div>
                <Card className="border-gray-200 shadow-sm overflow-hidden pt-2">
                  <CardHeader className="border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-gray-600" />
                        Coaching Sessions
                      </h2>
                      {!isViewer && (
                        <Button
                          size="sm"
                          onClick={() => setIsManualSessionModalOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Past Session
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <ScrollArea className="h-[600px]">
                    {sessions && sessions.length > 0 ? (
                      <div>
                        {sessions.map((session, index) => (
                          <div
                            key={session.id}
                            className={cn(
                              'p-4 hover:bg-gray-50 transition-colors cursor-pointer',
                              index !== 0 && 'border-t border-gray-100',
                            )}
                            onClick={() =>
                              router.push(`/sessions/${session.id}`)
                            }
                          >
                            <SessionCardCompact
                              session={session}
                              showClient={false}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center p-8">
                          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-gray-900 font-medium mb-2">
                            No sessions yet
                          </h3>
                          <p className="text-gray-500 text-sm mb-4">
                            {isViewer
                              ? `No sessions have been recorded for ${client.name} yet.`
                              : `Start recording your first coaching session with ${client.name}`}
                          </p>
                          {!isViewer && (
                            <Button
                              onClick={() => setIsManualSessionModalOpen(true)}
                              className="bg-gray-900 hover:bg-gray-800 text-white"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Recording
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </Card>
              </div>

              {/* Unified Chat Widget - Hidden for viewers */}
              {!isViewer ? (
                <Card className="border-gray-200 shadow-sm overflow-hidden">
                  <CardContent className="p-0 h-full -my-4">
                    <ClientChatUnified
                      clientId={client.id}
                      clientName={client.name}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-gray-200 shadow-sm overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="p-4 bg-blue-50 rounded-full mb-4">
                        <Lock className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Restricted Access
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Chat functionality is not available with viewer
                        permissions.
                      </p>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 border-blue-200 text-blue-700"
                      >
                        <Eye className="h-3 w-3 mr-1.5" />
                        View Only Mode
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        <ClientModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={refetch}
          client={client}
          mode="edit"
        />

        <ClientInvitationModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          clientId={client.id}
          clientName={client.name}
          clientEmail={client.email}
          invitationStatus={client.invitation_status}
          onInvitationSent={refetch}
        />

        <ManualSessionModal
          isOpen={isManualSessionModalOpen}
          onClose={() => {
            setIsManualSessionModalOpen(false)
            refetch()
          }}
          preselectedClientId={client.id}
        />
      </PageLayout>
    </ProtectedRoute>
  )
}
