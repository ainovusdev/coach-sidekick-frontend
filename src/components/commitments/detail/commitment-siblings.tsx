'use client'

/**
 * "From this session" — the client's other commitments from the same session.
 *
 * Reuses the existing list endpoint rather than adding a new one. The filter
 * object is byte-identical to the one sessions/[sessionId]/page.tsx passes, so
 * arriving here from a session page is a cache hit rather than a refetch.
 */

import Link from 'next/link'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { cn } from '@/lib/utils'
import type { Commitment } from '@/types/commitment'

const MAX_SHOWN = 6

const STATUS_DOT: Record<string, string> = {
  draft: 'bg-line',
  active: 'bg-ds-accent',
  in_progress: 'bg-amber-token',
  completed: 'bg-forest',
  abandoned: 'bg-vermillion',
}

export function CommitmentSiblings({ commitment }: { commitment: Commitment }) {
  const { data } = useCommitments({
    session_id: commitment.session_id,
    include_drafts: true,
  })

  if (!commitment.session_id) return null

  // Unwrapped the same way the hub does (use-commitments-view.ts).
  const siblings = ((data as { commitments?: Commitment[] })?.commitments ?? [])
    .filter(c => c.id !== commitment.id)
    .slice(0, MAX_SHOWN)

  if (siblings.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-ink-3">From this session</h3>
      <div className="space-y-1">
        {siblings.map(sibling => (
          <Link
            key={sibling.id}
            href={`/commitments/${sibling.id}`}
            className="flex items-start gap-2 rounded px-2 py-1.5 -mx-2 hover:bg-surface-3 group"
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full mt-1.5 shrink-0',
                STATUS_DOT[sibling.status] || 'bg-line',
              )}
            />
            <span className="text-xs text-ink-2 group-hover:text-ink line-clamp-2">
              {sibling.title}
            </span>
          </Link>
        ))}
      </div>
      {commitment.client_id && (
        <Link
          href={`/commitments?client=${commitment.client_id}`}
          className="inline-block text-[11px] text-ink-3 hover:text-ink hover:underline"
        >
          View all for this client
        </Link>
      )}
    </div>
  )
}
