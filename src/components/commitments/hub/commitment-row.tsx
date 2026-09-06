'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarWidget } from '@/components/ui/calendar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AssigneeChip } from '@/components/people/assignee-chip'
import { assigneeKindOf } from '@/lib/commitments/assignee'
import { Commitment, CommitmentStatus } from '@/types/commitment'
import { priorityInfo, statusInfo } from '@/lib/commitments/labels'
import { TONE_DOT, TONE_TEXT } from '@/lib/tone'
import { formatDateOnly } from '@/lib/date-utils'
import { parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Boxes,
  Lock,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Edit,
  Loader2,
  Sparkles,
  Target,
  Trash2,
  XCircle,
} from 'lucide-react'
import { daysUntilDue, isOverdue } from './commitment-view'
import { AutomaticChip } from '../automatic-chip'

export interface CommitmentRowHandlers {
  onEdit: (c: Commitment) => void
  onDelete: (c: Commitment) => void
  onConfirm: (id: string) => void
  onReject: (id: string) => void
  onStatusChange: (id: string, status: CommitmentStatus) => void
  onDateChange: (id: string, date: string | undefined) => void
  onSelect?: (id: string) => void
}

interface CommitmentRowProps extends CommitmentRowHandlers {
  commitment: Commitment
  isSelected?: boolean
  /** Show the context (client, else sandbox) on the row */
  showClient?: boolean
  /** Show who the row is for (hidden inside "Assigned to me" / by-person groups) */
  showAssignee?: boolean
}

