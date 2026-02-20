'use client'

import { use, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useProgramDashboard, useProgram } from '@/hooks/queries/use-programs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProgramTrends } from '@/components/programs/program-trends'
import { ProgramActionItems } from '@/components/programs/program-action-items'
import { ProgramCalendar } from '@/components/programs/program-calendar'
import { ProgramThemeAnalysis } from '@/components/programs/program-theme-analysis'
import { ProgramOutcomes } from '@/components/programs/program-outcomes'
import { ProgramWins } from '@/components/programs/program-wins'
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
  TrendingDown,
  Minus,
  XCircle,
  Clock,
  Edit,
  BarChart3,
  ListTodo,
  CalendarDays,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import { ClientSessionSummary } from '@/types/program'
import { differenceInDays } from 'date-fns'
import { formatRelativeTime } from '@/lib/date-utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Status filter type
type StatusFilter = 'all' | 'at-risk' | 'on-track' | 'excelling'

export default function ProgramDashboardPage({
  params,
}: {
  params: Promise<{ programId: string }>
}) {
  const { programId } = use(params)
  const router = useRouter()
  const [sortBy, setSortBy] = useState<'name' | 'sessions' | 'date' | 'risk'>(
    'risk',
  )
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')

  const { data: _program } = useProgram(programId)
  const { data: dashboard, isLoading, error } = useProgramDashboard(programId)

  // Calculate status counts for navigation pills
  const statusCounts = useMemo(() => {
    if (!dashboard?.clients) {
      return { all: 0, 'at-risk': 0, 'on-track': 0, excelling: 0 }
    }
    return dashboard.clients.reduce(
      (acc, client) => {
        acc.all++
        acc[client.status]++
        return acc
      },
      { all: 0, 'at-risk': 0, 'on-track': 0, excelling: 0 } as Record<
        StatusFilter,
        number
      >,
    )
  }, [dashboard?.clients])

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
              There was an error loading the sandbox dashboard.
            </p>
            <Button onClick={() => router.push('/admin/programs')}>
              Back to Sandboxes
            </Button>
          </CardContent>
        </Card>
      </>
    )
  }

  // Helper function to get risk priority (lower = more urgent)
  const getRiskPriority = (status: string): number => {
    switch (status) {
      case 'at-risk':
        return 0
      case 'on-track':
        return 1
      case 'excelling':
        return 2
      default:
        return 3
    }
  }

  // Helper to calculate days since last session
  const getDaysSinceLastSession = (client: ClientSessionSummary): number => {
    if (!client.last_session_date) return Infinity
    return differenceInDays(new Date(), new Date(client.last_session_date))
  }

  // Sort and filter clients
  let filteredClients = [...dashboard.clients]

  if (filterStatus !== 'all') {
    filteredClients = filteredClients.filter(c => c.status === filterStatus)
  }

  filteredClients.sort((a, b) => {
    switch (sortBy) {
      case 'risk':
        // Sort by risk priority first, then by days since last session
        const riskDiff = getRiskPriority(a.status) - getRiskPriority(b.status)
        if (riskDiff !== 0) return riskDiff
        // For same risk level, sort by days since last session (more days = higher priority)
        return getDaysSinceLastSession(b) - getDaysSinceLastSession(a)
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
      {/* Header with Compact Stats */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sandboxes
        </Button>

        {/* Program Title and Compact Stats Bar */}
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Program Info */}
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: dashboard.program_color }}
              />
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {dashboard.program_name}
                </h1>
                {dashboard.program_description && (
                  <p className="text-gray-600 text-sm truncate">
                    {dashboard.program_description}
                  </p>
                )}
              </div>
            </div>

            {/* Compact Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-gray-900">
                  {dashboard.total_clients}
                </span>
                <span className="text-gray-500">Clients</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-gray-900">
                  {dashboard.total_sessions}
                </span>
                <span className="text-gray-500">Sessions</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-gray-900">
                  {dashboard.missed_sessions}
                </span>
                <span className="text-gray-500">Missed</span>
                {dashboard.missed_sessions > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
              </div>
              <div className="hidden sm:block w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-gray-900">
                  {dashboard.active_this_week}
                </span>
                <span className="text-gray-500">Active</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/admin/clients?program_id=${programId}`)
                }
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Clients
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/admin/programs/${programId}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* At-Risk Alert Banner */}
      {statusCounts['at-risk'] > 0 && (
        <div className="mb-6 bg-gray-50 border border-gray-200 border-l-4 border-l-red-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">
                {statusCounts['at-risk']} client
                {statusCounts['at-risk'] !== 1 ? 's' : ''} need
                {statusCounts['at-risk'] === 1 ? 's' : ''} attention
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {dashboard.clients
                  .filter(c => c.status === 'at-risk')
                  .map(client => (
                    <button
                      key={client.client_id}
                      onClick={() =>
                        router.push(`/clients/${client.client_id}`)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {client.client_name}
                    </button>
                  ))}
              </div>
            </div>
            <button
              onClick={() => setFilterStatus('at-risk')}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 shrink-0"
            >
              View all →
            </button>
          </div>
        </div>
      )}

      {/* Tabbed Interface */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="border-b border-gray-200">
          <TabsList className="flex w-full bg-transparent p-0 h-auto gap-0">
            <TabsTrigger
              value="overview"
              className="relative flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 rounded-none bg-transparent shadow-none transition-colors"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
              <span className="ml-1.5 hidden sm:inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900">
                {dashboard.total_clients}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="trends"
              className="relative flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 rounded-none bg-transparent shadow-none transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Trends</span>
            </TabsTrigger>
            <TabsTrigger
              value="action-items"
              className="relative flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 rounded-none bg-transparent shadow-none transition-colors"
            >
              <ListTodo className="h-4 w-4" />
              <span className="hidden sm:inline">Actions</span>
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="relative flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 rounded-none bg-transparent shadow-none transition-colors"
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger
              value="themes"
              className="relative flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 rounded-none bg-transparent shadow-none transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Themes</span>
            </TabsTrigger>
            <TabsTrigger
              value="outcomes"
              className="relative flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 rounded-none bg-transparent shadow-none transition-colors"
            >
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Outcomes</span>
            </TabsTrigger>
            <TabsTrigger
              value="wins"
              className="relative flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 rounded-none bg-transparent shadow-none transition-colors"
            >
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Wins</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Navigation Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter Pills - Outline style with subtle indicators */}
              <button
                onClick={() => setFilterStatus('all')}
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  filterStatus === 'all'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                All ({statusCounts.all})
              </button>
              <button
                onClick={() => setFilterStatus('at-risk')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  filterStatus === 'at-risk'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full bg-red-500 ${statusCounts['at-risk'] > 0 ? 'animate-pulse' : ''}`}
                />
                At Risk ({statusCounts['at-risk']})
              </button>
              <button
                onClick={() => setFilterStatus('on-track')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  filterStatus === 'on-track'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                On Track ({statusCounts['on-track']})
              </button>
              <button
                onClick={() => setFilterStatus('excelling')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  filterStatus === 'excelling'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Excelling ({statusCounts.excelling})
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-3">
              <Select
                value={sortBy}
                onValueChange={(value: any) => setSortBy(value)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="risk">Risk Level</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="sessions">Session Count</SelectItem>
                  <SelectItem value="date">Last Session</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500">
                {filteredClients.length} client
                {filteredClients.length !== 1 ? 's' : ''}
              </span>
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
                    : 'Add clients to this sandbox to see them here'}
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
                <CardTitle>Common Themes Across Sandbox</CardTitle>
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

        {/* Outcomes Tab */}
        <TabsContent value="outcomes">
          <ProgramOutcomes programId={programId} />
        </TabsContent>

        {/* Wins Tab */}
        <TabsContent value="wins">
          <ProgramWins programId={programId} />
        </TabsContent>
      </Tabs>
    </>
  )
}

function ClientCard({ client }: { client: ClientSessionSummary }) {
  const router = useRouter()

  // Calculate days since last session
  const daysSinceLastSession = client.last_session_date
    ? differenceInDays(new Date(), new Date(client.last_session_date))
    : null

  // Determine if client needs attention (no session in 14+ days)
  const needsAttention =
    daysSinceLastSession !== null && daysSinceLastSession >= 14

  // Get status dot color
  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'at-risk':
        return 'bg-red-500'
      case 'excelling':
        return 'bg-green-500'
      default:
        return 'bg-blue-500'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'at-risk':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'excelling':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  // Get trend indicator based on session_streak
  const getTrendIndicator = () => {
    if (client.session_streak > 2) {
      return (
        <span
          className="flex items-center text-green-600"
          title="Improving trend"
        >
          <TrendingUp className="h-4 w-4" />
        </span>
      )
    } else if (client.session_streak < 0 || client.missed_sessions > 1) {
      return (
        <span
          className="flex items-center text-red-600"
          title="Declining trend"
        >
          <TrendingDown className="h-4 w-4" />
        </span>
      )
    }
    return (
      <span className="flex items-center text-gray-400" title="Stable">
        <Minus className="h-4 w-4" />
      </span>
    )
  }

  // Get progress bar color - gray by default, red only for at-risk clients
  const getProgressColor = () => {
    if (client.status === 'at-risk') return 'bg-red-500'
    return 'bg-gray-400'
  }

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => router.push(`/clients/${client.client_id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${getStatusDotColor(client.status)}`}
              />
              <CardTitle className="text-lg truncate">
                {client.client_name}
              </CardTitle>
              {getTrendIndicator()}
            </div>
            <CardDescription className="text-sm ml-4">
              Coach: {client.coach_name}
            </CardDescription>
          </div>
          <Badge
            className={`flex items-center gap-1.5 ${getStatusBadgeColor(client.status)} shrink-0`}
            variant="outline"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(client.status)}`}
            />
            <span className="capitalize">
              {client.status.replace('-', ' ')}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Completion Rate with Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-500">Completion Rate</p>
            <span className="text-sm font-semibold text-gray-900">
              {Math.round(client.completion_rate)}%
            </span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getProgressColor()}`}
              style={{ width: `${Math.min(100, client.completion_rate)}%` }}
            />
          </div>
        </div>

        {/* Session Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">
                {client.total_sessions}
              </span>{' '}
              sessions
            </span>
            {client.session_streak > 0 && (
              <span className="text-green-600 text-xs">
                {client.session_streak} streak
              </span>
            )}
          </div>
        </div>

        {/* Last Session with Warning */}
        <div className="pt-3 border-t">
          {client.last_session_date ? (
            <>
              <div
                className={`flex items-center gap-2 text-xs mb-1 ${
                  needsAttention ? 'text-red-600 font-medium' : 'text-gray-500'
                }`}
              >
                <Clock className="h-3 w-3" />
                {needsAttention && <AlertCircle className="h-3 w-3" />}
                Last session {formatRelativeTime(client.last_session_date)}
                {needsAttention && ' - needs attention'}
              </div>
              {client.last_session_summary && (
                <p className="text-sm text-gray-700 line-clamp-2">
                  {client.last_session_summary}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500 italic">No sessions yet</p>
          )}
        </div>

        {/* Missed Sessions Warning */}
        {client.missed_sessions > 0 && (
          <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
            <AlertCircle className="h-4 w-4 shrink-0" />
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
