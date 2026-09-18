'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PersonPicker,
  type PickedPerson,
} from '@/components/people/person-picker'
import { CommitmentType, commitmentTypeLabels } from '@/types/commitment'
import { cn } from '@/lib/utils'
import {
  AlertCircle,
  ArrowUpDown,
  Boxes,
  Layers,
  Search,
  UserRound,
  X,
} from 'lucide-react'
import {
  COMMITMENT_GROUP_BYS,
  CommitmentGroupBy,
  CommitmentSort,
  CommitmentTab,
  CommitmentView,
  DueFilter,
  VIEW_LABELS,
} from './commitment-view'

interface ClientOption {
  id: string
  name: string
}

interface CommitmentsToolbarProps {
  tabs: CommitmentTab[]
  tab: CommitmentTab
  onTabChange: (tab: CommitmentTab) => void
  counts: { all: number; active: number; drafts: number; completed: number }
  searchInput: string
  onSearchChange: (value: string) => void
  /** Who: everyone / me / unassigned / clients / others / a person. */
  view: CommitmentView
  onViewChange: (view: CommitmentView) => void
  assigneePerson: PickedPerson | null
  onAssigneeChange: (person: PickedPerson | null) => void
  /** Narrow the person picker (admin: coach-like people only). */
  onlyRoles?: (roles: string[]) => boolean
  sort: CommitmentSort
  onSortChange: (sort: CommitmentSort) => void
  groupBy: CommitmentGroupBy
  onGroupByChange: (groupBy: CommitmentGroupBy) => void
  /** Client filter; omit to hide (audiences without a client roster). */
  clientFilter?: string
  onClientChange?: (clientId: string) => void
  clients?: ClientOption[]
  typeFilter: CommitmentType | 'all'
  onTypeChange: (type: CommitmentType | 'all') => void
  dueFilter: DueFilter
  onClearDue: () => void
  /** Active `sandbox=` filter, shown as a chip. */
  sandboxChip?: { name: string | null; onClear: () => void } | null
}

const TAB_LABELS: Record<CommitmentTab, string> = {
  all: 'All',
  active: 'Active',
  drafts: 'Drafts',
  completed: 'Completed',
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
  sandbox: 'By sandbox',
  session: 'By session',
  status: 'By status',
  assignee: 'By person',
}

const VIEW_ORDER: CommitmentView[] = [
  'all',
  'mine',
  'unassigned',
  'clients',
  'others',
]

/** Sentinel for the "Person…" entry — never a real view. */
const PERSON = '__person__'

const GHOST_TRIGGER =
  'h-8 w-auto gap-1 border-0 bg-transparent px-2 shadow-none text-ink-3 hover:text-ink data-[state=open]:text-ink focus:ring-0 focus-visible:ring-1'

