'use client'

/**
 * DetailSidePanel — a lightweight, read-only right-slide drawer.
 *
 * Mirrors the shell of `commitment-detail-panel.tsx` (fixed backdrop + right
 * panel + Escape-to-close + ScrollArea body) but is content-agnostic and
 * read-only. Used by the Vision / Meta Performance Outcome / Sprint detail
 * panels on the goals tree board. Editing is delegated to the existing form
 * modals via the header actions, so this shell renders no inputs.
 */

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { X, Edit2, MoreVertical, CheckCircle2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateOnly } from '@/lib/date-utils'

interface DetailSidePanelProps {
  onClose: () => void
  title: string
  eyebrow?: string
  icon?: React.ReactNode
  statusBadge?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
}

/**
 * Right-hand slide-in drawer for record details with eyebrow, title, status badge and
 * action slots; closes on Escape. Compose with DetailSection, DetailRow, StatusBadge,
 * PanelActions, EmptyHint, LinkedItem and CommitmentsSection.
 *
 * @category overlays
 */
export function DetailSidePanel({
  onClose,
  title,
  eyebrow,
  icon,
  statusBadge,
  actions,
  children,
}: DetailSidePanelProps) {
  // Mount off-screen then flip on the next frame so the drawer slides in.
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-[60] bg-overlay animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full md:w-[600px] z-[70] bg-surface-1 border-l border-line shadow-2xl',
          'transition-transform duration-300 ease-in-out',
          entered ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start gap-3 p-6 pb-4 border-b border-line">
            {icon && <div className="mt-1 shrink-0">{icon}</div>}
            <div className="flex-1 min-w-0">
              {eyebrow && (
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-4 mb-1">
                  {eyebrow}
                </div>
              )}
              <h2 className="text-xl font-bold text-ink break-words">
                {title}
              </h2>
              {statusBadge && <div className="mt-2">{statusBadge}</div>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {actions}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">{children}</div>
          </ScrollArea>
        </div>
      </div>
    </>
  )
}

// === Presentational helpers (shared by all three detail panels) ===

export function DetailSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-4">
        {title}
      </h3>
      {children}
    </div>
  )
}

export function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-line/60 last:border-0">
      <span className="text-sm text-ink-3 shrink-0">{label}</span>
      <span className="text-sm text-ink text-right break-words min-w-0">
        {children}
      </span>
    </div>
  )
}

export function StatusBadge({ status }: { status?: string }) {
  if (!status) return null
  const cls =
    status === 'active'
      ? 'bg-forest-bg text-forest border-forest'
      : status === 'completed'
        ? 'bg-ds-accent-bg text-ds-accent border-ds-accent'
        : status === 'paused' ||
            status === 'planning' ||
            status === 'in_progress'
          ? 'bg-amber-token-bg text-amber-token border-amber-token'
          : 'bg-surface-3 text-ink-2 border-line'
  const label = status.replace(/_/g, ' ')
  return (
    <Badge variant="outline" className={cn('text-xs capitalize', cls)}>
      {label}
    </Badge>
  )
}

export function PanelActions({
  onEdit,
  onComplete,
  onDelete,
  canComplete,
  deleteLabel,
}: {
  onEdit?: () => void
  onComplete?: () => void
  onDelete?: () => void
  canComplete?: boolean
  deleteLabel?: string
}) {
  const showMenu = !!onDelete || (!!onComplete && canComplete)
  return (
    <>
      {onEdit && (
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="h-8 gap-1.5"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </Button>
      )}
      {showMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[80]">
            {onComplete && canComplete && (
              <DropdownMenuItem
                onClick={onComplete}
                className="text-forest focus:text-forest"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Complete
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={onDelete}
                className="text-vermillion focus:text-vermillion"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteLabel || 'Delete'}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  )
}

// A muted empty-state line for "no linked items" sections.
export function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-ink-4 italic">{children}</p>
}

// A compact linked-entity row (icon + title + optional status badge).
export function LinkedItem({
  icon,
  title,
  status,
}: {
  icon: React.ReactNode
  title: string
  status?: string
}) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-surface-3">
      <div className="shrink-0">{icon}</div>
      <span className="flex-1 text-sm text-ink break-words min-w-0">
        {title}
      </span>
      {status && <StatusBadge status={status} />}
    </div>
  )
}

// A clickable commitment row — title + optional coach tag / due date / status.
export function CommitmentRow({
  title,
  status,
  dueDate,
  isCoach,
  onClick,
}: {
  title: string
  status?: string
  dueDate?: string
  isCoach?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2 py-2 px-3 rounded-lg border border-line hover:bg-surface-3 text-left transition-colors"
    >
      <span className="flex-1 text-sm text-ink break-words min-w-0">
        {title}
      </span>
      {isCoach && (
        <span className="text-[10px] font-medium uppercase tracking-wide text-ink-4 shrink-0">
          Coach
        </span>
      )}
      {dueDate && (
        <span className="text-xs text-ink-4 shrink-0">{dueDate}</span>
      )}
      {status && <StatusBadge status={status} />}
    </button>
  )
}

// The "Commitments (N)" section shared by all three entity detail panels.
export function CommitmentsSection({
  commitments,
  onCommitmentClick,
}: {
  commitments: any[]
  onCommitmentClick?: (commitment: any) => void
}) {
  return (
    <DetailSection title={`Commitments (${commitments.length})`}>
      {commitments.length === 0 ? (
        <EmptyHint>No commitments linked yet.</EmptyHint>
      ) : (
        <div className="space-y-1.5">
          {commitments.map(c => (
            <CommitmentRow
              key={c.id}
              title={c.title}
              status={c.status}
              dueDate={
                c.target_date ? formatDateOnly(c.target_date) : undefined
              }
              isCoach={!!c.is_coach_commitment}
              onClick={
                onCommitmentClick ? () => onCommitmentClick(c) : undefined
              }
            />
          ))}
        </div>
      )}
    </DetailSection>
  )
}
