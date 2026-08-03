'use client'

/**
 * Who / where a commitment belongs to: client, originating session, assignee.
 *
 * This is the enrichment the standalone page most needs. In the panel you
 * always arrive from a list that already shows whose commitment it is; a page
 * opened from a pasted link has no such context to borrow.
 *
 * Every field is optional-chained, so this renders correctly against an older
 * backend that doesn't yet return the names — it just shows less.
 */

import Link from 'next/link'
import { Calendar, User2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateOnly } from '@/lib/date-utils'
import type { Commitment } from '@/types/commitment'

export function CommitmentContextHeader({
  commitment,
  linkable = true,
  className,
}: {
  commitment: Commitment
  /** Client/session links only make sense on coach surfaces. */
  linkable?: boolean
  className?: string
}) {
  const assignee = commitment.assigned_to_name || commitment.client_name

  const clientNode = commitment.client_name ? (
    linkable && commitment.client_id ? (
      <Link
        href={`/clients/${commitment.client_id}`}
        className="font-medium text-ink-2 hover:text-ink hover:underline"
      >
        {commitment.client_name}
      </Link>
    ) : (
      <span className="font-medium text-ink-2">{commitment.client_name}</span>
    )
  ) : null

  const sessionLabel = commitment.session_title || 'Session'
  const sessionNode = commitment.session_id ? (
    <span className="inline-flex items-center gap-1">
      <Calendar className="h-3 w-3 shrink-0" />
      {linkable ? (
        <Link
          href={`/sessions/${commitment.session_id}`}
          className="hover:text-ink hover:underline truncate"
        >
          {sessionLabel}
        </Link>
      ) : (
        <span className="truncate">{sessionLabel}</span>
      )}
      {commitment.session_date && (
        <span className="text-ink-3">
          ({formatDateOnly(commitment.session_date, 'MMM d')})
        </span>
      )}
    </span>
  ) : (
    // Mirrors the 'Manually Created' label the hub's grouping already uses.
    <span className="text-ink-3">Created manually</span>
  )

  const parts = [
    clientNode,
    sessionNode,
    assignee ? (
      <span className="inline-flex items-center gap-1 min-w-0">
        <User2 className="h-3 w-3 shrink-0" />
        <span className="truncate">{assignee}</span>
        {commitment.is_coach_commitment && (
          <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-3 text-ink-2 uppercase tracking-wide">
            Coach
          </span>
        )}
      </span>
    ) : null,
  ].filter(Boolean)

  if (parts.length === 0) return null

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3 min-w-0',
        className,
      )}
    >
      {parts.map((node, i) => (
        <span key={i} className="inline-flex items-center gap-2 min-w-0">
          {i > 0 && (
            <span aria-hidden className="text-line">
              ·
            </span>
          )}
          {node}
        </span>
      ))}
    </div>
  )
}
