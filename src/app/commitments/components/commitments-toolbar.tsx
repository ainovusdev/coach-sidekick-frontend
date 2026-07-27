'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CommitmentType, commitmentTypeLabels } from '@/types/commitment'
import { cn } from '@/lib/utils'
import { AlertCircle, ArrowUpDown, Layers, Search, X } from 'lucide-react'
import {
  CommitmentGroupBy,
  CommitmentSort,
  CommitmentTab,
  DueFilter,
} from '../utils/commitment-view'

interface ClientOption {
  id: string
  name: string
}

interface CommitmentsToolbarProps {
  tab: CommitmentTab
  onTabChange: (tab: CommitmentTab) => void
  counts: { all: number; active: number; drafts: number; completed: number }
  searchInput: string
  onSearchChange: (value: string) => void
  sort: CommitmentSort
  onSortChange: (sort: CommitmentSort) => void
  groupBy: CommitmentGroupBy
  onGroupByChange: (groupBy: CommitmentGroupBy) => void
  clientFilter: string
  onClientChange: (clientId: string) => void
  clients: ClientOption[]
  typeFilter: CommitmentType | 'all'
  onTypeChange: (type: CommitmentType | 'all') => void
  dueFilter: DueFilter
  onClearDue: () => void
}

const SORT_LABELS: Record<CommitmentSort, string> = {
  smart: 'Smart',
  due: 'Due date',
  priority: 'Priority',
  created: 'Newest',
  client: 'Client',
}

const GROUP_LABELS: Record<CommitmentGroupBy, string> = {
  none: 'No grouping',
  client: 'By client',
  session: 'By session',
  status: 'By status',
}

const GHOST_TRIGGER =
  'h-8 w-auto gap-1 border-0 bg-transparent px-2 shadow-none text-ink-3 hover:text-ink data-[state=open]:text-ink focus:ring-0 focus-visible:ring-1'

export function CommitmentsToolbar({
  tab,
  onTabChange,
  counts,
  searchInput,
  onSearchChange,
  sort,
  onSortChange,
  groupBy,
  onGroupByChange,
  clientFilter,
  onClientChange,
  clients,
  typeFilter,
  onTypeChange,
  dueFilter,
  onClearDue,
}: CommitmentsToolbarProps) {
  const tabs: { key: CommitmentTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'active', label: 'Active', count: counts.active },
    { key: 'drafts', label: 'Drafts', count: counts.drafts },
    { key: 'completed', label: 'Completed', count: counts.completed },
  ]

  return (
    <div className="mb-6 space-y-3">
      {/* Tabs + controls share one hairline */}
      <div className="flex flex-wrap items-end gap-x-2 gap-y-2 border-b border-line">
        <div className="flex items-center gap-5">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              className={cn(
                'pb-2.5 -mb-px text-sm font-medium border-b-2 transition-colors',
                tab === t.key
                  ? 'text-ink border-ink'
                  : 'text-ink-3 border-transparent hover:text-ink-2',
              )}
            >
              {t.label}
              {t.count > 0 && (
                <span className="ml-1.5 text-xs text-ink-4 tabular-nums">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex flex-wrap items-center gap-1 pb-1.5">
          {/* Search */}
          <div className="relative mr-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-4 pointer-events-none" />
            <Input
              value={searchInput}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="h-8 pl-8 w-[180px] border-0 shadow-none bg-surface-3/60 focus-visible:bg-surface-1 focus-visible:ring-1"
            />
            {searchInput && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink-2"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort */}
          <Select
            value={sort}
            onValueChange={v => onSortChange(v as CommitmentSort)}
          >
            <SelectTrigger className={GHOST_TRIGGER} aria-label="Sort">
              <span className="flex items-center gap-1.5 truncate">
                <ArrowUpDown className="h-3.5 w-3.5 shrink-0" />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as CommitmentSort[]).map(key => (
                <SelectItem key={key} value={key}>
                  {SORT_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Group by */}
          <Select
            value={groupBy}
            onValueChange={v => onGroupByChange(v as CommitmentGroupBy)}
          >
            <SelectTrigger className={GHOST_TRIGGER} aria-label="Group by">
              <span className="flex items-center gap-1.5 truncate">
                <Layers className="h-3.5 w-3.5 shrink-0" />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(GROUP_LABELS) as CommitmentGroupBy[]).map(key => (
                <SelectItem key={key} value={key}>
                  {GROUP_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Client filter */}
          <Select value={clientFilter} onValueChange={onClientChange}>
            <SelectTrigger className={GHOST_TRIGGER} aria-label="Client">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type filter */}
          <Select
            value={typeFilter}
            onValueChange={v => onTypeChange(v as CommitmentType | 'all')}
          >
            <SelectTrigger className={GHOST_TRIGGER} aria-label="Type">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(commitmentTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active due-filter chip */}
      {dueFilter && (
        <div className="flex items-center gap-2">
          <button
            onClick={onClearDue}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-vermillion-bg text-vermillion border border-vermillion hover:opacity-80 transition-opacity"
          >
            <AlertCircle className="h-3 w-3" />
            {dueFilter === 'overdue' ? 'Overdue only' : 'Due within 7 days'}
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}
