'use client'

/**
 * Who / where a commitment belongs to: client, sandbox, originating session,
 * and the person it is assigned to.
 *
 * This is the enrichment the standalone page most needs. In the panel you
 * always arrive from a list that already shows whose commitment it is; a page
 * opened from a pasted link has no such context to borrow.
 *
 * Every field is optional-chained, so this renders correctly against an older
 * backend that doesn't yet return the names — it just shows less.
 */

import Link from 'next/link'
import { Calendar, Compass, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateOnly } from '@/lib/date-utils'
import { AssigneeChip } from '@/components/people/assignee-chip'
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

  const sandboxNode = commitment.sandbox_id ? (
    <span className="inline-flex items-center gap-1 min-w-0">
      <Compass className="h-3 w-3 shrink-0" />
      {linkable ? (
        <Link
          href={`/sandboxes/${commitment.sandbox_id}`}
          className="hover:text-ink hover:underline truncate"
        >
          {commitment.sandbox_name || 'Sandbox'}
        </Link>
      ) : (
        <span className="truncate">{commitment.sandbox_name || 'Sandbox'}</span>
      )}
    </span>
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
    sandboxNode,
    sessionNode,
    // The person is the label — no role words.
    <AssigneeChip key="assignee" commitment={commitment} size="xs" />,
    commitment.visibility === 'private' ? (
      <span
        key="private"
        className="inline-flex items-center gap-1 text-ink-3"
        title="Only people on this commitment can see it"
      >
        <Lock className="h-3 w-3 shrink-0" />
        Private
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
      data-testid="commitment-context"
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