export function CommitmentRow({
  commitment,
  onEdit,
  onDelete,
  onConfirm,
  onReject,
  onStatusChange,
  onDateChange,
  isSelected,
  onSelect,
  showClient = false,
  showAssignee = false,
}: CommitmentRowProps) {
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

  const status = statusInfo(commitment.status)
  const priority = priorityInfo(commitment.priority)
  const showPriority =
    commitment.priority === 'high' || commitment.priority === 'urgent'
  const isDraft = commitment.status === 'draft'
  const overdue = isOverdue(commitment)
  const daysUntil = daysUntilDue(commitment)
  // The API says what the viewer may do; older cached rows say nothing, so
  // only an explicit `false` locks a row.
  const canEdit = commitment.can_edit !== false
  const canDelete = commitment.can_delete !== false

  // Hover-revealed controls stay keyboard-reachable via focus-visible
  const revealOnHover =
    'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity'

  return (
    <div
      data-testid="commitment-row"
      data-id={commitment.id}
      className={cn(
        'group flex items-start gap-3 px-4 py-3 border-b border-line last:border-b-0 hover:bg-paper transition-colors',
        overdue && 'border-l-2 border-l-vermillion',
        isSelected && 'bg-ds-accent-bg/50 ',
      )}
    >
      {/* Checkbox for drafts */}
      {isDraft && canEdit && (
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
          {/* A real <Link>, so the row gets a hover URL and cmd/ctrl/middle
              click opens the full page in a new tab. Plain click is
              intercepted and still opens the fast slide-over panel. */}
          <Link
            href={`/commitments/${commitment.id}`}
            className="text-sm font-medium text-ink hover:underline"
            data-testid="commitment-row-title"
            onClick={e => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return
              e.preventDefault()
              onEdit(commitment)
            }}
          >
            {commitment.title}
          </Link>
          {commitment.visibility === 'private' && (
            <span
              className="inline-flex items-center text-ink-4"
              title="Only people on this commitment can see it"
              data-testid="commitment-private"
            >
              <Lock className="h-3 w-3" aria-hidden />
              <span className="sr-only">Private</span>
            </span>
          )}
          {showPriority && (
            <span
              className={cn('text-xs font-medium', TONE_TEXT[priority.tone])}
            >
              {priority.label}
            </span>
          )}
          {isDraft && commitment.extracted_from_transcript && (
            <span className="inline-flex items-center gap-1 text-xs text-indigo">
              <Sparkles className="h-3 w-3" />
              AI
            </span>
          )}
          <AutomaticChip commitment={commitment} />
          {/* A client's own commitment already names the client in the context link — no second chip. */}
          {showAssignee && assigneeKindOf(commitment) !== 'client' && (
            <AssigneeChip commitment={commitment} size="xs" />
          )}
          {showClient && commitment.client_id && commitment.client_name && (
            <Link
              href={`/clients/${commitment.client_id}`}
              className="text-xs text-ink-4 hover:text-ink hover:underline"
              onClick={e => e.stopPropagation()}
            >
              {commitment.client_name}
            </Link>
          )}
          {showClient && !commitment.client_id && commitment.sandbox_id && (
            <Link
              href={`/sandboxes/${commitment.sandbox_id}`}
              className="inline-flex items-center gap-1 text-xs text-ink-4 hover:text-ink hover:underline"
              onClick={e => e.stopPropagation()}
            >
              <Boxes className="h-3 w-3" />
              {commitment.sandbox_name || 'Sandbox'}
            </Link>
          )}
        </div>

        {/* Description */}
        {commitment.description && (
          <p className="text-xs text-ink-3 mt-0.5 truncate max-w-2xl">
            {commitment.description}
          </p>
        )}

        {/* Transcript context for drafts */}
        {isDraft && commitment.transcript_context && (
          <p className="text-xs text-ink-4 italic mt-0.5 truncate max-w-xl">
            &ldquo;{commitment.transcript_context}&rdquo;
          </p>
        )}
      </div>

      {/* Right: inline controls; secondary actions reveal on hover */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Inline status dropdown — quiet dot + label */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={!canEdit}>
            <button
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-ink-2 transition-colors',
                canEdit
                  ? 'cursor-pointer hover:bg-surface-3'
                  : 'cursor-default',
              )}
              aria-label={`Status: ${status.label}`}
              data-testid="commitment-row-status"
            >
              <span
                className={cn('h-2 w-2 rounded-full', TONE_DOT[status.tone])}
              />
              {status.label}
              {canEdit && (
                <ChevronDown
                  className={cn('h-3 w-3 text-ink-4', revealOnHover)}
                />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isDraft && (
              <DropdownMenuItem onClick={() => onConfirm(commitment.id)}>
                <Check className="h-3.5 w-3.5 mr-2 text-forest" />
                Approve
              </DropdownMenuItem>
            )}
            {commitment.status !== 'active' && !isDraft && (
              <DropdownMenuItem
                onClick={() => onStatusChange(commitment.id, 'active')}
              >
                <Target className="h-3.5 w-3.5 mr-2 text-ds-accent" />
                Active
              </DropdownMenuItem>
            )}
            {commitment.status !== 'in_progress' && !isDraft && (
              <DropdownMenuItem
                onClick={() => onStatusChange(commitment.id, 'in_progress')}
              >
                <Circle className="h-3.5 w-3.5 mr-2 text-amber-token" />
                In progress
              </DropdownMenuItem>
            )}
            {commitment.status !== 'completed' && (
              <DropdownMenuItem
                onClick={() => onStatusChange(commitment.id, 'completed')}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-forest" />
                Completed
              </DropdownMenuItem>
            )}
            {commitment.status !== 'abandoned' && (
              <DropdownMenuItem
                onClick={() => onStatusChange(commitment.id, 'abandoned')}
              >
                <XCircle className="h-3.5 w-3.5 mr-2 text-vermillion" />
                Abandon
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Inline due date picker — colored only when it needs attention */}
        <Popover
          open={dateOpen}
          onOpenChange={open => setDateOpen(canEdit && open)}
        >
          <PopoverTrigger asChild disabled={!canEdit}>
            <button
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors',
                canEdit
                  ? 'cursor-pointer hover:bg-surface-3'
                  : 'cursor-default',
                overdue
                  ? 'text-vermillion font-medium'
                  : daysUntil !== null && daysUntil <= 7
                    ? 'text-amber-token'
                    : 'text-ink-3',
                !commitment.target_date && cn('text-ink-4', revealOnHover),
                !commitment.target_date && !canEdit && 'hidden',
              )}
            >
              <Calendar className="h-3 w-3" />
              {commitment.target_date
                ? overdue
                  ? `${Math.abs(daysUntil!)}d overdue`
                  : daysUntil === 0
                    ? 'Due today'
                    : formatDateOnly(commitment.target_date, 'MMM d')
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

        {/* Draft: Approve / Reject stay always visible — primary actions */}
        {isDraft && canEdit && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs text-forest border-forest hover:bg-forest-bg "
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
              className="h-7 px-2.5 text-xs text-vermillion border-vermillion hover:bg-vermillion-bg "
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

        {/* Open / Delete — icon-only, revealed on hover */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-7 w-7 p-0 text-ink-4 hover:text-ink-2',
            revealOnHover,
          )}
          onClick={() => onEdit(commitment)}
          aria-label={canEdit ? 'Edit commitment' : 'Open commitment'}
          title={canEdit ? 'Edit' : 'Open'}
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 w-7 p-0 text-ink-4 hover:text-vermillion hover:bg-vermillion-bg',
              revealOnHover,
            )}
            onClick={() => onDelete(commitment)}
            aria-label="Delete commitment"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
