'use client'

import Link from 'next/link'
import { Section } from '@/components/sandboxes/section'
import { cn } from '@/lib/utils'
import type {
  SandboxEntityDetail,
  SandboxFollowThroughCounts,
} from '@/types/sandbox-details'

type Status = 'open' | 'overdue' | 'done'

/** "7 of 9 on time" — and a dash when nothing dated has been completed. */
function onTime(c: SandboxFollowThroughCounts): string {
  if (c.completed_dated === 0) return '—'
  return `${c.completed_on_time} of ${c.completed_dated}`
}

function Count({
  value,
  label,
  href,
  warn,
}: {
  value: number | string
  label: string
  href?: string | null
  warn?: boolean
}) {
  const body = (
    <>
      <span
        className={cn(
          'text-lg font-semibold tabular-nums',
          warn ? 'text-amber-token' : 'text-ink',
        )}
      >
        {value}
      </span>
      <span className="ml-1.5 text-xs text-ink-3">{label}</span>
    </>
  )
  return href ? (
    <Link
      href={href}
      className="rounded-md hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
    >
      {body}
    </Link>
  ) : (
    <span>{body}</span>
  )
}

/**
 * What coachees agreed with their coaches, and whether it gets done. Ours
 * only: the API sends nothing to the client's side or to someone coached
 * here, and then this renders nothing at all. Counts only — each number links
 * to the Commitments tab, which decides what may be opened.
 */
export function FollowThroughSection({ data }: { data: SandboxEntityDetail }) {
  const follow = data.stats?.follow_through
  if (!follow) return null
  const group = data.entity.kind === 'group'
  const groupId = group ? data.entity.id : data.selection.group_id
  const href = (memberId: string, status: Status) => {
    if (!follow.linkable) return null
    const q = new URLSearchParams({
      tab: 'commitments',
      coachee: memberId,
      kind: 'coaching',
      status,
    })
    if (groupId) q.set('group', groupId)
    return `/sandboxes/${data.sandbox_id}?${q}`
  }
  const none =
    follow.total.open + follow.total.completed + follow.total.abandoned === 0

  return (
    <Section
      id="follow-through"
      title="Commitment follow-through"
      testId="detail-follow-through"
      note="What was agreed in coaching, by status today. Counts only: what was said stays between coach and coachee. Dates are counted in UTC."
    >
      {none ? (
        <p className="text-sm text-ink-3">
          No commitments from this coaching yet.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {follow.coachees.map(c => (
            <li
              key={c.member_id}
              className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-3 first:pt-0 last:pb-0"
              data-testid="follow-through-row"
            >
              {group && (
                <span className="w-full truncate text-sm font-medium text-ink sm:w-44">
                  {c.name}
                </span>
              )}
              <Count
                value={c.open}
                label="open"
                href={href(c.member_id, 'open')}
              />
              <Count
                value={c.overdue}
                label="overdue"
                warn={c.overdue > 0}
                href={c.overdue > 0 ? href(c.member_id, 'overdue') : null}
              />
              <Count
                value={c.completed}
                label="done"
                href={c.completed > 0 ? href(c.member_id, 'done') : null}
              />
              <Count value={onTime(c)} label="on time" />
              {c.abandoned > 0 && <Count value={c.abandoned} label="dropped" />}
            </li>
          ))}
        </ul>
      )}
      {!follow.linkable && !none && (
        <p className="mt-3 text-xs text-ink-3">
          Narrowed to one coach. Clear the coach filter to open these in
          Commitments.
        </p>
      )}
    </Section>
  )
}
