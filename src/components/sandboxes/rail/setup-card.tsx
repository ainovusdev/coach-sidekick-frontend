'use client'

import { AlertCircle, CheckCircle2, Circle } from 'lucide-react'
import { fmtDay, pluralise } from '@/lib/sandbox/format'
import { cn } from '@/lib/utils'
import type { SandboxOverview } from '@/types/sandbox'

export type SetupTarget = 'term' | 'vision' | 'team' | 'groups' | 'invitations'

interface SetupItem {
  key: SetupTarget
  label: string
  detail: string
  done: boolean
  attention?: boolean
}

export function SetupCard({
  overview,
  onSelect,
}: {
  overview: SandboxOverview
  onSelect: (target: SetupTarget) => void
}) {
  const { sandbox, checklist } = overview
  const inv = checklist.invitations
  const waiting = inv.pending_count + inv.expired_count
  const groupsDone =
    checklist.groups.count > 0 && checklist.groups.incomplete_count === 0
  const invitationsDone = inv.total_client_side > 0 && waiting === 0

  const items: SetupItem[] = [
    {
      key: 'term',
      label: 'Term set',
      detail: `${sandbox.term_months} months from ${fmtDay(sandbox.term_start, true)}`,
      done: true,
    },
    {
      key: 'vision',
      label: 'Vision added',
      detail: checklist.vision_added
        ? 'In the client’s words'
        : 'Write the vision',
      done: checklist.vision_added,
    },
    {
      key: 'team',
      label: 'Team, both sides',
      detail: checklist.team_both_sides
        ? `${checklist.our_side_count} ours · ${checklist.their_side_count} theirs`
        : checklist.our_side_count && !checklist.their_side_count
          ? 'Add their people'
          : checklist.their_side_count && !checklist.our_side_count
            ? 'Add our people'
            : 'Add people on both sides',
      done: checklist.team_both_sides,
    },
    {
      key: 'groups',
      label: 'Groups',
      detail:
        checklist.groups.count === 0
          ? 'Build a group'
          : `${pluralise(checklist.groups.count, 'group')} · ${pluralise(checklist.groups.coachee_count, 'coachee')}${
              checklist.groups.incomplete_count
                ? ` · ${checklist.groups.incomplete_count} incomplete`
                : ''
            }`,
      done: groupsDone,
      attention: checklist.groups.incomplete_count > 0,
    },
    {
      key: 'invitations',
      label: 'Invitations',
      detail:
        inv.total_client_side === 0
          ? 'No one to invite yet'
          : invitationsDone
            ? inv.accepted_count === inv.total_client_side
              ? 'Everyone has accepted'
              : 'All invited'
            : inv.sent_count + inv.accepted_count === 0
              ? `Send ${pluralise(waiting, 'invitation')}`
              : `${pluralise(waiting, 'person', 'people')} still waiting`,
      done: invitationsDone,
      attention: inv.expired_count > 0,
    },
  ]

  const nextKey = items.find(i => !i.done)?.key
  const doneCount = items.filter(i => i.done).length

  return (
    <div
      className="rounded-xl border border-line bg-paper p-5"
      data-testid="setup-card"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-3">
          Setup
        </h2>
        <span className="text-xs text-ink-3" data-testid="setup-progress">
          {doneCount} of {items.length} done
        </span>
      </div>
      <p className="mt-1 text-xs text-ink-3">
        {doneCount === items.length
          ? 'Everything is in place.'
          : 'Nothing is sent until you say so.'}
      </p>
      <ul className="mt-4 space-y-1">
        {items.map(item => {
          const isNext = item.key === nextKey
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => onSelect(item.key)}
                data-testid={`setup-${item.key}`}
                className={cn(
                  'flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface-2',
                  isNext && 'bg-surface-2',
                )}
              >
                {item.done && !item.attention ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                ) : item.attention ? (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-token" />
                ) : (
                  <Circle
                    className="mt-0.5 h-4 w-4 shrink-0 text-ink-4"
                    strokeWidth={1.5}
                  />
                )}
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block text-sm leading-tight',
                      item.done && !item.attention
                        ? 'text-ink-2'
                        : isNext
                          ? 'font-medium text-ink'
                          : 'text-ink-2',
                    )}
                  >
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      'block text-xs leading-snug',
                      item.attention ? 'text-amber-token' : 'text-ink-3',
                    )}
                  >
                    {item.detail}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
