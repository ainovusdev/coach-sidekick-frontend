'use client'

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
  UserCheck,
  Send,
  Clock,
} from 'lucide-react'
import { StatusFilter } from '../hooks/use-clients-data'

interface Coach {
  id: string
  name: string
}

interface ClientsFiltersProps {
  // Status filter
  statusFilter: StatusFilter
  onStatusFilter: (status: StatusFilter) => void

  // Coach filter
  coaches: Coach[]
  loadingCoaches: boolean
  selectedCoachId: string | null
  selectedCoach: Coach | undefined
  onCoachFilter: (coachId: string | null) => void

  // General
  hasActiveFilters: boolean
  onClearFilters: () => void
}

const STATUS_OPTIONS: {
  value: StatusFilter
  label: string
  icon: React.ReactNode
}[] = [
  { value: 'all', label: 'All Clients', icon: <Users className="h-3 w-3" /> },
  {
    value: 'active',
    label: 'Active (7 days)',
    icon: <Clock className="h-3 w-3" />,
  },
  { value: 'invited', label: 'Invited', icon: <Send className="h-3 w-3" /> },
  {
    value: 'not_invited',
    label: 'Not Invited',
    icon: <User className="h-3 w-3" />,
  },
]

export default function ClientsFilters({
  statusFilter,
  onStatusFilter,
  coaches,
  loadingCoaches,
  selectedCoachId,
  selectedCoach,
  onCoachFilter,
  hasActiveFilters,
  onClearFilters,
}: ClientsFiltersProps) {
  const [coachSearch, setCoachSearch] = useState('')
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false)
  const [coachPopoverOpen, setCoachPopoverOpen] = useState(false)

  // Filter coaches based on search
  const filteredCoaches = coaches.filter(coach =>
    coach.name.toLowerCase().includes(coachSearch.toLowerCase()),
  )

  // Get current status label
  const currentStatusLabel =
    STATUS_OPTIONS.find(opt => opt.value === statusFilter)?.label ||
    'All Clients'

  return (
    <div className="mb-6 space-y-4">
      {/* Filters Row - Side by Side */}
      <div className="flex items-center gap-6 flex-wrap">
        {/* Status Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Status:</span>
          </div>

          <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="min-w-[160px] justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="h-3 w-3" />
                  {currentStatusLabel}
                </div>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <div className="p-1">
                {STATUS_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onStatusFilter(option.value)
                      setStatusPopoverOpen(false)
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-2 text-xs rounded-md hover:bg-slate-100 ${
                      statusFilter === option.value
                        ? 'bg-slate-100 font-medium'
                        : ''
                    }`}
                  >
                    {option.icon}
                    <span className="flex-1 text-left">{option.label}</span>
                    {statusFilter === option.value && (
                      <Check className="h-3 w-3 text-slate-600" />
                    )}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Coach Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Coach:</span>
          </div>

          <Popover open={coachPopoverOpen} onOpenChange={setCoachPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="min-w-[200px] justify-between text-xs"
                disabled={loadingCoaches}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  {selectedCoach ? selectedCoach.name : 'All Coaches'}
                </div>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
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
                    className={`w-full flex items-center gap-2 px-2 py-2 text-xs rounded-md hover:bg-slate-100 ${
                      selectedCoachId === null ? 'bg-slate-100 font-medium' : ''
                    }`}
                  >
                    <Users className="h-3 w-3" />
                    <span className="flex-1 text-left">All Coaches</span>
                    {selectedCoachId === null && (
                      <Check className="h-3 w-3 text-slate-600" />
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
                      className={`w-full flex items-center gap-2 px-2 py-2 text-xs rounded-md hover:bg-slate-100 ${
                        selectedCoachId === coach.id
                          ? 'bg-slate-100 font-medium'
                          : ''
                      }`}
                    >
                      <User className="h-3 w-3" />
                      <span className="flex-1 text-left">{coach.name}</span>
                      {selectedCoachId === coach.id && (
                        <Check className="h-3 w-3 text-slate-600" />
                      )}
                    </button>
                  ))}

                  {filteredCoaches.length === 0 && (
                    <div className="px-2 py-4 text-xs text-slate-500 text-center">
                      No coaches found
                    </div>
                  )}
                </div>
              </ScrollArea>
              {coaches.length > 0 && (
                <div className="p-2 border-t text-xs text-slate-500 text-center">
                  {coaches.length} coaches total
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Clear All Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-slate-500 hover:text-slate-700 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
          {statusFilter !== 'all' && (
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Status: {currentStatusLabel}
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
