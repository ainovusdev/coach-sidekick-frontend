'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Commitment,
  CommitmentType,
  CommitmentStatus,
  CommitmentPriority,
} from '@/types/commitment'
import { CommitmentCreatePanel } from '@/components/commitments/commitment-create-panel'
import { CommitmentDetailPanel } from '@/components/commitments/commitment-detail-panel'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarWidget } from '@/components/ui/calendar'
import {
  useCommitments,
  useCommitmentStats,
} from '@/hooks/queries/use-commitments'
import { useClients } from '@/hooks/queries/use-clients'
import {
  useConfirmCommitment,
  useDiscardCommitment,
  useUpdateCommitment,
  useBulkConfirmCommitments,
  useBulkDiscardCommitments,
} from '@/hooks/mutations/use-commitment-mutations'
import { formatDate } from '@/lib/date-utils'
import { isPast, parseISO, differenceInDays } from 'date-fns'
import PageLayout from '@/components/layout/page-layout'
import {
  Plus,
  Target,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Loader2,
  ChevronRight,
  UserCircle,
  Calendar,
  Sparkles,
  XCircle,
  Edit,
  Trash2,
  Check,
  FileText,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// --- Helper types ---

interface ClientGroup {
  clientId: string
  clientName: string
  sessions: SessionGroup[]
  draftCount: number
  activeCount: number
  completedCount: number
}

interface SessionGroup {
  sessionId: string | null
  sessionLabel: string
  sessionDate: string | null
  commitments: Commitment[]
}

// --- Status/Priority config ---

const statusConfig: Record<
  CommitmentStatus,
  { label: string; className: string }
> = {
  draft: {
    label: 'Draft',
    className:
      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  },
  active: {
    label: 'Active',
    className:
      'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  in_progress: {
    label: 'In Progress',
    className:
      'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  completed: {
    label: 'Completed',
    className:
      'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  },
  abandoned: {
    label: 'Abandoned',
    className:
      'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  },
}

const priorityConfig: Record<
  CommitmentPriority,
  { label: string; className: string }
> = {
  low: { label: 'Low', className: 'text-gray-500' },
  medium: { label: 'Medium', className: 'text-amber-600' },
  high: { label: 'High', className: 'text-orange-600' },
  urgent: { label: 'Urgent', className: 'text-red-600' },
}

// --- Inline Commitment Row ---

function CommitmentRow({
  commitment,
  onEdit,
  onDelete,
  onConfirm,
  onReject,
  onStatusChange,
  onDateChange,
  isSelected,
  onSelect,
}: {
  commitment: Commitment
  onEdit: (c: Commitment) => void
  onDelete: (id: string) => void
  onConfirm: (id: string) => void
  onReject: (id: string) => void
  onStatusChange: (id: string, status: CommitmentStatus) => void
  onDateChange: (id: string, date: string | undefined) => void
  isSelected?: boolean
  onSelect?: (id: string) => void
}) {
  const [actionLoading, setActionLoading] = useState<
    'approve' | 'reject' | null
  >(null)
  const [dateOpen, setDateOpen] = useState(false)

  const handleConfirm = async () => {
    setActionLoading('approve')
    try {
      await onConfirm(commitment.id)
    } finally {
      setActionLoading(null)
    }
  }
  const handleReject = async () => {
    setActionLoading('reject')
    try {
      await onReject(commitment.id)
    } finally {
      setActionLoading(null)
    }
  }

  const status = statusConfig[commitment.status]
  const priority = priorityConfig[commitment.priority]
  const isDraft = commitment.status === 'draft'
  const isOverdue =
    commitment.status !== 'completed' &&
    commitment.target_date &&
    isPast(parseISO(commitment.target_date))
  const daysUntil = commitment.target_date
    ? differenceInDays(parseISO(commitment.target_date), new Date())
    : null

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
        isSelected && 'bg-blue-50/50 dark:bg-blue-900/10',
      )}
    >
      {/* Checkbox for drafts */}
      {isDraft && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect?.(commitment.id)}
          className="flex-shrink-0 mt-1"
        />
      )}

      {/* Left: content */}
      <div className="flex-1 min-w-0">
        {/* Title line */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:underline"
            onClick={() => onEdit(commitment)}
          >
            {commitment.title}
          </span>
          {commitment.extracted_from_transcript && (
            <Badge
              variant="outline"
              className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              AI
            </Badge>
          )}
          <Badge
            variant="outline"
            className={cn('text-xs', priority.className, 'border-current/20')}
          >
            {priority.label}
          </Badge>
        </div>

        {/* Description */}
        {commitment.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-2xl">
            {commitment.description}
          </p>
        )}

        {/* Transcript context for drafts */}
        {isDraft && commitment.transcript_context && (
          <p className="text-xs text-gray-400 italic mt-0.5 truncate max-w-xl">
            &ldquo;{commitment.transcript_context}&rdquo;
          </p>
        )}
      </div>

      {/* Right: inline controls + actions — always visible */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Inline status dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border cursor-pointer transition-colors hover:opacity-80',
                status.className,
              )}
            >
              {status.label}
              <ChevronRight className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isDraft && (
              <DropdownMenuItem onClick={() => onConfirm(commitment.id)}>
                <Check className="h-3.5 w-3.5 mr-2 text-green-500" />
                Approve
              </DropdownMenuItem>
            )}
            {commitment.status !== 'active' && !isDraft && (
              <DropdownMenuItem
                onClick={() => onStatusChange(commitment.id, 'active')}
              >
                <Target className="h-3.5 w-3.5 mr-2 text-blue-500" />
                Active
              </DropdownMenuItem>
            )}
            {commitment.status !== 'completed' && (
              <DropdownMenuItem
                onClick={() => onStatusChange(commitment.id, 'completed')}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-green-500" />
                Completed
              </DropdownMenuItem>
            )}
            {commitment.status !== 'abandoned' && (
              <DropdownMenuItem
                onClick={() => onStatusChange(commitment.id, 'abandoned')}
              >
                <XCircle className="h-3.5 w-3.5 mr-2 text-red-500" />
                Abandon
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Inline due date picker */}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border border-gray-200 dark:border-gray-700 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700',
                isOverdue
                  ? 'text-red-600 dark:text-red-400 font-medium border-red-200 dark:border-red-800'
                  : daysUntil !== null && daysUntil <= 7
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-600 dark:text-gray-400',
              )}
            >
              <Calendar className="h-3 w-3" />
              {commitment.target_date
                ? isOverdue
                  ? `${Math.abs(daysUntil!)}d overdue`
                  : formatDate(commitment.target_date, 'MMM d')
                : 'Set date'}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarWidget
              mode="single"
              selected={
                commitment.target_date
                  ? parseISO(commitment.target_date)
                  : undefined
              }
              onSelect={date => {
                onDateChange(
                  commitment.id,
                  date ? date.toISOString().split('T')[0] : undefined,
                )
                setDateOpen(false)
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Draft: Approve / Reject */}
        {isDraft && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs text-green-600 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20"
              onClick={handleConfirm}
              disabled={actionLoading !== null}
            >
              {actionLoading === 'approve' ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Check className="h-3 w-3 mr-1" />
              )}
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={handleReject}
              disabled={actionLoading !== null}
            >
              {actionLoading === 'reject' ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <XCircle className="h-3 w-3 mr-1" />
              )}
              Reject
            </Button>
          </>
        )}

        {/* Edit */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          onClick={() => onEdit(commitment)}
        >
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Button>

        {/* Delete */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={() => onDelete(commitment.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

// --- Main Page ---

export default function CommitmentsPage() {
  const [selectedClient, setSelectedClient] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<CommitmentType | 'all'>(
    'all',
  )
  const [activeTab, setActiveTab] = useState<
    'all' | 'active' | 'drafts' | 'completed'
  >('all')
  const [createPanelOpen, setCreatePanelOpen] = useState(false)
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<
    string | null
  >(null)
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<string>>(
    new Set(),
  )
  const [expandedClients, setExpandedClients] = useState<Set<string>>(
    new Set(['__all__']),
  )

  // Data
  const { data: commitmentsData, isLoading } = useCommitments({
    include_drafts: true,
    my_clients_only: true,
  })
  const { data: clientsData } = useClients()
  const { data: stats } = useCommitmentStats(undefined, true)
  const confirmMutation = useConfirmCommitment()
  const discardMutation = useDiscardCommitment()
  const updateMutation = useUpdateCommitment()
  const bulkConfirm = useBulkConfirmCommitments()
  const bulkDiscard = useBulkDiscardCommitments()

  const allCommitments = useMemo(
    () => commitmentsData?.commitments ?? [],
    [commitmentsData],
  )
  const clients = clientsData?.clients ?? []

  // Filter commitments
  const filteredCommitments = useMemo(() => {
    return allCommitments.filter(c => {
      if (selectedClient !== 'all' && c.client_id !== selectedClient)
        return false
      if (selectedType !== 'all' && c.type !== selectedType) return false
      if (activeTab === 'active' && c.status !== 'active') return false
      if (activeTab === 'drafts' && c.status !== 'draft') return false
      if (activeTab === 'completed' && c.status !== 'completed') return false
      return true
    })
  }, [allCommitments, selectedClient, selectedType, activeTab])

  // Group by client → session
  const clientGroups = useMemo(() => {
    const clientMap = new Map<string, ClientGroup>()

    for (const c of filteredCommitments) {
      const clientId = c.client_id
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          clientId,
          clientName: c.client_name || 'Unknown Client',
          sessions: [],
          draftCount: 0,
          activeCount: 0,
          completedCount: 0,
        })
      }
      const group = clientMap.get(clientId)!

      if (c.status === 'draft') group.draftCount++
      else if (c.status === 'active') group.activeCount++
      else if (c.status === 'completed') group.completedCount++
    }

    // Now group by session within each client
    for (const c of filteredCommitments) {
      const group = clientMap.get(c.client_id)!
      const sessionKey = c.session_id || '__manual__'

      let sessionGroup = group.sessions.find(s => {
        if (sessionKey === '__manual__') return s.sessionId === null
        return s.sessionId === sessionKey
      })

      if (!sessionGroup) {
        sessionGroup = {
          sessionId: c.session_id || null,
          sessionLabel: c.session_id ? `Session` : 'Manually Created',
          sessionDate: c.created_at,
          commitments: [],
        }
        group.sessions.push(sessionGroup)
      }

      sessionGroup.commitments.push(c)
    }

    // Sort sessions by date (newest first), and sort commitments within each session
    for (const group of clientMap.values()) {
      group.sessions.sort((a, b) => {
        if (!a.sessionDate) return 1
        if (!b.sessionDate) return -1
        return (
          new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
        )
      })
      for (const session of group.sessions) {
        session.commitments.sort((a, b) => {
          // Drafts first, then by date
          if (a.status === 'draft' && b.status !== 'draft') return -1
          if (a.status !== 'draft' && b.status === 'draft') return 1
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        })
      }
    }

    // Sort clients alphabetically
    return Array.from(clientMap.values()).sort((a, b) =>
      a.clientName.localeCompare(b.clientName),
    )
  }, [filteredCommitments])

  // Auto-expand all clients on first load

  useEffect(() => {
    if (clientGroups.length > 0 && expandedClients.has('__all__')) {
      setExpandedClients(new Set(clientGroups.map(g => g.clientId)))
    }
  }, [clientGroups.length])

  // Counts
  const draftCount = allCommitments.filter(c => c.status === 'draft').length
  const activeCount = allCommitments.filter(c => c.status === 'active').length
  const completedCount = allCommitments.filter(
    c => c.status === 'completed',
  ).length

  // Draft selection
  const allDraftIds = filteredCommitments
    .filter(c => c.status === 'draft')
    .map(c => c.id)
  const allDraftsSelected =
    allDraftIds.length > 0 && allDraftIds.every(id => selectedDraftIds.has(id))

  const toggleDraftSelection = (id: string) => {
    const next = new Set(selectedDraftIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedDraftIds(next)
  }

  const toggleAllDrafts = () => {
    if (allDraftsSelected) {
      setSelectedDraftIds(new Set())
    } else {
      setSelectedDraftIds(new Set(allDraftIds))
    }
  }

  const toggleClient = (clientId: string) => {
    const next = new Set(expandedClients)
    next.delete('__all__')
    if (next.has(clientId)) next.delete(clientId)
    else next.add(clientId)
    setExpandedClients(next)
  }

  // Handlers
  const handleConfirm = async (id: string) => {
    await confirmMutation.mutateAsync(id)
    selectedDraftIds.delete(id)
    setSelectedDraftIds(new Set(selectedDraftIds))
  }

  const handleReject = async (id: string) => {
    await discardMutation.mutateAsync(id)
    selectedDraftIds.delete(id)
    setSelectedDraftIds(new Set(selectedDraftIds))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this commitment?')) return
    await discardMutation.mutateAsync(id)
    selectedDraftIds.delete(id)
    setSelectedDraftIds(new Set(selectedDraftIds))
  }

  const handleStatusChange = async (
    id: string,
    newStatus: CommitmentStatus,
  ) => {
    await updateMutation.mutateAsync({
      commitmentId: id,
      data: { status: newStatus },
    })
  }

  const handleDateChange = async (id: string, date: string | undefined) => {
    await updateMutation.mutateAsync({
      commitmentId: id,
      data: { target_date: date },
    })
  }

  const handleBulkConfirm = async () => {
    if (selectedDraftIds.size === 0) return
    await bulkConfirm.mutateAsync(Array.from(selectedDraftIds))
    setSelectedDraftIds(new Set())
  }

  const handleBulkDiscard = async () => {
    if (selectedDraftIds.size === 0) return
    if (!confirm(`Delete ${selectedDraftIds.size} draft commitment(s)?`)) return
    await bulkDiscard.mutateAsync(Array.from(selectedDraftIds))
    setSelectedDraftIds(new Set())
  }

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Commitments
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Track and manage commitments across all your clients
            </p>
          </div>
          <Button
            onClick={() => setCreatePanelOpen(true)}
            className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Commitment
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card className="border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Active
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats?.total_active ?? activeCount}
              </p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Completed
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats?.total_completed ?? completedCount}
              </p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  At Risk
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats?.at_risk_count ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Completion Rate
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats?.completion_rate ?? 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Tabs Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Tabs */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {[
              {
                key: 'all' as const,
                label: 'All',
                count: allCommitments.length,
              },
              { key: 'active' as const, label: 'Active', count: activeCount },
              { key: 'drafts' as const, label: 'Drafts', count: draftCount },
              {
                key: 'completed' as const,
                label: 'Completed',
                count: completedCount,
              },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5',
                  activeTab === tab.key
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded-full',
                      activeTab === tab.key
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Client filter */}
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[180px] border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients
                .filter(c => c.is_my_client !== false)
                .map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Type filter */}
          <Select
            value={selectedType}
            onValueChange={v => setSelectedType(v as CommitmentType | 'all')}
          >
            <SelectTrigger className="w-[160px] border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="commitment">Commitment</SelectItem>
              <SelectItem value="habit">Habit</SelectItem>
              <SelectItem value="mp_outcome">MP Outcome</SelectItem>
              <SelectItem value="learning">Learning</SelectItem>
              <SelectItem value="sprint">Sprint</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Draft Actions */}
        {activeTab === 'drafts' && draftCount > 0 && (
          <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 mb-4">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={allDraftsSelected}
                    onCheckedChange={toggleAllDrafts}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedDraftIds.size > 0
                      ? `${selectedDraftIds.size} of ${allDraftIds.length} selected`
                      : `${allDraftIds.length} draft${allDraftIds.length !== 1 ? 's' : ''} pending review`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkDiscard}
                    disabled={
                      selectedDraftIds.size === 0 || bulkDiscard.isPending
                    }
                    className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    {bulkDiscard.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBulkConfirm}
                    disabled={
                      selectedDraftIds.size === 0 || bulkConfirm.isPending
                    }
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {bulkConfirm.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Approve ({selectedDraftIds.size})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {filteredCommitments.length === 0 && (
          <Card className="border-gray-200 dark:border-gray-700">
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <Target className="h-7 w-7 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                No commitments found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {activeTab === 'drafts'
                  ? 'No draft commitments to review. Drafts are created when AI extracts commitments from session transcripts.'
                  : 'Commitments are created during sessions or manually by coaches.'}
              </p>
              <Button
                variant="outline"
                onClick={() => setCreatePanelOpen(true)}
                className="border-gray-300 dark:border-gray-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Commitment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Client → Session → Commitments Hierarchy */}
        <div className="space-y-4">
          {clientGroups.map(clientGroup => (
            <Collapsible
              key={clientGroup.clientId}
              open={expandedClients.has(clientGroup.clientId)}
              onOpenChange={() => toggleClient(clientGroup.clientId)}
            >
              <Card className="border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Client Header */}
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left">
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 text-gray-400 transition-transform flex-shrink-0',
                        expandedClients.has(clientGroup.clientId) &&
                          'rotate-90',
                      )}
                    />
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 dark:bg-white flex-shrink-0">
                      <UserCircle className="h-4 w-4 text-white dark:text-gray-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {clientGroup.clientName}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {clientGroup.draftCount > 0 && (
                        <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs">
                          {clientGroup.draftCount} draft
                          {clientGroup.draftCount !== 1 && 's'}
                        </Badge>
                      )}
                      {clientGroup.activeCount > 0 && (
                        <Badge className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs">
                          {clientGroup.activeCount} active
                        </Badge>
                      )}
                      {clientGroup.completedCount > 0 && (
                        <Badge className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs">
                          {clientGroup.completedCount} done
                        </Badge>
                      )}
                    </div>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t border-gray-100 dark:border-gray-800">
                    {clientGroup.sessions.map((session, idx) => (
                      <div key={session.sessionId || `manual-${idx}`}>
                        {/* Session Header */}
                        <div className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800">
                          {session.sessionId ? (
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          ) : (
                            <FileText className="h-3.5 w-3.5 text-gray-400" />
                          )}
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {session.sessionId
                              ? `Session - ${session.sessionDate ? formatDate(session.sessionDate, 'MMM d, yyyy') : 'Unknown date'}`
                              : 'Manually Created'}
                          </span>
                          <Badge variant="outline" className="text-xs ml-auto">
                            {session.commitments.length}
                          </Badge>
                        </div>

                        {/* Commitments */}
                        <div>
                          {session.commitments.map(commitment => (
                            <CommitmentRow
                              key={commitment.id}
                              commitment={commitment}
                              onEdit={c => setSelectedCommitmentId(c.id)}
                              onDelete={handleDelete}
                              onConfirm={handleConfirm}
                              onReject={handleReject}
                              onStatusChange={handleStatusChange}
                              onDateChange={handleDateChange}
                              isSelected={selectedDraftIds.has(commitment.id)}
                              onSelect={toggleDraftSelection}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      </div>

      {/* Create Panel */}
      {clients.length > 0 && (
        <CommitmentCreatePanel
          isOpen={createPanelOpen}
          onClose={() => setCreatePanelOpen(false)}
          clientId={selectedClient !== 'all' ? selectedClient : clients[0].id}
          onCreated={commitment => {
            setCreatePanelOpen(false)
            setSelectedCommitmentId(commitment.id)
          }}
        />
      )}

      {/* Detail Panel */}
      <CommitmentDetailPanel
        commitmentId={selectedCommitmentId}
        onClose={() => setSelectedCommitmentId(null)}
      />
    </PageLayout>
  )
}
