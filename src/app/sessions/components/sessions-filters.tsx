import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Filter,
  User,
  Users,
  X,
  ChevronDown,
  Search,
  Check,
  Activity,
} from 'lucide-react'

interface Client {
  id: string
  name: string
  email?: string
}

interface Coach {
  id: string
  name: string
}

export type SessionTypeFilter = 'all' | '1:1' | 'group'

export type SessionStatusFilter =
  | 'all'
  | 'completed'
  | 'processing'
  | 'scheduled'
  | 'pending_upload'
  | 'active'

const STATUS_OPTIONS: {
  value: SessionStatusFilter
  label: string
  dot: string
}[] = [
  { value: 'all', label: 'All Statuses', dot: 'bg-line' },
  { value: 'completed', label: 'Completed', dot: 'bg-forest' },
  { value: 'active', label: 'Active', dot: 'bg-vermillion' },
  { value: 'processing', label: 'Processing', dot: 'bg-amber-token' },
  { value: 'scheduled', label: 'Scheduled', dot: 'bg-ds-accent' },
  { value: 'pending_upload', label: 'Pending Upload', dot: 'bg-indigo' },
]

const getStatusOption = (value: SessionStatusFilter) =>
  STATUS_OPTIONS.find(o => o.value === value) ?? STATUS_OPTIONS[0]

interface SessionsFiltersProps {
  clients: Client[]
  coaches: Coach[]
  loadingClients: boolean
  loadingCoaches?: boolean
  selectedClientId: string | null
  selectedClient: Client | undefined
  selectedCoachId: string | null
  selectedCoach: Coach | undefined
  sessionType: SessionTypeFilter
  selectedStatus: SessionStatusFilter
  hasActiveFilters: boolean
  onClientFilter: (clientId: string | null) => void
  onCoachFilter: (coachId: string | null) => void
  onSessionTypeFilter: (type: SessionTypeFilter) => void
  onStatusFilter: (status: SessionStatusFilter) => void
  onClearFilters: () => void
}

