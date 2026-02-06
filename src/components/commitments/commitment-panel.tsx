/**
 * Shared Commitment Panel
 * Used by both coach (QuickCommitment) and client (ClientCommitmentPanel) wrappers.
 * Renders form, tabs, commitment lists. Data fetching is handled by wrappers.
 */

'use client'

import React, { useState } from 'react'
import { format, isPast, addDays, addWeeks } from 'date-fns'
import { formatRelativeTime } from '@/lib/date-utils'
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
    commitment.target_date ? new Date(commitment.target_date) : undefined,
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
    <div className="border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-3">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-violet-600 dark:text-violet-400" />
          <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
            Suggested
          </span>
        </div>
        {commitment.extraction_confidence != null && (
          <span className="text-xs text-gray-400">
            {Math.round(commitment.extraction_confidence * 100)}% confidence
          </span>
        )}
      </div>

      {/* Editable title */}
      <Input
        value={editTitle}
        onChange={e => setEditTitle(e.target.value)}
        className="h-8 text-sm border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 mb-2"
        placeholder="Commitment title"
      />

      {/* Transcript context */}
      {commitment.transcript_context && (
        <p className="text-xs italic text-gray-500 bg-white/80 dark:bg-gray-700/50 rounded px-2 py-1 mb-2">
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
                ? 'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900'
                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400',
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
                'h-6 text-xs px-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400',
                editDate &&
                  ![addWeeks(new Date(), 1), addWeeks(new Date(), 2)].some(
                    d => d.toDateString() === editDate.toDateString(),
                  ) &&
                  'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-white',
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
              disabled={date => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {editDate && (
          <button
            type="button"
            onClick={() => setEditDate(undefined)}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Outcome chips */}
      {targets.length > 0 && (
        <div className="mb-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
            Link to Outcomes
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
                      : `bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 ${accentChipHover}`,
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
          className="h-7 text-xs text-gray-500 hover:text-red-500"
        >
          <X className="h-3 w-3 mr-1" />
          Dismiss
        </Button>
        <Button
          size="sm"
          onClick={handleAccept}
          disabled={!editTitle.trim()}
          className="h-7 text-xs bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900"
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
  onCreateCommitment,
  isSaving = false,
  onToggleComplete,
  onEditCommitment,
  onDeleteCommitment,
  onExtract,
  isExtracting = false,
  onConfirmDraft,
  onRejectDraft,
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
        button:
          'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
        tabActive:
          'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20',
        chipSelected:
          'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500',
        chipHover: 'hover:border-blue-300 dark:hover:border-blue-600',
        dateText: 'text-blue-600 dark:text-blue-400',
        dateButtonActive: 'bg-blue-600 hover:bg-blue-700 text-white',
        inputFocus: 'focus:border-blue-400',
        itemHover:
          'hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm',
      }
    : {
        button:
          'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900',
        tabActive:
          'text-gray-900 dark:text-white border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-700/50',
        chipSelected:
          'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white',
        chipHover: 'hover:border-gray-400 dark:hover:border-gray-500',
        dateText: 'text-gray-700 dark:text-gray-300',
        dateButtonActive:
          'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900',
        inputFocus: 'focus:border-gray-400',
        itemHover:
          'hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm',
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
    setEditDate(
      commitment.target_date ? new Date(commitment.target_date) : undefined,
    )
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
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800'
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600'
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
        <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <Input
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            className="h-9 text-sm border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
            placeholder="Commitment title"
            autoFocus
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal h-8 text-xs border-gray-200 bg-white',
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
              className="h-7 text-xs bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
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
            ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
            : isOverdue
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : `bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${accent.itemHover}`,
        )}
      >
        <div className="flex items-start gap-3">
          {showCompleteToggle && (
            <button
              onClick={() => onToggleComplete(commitment)}
              className={cn(
                'mt-0.5 flex-shrink-0 transition-colors',
                commitment.status === 'completed'
                  ? 'text-green-500'
                  : 'text-gray-300 hover:text-green-500',
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
                    ? 'text-gray-500 dark:text-gray-400 line-through'
                    : 'text-gray-900 dark:text-white',
                )}
              >
                {commitment.title}
              </p>

              {/* Edit/Delete (coach only) */}
              {isCoach && onEditCommitment && onDeleteCommitment && (
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleStartEdit(commitment)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
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
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-3 dark:bg-gray-800 dark:border-gray-700"
                      align="end"
                    >
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
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
                      ? 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700'
                      : 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
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
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <TrendingUp className="h-3 w-3" />
                  {progress}%
                </span>
              )}

              {commitment.target_date && (
                <span
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    isOverdue
                      ? 'text-red-600 dark:text-red-400 font-medium'
                      : 'text-gray-500 dark:text-gray-400',
                  )}
                >
                  <CalendarIcon className="h-3 w-3" />
                  {isOverdue && 'Overdue: '}
                  {format(new Date(commitment.target_date), 'MMM d')}
                </span>
              )}

              {isCoach && (
                <span className="text-xs text-gray-400">
                  {formatRelativeTime(commitment.created_at)}
                </span>
              )}
            </div>

            {progress > 0 &&
              progress < 100 &&
              commitment.status !== 'completed' && (
                <div className="mt-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all"
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
        <div className="p-4 flex items-center justify-center gap-2 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading...</span>
        </div>
      )
    }

    if (pastGroups.length === 0) {
      return (
        <div className="p-6 text-center">
          <History className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No past commitments
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {group.date
                ? format(new Date(group.date), 'MMM d, yyyy')
                : 'Previous Sessions'}
            </div>
            <div className="space-y-2 pl-3 border-l-2 border-gray-100 dark:border-gray-700">
              {(group.commitments || []).map(commitment => (
                <div key={commitment.id} className="flex items-start gap-2">
                  {commitment.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : commitment.status === 'abandoned' ? (
                    <X className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-300 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-xs',
                        commitment.status === 'completed'
                          ? 'text-gray-500 dark:text-gray-400 line-through'
                          : commitment.status === 'abandoned'
                            ? 'text-gray-400 dark:text-gray-500 line-through'
                            : 'text-gray-700 dark:text-gray-300',
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
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                            : commitment.status === 'abandoned'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                              : commitment.status === 'active'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
                        )}
                      >
                        {commitment.status}
                      </Badge>
                      {commitment.target_date && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
                          <CalendarIcon className="h-2.5 w-2.5" />
                          {format(new Date(commitment.target_date), 'MMM d')}
                        </span>
                      )}
                      {isCoach && commitment.is_coach_commitment && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0 border-gray-300 dark:border-gray-600"
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
    <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Commitments
          </span>
          {onExtract && (
            <Button
              size="sm"
              variant="outline"
              onClick={onExtract}
              disabled={isExtracting}
              className="h-7 text-xs border-gray-300 dark:border-gray-600 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
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
          <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700 rounded-md p-0.5">
            <button
              onClick={() => setAssigneeType('client')}
              className={cn(
                'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors',
                assigneeType === 'client'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
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
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
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
            className={cn(
              'border-gray-200 dark:border-gray-600 dark:bg-gray-700 text-sm h-10',
              accent.inputFocus,
            )}
            maxLength={200}
          />

          {/* Outcomes */}
          {targets.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowOutcomes(!showOutcomes)}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                {showOutcomes ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                Link to Outcomes
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
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      Loading outcomes...
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
                              : `bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 ${accent.chipHover}`,
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

          {/* Due Date */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Due Date
              </label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowCalendar(!showCalendar)}
                className="h-6 px-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
                      : `border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 ${accent.chipHover}`,
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
                  className="h-7 text-xs text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {showCalendar && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 overflow-hidden">
                <Calendar
                  mode="single"
                  selected={targetDate}
                  onSelect={setTargetDate}
                  disabled={date => date < new Date()}
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
      <div className="border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 py-2.5 text-xs font-medium transition-colors border-b-2',
                activeTab === tab.id
                  ? accent.tabActive
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
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
            <div className="p-4 flex items-center justify-center gap-2 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Loading...</span>
            </div>
          ) : sessionCommitments.length === 0 ? (
            <div className="p-6 text-center">
              <Target className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No commitments this session
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <Sparkles className="h-3 w-3" />
                        AI Suggestions
                      </div>
                      {drafts.map(c => (
                        <div key={c.id}>{renderCommitmentItem(c, false)}</div>
                      ))}
                      {nonDrafts.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-600 my-2" />
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
            <div className="p-4 flex items-center justify-center gap-2 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Loading...</span>
            </div>
          ) : activeCommitments.length === 0 ? (
            <div className="p-6 text-center">
              <Target className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No active commitments
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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
