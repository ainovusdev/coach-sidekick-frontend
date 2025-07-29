'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import PageLayout from '@/components/page-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Client, ClientSessionStats } from '@/types/meeting'
import { ApiClient } from '@/lib/api-client'
import {
  ArrowLeft,
  Edit,
  Calendar,
  BarChart3,
  Clock,
  TrendingUp,
  User,
  Mail,
  Phone,
  Building,
  FileText,
  Tag,
  Activity,
  Target,
  PlayCircle,
  Eye,
  MessageSquare,
  Star,
  Zap,
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
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [client, setClient] = useState<ClientWithStats | null>(null)
  const [sessions, setSessions] = useState<ClientSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)

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
      const clientResponse = await ApiClient.get(
        `/api/clients/${clientId}`,
      )
      if (!clientResponse.ok) {
        throw new Error('Failed to fetch client details')
      }
      const clientData = await clientResponse.json()
      setClient(clientData.client)

      // Fetch client sessions
      const sessionsResponse = await ApiClient.get(
        `/api/clients/${clientId}/sessions?limit=10`,
      )
      if (!sessionsResponse.ok) {
        throw new Error('Failed to fetch client sessions')
      }
      const sessionsData = await sessionsResponse.json()
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
    if (!authLoading && !user) {
      router.push('/auth')
      return
    }

    if (!user || authLoading || !clientId) return

    fetchClientData()
  }, [clientId, user, authLoading, router, fetchClientData])

  if (authLoading || loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="mt-3 text-slate-600 font-medium">
              Loading client details...
            </p>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (error || !client) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <User className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Client Not Found
            </h3>
            <p className="text-red-600 mb-6">
              {error || 'The requested client could not be found.'}
            </p>
            <Link href="/clients">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Clients
              </Button>
            </Link>
          </div>
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: '🟢',
          label: 'Active',
        }
      case 'inactive':
        return {
          color: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: '⏸️',
          label: 'Inactive',
        }
      case 'archived':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '📁',
          label: 'Archived',
        }
      default:
        return {
          color: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: '❓',
          label: status,
        }
    }
  }

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'recording':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const stats = client.client_session_stats?.[0]
  const statusConfig = getStatusConfig(client.status)

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 sm:justify-between sm:items-start mb-4">
            <div className="flex items-center gap-4">
              <Link href="/clients">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Clients
                </Button>
              </Link>
            </div>

            <div className="flex gap-2">
              <Link href={`/clients/${client.id}/edit`}>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Client
                </Button>
              </Link>
            </div>
          </div>

          {/* Client Header Card */}
          <Card className="shadow-lg border-slate-200">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex items-start gap-6">
                  <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xl font-bold">
                      {getClientInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-slate-900">
                        {client.name}
                      </h1>
                      <Badge
                        className={`${statusConfig.color} border font-medium`}
                      >
                        {statusConfig.icon} {statusConfig.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {client.email && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <a
                            href={`mailto:${client.email}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {client.email}
                          </a>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <a
                            href={`tel:${client.phone}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {client.phone}
                          </a>
                        </div>
                      )}
                      {client.company && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Building className="h-4 w-4 text-slate-400" />
                          <span>
                            {client.company}
                            {client.position ? ` • ${client.position}` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {client.tags.length > 0 && (
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-2">
                          {client.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs border-slate-300 text-slate-600"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Enhanced Statistics */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Quick Stats */}
              {stats && (
                <div className="grid gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-900">
                            {stats.total_sessions}
                          </p>
                          <p className="text-xs text-blue-600">
                            Total Sessions
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-emerald-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500 rounded-lg">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-emerald-900">
                            {stats.total_duration_minutes}
                          </p>
                          <p className="text-xs text-emerald-600">
                            Total Minutes
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {stats.average_overall_score && (
                    <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500 rounded-lg">
                            <Star className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-purple-900">
                              {stats.average_overall_score.toFixed(1)}
                            </p>
                            <p className="text-xs text-purple-600">
                              Average Score
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-orange-900">
                            {stats.last_session_date
                              ? formatDate(stats.last_session_date)
                              : 'Never'}
                          </p>
                          <p className="text-xs text-orange-600">
                            Last Session
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Client Notes */}
              {client.notes && (
                <Card className="shadow-sm border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-slate-600" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {client.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Enhanced Sessions */}
          <div className="lg:col-span-3">
            <Card className="shadow-lg border-slate-200">
              <CardHeader className="border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-slate-600" />
                    Coaching Sessions
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className="bg-slate-200 text-slate-700 font-medium"
                  >
                    {sessions.length} total sessions
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {sessions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                      <MessageSquare className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      No coaching sessions yet
                    </h3>
                    <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                      Start your first coaching session with {client.name} to
                      see detailed analytics and insights.
                    </p>
                    <div className="flex items-center justify-center text-xs text-slate-500">
                      <Zap className="h-3 w-3 mr-1" />
                      Ready for AI-powered coaching analysis
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map(session => {
                      const summary = session.meeting_summaries?.[0]
                      const sessionDate = new Date(session.created_at)

                      return (
                        <Card
                          key={session.id}
                          className="border border-slate-200 hover:shadow-md transition-all duration-200"
                        >
                          <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                                    <PlayCircle className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-slate-900">
                                      Coaching Session
                                    </h4>
                                    <p className="text-sm text-slate-500">
                                      {sessionDate.toLocaleDateString()} at{' '}
                                      {sessionDate.toLocaleTimeString()}
                                    </p>
                                  </div>
                                  <Badge
                                    className={`${getSessionStatusColor(
                                      session.status,
                                    )} border text-xs font-medium ml-auto lg:ml-0`}
                                  >
                                    {session.status}
                                  </Badge>
                                </div>

                                {summary && (
                                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4 p-3 bg-slate-50 rounded-lg">
                                    {summary.duration_minutes && (
                                      <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                          <Clock className="h-3 w-3 text-slate-400" />
                                          <span className="text-xs text-slate-500">
                                            Duration
                                          </span>
                                        </div>
                                        <p className="font-semibold text-slate-900">
                                          {summary.duration_minutes}m
                                        </p>
                                      </div>
                                    )}

                                    {summary.final_overall_score && (
                                      <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                          <Target className="h-3 w-3 text-slate-400" />
                                          <span className="text-xs text-slate-500">
                                            Score
                                          </span>
                                        </div>
                                        <p className="font-semibold text-slate-900">
                                          {summary.final_overall_score.toFixed(
                                            1,
                                          )}
                                        </p>
                                      </div>
                                    )}

                                    <div className="text-center lg:col-span-1 col-span-2">
                                      <div className="flex items-center justify-center gap-1 mb-1">
                                        <BarChart3 className="h-3 w-3 text-slate-400" />
                                        <span className="text-xs text-slate-500">
                                          Analysis
                                        </span>
                                      </div>
                                      <p className="font-semibold text-slate-900 text-xs">
                                        Available
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {summary?.meeting_summary && (
                                  <div className="mt-4">
                                    <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                                      {summary.meeting_summary}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2 lg:flex-col">
                                <Link
                                  href={`/sessions/${session.id}`}
                                  className="flex-1 lg:flex-none"
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full border-slate-300 hover:bg-slate-50"
                                  >
                                    <Eye className="h-3 w-3 mr-2" />
                                    View Details
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}

                    {sessions.length >= 10 && (
                      <div className="text-center pt-4 border-t border-slate-200">
                        <Link href={`/sessions?client=${client.id}`}>
                          <Button
                            variant="outline"
                            className="border-slate-300 hover:bg-slate-50"
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
        </div>
      </div>
    </PageLayout>
  )
}
