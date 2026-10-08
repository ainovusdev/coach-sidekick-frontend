'use client'

import { useMemo, useState } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { Section } from '@/components/sandboxes/section'
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
import { useInsightViewer } from '@/hooks/queries/use-sandbox-insights'
import { useSandboxChanges } from '@/hooks/queries/use-sandbox-details'
import { formatDate, formatRelativeTime } from '@/lib/date-utils'
import { fmtDay } from '@/lib/sandbox/format'
import { cn } from '@/lib/utils'
import type { SandboxOverview } from '@/types/sandbox'
import type {
  SandboxChangeItem,
  SandboxChangeKind,
  SandboxChangesFilters,
} from '@/types/sandbox-details'

/**
 * The sandbox's log: who changed what, newest first.
 *
 * Dates, contract and people are on by default — they are the changes someone
 * asks "who did that?" about. Commitments and outcomes are noisy and have their
 * own histories, so they start off. "Follow-on" rows are the consequences a
 * change dragged along (the check-ins shifted with a window, the agreement
 * re-dated with a group); they are filed under the person who made the change.
 */

const KIND_LABEL: Record<SandboxChangeKind, string> = {
  dates: 'Dates',
  contract: 'Contract',
  people: 'People',
  commitments: 'Commitments',
  outcomes: 'Outcomes',
}
const KINDS = Object.keys(KIND_LABEL) as SandboxChangeKind[]
const DEFAULT_KINDS: SandboxChangeKind[] = ['dates', 'contract', 'people']

/** The name the backend wrote the sentence under, as it should read here. */
export function changeWho(item: SandboxChangeItem): string {
  if (!item.actor) return 'Coach Sidekick'
  return item.as_user && item.as_user.id !== item.actor.id
    ? `${item.actor.name} (as ${item.as_user.name})`
    : item.actor.name
}

/**
 * The sentence minus its leading name, so the name can be set in bold. The
 * backend builds `summary` as `"{who} {verb} {label}…"`; when the two no longer
 * line up (a rename in between), the whole sentence is shown unbolded.
 */
function splitSummary(item: SandboxChangeItem): [string | null, string] {
  const who = changeWho(item)
  return item.summary.startsWith(`${who} `)
    ? [who, item.summary.slice(who.length)]
    : [null, item.summary]
}

function Chip({
  on,
  onClick,
  children,
  testId,
}: {
  on: boolean
  onClick: () => void
  children: React.ReactNode
  testId?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      data-testid={testId}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-ds-accent',
        on
          ? 'border-ink bg-ink text-ink-on-dark'
          : 'border-line bg-paper text-ink-3 hover:bg-surface-2',
      )}
    >
      {children}
    </button>
  )
}

export function ChangeRow({
  item,
  onOpenCommitment,
}: {
  item: SandboxChangeItem
  onOpenCommitment?: (id: string) => void
}) {
  const [who, rest] = splitSummary(item)
  const system = !item.actor
  const openable =
    item.record_type === 'commitment' &&
    !['deleted', 'dismissed'].includes(item.action) &&
    !!onOpenCommitment
  const body = (
    <>
      <PersonAvatar
        name={system ? 'Coach Sidekick' : item.actor!.name}
        size="sm"
        className={cn('mt-0.5', system && 'bg-surface-2 text-ink-3')}
        title={changeWho(item)}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-snug text-ink">
          {who ? (
            <>
              <span className="font-semibold">{who}</span>
              {rest}
            </>
          ) : (
            rest
          )}
          {item.restricted && (
            <Lock
              className="ml-1.5 inline h-3 w-3 align-[-1px] text-ink-4"
              aria-label="Private commitment"
            />
          )}
        </span>
        {item.cause && (
          <span
            className="mt-1 block text-xs leading-relaxed text-ink-3"
            data-testid="change-cause"
          >
            {item.cause}
          </span>
        )}
        <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-3">
          <time
            dateTime={item.created_at}
            title={formatDate(item.created_at, 'PPP p')}
          >
            {formatRelativeTime(item.created_at)}
          </time>
          {item.source === 'derived' && <span>follow-on</span>}
          {item.source === 'public_link' && <span>from a check-in link</span>}
        </span>
      </span>
    </>
  )
  const className =
    '-mx-2 flex w-[calc(100%+1rem)] items-start gap-3 rounded-lg px-2 py-3 text-left'
  return (
    <li
      data-testid="change-row"
      data-kind={item.kind}
      data-action={item.action}
      data-record-type={item.record_type}
    >
      {openable ? (
        <button
          type="button"
          className={`${className} hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ds-accent`}
          onClick={() => onOpenCommitment!(item.record_id)}
        >
          {body}
        </button>
      ) : (
        <div className={className}>{body}</div>
      )}
    </li>
  )
}

