'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  Commitment,
  CommitmentPriority,
  CommitmentStatus,
} from '@/types/commitment'
import { formatDateOnly } from '@/lib/date-utils'
import { parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Edit,
  Loader2,
  Sparkles,
  Target,
  Trash2,
  UserCircle,
  XCircle,
} from 'lucide-react'
import { daysUntilDue, isOverdue } from '../utils/commitment-view'

export const statusConfig: Record<
  CommitmentStatus,
  { label: string; className: string }
> = {
  draft: {
    label: 'Draft',
    className: 'bg-surface-3 text-ink-3 border-line ',
  },
  active: {
    label: 'Active',
    className: 'bg-ds-accent-bg text-ds-accent border-ds-accent ',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-amber-token-bg text-amber-token border-amber-token ',
  },
  completed: {
    label: 'Completed',
    className: 'bg-forest-bg text-forest border-forest ',
  },
  abandoned: {
    label: 'Abandoned',
    className: 'bg-vermillion-bg text-vermillion border-vermillion ',
  },
}

export const priorityConfig: Record<
  CommitmentPriority,
  { label: string; className: string }
> = {
  low: { label: 'Low', className: 'text-ink-3' },
  medium: { label: 'Medium', className: 'text-amber-token' },
  high: { label: 'High', className: 'text-amber-token' },
  urgent: { label: 'Urgent', className: 'text-vermillion' },
}

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
  /** Show a client chip on the row (flat / session / status views) */
  showClient?: boolean
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

  const status = statusConfig[commitment.status]
  const priority = priorityConfig[commitment.priority]
  const isDraft = commitment.status === 'draft'
  const overdue = isOverdue(commitment)
  const daysUntil = daysUntilDue(commitment)

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 border-b border-line last:border-b-0 hover:bg-paper transition-colors',
        overdue && 'border-l-2 border-l-vermillion',
        isSelected && 'bg-ds-accent-bg/50 ',
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
            className="text-sm font-medium text-ink cursor-pointer hover:underline"
            onClick={() => onEdit(commitment)}
          >
            {commitment.title}
          </span>
          {commitment.extracted_from_transcript && (
            <Badge
              variant="outline"
              className="text-xs bg-indigo-bg text-indigo border-indigo "
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
          {showClient && commitment.client_name && (
            <Link
              href={`/clients/${commitment.client_id}`}
              className="inline-flex items-center gap-1 text-xs text-ink-3 hover:text-ink hover:underline"
              onClick={e => e.stopPropagation()}
            >
              <UserCircle className="h-3.5 w-3.5" />
              {commitment.client_name}
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
                In Progress
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

        {/* Inline due date picker */}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border border-line cursor-pointer transition-colors hover:bg-surface-3 ',
                overdue
                  ? 'text-vermillion font-medium border-vermillion '
                  : daysUntil !== null && daysUntil <= 7
                    ? 'text-amber-token '
                    : 'text-ink-3 ',
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

        {/* Draft: Approve / Reject */}
        {isDraft && (
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

        {/* Edit */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-ink-3 hover:text-ink-2 "
          onClick={() => onEdit(commitment)}
        >
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Button>

        {/* Delete */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-vermillion hover:text-vermillion hover:bg-vermillion-bg "
          onClick={() => onDelete(commitment)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
