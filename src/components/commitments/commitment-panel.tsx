/**
 * Shared Commitment Panel
 * Used by both coach (QuickCommitment) and client (ClientCommitmentPanel) wrappers.
 * Renders form, tabs, commitment lists. Data fetching is handled by wrappers.
 */

'use client'

import React, { useState } from 'react'
import { format, isPast, addDays, addWeeks } from 'date-fns'
import {
  formatDate,
  formatDateOnly,
  formatRelativeTime,
  parseDateForPicker,
} from '@/lib/date-utils'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Check,
  Target,
  CalendarIcon,
  User,
  Briefcase,
  Loader2,
  Pencil,
  Trash2,
  X,
  Clock,
  TrendingUp,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  History,
  Sparkles,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Shared Types ───

export interface PanelCommitment {
  id: string
  title: string
  description?: string | null
  status: string
  priority?: string
  target_date?: string | null
  progress_percentage: number
  created_at: string
  updated_at: string
  is_coach_commitment?: boolean
  assigned_to_id?: string
  assigned_to_name?: string
  type?: string
  session_id?: string | null
  extracted_from_transcript?: boolean
  extraction_confidence?: number | null
  transcript_context?: string | null
}

export interface PanelTarget {
  id: string
  title: string
  goal_titles?: string[]
}

export interface PanelSprint {
  id: string
  title: string
  status: string
  target_ids: string[]
}

export interface PanelCommitmentGroup {
  date: string | null
  commitments: PanelCommitment[]
}

// ─── Props ───

export interface CommitmentPanelProps {
  variant: 'coach' | 'client'

  sessionCommitments: PanelCommitment[]
  loadingSession: boolean

  activeCommitments?: PanelCommitment[]
  loadingActive?: boolean

  pastGroups: PanelCommitmentGroup[]
  loadingPast: boolean

  targets: PanelTarget[]
  loadingTargets: boolean

  sprints?: PanelSprint[]

  onCreateCommitment: (data: {
    title: string
    target_date?: string
    target_ids?: string[]
    assigned_to_id?: string
  }) => Promise<void> | void
  isSaving?: boolean

  onToggleComplete: (commitment: PanelCommitment) => void

  onEditCommitment?: (
    id: string,
    data: { title?: string; target_date?: string },
  ) => Promise<void>
  onDeleteCommitment?: (id: string) => Promise<void>

  onExtract?: () => void
  isExtracting?: boolean
  onConfirmDraft?: (
    id: string,
    data: { title: string; target_date?: string; target_ids?: string[] },
  ) => void
  onRejectDraft?: (id: string) => void

  onOpenFull?: (commitment: PanelCommitment) => void

  currentUserId?: string
}

type TabType = 'session' | 'active' | 'past'

// ─── Draft Commitment Card (inline editing) ───

