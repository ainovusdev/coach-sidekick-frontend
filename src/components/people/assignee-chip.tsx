'use client'

import { cn } from '@/lib/utils'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { useViewerId } from '@/hooks/use-viewer-id'
import { assigneeOf } from '@/lib/commitments/assignee'
import type { Assignee, Commitment } from '@/types/commitment'

/**
 * The one way a person shows on a commitment: avatar + name, "You" for the
 * viewer, dashed avatar for a client without a login. No role words — the
 * person is the label.
 */
export function AssigneeChip({
  commitment,
  assignee,
  size = 'sm',
  showName = true,
  className,
  viewerId,
}: {
  commitment?: Commitment
  assignee?: Assignee | null
  size?: 'xs' | 'sm'
  showName?: boolean
  className?: string
  /** Overrides the auth context (tests, previews). */
  viewerId?: string | null
}) {
  const userId = useViewerId()
  const me = viewerId === undefined ? userId : viewerId
  const a =
    assignee !== undefined
      ? assignee
      : commitment
        ? assigneeOf(commitment)
        : null
  if (!a) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-ink-3',
          size === 'xs' ? 'text-xs' : 'text-sm',
          className,
        )}
        data-testid="assignee-chip"
        data-assignee="none"
      >
        <span
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-ink-4',
            size === 'xs' ? 'h-5 w-5' : 'h-6 w-6',
          )}
          aria-hidden
        />
        {showName && <span>Unassigned</span>}
      </span>
    )
  }
  const isYou = !!me && a.user_id === me
  const name = isYou ? 'You' : a.name || a.email || 'Someone'
  const dashed = a.has_account === false
  return (
    <span
      className={cn(
        'inline-flex min-w-0 items-center gap-1.5 text-ink-2',
        size === 'xs' ? 'text-xs' : 'text-sm',
        className,
      )}
      title={
        dashed
          ? `${a.name ?? a.email ?? 'Client'} · no account yet`
          : (a.name ?? a.email ?? undefined)
      }
      data-testid="assignee-chip"
      data-assignee={a.user_id ?? a.client_id ?? 'none'}
    >
      <PersonAvatar name={a.name} email={a.email} dashed={dashed} size="xs" />
      {showName && <span className="truncate">{name}</span>}
    </span>
  )
}
