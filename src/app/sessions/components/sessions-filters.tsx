import { Button } from '@/components/ui/button'
import { Filter, User, Users, X } from 'lucide-react'

interface Client {
  id: string
  name: string
  email?: string
}

interface Coach {
  id: string
  name: string
}

interface SessionsFiltersProps {
  clients: Client[]
  coaches: Coach[]
  loadingClients: boolean
  selectedClientId: string | null
  selectedClient: Client | undefined
  selectedCoachId: string | null
  selectedCoach: Coach | undefined
  hasActiveFilters: boolean
  onClientFilter: (clientId: string | null) => void
  onCoachFilter: (coachId: string | null) => void
  onClearFilters: () => void
}

export default function SessionsFilters({
  clients,
  coaches,
  loadingClients,
  selectedClientId,
  selectedClient,
  selectedCoachId,
  selectedCoach,
  hasActiveFilters,
  onClientFilter,
  onCoachFilter,
  onClearFilters,
}: SessionsFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      {/* Client Filter */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">
            Filter by client:
          </span>
        </div>

        {!loadingClients && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={selectedClientId === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => onClientFilter(null)}
              className="text-xs"
            >
              All Clients
            </Button>
            {clients.slice(0, 5).map(client => (
              <Button
                key={client.id}
                variant={selectedClientId === client.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => onClientFilter(client.id)}
                className="text-xs"
              >
                <User className="h-3 w-3 mr-1" />
                {client.name}
              </Button>
            ))}
            {clients.length > 5 && (
              <span className="text-xs text-slate-500">
                +{clients.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Coach Filter */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">
            Filter by coach:
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={selectedCoachId === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCoachFilter(null)}
            className="text-xs"
          >
            All Coaches
          </Button>
          {coaches.slice(0, 5).map(coach => (
            <Button
              key={coach.id}
              variant={selectedCoachId === coach.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCoachFilter(coach.id)}
              className="text-xs"
            >
              <Users className="h-3 w-3 mr-1" />
              {coach.name}
            </Button>
          ))}
          {coaches.length > 5 && (
            <span className="text-xs text-slate-500">
              +{coaches.length - 5} more
            </span>
          )}
        </div>
      </div>

      {/* Clear All Filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-slate-500 hover:text-slate-700 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all filters
          </Button>
        </div>
      )}

      {/* Active Filters Display */}
      {(selectedClient || selectedCoach) && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
          {selectedClient && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Client: {selectedClient.name}
              </span>
            </div>
          )}
          {selectedCoach && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Coach: {selectedCoach.name}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
