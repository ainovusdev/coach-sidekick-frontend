'use client'

import { Video } from 'lucide-react'
import { fmtDay } from '@/lib/sandbox/format'
import { KIND_TONE } from '@/lib/sandbox/timeline'
import { cn } from '@/lib/utils'
import { whenLabel } from './client-view-copy'
import { Empty } from '@/components/sandboxes/section'
import type { ClientViewModel, ComingUpItem } from './client-view-model'

function timeOf(at: string | null): string | null {
  if (!at) return null
  const d = new Date(at)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/** Sessions on the calendar and windows about to open, in date order. */
export function ComingUp({
  model,
  limit = 5,
}: {
  model: ClientViewModel
  limit?: number
}) {
  const rows = model.comingUp.slice(0, limit)
  if (!rows.length) return <Empty>Nothing scheduled yet.</Empty>
  return (
    <ul className="space-y-2.5">
      {rows.map(row => (
        <li
          key={row.key}
          className="flex gap-3"
          data-testid="coming-up-row"
          data-kind={row.kind}
        >
          <div className="w-16 shrink-0">
            <p className="text-xs font-medium text-ink">
              {whenLabel(row.date, model.today)}
            </p>
            {timeOf(row.at) && (
              <p className="font-mono text-[11px] text-ink-3">
                {timeOf(row.at)}
              </p>
            )}
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm text-ink">
              {row.kind === 'milestone' ? (
                <span
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-full',
                    KIND_TONE[row.milestoneKind ?? 'custom'],
                  )}
                  aria-hidden
                />
              ) : (
                <Video
                  className="h-3.5 w-3.5 shrink-0 text-ink-4"
                  aria-hidden
                />
              )}
              <span className="truncate">{row.title}</span>
            </p>
            {detailOf(row, model.today) && (
              <p className="truncate text-xs text-ink-3">
                {detailOf(row, model.today)}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

function detailOf(row: ComingUpItem, today: string): string {
  if (row.kind === 'session') return row.detail
  return row.date === today ? `Open today` : `Opens ${fmtDay(row.date)}`
}
