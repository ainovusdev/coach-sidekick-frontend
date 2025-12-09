'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useProgramOutcomes } from '@/hooks/queries/use-programs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  ChevronRight,
  Eye,
  TrendingUp,
} from 'lucide-react'
import { ProgramOutcomeSummary } from '@/types/program'

interface ProgramOutcomesProps {
  programId: string
}

type StatusFilter = 'all' | 'active' | 'completed' | 'deferred' | 'abandoned'
type ViewMode = 'grid' | 'by-client'

export function ProgramOutcomes({ programId }: ProgramOutcomesProps) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedClient, setSelectedClient] = useState<string>('all')

  const { data: outcomes, isLoading } = useProgramOutcomes(
    programId,
    statusFilter === 'all' ? undefined : statusFilter,
  )

  // Get unique clients for the filter
  const uniqueClients = useMemo(() => {
    if (!outcomes?.outcomes) return []
    const clientsMap = new Map<string, string>()
    outcomes.outcomes.forEach(outcome => {
      clientsMap.set(outcome.client_id, outcome.client_name)
    })
    return Array.from(clientsMap, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  }, [outcomes])

  // Filter outcomes
  const filteredOutcomes = useMemo(() => {
    if (!outcomes?.outcomes) return []
    let result = outcomes.outcomes

    if (selectedClient !== 'all') {
      result = result.filter(o => o.client_id === selectedClient)
    }

    return result
  }, [outcomes, selectedClient])

  // Group by client for "by-client" view
  const outcomesByClient = useMemo(() => {
    if (!outcomes?.outcomes_by_client) return {}
    if (selectedClient !== 'all') {
      const clientName = uniqueClients.find(c => c.id === selectedClient)?.name
      if (clientName && outcomes.outcomes_by_client[clientName]) {
        return { [clientName]: outcomes.outcomes_by_client[clientName] }
      }
    }
    return outcomes.outcomes_by_client
  }, [outcomes, selectedClient, uniqueClients])

  // Status counts for pills
  const statusCounts = useMemo(() => {
    if (!outcomes?.outcomes) {
      return { all: 0, active: 0, completed: 0, deferred: 0, abandoned: 0 }
    }
    return outcomes.outcomes.reduce(
      (acc, outcome) => {
        acc.all++
        acc[outcome.status]++
        return acc
      },
      { all: 0, active: 0, completed: 0, deferred: 0, abandoned: 0 } as Record<
        StatusFilter,
        number
      >,
    )
  }, [outcomes?.outcomes])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!outcomes) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to Load Outcomes
          </h3>
          <p className="text-gray-600 text-center">
            There was an error loading the program outcomes.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Target className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {outcomes.total_outcomes}
                </p>
                <p className="text-sm text-gray-500">Total Outcomes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {outcomes.active_outcomes}
                </p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {outcomes.completed_outcomes}
                </p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(outcomes.overall_progress)}%
                </p>
                <p className="text-sm text-gray-500">Overall Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Program Progress
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {Math.round(outcomes.overall_progress)}%
            </span>
          </div>
          <Progress value={outcomes.overall_progress} className="h-3" />
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>
              {outcomes.completed_outcomes} of {outcomes.total_outcomes}{' '}
              outcomes completed
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Pills */}
          <button
            onClick={() => setStatusFilter('all')}
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              statusFilter === 'all'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            All ({statusCounts.all})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              statusFilter === 'active'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Active ({statusCounts.active})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              statusFilter === 'completed'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Completed ({statusCounts.completed})
          </button>
          <button
            onClick={() => setStatusFilter('deferred')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              statusFilter === 'deferred'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            Deferred ({statusCounts.deferred})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Client Filter */}
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[180px]">
              <User className="h-4 w-4 mr-2 text-gray-500" />
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {uniqueClients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <Select
            value={viewMode}
            onValueChange={(value: ViewMode) => setViewMode(value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Grid View</SelectItem>
              <SelectItem value="by-client">By Client</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Empty State */}
      {filteredOutcomes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No outcomes found
            </h3>
            <p className="text-gray-600 text-center">
              {statusFilter !== 'all'
                ? 'Try changing the filter to see more outcomes'
                : 'Outcomes will appear here as clients set them'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && filteredOutcomes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOutcomes.map(outcome => (
            <OutcomeCard
              key={outcome.id}
              outcome={outcome}
              onClick={() => router.push(`/clients/${outcome.client_id}`)}
            />
          ))}
        </div>
      )}

      {/* By Client View */}
      {viewMode === 'by-client' && Object.keys(outcomesByClient).length > 0 && (
        <div className="space-y-6">
          {Object.entries(outcomesByClient).map(
            ([clientName, clientOutcomes]) => (
              <Card key={clientName}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-full">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{clientName}</CardTitle>
                        <CardDescription>
                          {clientOutcomes.length} outcome
                          {clientOutcomes.length !== 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const clientId = clientOutcomes[0]?.client_id
                        if (clientId) router.push(`/clients/${clientId}`)
                      }}
                      className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
                    >
                      View Client <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {clientOutcomes.map(outcome => (
                      <OutcomeRow
                        key={outcome.id}
                        outcome={outcome}
                        onClick={() =>
                          router.push(`/clients/${outcome.client_id}`)
                        }
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      )}
    </div>
  )
}

function OutcomeCard({
  outcome,
  onClick,
}: {
  outcome: ProgramOutcomeSummary
  onClick: () => void
}) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return { dot: 'bg-green-500', badge: 'bg-gray-100 text-gray-700' }
      case 'active':
        return { dot: 'bg-blue-500', badge: 'bg-gray-100 text-gray-700' }
      case 'deferred':
        return { dot: 'bg-yellow-500', badge: 'bg-gray-100 text-gray-700' }
      case 'abandoned':
        return { dot: 'bg-red-500', badge: 'bg-gray-100 text-gray-700' }
      default:
        return { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-700' }
    }
  }

  const styles = getStatusStyles(outcome.status)

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-gray-400 shrink-0" />
              <h3 className="font-semibold text-gray-900 truncate">
                {outcome.title}
              </h3>
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <User className="h-3 w-3" />
              {outcome.client_name}
            </p>
          </div>
          <Badge variant="outline" className={`${styles.badge} shrink-0`}>
            <span className={`w-1.5 h-1.5 rounded-full ${styles.dot} mr-1.5`} />
            <span className="capitalize">{outcome.status}</span>
          </Badge>
        </div>

        {outcome.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {outcome.description}
          </p>
        )}

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Progress</span>
            <span className="text-xs font-semibold text-gray-700">
              {outcome.progress_percentage}%
            </span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                outcome.status === 'completed' ? 'bg-green-500' : 'bg-gray-400'
              }`}
              style={{
                width: `${Math.min(100, outcome.progress_percentage)}%`,
              }}
            />
          </div>
        </div>

        {/* Commitments */}
        <div className="flex items-center justify-between text-sm border-t pt-3">
          <span className="text-gray-500">Commitments</span>
          <span className="font-medium text-gray-900">
            {outcome.completed_commitment_count} / {outcome.commitment_count}
          </span>
        </div>

        {/* Linked Visions */}
        {outcome.vision_titles.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {outcome.vision_titles.slice(0, 2).map((title, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                {title}
              </Badge>
            ))}
            {outcome.vision_titles.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{outcome.vision_titles.length - 2}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function OutcomeRow({
  outcome,
  onClick,
}: {
  outcome: ProgramOutcomeSummary
  onClick: () => void
}) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'active':
        return 'bg-blue-500'
      case 'deferred':
        return 'bg-yellow-500'
      case 'abandoned':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${getStatusStyles(
              outcome.status,
            )}`}
          />
          <h4 className="font-medium text-gray-900 truncate">
            {outcome.title}
          </h4>
        </div>
        {outcome.vision_titles.length > 0 && (
          <p className="text-xs text-gray-500 mt-1 ml-4 truncate">
            Vision: {outcome.vision_titles.join(', ')}
          </p>
        )}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-24">
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                outcome.status === 'completed' ? 'bg-green-500' : 'bg-gray-400'
              }`}
              style={{
                width: `${Math.min(100, outcome.progress_percentage)}%`,
              }}
            />
          </div>
        </div>
        <span className="text-sm font-medium text-gray-700 w-10 text-right">
          {outcome.progress_percentage}%
        </span>
      </div>

      <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
    </div>
  )
}