export function ActivityTab({
  overview,
  onOpenCommitment,
}: {
  overview: SandboxOverview
  onOpenCommitment?: (id: string) => void
}) {
  const sandboxId = overview.sandbox.id
  const view = useSandboxView()
  const viewer = useInsightViewer()

  const [kinds, setKinds] = useState<SandboxChangeKind[]>(DEFAULT_KINDS)
  const [followOn, setFollowOn] = useState(false)
  const [groupId, setGroupId] = useState<string | null>(null)

  const filters = useMemo<SandboxChangesFilters>(
    () => ({
      kinds: [...kinds].sort(),
      include_derived: followOn,
      group_id: groupId,
    }),
    [kinds, followOn, groupId],
  )
  const query = useSandboxChanges(sandboxId, viewer, filters)
  const first = query.data?.pages[0]
  const items = query.isError
    ? []
    : (query.data?.pages.flatMap(p => p.items) ?? [])

  const toggleKind = (k: SandboxChangeKind) =>
    setKinds(cur => (cur.includes(k) ? cur.filter(x => x !== k) : [...cur, k]))

  const groups = view.scope === 'all' ? overview.groups : []

  return (
    <Section
      id="activity"
      title="Activity"
      testId="activity-panel"
      note="Every change to this sandbox, with who made it and why they said they did."
      aside={
        groups.length > 0 ? (
          <label className="text-xs text-ink-3">
            <span className="sr-only">Group</span>
            <select
              aria-label="Group"
              data-testid="activity-group"
              className="rounded-lg border border-line bg-paper px-2.5 py-1.5 text-xs text-ink focus-visible:outline-2 focus-visible:outline-ds-accent"
              value={groupId ?? ''}
              onChange={e => setGroupId(e.target.value || null)}
            >
              <option value="">Whole sandbox</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.display_name}
                </option>
              ))}
            </select>
          </label>
        ) : undefined
      }
    >
      <div
        className="mb-3 flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label="Show"
        data-testid="activity-filters"
      >
        {KINDS.map(k => (
          <Chip
            key={k}
            on={kinds.includes(k)}
            onClick={() => toggleKind(k)}
            testId={`activity-kind-${k}`}
          >
            {KIND_LABEL[k]}
          </Chip>
        ))}
        <span className="mx-1 h-4 w-px bg-line" aria-hidden />
        <Chip
          on={followOn}
          onClick={() => setFollowOn(v => !v)}
          testId="activity-follow-on"
        >
          Follow-on changes
        </Chip>
      </div>

      {query.isPending ? (
        <p className="py-6 text-sm text-ink-3" role="status">
          Loading changes…
        </p>
      ) : query.isError ? (
        <p className="py-6 text-sm text-ink-3" role="alert">
          The log could not be loaded.{' '}
          <button className="underline" onClick={() => void query.refetch()}>
            Try again
          </button>
        </p>
      ) : first && !first.visible ? (
        <p
          className="py-6 text-sm text-ink-3"
          data-testid="activity-unavailable"
        >
          Not available to you.
        </p>
      ) : items.length === 0 ? (
        <p className="py-6 text-sm text-ink-3" data-testid="activity-empty">
          {kinds.length === 0
            ? 'Pick something to show.'
            : first?.recording_started_at
              ? `Nothing recorded yet. Changes have been recorded since ${fmtDay(first.recording_started_at.slice(0, 10), true)}; anything before that is not in the log.`
              : 'Nothing recorded yet.'}
        </p>
      ) : (
        <ol className="divide-y divide-line" data-testid="activity-list">
          {items.map(item => (
            <ChangeRow
              key={item.id}
              item={item}
              onOpenCommitment={onOpenCommitment}
            />
          ))}
        </ol>
      )}

      {query.hasNextPage && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => void query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
          data-testid="activity-more"
        >
          {query.isFetchingNextPage ? 'Loading…' : 'Load earlier changes'}
        </Button>
      )}
    </Section>
  )
}
