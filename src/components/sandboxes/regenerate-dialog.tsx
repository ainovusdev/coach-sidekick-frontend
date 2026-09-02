'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useRegenerateTimeline } from '@/hooks/mutations/use-sandbox-mutations'
import { useRegeneratePreview } from '@/hooks/queries/use-sandboxes'
import { fmtWindow, pluralise } from '@/lib/sandbox/format'
import { cn } from '@/lib/utils'
import type {
  SandboxOverview,
  TimelineChange,
  TimelineChangeAction,
  TimelineRegeneratePreview,
} from '@/types/sandbox'

const ACTION_LABEL: Record<TimelineChangeAction, string> = {
  unchanged: 'Stays',
  moved: 'Moves',
  added: 'New',
  dropped: 'Goes',
  kept: 'Kept',
  overwritten: 'Reset',
}

const ACTION_CLASS: Record<TimelineChangeAction, string> = {
  unchanged: 'bg-surface-3 text-ink-3',
  moved: 'bg-indigo-bg text-indigo',
  added: 'bg-forest-bg text-forest',
  dropped: 'bg-amber-token-bg text-amber-token',
  kept: 'bg-surface-3 text-ink-2',
  overwritten: 'bg-amber-token-bg text-amber-token',
}

function keptText(c: TimelineChange): string {
  if (c.was_removed) return 'Stays removed'
  if (c.is_custom) return 'Kept · added by hand'
  return 'Kept · adjusted by hand'
}

/** "2 move, 3 new, 1 kept" — only the counts that are not zero. */
export function summariseCounts(
  counts: TimelineRegeneratePreview['counts'],
): string {
  const parts: string[] = []
  if (counts.moved)
    parts.push(`${counts.moved} move${counts.moved === 1 ? 's' : ''}`)
  if (counts.added) parts.push(`${counts.added} new`)
  if (counts.dropped)
    parts.push(`${counts.dropped} go${counts.dropped === 1 ? 'es' : ''}`)
  if (counts.overwritten) parts.push(`${counts.overwritten} reset`)
  if (counts.kept) parts.push(`${counts.kept} kept`)
  if (counts.unchanged) parts.push(`${counts.unchanged} unchanged`)
  return parts.join(', ')
}

export function wouldChange(preview: TimelineRegeneratePreview): boolean {
  const c = preview.counts
  return c.moved + c.added + c.dropped + c.overwritten > 0
}

/** The before/after list. Shared by the term-change dialog and Regenerate. */
export function RegeneratePreviewList({
  preview,
  isLoading,
}: {
  preview: TimelineRegeneratePreview | undefined
  isLoading: boolean
}) {
  if (isLoading || !preview) {
    return (
      <div className="space-y-2" data-testid="regen-preview-loading">
        {[0, 1, 2].map(i => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }
  return (
    <div data-testid="regen-preview">
      <ol className="divide-y divide-line rounded-lg border border-line">
        {preview.changes.map((c, i) => {
          const before =
            c.before_start && c.before_end
              ? fmtWindow(c.before_start, c.before_end)
              : null
          const after =
            c.after_start && c.after_end
              ? fmtWindow(c.after_start, c.after_end)
              : null
          const windowsDiffer = before !== after
          return (
            <li
              key={c.event_id ?? `${c.gen_key}-${i}`}
              className="flex items-center gap-3 px-3 py-2 text-sm"
              data-testid="regen-row"
              data-action={c.action}
            >
              <span
                className={cn(
                  'min-w-0 flex-1 truncate',
                  c.action === 'dropped'
                    ? 'text-ink-3 line-through'
                    : 'text-ink',
                )}
              >
                {c.label}
              </span>
              <span className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] text-ink-3">
                {before && (windowsDiffer || !after) && (
                  <span
                    className={cn(after && 'line-through decoration-ink-4')}
                  >
                    {before}
                  </span>
                )}
                {before && after && windowsDiffer && (
                  <ArrowRight className="h-3 w-3" aria-hidden />
                )}
                {after && <span className="text-ink-2">{after}</span>}
              </span>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                  ACTION_CLASS[c.action],
                )}
                title={c.action === 'kept' ? keptText(c) : undefined}
              >
                {c.action === 'kept' && c.was_removed
                  ? 'Removed'
                  : ACTION_LABEL[c.action]}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="mt-2 text-xs text-ink-3" data-testid="regen-summary">
        {summariseCounts(preview.counts) || 'Nothing changes.'}
      </p>
    </div>
  )
}

/**
 * Regenerate for the current term — the way back after hand adjustments.
 * Term changes preview from the sandbox-details dialog instead.
 */
export function RegenerateDialog({
  open,
  onOpenChange,
  overview,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  overview: SandboxOverview
}) {
  const sandboxId = overview.sandbox.id
  const [overwrite, setOverwrite] = useState(true)
  const regenerate = useRegenerateTimeline(sandboxId)
  const preview = useRegeneratePreview(sandboxId, null, null, overwrite, open)

  useEffect(() => {
    if (open) setOverwrite(true)
  }, [open])

  const handCount = preview.data?.hand_adjusted_count ?? 0
  const nothing = preview.data ? !wouldChange(preview.data) : false

  const confirm = async () => {
    await regenerate.mutateAsync(overwrite)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Regenerate the timeline</DialogTitle>
          <DialogDescription>
            From the current term. Nothing is applied until you confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <Checkbox
              checked={overwrite}
              onCheckedChange={v => setOverwrite(v === true)}
              className="mt-0.5"
              data-testid="regen-overwrite"
            />
            <span className="text-ink-2">
              Reset the {pluralise(handCount, 'hand adjustment')} too
              <span className="block text-xs text-ink-3">
                Moved windows go back to their generated dates, removed events
                come back, and events added by hand are dropped.
              </span>
            </span>
          </label>
          <RegeneratePreviewList
            preview={preview.data}
            isLoading={preview.isLoading}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-ink text-ink-on-dark hover:bg-ink/90"
            disabled={!preview.data || nothing || regenerate.isPending}
            onClick={confirm}
            data-testid="regen-confirm"
          >
            {regenerate.isPending ? 'Regenerating…' : 'Regenerate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