export function CommitmentsToolbar({
  tabs,
  tab,
  onTabChange,
  counts,
  searchInput,
  onSearchChange,
  view,
  onViewChange,
  assigneePerson,
  onAssigneeChange,
  onlyRoles,
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
  sandboxChip,
}: CommitmentsToolbarProps) {
  // "Person…" in the view select mounts the picker and opens it; once a
  // person is chosen the picker stays as the way to change or clear them.
  const [personMode, setPersonMode] = useState(false)
  const pickerHost = useRef<HTMLSpanElement>(null)
  const showPicker = personMode || assigneePerson !== null

  useEffect(() => {
    if (!personMode) return
    const t = setTimeout(
      () => pickerHost.current?.querySelector('button')?.click(),
      0,
    )
    return () => clearTimeout(t)
  }, [personMode])

  const viewValue = assigneePerson ? PERSON : view

  return (
    <div className="mb-6 space-y-3">
      {/* Tabs + controls share one hairline */}
      <div className="flex flex-wrap items-end gap-x-2 gap-y-2 border-b border-line">
        <div className="flex items-center gap-5">
          {tabs.map(key => {
            const count = counts[key]
            return (
              <button
                key={key}
                onClick={() => onTabChange(key)}
                data-testid={`hub-tab-${key}`}
                className={cn(
                  'pb-2.5 -mb-px text-sm font-medium border-b-2 transition-colors',
                  tab === key
                    ? 'text-ink border-ink'
                    : 'text-ink-3 border-transparent hover:text-ink-2',
                )}
              >
                {TAB_LABELS[key]}
                {count > 0 && (
                  <span className="ml-1.5 text-xs text-ink-4 tabular-nums">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
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
              data-testid="hub-search"
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

          {/* Who */}
          <Select
            value={viewValue}
            onValueChange={v => {
              if (v === PERSON) {
                setPersonMode(true)
                return
              }
              setPersonMode(false)
              onViewChange(v as CommitmentView)
            }}
          >
            <SelectTrigger
              className={GHOST_TRIGGER}
              aria-label="Who"
              data-testid="hub-view-select"
            >
              <span className="flex items-center gap-1.5 truncate">
                <UserRound className="h-3.5 w-3.5 shrink-0" />
                {assigneePerson ? (
                  <span className="truncate">
                    {assigneePerson.name || assigneePerson.email || 'Person'}
                  </span>
                ) : (
                  <SelectValue />
                )}
              </span>
            </SelectTrigger>
            <SelectContent>
              {VIEW_ORDER.map(key => (
                <SelectItem
                  key={key}
                  value={key}
                  data-testid={`hub-view-${key}`}
                >
                  {VIEW_LABELS[key]}
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value={PERSON} data-testid="hub-view-person">
                {assigneePerson
                  ? assigneePerson.name || assigneePerson.email || 'Person'
                  : 'Person…'}
              </SelectItem>
            </SelectContent>
          </Select>
          {showPicker && (
            <span ref={pickerHost} className="inline-flex">
              <PersonPicker
                value={assigneePerson}
                onChange={p => {
                  setPersonMode(false)
                  onAssigneeChange(p)
                }}
                onlyRoles={onlyRoles}
                allowClear
                size="sm"
                placeholder="Pick a person"
                className="border-0 bg-transparent text-ink-3 hover:text-ink"
                data-testid="hub-assignee-picker"
              />
            </span>
          )}

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
            <SelectTrigger
              className={GHOST_TRIGGER}
              aria-label="Group by"
              data-testid="hub-group-select"
            >
              <span className="flex items-center gap-1.5 truncate">
                <Layers className="h-3.5 w-3.5 shrink-0" />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              {COMMITMENT_GROUP_BYS.map(key => (
                <SelectItem key={key} value={key}>
                  {GROUP_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Client filter */}
          {clients && onClientChange && (
            <Select
              value={clientFilter ?? 'all'}
              onValueChange={onClientChange}
            >
              <SelectTrigger className={GHOST_TRIGGER} aria-label="Client">
                <SelectValue placeholder="All clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clients</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Type filter */}
          <Select
            value={typeFilter}
            onValueChange={v => onTypeChange(v as CommitmentType | 'all')}
          >
            <SelectTrigger className={GHOST_TRIGGER} aria-label="Type">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.entries(commitmentTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active filter chips */}
      {(dueFilter || sandboxChip) && (
        <div className="flex flex-wrap items-center gap-2">
          {dueFilter && (
            <button
              onClick={onClearDue}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-vermillion-bg text-vermillion border border-vermillion hover:opacity-80 transition-opacity"
            >
              <AlertCircle className="h-3 w-3" />
              {dueFilter === 'overdue'
                ? 'Overdue only'
                : dueFilter === 'today'
                  ? 'Due today'
                  : 'Due within 7 days'}
              <X className="h-3 w-3" />
            </button>
          )}
          {sandboxChip && (
            <button
              onClick={sandboxChip.onClear}
              data-testid="hub-sandbox-chip"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-3 text-ink-2 border border-line hover:opacity-80 transition-opacity"
            >
              <Boxes className="h-3 w-3" />
              {sandboxChip.name ? `In ${sandboxChip.name}` : 'One sandbox'}
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
