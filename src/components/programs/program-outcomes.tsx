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
          <AlertCircle className="h-12 w-12 text-ink-4 mb-4" />
          <h3 className="text-lg font-semibold text-ink mb-2">
            Unable to Load Outcomes
          </h3>
          <p className="text-ink-3 text-center">
            There was an error loading the sandbox outcomes.
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
              <div className="p-2 bg-surface-3 rounded-lg">
                <Target className="h-5 w-5 text-ink-3" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">
                  {outcomes.total_outcomes}
                </p>
                <p className="text-sm text-ink-3">
                  Total Meta Performance Outcomes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-surface-3 rounded-lg">
                <Clock className="h-5 w-5 text-ink-3" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">
                  {outcomes.active_outcomes}
                </p>
                <p className="text-sm text-ink-3">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-surface-3 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-ink-3" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">
                  {outcomes.completed_outcomes}
                </p>
                <p className="text-sm text-ink-3">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-surface-3 rounded-lg">
                <TrendingUp className="h-5 w-5 text-ink-3" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">
                  {Math.round(outcomes.overall_progress)}%
                </p>
                <p className="text-sm text-ink-3">Overall Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink-2">
              Sandbox Progress
            </span>
            <span className="text-sm font-semibold text-ink">
              {Math.round(outcomes.overall_progress)}%
            </span>
          </div>
          <Progress value={outcomes.overall_progress} className="h-3" />
          <div className="flex items-center justify-between mt-2 text-xs text-ink-3">
            <span>
              {outcomes.completed_outcomes} of {outcomes.total_outcomes} meta
              performance outcomes completed
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
                ? 'bg-ink text-ink-on-dark border-line '
                : 'bg-surface-1 text-ink-2 border-line-strong hover:border-line-strong hover:bg-paper'
            }`}
          >
            All ({statusCounts.all})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              statusFilter === 'active'
                ? 'bg-ink text-ink-on-dark border-line '
                : 'bg-surface-1 text-ink-2 border-line-strong hover:border-line-strong hover:bg-paper'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-ds-accent" />
            Active ({statusCounts.active})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              statusFilter === 'completed'
                ? 'bg-ink text-ink-on-dark border-line '
                : 'bg-surface-1 text-ink-2 border-line-strong hover:border-line-strong hover:bg-paper'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-forest" />
            Completed ({statusCounts.completed})
          </button>
          <button
            onClick={() => setStatusFilter('deferred')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              statusFilter === 'deferred'
                ? 'bg-ink text-ink-on-dark border-line '
                : 'bg-surface-1 text-ink-2 border-line-strong hover:border-line-strong hover:bg-paper'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-token" />
            Deferred ({statusCounts.deferred})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Client Filter */}
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[180px]">
              <User className="h-4 w-4 mr-2 text-ink-3" />
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
            <Target className="h-12 w-12 text-ink-4 mb-4" />
            <h3 className="text-lg font-semibold text-ink mb-2">
              No meta performance outcomes found
            </h3>
            <p className="text-ink-3 text-center">
              {statusFilter !== 'all'
                ? 'Try changing the filter to see more meta performance outcomes'
                : 'Meta performance outcomes will appear here as clients set them'}
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
                      <div className="p-2 bg-surface-3 rounded-full">
                        <User className="h-4 w-4 text-ink-3" />
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
                      className="text-sm font-medium text-ink-3 hover:text-ink flex items-center gap-1"
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
        return { dot: 'bg-forest', badge: 'bg-surface-3 text-ink-2' }
      case 'active':
        return { dot: 'bg-ds-accent', badge: 'bg-surface-3 text-ink-2' }
      case 'deferred':
        return { dot: 'bg-amber-token', badge: 'bg-surface-3 text-ink-2' }
      case 'abandoned':
        return { dot: 'bg-vermillion', badge: 'bg-surface-3 text-ink-2' }
      default:
        return { dot: 'bg-line', badge: 'bg-surface-3 text-ink-2' }
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
              <Target className="h-4 w-4 text-ink-4 shrink-0" />
              <h3 className="font-semibold text-ink truncate">
                {outcome.title}
              </h3>
            </div>
            <p className="text-sm text-ink-3 flex items-center gap-1">
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
          <p className="text-sm text-ink-3 line-clamp-2 mb-3">
            {outcome.description}
          </p>
        )}

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-ink-3">Progress</span>
            <span className="text-xs font-semibold text-ink-2">
              {outcome.progress_percentage}%
            </span>
          </div>
          <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                outcome.status === 'completed' ? 'bg-forest' : 'bg-line'
              }`}
              style={{
                width: `${Math.min(100, outcome.progress_percentage)}%`,
              }}
            />
          </div>
        </div>

        {/* Commitments */}
        <div className="flex items-center justify-between text-sm border-t pt-3">
          <span className="text-ink-3">Commitments</span>
          <span className="font-medium text-ink">
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
        return 'bg-forest'
      case 'active':
        return 'bg-ds-accent'
      case 'deferred':
        return 'bg-amber-token'
      case 'abandoned':
        return 'bg-vermillion'
      default:
        return 'bg-line'
    }
  }

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-3 rounded-lg border border-line hover:bg-paper cursor-pointer transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${getStatusStyles(
              outcome.status,
            )}`}
          />
          <h4 className="font-medium text-ink truncate">{outcome.title}</h4>
        </div>
        {outcome.vision_titles.length > 0 && (
          <p className="text-xs text-ink-3 mt-1 ml-4 truncate">
            Vision: {outcome.vision_titles.join(', ')}
          </p>
        )}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-24">
          <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                outcome.status === 'completed' ? 'bg-forest' : 'bg-line'
              }`}
              style={{
                width: `${Math.min(100, outcome.progress_percentage)}%`,
              }}
            />
          </div>
        </div>
        <span className="text-sm font-medium text-ink-2 w-10 text-right">
          {outcome.progress_percentage}%
        </span>
      </div>

      <ChevronRight className="h-4 w-4 text-ink-4 shrink-0" />
    </div>
  )
}