function DraftCommitmentCard({
  commitment,
  targets,
  onConfirm,
  onReject,
  accentChipSelected,
  accentChipHover,
}: {
  commitment: PanelCommitment
  targets: PanelTarget[]
  onConfirm: (
    id: string,
    data: { title: string; target_date?: string; target_ids?: string[] },
  ) => void | Promise<void>
  onReject: (id: string) => void | Promise<void>
  accentChipSelected: string
  accentChipHover: string
}) {
  const [editTitle, setEditTitle] = useState(commitment.title)
  const [editDate, setEditDate] = useState<Date | undefined>(
    parseDateForPicker(commitment.target_date),
  )
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([])
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleAccept = () => {
    if (!editTitle.trim()) return
    onConfirm(commitment.id, {
      title: editTitle.trim(),
      target_date: editDate ? format(editDate, 'yyyy-MM-dd') : undefined,
      target_ids: selectedTargetIds.length > 0 ? selectedTargetIds : undefined,
    })
  }

  return (
    <div className="border border-dashed border-line-strong bg-paper/50 rounded-lg p-3">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-indigo " />
          <span className="text-xs font-medium text-indigo ">Suggested</span>
        </div>
        {commitment.extraction_confidence != null && (
          <span className="text-xs text-ink-4">
            {Math.round(commitment.extraction_confidence * 100)}% confidence
          </span>
        )}
      </div>

      {/* Editable title */}
      <Input
        value={editTitle}
        onChange={e => setEditTitle(e.target.value)}
        className="h-8 text-sm border-line bg-surface-1 mb-2"
        placeholder="Commitment title"
      />

      {/* Transcript context */}
      {commitment.transcript_context && (
        <p className="text-xs italic text-ink-3 bg-surface-1/80 rounded px-2 py-1 mb-2">
          &ldquo;{commitment.transcript_context}&rdquo;
        </p>
      )}

      {/* Date quick-picks */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {[
          { label: '1 week', date: addWeeks(new Date(), 1) },
          { label: '2 weeks', date: addWeeks(new Date(), 2) },
        ].map(option => (
          <Button
            key={option.label}
            type="button"
            size="sm"
            variant={
              editDate?.toDateString() === option.date.toDateString()
                ? 'default'
                : 'outline'
            }
            onClick={() => setEditDate(option.date)}
            className={cn(
              'h-6 text-xs px-2',
              editDate?.toDateString() === option.date.toDateString()
                ? 'bg-ink hover:bg-ink-2 text-ink-on-dark '
                : 'border-line text-ink-3 ',
            )}
          >
            {option.label}
          </Button>
        ))}
        <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className={cn(
                'h-6 text-xs px-2 border-line text-ink-3 ',
                editDate &&
                  ![addWeeks(new Date(), 1), addWeeks(new Date(), 2)].some(
                    d => d.toDateString() === editDate.toDateString(),
                  ) &&
                  'bg-ink hover:bg-ink-2 text-ink-on-dark border-line ',
              )}
            >
              <CalendarIcon className="h-3 w-3 mr-1" />
              {editDate &&
              ![addWeeks(new Date(), 1), addWeeks(new Date(), 2)].some(
                d => d.toDateString() === editDate.toDateString(),
              )
                ? format(editDate, 'MMM d')
                : 'Pick date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={editDate}
              onSelect={d => {
                setEditDate(d)
                setShowDatePicker(false)
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {editDate && (
          <button
            type="button"
            onClick={() => setEditDate(undefined)}
            className="text-xs text-ink-4 hover:text-ink-3 "
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Outcome chips */}
      {targets.length > 0 && (
        <div className="mb-2">
          <span className="text-xs font-medium text-ink-3 mb-1 block">
            Link to Meta Performance Outcomes
          </span>
          <div className="flex flex-wrap gap-1.5">
            {targets.map(target => {
              const isSelected = selectedTargetIds.includes(target.id)
              return (
                <button
                  key={target.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedTargetIds(prev =>
                        prev.filter(id => id !== target.id),
                      )
                    } else {
                      setSelectedTargetIds(prev => [...prev, target.id])
                    }
                  }}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors',
                    isSelected
                      ? accentChipSelected
                      : `bg-surface-1 text-ink-2 border-line ${accentChipHover}`,
                  )}
                >
                  {isSelected && <Check className="h-2.5 w-2.5" />}
                  {target.title}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onReject(commitment.id)}
          className="h-7 text-xs text-ink-3 hover:text-vermillion"
        >
          <X className="h-3 w-3 mr-1" />
          Dismiss
        </Button>
        <Button
          size="sm"
          onClick={handleAccept}
          disabled={!editTitle.trim()}
          className="h-7 text-xs bg-ink hover:bg-ink-2 text-ink-on-dark "
        >
          <Check className="h-3 w-3 mr-1" />
          Accept
        </Button>
      </div>
    </div>
  )
}

export function CommitmentPanel({
  variant,
  sessionCommitments,
  loadingSession,
  activeCommitments = [],
  loadingActive = false,
  pastGroups,
  loadingPast,
  targets,
  loadingTargets,
  sprints = [],
  onCreateCommitment,
  isSaving = false,
  onToggleComplete,
  onEditCommitment,
  onDeleteCommitment,
  onExtract,
  isExtracting = false,
  onConfirmDraft,
  onRejectDraft,
  onOpenFull,
  currentUserId,
}: CommitmentPanelProps) {
  const isCoach = variant === 'coach'

  // Form state
  const [title, setTitle] = useState('')
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined)
  const [assigneeType, setAssigneeType] = useState<'client' | 'coach'>('client')
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([])
  const [showOutcomes, setShowOutcomes] = useState(true)
  const [selectedSprintIds, setSelectedSprintIds] = useState<string[]>([])
  const [showSprints, setShowSprints] = useState(true)

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('session')

  // Edit state (coach only)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState<Date | undefined>(undefined)
  const [isEditSaving, setIsEditSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Accent classes
  const accent = isCoach
    ? {
        button: 'bg-ds-accent hover:bg-ds-accent ',
        tabActive: 'text-ds-accent border-ds-accent bg-ds-accent-bg/50 ',
        chipSelected: 'bg-ds-accent text-ink-on-dark border-ds-accent ',
        chipHover: 'hover:border-ds-accent ',
        dateText: 'text-ds-accent ',
        dateButtonActive: 'bg-ds-accent hover:bg-ds-accent text-ink-on-dark',
        inputFocus: 'focus:border-ds-accent',
        itemHover: 'hover:border-ds-accent hover:shadow-sm',
      }
    : {
        button: 'bg-ink hover:bg-ink-2 text-ink-on-dark ',
        tabActive: 'text-ink border-line bg-paper ',
        chipSelected: 'bg-ink text-ink-on-dark border-line ',
        chipHover: 'hover:border-line-strong ',
        dateText: 'text-ink-2 ',
        dateButtonActive: 'bg-ink hover:bg-ink-2 text-ink-on-dark ',
        inputFocus: 'focus:border-line-strong',
        itemHover: 'hover:border-line-strong hover:shadow-sm',
      }

  // ─── Handlers ───

  const handleCreate = async () => {
    if (!title.trim()) return

    const data = {
      title: title.trim(),
      target_date: targetDate ? format(targetDate, 'yyyy-MM-dd') : undefined,
      target_ids: selectedTargetIds.length > 0 ? selectedTargetIds : undefined,
      assigned_to_id:
        isCoach && assigneeType === 'coach' ? currentUserId : undefined,
    }

    // Clear form optimistically
    const prevTitle = title
    const prevDate = targetDate
    const prevTargets = selectedTargetIds
    setTitle('')
    setTargetDate(undefined)
    setSelectedTargetIds([])
    setSelectedSprintIds([])
    if (isCoach) setAssigneeType('client')

    try {
      await onCreateCommitment(data)
    } catch {
      // Restore form on error
      setTitle(prevTitle)
      setTargetDate(prevDate)
      setSelectedTargetIds(prevTargets)
    }
  }

  const handleStartEdit = (commitment: PanelCommitment) => {
    setEditingId(commitment.id)
    setEditTitle(commitment.title)
    setEditDate(parseDateForPicker(commitment.target_date))
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditDate(undefined)
  }

  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim() || !onEditCommitment || isEditSaving) return
    setIsEditSaving(true)
    try {
      await onEditCommitment(id, {
        title: editTitle.trim(),
        target_date: editDate ? format(editDate, 'yyyy-MM-dd') : undefined,
      })
      setEditingId(null)
      setEditTitle('')
      setEditDate(undefined)
    } finally {
      setIsEditSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!onDeleteCommitment || isDeleting) return
    setIsDeleting(true)
    try {
      await onDeleteCommitment(id)
      setDeleteConfirmId(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleCreate()
    }
  }

  // ─── Counts ───

  const sessionCount = sessionCommitments.length
  const activeCount = activeCommitments.filter(
    c => c.status === 'active',
  ).length
  const pastCount = pastGroups.reduce(
    (sum, g) => sum + (g.commitments?.length || 0),
    0,
  )

  // ─── Helpers ───

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-vermillion-bg text-vermillion border-vermillion '
      case 'high':
        return 'bg-amber-token-bg text-amber-token border-amber-token '
      case 'medium':
        return 'bg-amber-token-bg text-amber-token border-amber-token '
      default:
        return 'bg-surface-3 text-ink-3 border-line '
    }
  }

  // ─── Render: Commitment Item (Session & Active tabs) ───

  const renderCommitmentItem = (
    commitment: PanelCommitment,
    showCompleteToggle: boolean,
  ) => {
    const isOverdue =
      commitment.target_date &&
      isPast(new Date(commitment.target_date)) &&
      commitment.status !== 'completed'
    const progress = commitment.progress_percentage || 0

    // Draft commitment (AI extracted) — rendered via DraftCommitmentCard
    if (commitment.status === 'draft' && onConfirmDraft && onRejectDraft) {
      return (
        <DraftCommitmentCard
          commitment={commitment}
          targets={targets}
          onConfirm={onConfirmDraft}
          onReject={onRejectDraft}
          accentChipSelected={accent.chipSelected}
          accentChipHover={accent.chipHover}
        />
      )
    }

    // Inline edit mode (coach only)
    if (isCoach && editingId === commitment.id) {
      return (
        <div className="space-y-2 p-3 bg-ds-accent-bg rounded-lg">
          <Input
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            className="h-9 text-sm border-line bg-surface-1 "
            placeholder="Commitment title"
            autoFocus
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal h-8 text-xs border-line bg-surface-1',
                  !editDate && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-3 w-3" />
                {editDate ? (
                  format(editDate, 'PPP')
                ) : (
                  <span>Pick due date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={editDate}
                onSelect={setEditDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancelEdit}
              className="h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => handleSaveEdit(commitment.id)}
              disabled={!editTitle.trim() || isEditSaving}
              className="h-7 text-xs bg-ds-accent hover:bg-ds-accent "
            >
              {isEditSaving ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Check className="h-3 w-3 mr-1" />
              )}
              Save
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div
        className={cn(
          'group p-3 rounded-lg border transition-all',
          commitment.status === 'completed'
            ? 'bg-paper border-line '
            : isOverdue
              ? 'bg-vermillion-bg border-vermillion '
              : `bg-surface-1 border-line ${accent.itemHover}`,
          onOpenFull && 'cursor-pointer',
        )}
        onClick={() => onOpenFull?.(commitment)}
      >
        <div className="flex items-start gap-3">
          {showCompleteToggle && (
            <button
              onClick={e => {
                e.stopPropagation()
                onToggleComplete(commitment)
              }}
              className={cn(
                'mt-0.5 flex-shrink-0 transition-colors',
                commitment.status === 'completed'
                  ? 'text-forest'
                  : 'text-ink-2 hover:text-forest',
              )}
            >
              {commitment.status === 'completed' ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p
                className={cn(
                  'text-sm font-medium line-clamp-2',
                  commitment.status === 'completed'
                    ? 'text-ink-3 line-through'
                    : 'text-ink ',
                )}
              >
                {commitment.title}
              </p>

              {/* Edit/Delete (coach only) */}
              {isCoach && onEditCommitment && onDeleteCommitment && (
                <div
                  className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleStartEdit(commitment)}
                    className="p-1 text-ink-4 hover:text-ink-3 hover:bg-surface-3 rounded"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <Popover
                    open={deleteConfirmId === commitment.id}
                    onOpenChange={open =>
                      setDeleteConfirmId(open ? commitment.id : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <button
                        className="p-1 text-ink-4 hover:text-vermillion hover:bg-vermillion-bg rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3 " align="end">
                      <p className="text-sm text-ink-2 mb-2">
                        Delete this commitment?
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteConfirmId(null)}
                          className="h-7 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(commitment.id)}
                          disabled={isDeleting}
                          className="h-7 text-xs"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Delete'
                          )}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* Meta info row */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {isCoach && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs px-1.5 py-0 h-5',
                    commitment.is_coach_commitment
                      ? 'border-line-strong text-ink-2 bg-paper '
                      : 'border-ds-accent text-ds-accent bg-ds-accent-bg ',
                  )}
                >
                  {commitment.is_coach_commitment ? (
                    <Briefcase className="h-2.5 w-2.5 mr-1" />
                  ) : (
                    <User className="h-2.5 w-2.5 mr-1" />
                  )}
                  {commitment.is_coach_commitment ? 'Coach' : 'Client'}
                </Badge>
              )}

              {isCoach &&
                (commitment.priority === 'high' ||
                  commitment.priority === 'urgent') && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs px-1.5 py-0 h-5',
                      getPriorityColor(commitment.priority),
                    )}
                  >
                    {commitment.priority}
                  </Badge>
                )}

              {progress > 0 && commitment.status !== 'completed' && (
                <span className="flex items-center gap-1 text-xs text-forest ">
                  <TrendingUp className="h-3 w-3" />
                  {progress}%
                </span>
              )}

              {commitment.target_date && (
                <span
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    isOverdue ? 'text-vermillion font-medium' : 'text-ink-3 ',
                  )}
                >
                  <CalendarIcon className="h-3 w-3" />
                  {isOverdue && 'Overdue: '}
                  {formatDateOnly(commitment.target_date, 'MMM d')}
                </span>
              )}

              {isCoach && (
                <span className="text-xs text-ink-4">
                  {formatRelativeTime(commitment.created_at)}
                </span>
              )}
            </div>

            {progress > 0 &&
              progress < 100 &&
              commitment.status !== 'completed' && (
                <div className="mt-2 w-full bg-surface-3 rounded-full h-1.5">
                  <div
                    className=" h-1.5 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Render: Past Groups (date-grouped) ───

  const renderPastGroups = () => {
    if (loadingPast) {
      return (
        <div className="p-4 flex items-center justify-center gap-2 text-ink-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading...</span>
        </div>
      )
    }

    if (pastGroups.length === 0) {
      return (
        <div className="p-6 text-center">
          <History className="h-8 w-8 text-ink-2 mx-auto mb-2" />
          <p className="text-sm text-ink-3 ">No past commitments</p>
          <p className="text-xs text-ink-4 mt-1">
            {isCoach
              ? 'Completed and abandoned commitments will appear here'
              : 'Previous session commitments will appear here'}
          </p>
        </div>
      )
    }

    return (
      <div className="p-3 space-y-4">
        {pastGroups.map((group, idx) => (
          <div key={idx}>
            <div className="text-xs font-medium text-ink-3 mb-2 flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {group.date
                ? formatDate(group.date, 'MMM d, yyyy')
                : 'Previous Sessions'}
            </div>
            <div className="space-y-2 pl-3 border-l-2 border-line ">
              {(group.commitments || []).map(commitment => (
                <div
                  key={commitment.id}
                  className={cn(
                    'flex items-start gap-2 rounded px-1 -mx-1',
                    onOpenFull && 'cursor-pointer hover:bg-paper ',
                  )}
                  onClick={() => onOpenFull?.(commitment)}
                >
                  {commitment.status === 'abandoned' ? (
                    <X className="h-4 w-4 text-vermillion flex-shrink-0 mt-0.5" />
                  ) : (
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onToggleComplete(commitment)
                      }}
                      className={cn(
                        'mt-0.5 flex-shrink-0 transition-colors',
                        commitment.status === 'completed'
                          ? 'text-forest'
                          : 'text-ink-2 hover:text-forest',
                      )}
                      title={
                        commitment.status === 'completed'
                          ? 'Mark as active'
                          : 'Mark as completed'
                      }
                    >
                      {commitment.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-xs',
                        commitment.status === 'completed'
                          ? 'text-ink-3 line-through'
                          : commitment.status === 'abandoned'
                            ? 'text-ink-4 line-through'
                            : 'text-ink-2 ',
                      )}
                    >
                      {commitment.title}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] px-1.5 py-0',
                          commitment.status === 'completed'
                            ? 'bg-forest-bg text-forest '
                            : commitment.status === 'abandoned'
                              ? 'bg-vermillion-bg text-vermillion '
                              : commitment.status === 'active'
                                ? 'bg-ds-accent-bg text-ds-accent '
                                : 'bg-surface-3 text-ink-2 ',
                        )}
                      >
                        {commitment.status}
                      </Badge>
                      {commitment.target_date && (
                        <span className="text-[10px] text-ink-4 flex items-center gap-0.5">
                          <CalendarIcon className="h-2.5 w-2.5" />
                          {formatDateOnly(commitment.target_date, 'MMM d')}
                        </span>
                      )}
                      {isCoach && commitment.is_coach_commitment && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0 border-line-strong "
                        >
                          <Briefcase className="h-2 w-2 mr-0.5" />
                          Coach
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ─── Tabs config ───

  const tabs = isCoach
    ? [
        {
          id: 'session' as TabType,
          label: 'This Session',
          icon: Clock,
          count: sessionCount,
        },
        {
          id: 'active' as TabType,
          label: 'Active',
          icon: Target,
          count: activeCount,
        },
        {
          id: 'past' as TabType,
          label: 'Past',
          icon: History,
          count: pastCount,
        },
      ]
    : [
        {
          id: 'session' as TabType,
          label: 'This Session',
          icon: Clock,
          count: sessionCount,
        },
        {
          id: 'past' as TabType,
          label: 'Past',
          icon: History,
          count: pastCount,
        },
      ]

  // ─── Main Render ───

  return (
    <Card className="bg-surface-1 rounded-xl shadow-sm border border-line flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-line flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-ink-2 " />
          <span className="text-sm font-semibold text-ink ">Commitments</span>
          {onExtract && (
            <Button
              size="sm"
              variant="outline"
              onClick={onExtract}
              disabled={isExtracting}
              className="h-7 text-xs border-line-strong text-indigo hover:bg-indigo-bg "
            >
              {isExtracting ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              {isExtracting ? 'Extracting...' : 'Extract'}
            </Button>
          )}
        </div>

        {isCoach && (
          <div className="flex items-center gap-0.5 bg-surface-3 rounded-md p-0.5">
            <button
              onClick={() => setAssigneeType('client')}
              className={cn(
                'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors',
                assigneeType === 'client'
                  ? 'bg-surface-1 text-ink shadow-sm'
                  : 'text-ink-3 hover:text-ink-2 ',
              )}
            >
              <User className="h-3 w-3" />
              Client
            </button>
            <button
              onClick={() => setAssigneeType('coach')}
              className={cn(
                'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors',
                assigneeType === 'coach'
                  ? 'bg-surface-1 text-ink shadow-sm'
                  : 'text-ink-3 hover:text-ink-2 ',
              )}
            >
              <Briefcase className="h-3 w-3" />
              Coach
            </button>
          </div>
        )}
      </div>

      {/* Form */}
      <CardContent className="p-4 flex-shrink-0">
        <div className="space-y-3">
          <Input
            placeholder={
              isCoach
                ? assigneeType === 'client'
                  ? 'What will the client commit to?'
                  : 'What will you (coach) commit to?'
                : 'What will you commit to?'
            }
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn('border-line text-sm h-10', accent.inputFocus)}
            maxLength={200}
          />

          {/* Outcomes */}
          {targets.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowOutcomes(!showOutcomes)}
                className="flex items-center gap-1.5 text-xs font-medium text-ink-3 hover:text-ink-2 transition-colors"
              >
                {showOutcomes ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                Link to Meta Performance Outcomes
                {selectedTargetIds.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs px-1.5 py-0 h-4 ml-1"
                  >
                    {selectedTargetIds.length}
                  </Badge>
                )}
              </button>
              {showOutcomes && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
                  {loadingTargets ? (
                    <span className="text-xs text-ink-4 ">
                      Loading meta performance outcomes...
                    </span>
                  ) : (
                    targets.map(target => {
                      const isSelected = selectedTargetIds.includes(target.id)
                      return (
                        <button
                          key={target.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTargetIds(prev =>
                                prev.filter(id => id !== target.id),
                              )
                            } else {
                              setSelectedTargetIds(prev => [...prev, target.id])
                            }
                          }}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                            isSelected
                              ? accent.chipSelected
                              : `bg-surface-1 text-ink-2 border-line ${accent.chipHover}`,
                          )}
                          title={
                            target.goal_titles && target.goal_titles.length > 0
                              ? `Vision: ${target.goal_titles.join(', ')}`
                              : undefined
                          }
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                          {target.title}
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sprints */}
          {sprints.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowSprints(!showSprints)}
                className="flex items-center gap-1.5 text-xs font-medium text-ink-3 hover:text-ink-2 transition-colors"
              >
                {showSprints ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                Link to Sprint
                {selectedSprintIds.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs px-1.5 py-0 h-4 ml-1"
                  >
                    {selectedSprintIds.length}
                  </Badge>
                )}
              </button>
              {showSprints && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {sprints.map(sprint => {
                    const isSelected = selectedSprintIds.includes(sprint.id)
                    return (
                      <button
                        key={sprint.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            // Deselect sprint and remove its targets
                            setSelectedSprintIds(prev =>
                              prev.filter(id => id !== sprint.id),
                            )
                            setSelectedTargetIds(prev =>
                              prev.filter(
                                id => !sprint.target_ids.includes(id),
                              ),
                            )
                          } else {
                            // Select sprint and auto-select its targets
                            setSelectedSprintIds(prev => [...prev, sprint.id])
                            setSelectedTargetIds(prev => {
                              const newIds = sprint.target_ids.filter(
                                id => !prev.includes(id),
                              )
                              return [...prev, ...newIds]
                            })
                          }
                        }}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                          isSelected
                            ? accent.chipSelected
                            : `bg-surface-1 text-ink-2 border-line ${accent.chipHover}`,
                        )}
                      >
                        {isSelected ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Zap className="h-3 w-3" />
                        )}
                        {sprint.title}
                        {sprint.target_ids.length > 0 && (
                          <span className="text-[10px] opacity-70">
                            ({sprint.target_ids.length})
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Due Date */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-ink-3 ">
                Due Date
              </label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowCalendar(!showCalendar)}
                className="h-6 px-2 text-xs text-ink-3 hover:text-ink-2 "
              >
                {showCalendar ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Hide calendar
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show calendar
                  </>
                )}
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { label: 'Tomorrow', date: addDays(new Date(), 1) },
                { label: '3 days', date: addDays(new Date(), 3) },
                { label: '1 week', date: addWeeks(new Date(), 1) },
                { label: '2 weeks', date: addWeeks(new Date(), 2) },
              ].map(option => (
                <Button
                  key={option.label}
                  type="button"
                  size="sm"
                  variant={
                    targetDate?.toDateString() === option.date.toDateString()
                      ? 'default'
                      : 'outline'
                  }
                  onClick={() => setTargetDate(option.date)}
                  className={cn(
                    'h-7 text-xs',
                    targetDate?.toDateString() === option.date.toDateString()
                      ? accent.dateButtonActive
                      : `border-line text-ink-3 ${accent.chipHover}`,
                  )}
                >
                  {option.label}
                </Button>
              ))}
              {targetDate && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setTargetDate(undefined)}
                  className="h-7 text-xs text-ink-4 hover:text-ink-3"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {showCalendar && (
              <div className="rounded-lg border border-line bg-surface-1 overflow-hidden">
                <Calendar
                  mode="single"
                  selected={targetDate}
                  onSelect={setTargetDate}
                  className="mx-auto"
                />
              </div>
            )}

            {targetDate && (
              <p
                className={cn(
                  'text-xs mt-2 flex items-center gap-1',
                  accent.dateText,
                )}
              >
                <CalendarIcon className="h-3 w-3" />
                Due: {format(targetDate, 'EEEE, MMMM d, yyyy')}
              </p>
            )}
          </div>

          {/* Add Button */}
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || isSaving}
            className={cn('w-full h-9', accent.button)}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-1" />
            )}
            {isSaving ? 'Adding...' : 'Add Commitment'}
          </Button>
        </div>
      </CardContent>

      {/* Tabs */}
      <div className="border-t border-line flex-shrink-0">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 py-2.5 text-xs font-medium transition-colors border-b-2',
                activeTab === tab.id
                  ? accent.tabActive
                  : 'text-ink-3 border-transparent hover:text-ink-2 hover:bg-paper ',
              )}
            >
              <tab.icon className="h-3.5 w-3.5 inline mr-1.5" />
              {tab.label}
              {tab.count > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 text-xs px-1.5 py-0 h-4"
                >
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Commitments List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'session' ? (
          loadingSession ? (
            <div className="p-4 flex items-center justify-center gap-2 text-ink-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Loading...</span>
            </div>
          ) : sessionCommitments.length === 0 ? (
            <div className="p-6 text-center">
              <Target className="h-8 w-8 text-ink-2 mx-auto mb-2" />
              <p className="text-sm text-ink-3 ">No commitments this session</p>
              <p className="text-xs text-ink-4 mt-1">
                Add one above to get started
              </p>
            </div>
          ) : (
            (() => {
              const drafts = sessionCommitments.filter(
                c => c.status === 'draft',
              )
              const nonDrafts = sessionCommitments.filter(
                c => c.status !== 'draft',
              )
              return (
                <div className="p-3 space-y-2">
                  {drafts.length > 0 && (
                    <>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-ink-3 ">
                        <Sparkles className="h-3 w-3" />
                        AI Suggestions
                      </div>
                      {drafts.map(c => (
                        <div key={c.id}>{renderCommitmentItem(c, false)}</div>
                      ))}
                      {nonDrafts.length > 0 && (
                        <div className="border-t border-line my-2" />
                      )}
                    </>
                  )}
                  {nonDrafts.map(c => (
                    <div key={c.id}>{renderCommitmentItem(c, !isCoach)}</div>
                  ))}
                </div>
              )
            })()
          )
        ) : activeTab === 'active' ? (
          loadingActive ? (
            <div className="p-4 flex items-center justify-center gap-2 text-ink-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Loading...</span>
            </div>
          ) : activeCommitments.length === 0 ? (
            <div className="p-6 text-center">
              <Target className="h-8 w-8 text-ink-2 mx-auto mb-2" />
              <p className="text-sm text-ink-3 ">No active commitments</p>
              <p className="text-xs text-ink-4 mt-1">
                All commitments have been completed!
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {activeCommitments.map(c => (
                <div key={c.id}>{renderCommitmentItem(c, true)}</div>
              ))}
            </div>
          )
        ) : (
          renderPastGroups()
        )}
      </div>
    </Card>
  )
}

// ─── Utility: Group flat commitments by session ───

export function groupCommitmentsBySession(
  commitments: PanelCommitment[],
): PanelCommitmentGroup[] {
  const grouped = new Map<
    string,
    { date: string | null; commitments: PanelCommitment[] }
  >()

  for (const c of commitments) {
    const key = c.session_id || 'no-session'
    if (!grouped.has(key)) {
      grouped.set(key, { date: c.created_at, commitments: [] })
    }
    grouped.get(key)!.commitments.push(c)
  }

  return Array.from(grouped.values()).sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
}
