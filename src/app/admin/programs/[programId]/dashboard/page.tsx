'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProgramDashboard, useProgram } from '@/hooks/queries/use-programs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProgramTrends } from '@/components/programs/program-trends'
import { ProgramActionItems } from '@/components/programs/program-action-items'
import { ProgramCalendar } from '@/components/programs/program-calendar'
import { ProgramThemeAnalysis } from '@/components/programs/program-theme-analysis'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Users,
  Calendar,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  BarChart3,
  ListTodo,
  CalendarDays,
  Sparkles,
} from 'lucide-react'
import { ClientSessionSummary } from '@/types/program'
import { formatDistanceToNow } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function ProgramDashboardPage({
  params,
}: {
  params: Promise<{ programId: string }>
}) {
  const { programId } = use(params)
  const router = useRouter()
  const [sortBy, setSortBy] = useState<'name' | 'sessions' | 'date'>('name')
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'at-risk' | 'on-track' | 'excelling'
  >('all')

  const { data: program } = useProgram(programId)
  const { data: dashboard, isLoading, error } = useProgramDashboard(programId)

  if (isLoading) {
    return (
      <>
        <Skeleton className="h-10 w-32 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </>
    )
  }

  if (error || !dashboard) {
    return (
      <>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unable to Load Dashboard
            </h3>
            <p className="text-gray-600 text-center mb-6">
              There was an error loading the program dashboard.
            </p>
            <Button onClick={() => router.push('/admin/programs')}>
              Back to Programs
            </Button>
          </CardContent>
        </Card>
      </>
    )
  }

  // Sort and filter clients
  let filteredClients = [...dashboard.clients]

  if (filterStatus !== 'all') {
    filteredClients = filteredClients.filter(c => c.status === filterStatus)
  }

  filteredClients.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.client_name.localeCompare(b.client_name)
      case 'sessions':
        return b.total_sessions - a.total_sessions
      case 'date':
        if (!a.last_session_date) return 1
        if (!b.last_session_date) return -1
        return (
          new Date(b.last_session_date).getTime() -
          new Date(a.last_session_date).getTime()
        )
      default:
        return 0
    }
  })

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Programs
        </Button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {program && (
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: dashboard.program_color }}
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {dashboard.program_name}
              </h1>
              {dashboard.program_description && (
                <p className="text-gray-600 mt-1">
                  {dashboard.program_description}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/programs/${programId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Program
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Clients
            </CardTitle>
            <Users className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {dashboard.total_clients}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Sessions
            </CardTitle>
            <Calendar className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {dashboard.total_sessions}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Missed Sessions
            </CardTitle>
            <XCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {dashboard.missed_sessions}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active This Week
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {dashboard.active_this_week}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="action-items" className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            <span className="hidden sm:inline">Actions</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="themes" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Themes</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Filters and Sort */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select
                value={filterStatus}
                onValueChange={(value: any) => setFilterStatus(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="at-risk">At Risk</SelectItem>
                  <SelectItem value="on-track">On Track</SelectItem>
                  <SelectItem value="excelling">Excelling</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(value: any) => setSortBy(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="sessions">Session Count</SelectItem>
                  <SelectItem value="date">Last Session</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-gray-600">
              Showing {filteredClients.length} of {dashboard.total_clients}{' '}
              clients
            </div>
          </div>

          {/* Client Cards Grid */}
          {filteredClients.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No clients found
                </h3>
                <p className="text-gray-600 text-center">
                  {filterStatus !== 'all'
                    ? 'Try changing the filter to see more clients'
                    : 'Add clients to this program to see them here'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map(client => (
                <ClientCard key={client.client_id} client={client} />
              ))}
            </div>
          )}

          {/* Common Themes */}
          {dashboard.common_themes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Common Themes Across Program</CardTitle>
                <CardDescription>
                  Frequently discussed topics across all clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dashboard.common_themes.map((theme, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <ProgramTrends programId={programId} />
        </TabsContent>

        {/* Action Items Tab */}
        <TabsContent value="action-items">
          <ProgramActionItems programId={programId} />
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <ProgramCalendar programId={programId} />
        </TabsContent>

        {/* Themes Tab */}
        <TabsContent value="themes">
          <ProgramThemeAnalysis programId={programId} />
        </TabsContent>
      </Tabs>
    </>
  )
}

function ClientCard({ client }: { client: ClientSessionSummary }) {
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'at-risk':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'excelling':
        return 'bg-green-50 text-green-700 border-green-200'
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'at-risk':
        return <XCircle className="h-4 w-4" />
      case 'excelling':
        return <CheckCircle2 className="h-4 w-4" />
      default:
        return <TrendingUp className="h-4 w-4" />
    }
  }

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => router.push(`/clients/${client.client_id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{client.client_name}</CardTitle>
            <CardDescription className="text-sm">
              Coach: {client.coach_name}
            </CardDescription>
          </div>
          <Badge
            className={`flex items-center gap-1 ${getStatusColor(client.status)}`}
            variant="outline"
          >
            {getStatusIcon(client.status)}
            {client.status.replace('-', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Session Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Total Sessions</p>
            <p className="text-2xl font-bold text-gray-900">
              {client.total_sessions}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Completion Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(client.completion_rate)}%
            </p>
          </div>
        </div>

        {/* Last Session */}
        {client.last_session_date ? (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Clock className="h-3 w-3" />
              Last session{' '}
              {formatDistanceToNow(new Date(client.last_session_date), {
                addSuffix: true,
              })}
            </div>
            {client.last_session_summary && (
              <p className="text-sm text-gray-700 line-clamp-2">
                {client.last_session_summary}
              </p>
            )}
          </div>
        ) : (
          <div className="pt-3 border-t">
            <p className="text-sm text-gray-500 italic">No sessions yet</p>
          </div>
        )}

        {/* Missed Sessions Warning */}
        {client.missed_sessions > 0 && (
          <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
            <AlertCircle className="h-4 w-4" />
            {client.missed_sessions} missed session
            {client.missed_sessions > 1 ? 's' : ''}
          </div>
        )}

        {/* Emerging Themes */}
        {client.emerging_themes.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs text-gray-500 mb-2">Emerging Themes</p>
            <div className="flex flex-wrap gap-1">
              {client.emerging_themes.slice(0, 3).map((theme, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {theme}
                </Badge>
              ))}
              {client.emerging_themes.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{client.emerging_themes.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