export default function SessionsFilters({
  clients,
  coaches,
  loadingClients,
  loadingCoaches: _loadingCoaches = false,
  selectedClientId,
  selectedClient,
  selectedCoachId,
  selectedCoach,
  sessionType,
  selectedStatus,
  hasActiveFilters,
  onClientFilter,
  onCoachFilter,
  onSessionTypeFilter,
  onStatusFilter,
  onClearFilters,
}: SessionsFiltersProps) {
  const [clientSearch, setClientSearch] = useState('')
  const [coachSearch, setCoachSearch] = useState('')
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false)
  const [coachPopoverOpen, setCoachPopoverOpen] = useState(false)
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false)
  const activeStatus = getStatusOption(selectedStatus)

  // Filter clients based on search
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()),
  )

  // Filter coaches based on search
  const filteredCoaches = coaches.filter(coach =>
    coach.name.toLowerCase().includes(coachSearch.toLowerCase()),
  )

  return (
    <div className="mb-6 space-y-4">
      {/* Filters Row - Side by Side */}
      <div className="flex items-center gap-6 flex-wrap">
        {/* Client Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-ink-3 " />
            <span className="text-sm font-medium text-ink-2 ">Client:</span>
          </div>

          {!loadingClients && (
            <Popover
              open={clientPopoverOpen}
              onOpenChange={setClientPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-w-[200px] justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    {selectedClient ? selectedClient.name : 'All Clients'}
                  </div>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0" align="start">
                <div className="p-2 border-b ">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-ink-4 " />
                    <Input
                      placeholder="Search clients..."
                      value={clientSearch}
                      onChange={e => setClientSearch(e.target.value)}
                      className="pl-7 h-8 text-xs"
                    />
                  </div>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="p-1">
                    {/* All Clients Option */}
                    <button
                      onClick={() => {
                        onClientFilter(null)
                        setClientPopoverOpen(false)
                        setClientSearch('')
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-2 text-xs rounded-md hover:bg-surface-3 ${
                        selectedClientId === null
                          ? 'bg-surface-3 font-medium'
                          : ''
                      }`}
                    >
                      <Users className="h-3 w-3" />
                      <span className="flex-1 text-left">All Clients</span>
                      {selectedClientId === null && (
                        <Check className="h-3 w-3 text-ink-3 " />
                      )}
                    </button>

                    {/* Client List */}
                    {filteredClients.map(client => (
                      <button
                        key={client.id}
                        onClick={() => {
                          onClientFilter(client.id)
                          setClientPopoverOpen(false)
                          setClientSearch('')
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-2 text-xs rounded-md hover:bg-surface-3 ${
                          selectedClientId === client.id
                            ? 'bg-surface-3 font-medium'
                            : ''
                        }`}
                      >
                        <User className="h-3 w-3" />
                        <span className="flex-1 text-left">{client.name}</span>
                        {selectedClientId === client.id && (
                          <Check className="h-3 w-3 text-ink-3 " />
                        )}
                      </button>
                    ))}

                    {filteredClients.length === 0 && (
                      <div className="px-2 py-4 text-xs text-ink-3 text-center">
                        No clients found
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="p-2 border-t text-xs text-ink-3 text-center">
                  {clients.length} clients total
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Coach Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-ink-3 " />
            <span className="text-sm font-medium text-ink-2 ">Coach:</span>
          </div>

          <Popover open={coachPopoverOpen} onOpenChange={setCoachPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="min-w-[200px] justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  {selectedCoach ? selectedCoach.name : 'All Coaches'}
                </div>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
              <div className="p-2 border-b ">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-ink-4 " />
                  <Input
                    placeholder="Search coaches..."
                    value={coachSearch}
                    onChange={e => setCoachSearch(e.target.value)}
                    className="pl-7 h-8 text-xs"
                  />
                </div>
              </div>
              <ScrollArea className="h-[200px]">
                <div className="p-1">
                  {/* All Coaches Option */}
                  <button
                    onClick={() => {
                      onCoachFilter(null)
                      setCoachPopoverOpen(false)
                      setCoachSearch('')
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-2 text-xs rounded-md hover:bg-surface-3 ${
                      selectedCoachId === null ? 'bg-surface-3 font-medium' : ''
                    }`}
                  >
                    <Users className="h-3 w-3" />
                    <span className="flex-1 text-left">All Coaches</span>
                    {selectedCoachId === null && (
                      <Check className="h-3 w-3 text-ink-3 " />
                    )}
                  </button>

                  {/* Coach List */}
                  {filteredCoaches.map(coach => (
                    <button
                      key={coach.id}
                      onClick={() => {
                        onCoachFilter(coach.id)
                        setCoachPopoverOpen(false)
                        setCoachSearch('')
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-2 text-xs rounded-md hover:bg-surface-3 ${
                        selectedCoachId === coach.id
                          ? 'bg-surface-3 font-medium'
                          : ''
                      }`}
                    >
                      <User className="h-3 w-3" />
                      <span className="flex-1 text-left">{coach.name}</span>
                      {selectedCoachId === coach.id && (
                        <Check className="h-3 w-3 text-ink-3 " />
                      )}
                    </button>
                  ))}

                  {filteredCoaches.length === 0 && (
                    <div className="px-2 py-4 text-xs text-ink-3 text-center">
                      No coaches found
                    </div>
                  )}
                </div>
              </ScrollArea>
              {coaches.length > 0 && (
                <div className="p-2 border-t text-xs text-ink-3 text-center">
                  {coaches.length} coaches total
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Session Type Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-ink-2 ">Type:</span>
          <div className="flex items-center border border-line rounded-md overflow-hidden">
            {(['all', '1:1', 'group'] as SessionTypeFilter[]).map(type => (
              <button
                key={type}
                onClick={() => onSessionTypeFilter(type)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  sessionType === type
                    ? 'bg-ink text-ink-on-dark '
                    : 'bg-surface-1 text-ink-3 hover:bg-paper '
                } ${type !== 'all' ? 'border-l border-line ' : ''}`}
              >
                {type === 'all' ? 'All' : type === '1:1' ? '1:1' : 'Group'}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-ink-3 " />
            <span className="text-sm font-medium text-ink-2 ">Status:</span>
          </div>

          <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="min-w-[180px] justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${activeStatus.dot}`}
                    aria-hidden="true"
                  />
                  {activeStatus.label}
                </div>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-1" align="start">
              {STATUS_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    onStatusFilter(option.value)
                    setStatusPopoverOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-2 text-xs rounded-md hover:bg-surface-3 ${
                    selectedStatus === option.value
                      ? 'bg-surface-3 font-medium'
                      : ''
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${option.dot}`}
                    aria-hidden="true"
                  />
                  <span className="flex-1 text-left">{option.label}</span>
                  {selectedStatus === option.value && (
                    <Check className="h-3 w-3 text-ink-3 " />
                  )}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        {/* Clear All Filters - inline */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-ink-3 hover:text-ink-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(selectedClient || selectedCoach) && (
        <div className="mt-2 p-3 bg-ds-accent-bg border border-ds-accent rounded-lg space-y-2">
          {selectedClient && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-ds-accent" />
              <span className="text-sm font-medium text-ds-accent ">
                Client: {selectedClient.name}
              </span>
            </div>
          )}
          {selectedCoach && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-ds-accent" />
              <span className="text-sm font-medium text-ds-accent ">
                Coach: {selectedCoach.name}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
