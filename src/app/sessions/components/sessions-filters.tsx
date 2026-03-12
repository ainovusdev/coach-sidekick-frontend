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
  hasActiveFilters: boolean
  onClientFilter: (clientId: string | null) => void
  onCoachFilter: (coachId: string | null) => void
  onSessionTypeFilter: (type: SessionTypeFilter) => void
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
  hasActiveFilters,
  onClientFilter,
  onCoachFilter,
  onSessionTypeFilter,
  onClearFilters,
}: SessionsFiltersProps) {
  const [clientSearch, setClientSearch] = useState('')
  const [coachSearch, setCoachSearch] = useState('')
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false)
  const [coachPopoverOpen, setCoachPopoverOpen] = useState(false)

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
            <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Client:
            </span>
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
                <div className="p-2 border-b dark:border-slate-700">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 dark:text-slate-500" />
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
                      className={`w-full flex items-center gap-2 px-2 py-2 text-xs rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 ${
                        selectedClientId === null
                          ? 'bg-slate-100 dark:bg-slate-800 font-medium'
                          : ''
                      }`}
                    >
                      <Users className="h-3 w-3" />
                      <span className="flex-1 text-left">All Clients</span>
                      {selectedClientId === null && (
                        <Check className="h-3 w-3 text-slate-600 dark:text-slate-400" />
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
                        className={`w-full flex items-center gap-2 px-2 py-2 text-xs rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 ${
                          selectedClientId === client.id
                            ? 'bg-slate-100 dark:bg-slate-800 font-medium'
                            : ''
                        }`}
                      >
                        <User className="h-3 w-3" />
                        <span className="flex-1 text-left">{client.name}</span>
                        {selectedClientId === client.id && (
                          <Check className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                        )}
                      </button>
                    ))}

                    {filteredClients.length === 0 && (
                      <div className="px-2 py-4 text-xs text-slate-500 dark:text-slate-400 text-center">
                        No clients found
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="p-2 border-t dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 text-center">
                  {clients.length} clients total
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Coach Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Coach:
            </span>
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
              <div className="p-2 border-b dark:border-slate-700">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 dark:text-slate-500" />
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
                    className={`w-full flex items-center gap-2 px-2 py-2 text-xs rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 ${
                      selectedCoachId === null
                        ? 'bg-slate-100 dark:bg-slate-800 font-medium'
                        : ''
                    }`}
                  >
                    <Users className="h-3 w-3" />
                    <span className="flex-1 text-left">All Coaches</span>
                    {selectedCoachId === null && (
                      <Check className="h-3 w-3 text-slate-600 dark:text-slate-400" />
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
                      className={`w-full flex items-center gap-2 px-2 py-2 text-xs rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 ${
                        selectedCoachId === coach.id
                          ? 'bg-slate-100 dark:bg-slate-800 font-medium'
                          : ''
                      }`}
                    >
                      <User className="h-3 w-3" />
                      <span className="flex-1 text-left">{coach.name}</span>
                      {selectedCoachId === coach.id && (
                        <Check className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                      )}
                    </button>
                  ))}

                  {filteredCoaches.length === 0 && (
                    <div className="px-2 py-4 text-xs text-slate-500 dark:text-slate-400 text-center">
                      No coaches found
                    </div>
                  )}
                </div>
              </ScrollArea>
              {coaches.length > 0 && (
                <div className="p-2 border-t dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 text-center">
                  {coaches.length} coaches total
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Session Type Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Type:
          </span>
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden">
            {(['all', '1:1', 'group'] as SessionTypeFilter[]).map(type => (
              <button
                key={type}
                onClick={() => onSessionTypeFilter(type)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  sessionType === type
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                } ${type !== 'all' ? 'border-l border-slate-200 dark:border-slate-700' : ''}`}
              >
                {type === 'all' ? 'All' : type === '1:1' ? '1:1' : 'Group'}
              </button>
            ))}
          </div>
        </div>

        {/* Clear All Filters - inline */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(selectedClient || selectedCoach) && (
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
          {selectedClient && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Client: {selectedClient.name}
              </span>
            </div>
          )}
          {selectedCoach && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Coach: {selectedCoach.name}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
