'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import PageLayout from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { Client, ClientSessionStats } from '@/types/meeting'
import { ClientService } from '@/services/client-service'
import { SessionService } from '@/services/session-service'
import ClientModal from '@/components/clients/client-modal'
import {
  ArrowLeft,
  Edit,
  Calendar,
  Clock,
  User,
  FileText,
  Activity,
  Eye,
  ChevronRight,
} from 'lucide-react'

interface ClientWithStats extends Client {
  client_session_stats?: ClientSessionStats[]
}

interface ClientSession {
  id: string
  bot_id: string
  status: string
  created_at: string
  meeting_summaries?: Array<{
    duration_minutes: number
    final_overall_score?: number
    meeting_summary: string
  }>
}

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { isAuthenticated, loading: authLoading, userId } = useAuth()
  const router = useRouter()
  const [client, setClient] = useState<ClientWithStats | null>(null)
  const [sessions, setSessions] = useState<ClientSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    params.then(({ clientId }) => {
      setClientId(clientId)
    })
  }, [params])

  const fetchClientData = useCallback(async () => {
    if (!clientId) return
    
    setLoading(true)
    setError(null)

    try {
      // Fetch client details
      const client = await ClientService.getClient(clientId)
      setClient(client)

      // Fetch client sessions
      const sessionsData = await SessionService.getClientSessions(clientId, {
        per_page: 10
      })
      setSessions(sessionsData.sessions || [])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred',
      )
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    // Redirect to auth if not authenticated
    if (!authLoading && !isAuthenticated) {
      router.push('/auth')
      return
    }

    if (!userId || authLoading || !clientId) return

    fetchClientData()
  }, [clientId, userId, authLoading, router, fetchClientData, isAuthenticated])

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

  const getClientInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const stats = client.client_session_stats?.[0]

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/clients">
              <Button
                variant="ghost"
                size="sm"
                className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>

          {/* Client Info Card */}
          <Card className="border-neutral-200">
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-6">
                  <Avatar className="h-16 w-16 bg-neutral-100 border border-neutral-200">
                    <AvatarFallback className="bg-white text-neutral-700 text-lg font-medium">
                      {getClientInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
                      {client.name}
                    </h1>
                    
                    {client.notes && (
                      <div className="flex items-start gap-2 mt-4">
                        <FileText className="h-4 w-4 text-neutral-400 mt-0.5" />
                        <p className="text-sm text-neutral-600 leading-relaxed">
                          {client.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-4 text-sm text-neutral-500">
                      <span>Added {formatDate(client.created_at)}</span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="border-neutral-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-neutral-100 rounded-lg">
                    <Calendar className="h-4 w-4 text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-neutral-900">
                      {stats.total_sessions}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Total Sessions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-neutral-100 rounded-lg">
                    <Clock className="h-4 w-4 text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-neutral-900">
                      {stats.total_duration_minutes}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Total Minutes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {stats.average_overall_score && (
              <Card className="border-neutral-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-neutral-100 rounded-lg">
                      <Activity className="h-4 w-4 text-neutral-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-neutral-900">
                        {stats.average_overall_score.toFixed(1)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Average Score
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Sessions Section */}
        <Card className="border-neutral-200">
          <CardHeader className="border-b border-neutral-100">
            <CardTitle className="text-lg font-medium text-neutral-900">
              Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sessions.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                  <Activity className="h-6 w-6 text-neutral-400" />
                </div>
                <h3 className="text-base font-medium text-neutral-900 mb-2">
                  No sessions yet
                </h3>
                <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                  Start your first coaching session with {client.name}.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {sessions.map(session => {
                  const summary = session.meeting_summaries?.[0]

                  return (
                    <Link
                      key={session.id}
                      href={`/sessions/${session.id}`}
                      className="block hover:bg-neutral-50 transition-colors"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-neutral-900">
                                {formatDate(session.created_at)}
                              </h4>
                              <span className="text-sm text-neutral-500">
                                {formatTime(session.created_at)}
                              </span>
                              {summary?.duration_minutes && (
                                <span className="text-sm text-neutral-500">
                                  • {summary.duration_minutes} min
                                </span>
                              )}
                            </div>

                            {summary?.meeting_summary && (
                              <p className="text-sm text-neutral-600 line-clamp-2">
                                {summary.meeting_summary}
                              </p>
                            )}

                            {summary?.final_overall_score && (
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm text-neutral-500">
                                  Score: {summary.final_overall_score.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-neutral-600 hover:text-neutral-900"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <ChevronRight className="h-4 w-4 text-neutral-300" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}

                {sessions.length >= 10 && (
                  <div className="p-4 text-center border-t border-neutral-100">
                    <Link href={`/sessions?client=${client.id}`}>
                      <Button
                        variant="outline"
                        className="border-neutral-300 hover:bg-neutral-50 text-neutral-700"
                      >
                        View All Sessions
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Client Modal */}
      <ClientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={async (clientData) => {
          if (!client) return
          try {
            await ClientService.updateClient(client.id, {
              name: clientData.name,
              notes: clientData.notes,
            })
            // Refresh client data
            fetchClientData()
          } catch (error) {
            console.error('Error updating client:', error)
            throw error
          }
        }}
        client={client}
        mode="edit"
      />
    </PageLayout>
  )
}