'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { PaceChip } from '@/components/sandboxes/pace-chip'
import { ProgressRail } from '@/components/sandboxes/progress-rail'
import { fmtHoursShort } from '@/lib/sandbox/delivery'
import { sandboxEntityHref } from '@/lib/sandbox/detail-links'
import {
  headcountText,
  hoursRemaining,
  projectedShort,
  weeksLeft,
} from '@/lib/sandbox/detail-view'
import { fmtDay, fmtWindow, pluralise } from '@/lib/sandbox/format'
import type {
  SandboxEntityDetail,
  SandboxRelationship,
} from '@/types/sandbox-details'

const KIND_LABEL = {
  client: 'Coachee',
  coach: 'Coach',
  group: 'Group',
} as const

/**
 * Who or what this page is about, above everything — the same heading shape as
 * the sandbox page, so moving between the two reads as one product.
 */
export function DetailHero({
  data,
  filters,
  help,
}: {
  data: SandboxEntityDetail
  filters: ReactNode
  help: ReactNode
}) {
  const { kind } = data.entity
  const current = data.relationships.filter(r => r.current)
  return (
    <section
      className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]"
      data-testid="detail-hero"
    >
      <div className="min-w-0">
        <nav
          aria-label="Breadcrumb"
          className="text-[11px] font-semibold uppercase tracking-wider text-ink-3"
        >
          <Link href="/sandboxes" className="hover:text-ink">
            Sandboxes
          </Link>
          <span className="mx-1.5 text-ink-4">/</span>
          <Link
            href={`/sandboxes/${data.sandbox_id}`}
            className="text-ink-2 hover:text-ink"
            data-testid="detail-back"
          >
            {data.sandbox_name}
          </Link>
        </nav>
        <div className="mt-3 flex items-start gap-4">
          {kind === 'group' ? (
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-line bg-paper">
              <Users className="h-5 w-5 text-ink-3" aria-hidden />
            </span>
          ) : (
            <PersonAvatar name={data.entity.name} size="lg" />
          )}
          <div className="min-w-0">
            <h1 className="break-words text-3xl font-semibold leading-tight text-ink">
              {data.entity.name}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-3">
              <span className="text-ink-2">
                {data.my_scope === 'self' ? 'Your coaching' : KIND_LABEL[kind]}
              </span>
              {!data.entity.active && (
                <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs text-ink-3">
                  Former participant
                </span>
              )}
              <Facts data={data} current={current} />
            </p>
          </div>
        </div>
        <div
          className="mt-4 flex flex-wrap items-center gap-2"
          aria-label="Reporting filters"
        >
          {filters}
          {help}
        </div>
      </div>
      <AgreementCard data={data} current={current} />
    </section>
  )
}

/** One quiet line: who coaches them, in which group — each a link. */
function Facts({
  data,
  current,
}: {
  data: SandboxEntityDetail
  current: SandboxRelationship[]
}) {
  const { kind } = data.entity
  if (kind !== 'client') {
    const coachees = new Set(current.map(r => r.member_id)).size
    return coachees ? (
      <span>· {pluralise(coachees, 'coachee')}</span>
    ) : (
      <span>· {data.entity.subtitle}</span>
    )
  }
  if (!current.length) return <span>· {data.entity.subtitle}</span>
  const coaches = new Map<string, string>()
  const groups = new Map<string, string>()
  for (const r of current) {
    r.coach_ids.forEach((id, i) => coaches.set(id, r.coach_names[i] ?? ''))
    groups.set(r.group_id, r.group_name)
  }
  return (
    <>
      {coaches.size > 0 && (
        <span>
          · with{' '}
          {[...coaches].map(([id, name], i) => (
            <span key={id}>
              {i > 0 && ', '}
              <Link
                href={sandboxEntityHref(data.sandbox_id, 'coach', id)}
                className="text-ink-2 underline-offset-4 hover:text-ink hover:underline"
              >
                {name}
              </Link>
            </span>
          ))}
        </span>
      )}
      <span>
        ·{' '}
        {[...groups].map(([id, name], i) => (
          <span key={id}>
            {i > 0 && ', '}
            <Link
              href={sandboxEntityHref(data.sandbox_id, 'group', id)}
              className="text-ink-2 underline-offset-4 hover:text-ink hover:underline"
            >
              {name}
            </Link>
          </span>
        ))}
      </span>
    </>
  )
}

/**
 * What was agreed and where it stands — the same card shape as the sandbox
 * page's Term card. The pace chip counts sessions; the bar counts hours. When
 * the two disagree the card says both rather than picking one.
 */
function AgreementCard({
  data,
  current,
}: {
  data: SandboxEntityDetail
  current: SandboxRelationship[]
}) {
  const { kind } = data.entity
  const contract = (data.portfolio ?? data.analytics).current_contract
  const today = contract.as_of
  const heads = kind === 'client' ? null : headcountText(contract)
  // A coachee with two agreements gets two bars — never one blended bar.
  const separate = kind === 'client' && current.length > 1
  const remaining = hoursRemaining(contract)
  const ends = current
    .map(r => r.ends_on)
    .filter(Boolean)
    .sort()
    .pop()
  const weeks = weeksLeft(ends ?? null, today)
  const short = (data.stats?.rhythm ?? []).filter(
    r => r.current && projectedShort(r.forecast),
  ).length

  return (
    <div
      className="rounded-xl border border-line bg-paper p-4"
      data-testid="agreement-card"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
          {kind === 'client' ? 'Agreement' : 'Delivery'}
        </p>
        <PaceChip state={contract.state} />
      </div>

      {separate ? (
        <ul className="mt-3 space-y-3">
          {current.map(r => (
            <li key={`${r.group_id}:${r.starts_on}`}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-xs text-ink-2">
                  {r.group_name}
                </span>
                <span className="flex-none text-xs tabular-nums text-ink-3">
                  {fmtHoursShort(r.hours_received)}
                  {r.hours_promised != null &&
                    ` of ${fmtHoursShort(r.hours_promised)}`}
                </span>
              </div>
              {r.hours_promised != null && (
                <ProgressRail
                  className="mt-1.5"
                  value={r.hours_received}
                  max={r.hours_promised}
                />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <>
          <p className="mt-3 text-sm font-medium text-ink">
            {heads ? (
              heads.main
            ) : (
              <>
                {fmtHoursShort(contract.hours_received)}
                {contract.hours_promised == null
                  ? ' received'
                  : ` of ${fmtHoursShort(contract.hours_promised)}`}
              </>
            )}
          </p>
          {heads && (
            <p className="text-xs text-ink-3">
              {fmtHoursShort(contract.hours_received)}
              {contract.hours_promised != null &&
                ` of ${fmtHoursShort(contract.hours_promised)}`}{' '}
              received{heads.sub && ` · ${heads.sub}`}
            </p>
          )}
          {contract.hours_promised != null ? (
            <ProgressRail
              className="mt-2.5"
              value={contract.hours_received}
              max={contract.hours_promised}
              marker={contract.expected_hours}
              markerLabel={
                contract.expected_hours == null
                  ? undefined
                  : `${fmtHoursShort(contract.expected_hours)} expected by today`
              }
            />
          ) : (
            <p className="mt-2 text-xs text-ink-3">
              No hours are agreed yet, so pace cannot be measured.
            </p>
          )}
        </>
      )}

      <p className="mt-2.5 text-xs text-ink-3">
        {[
          contract.expected_hours != null &&
            `${fmtHoursShort(contract.expected_hours)} expected by ${fmtDay(today)}`,
          remaining != null &&
            (remaining > 0
              ? `${fmtHoursShort(remaining)} still to deliver`
              : 'All agreed hours delivered'),
        ]
          .filter(Boolean)
          .join(' · ') || `As of ${fmtDay(today)}`}
      </p>
      {short > 0 && (
        <p
          className="mt-1 text-xs text-amber-token"
          data-testid="agreement-forecast"
        >
          {kind === 'client'
            ? 'At this rhythm it ends short of its sessions.'
            : `At this rhythm ${short} will end short of their sessions.`}
        </p>
      )}
      {current.length === 1 && current[0].starts_on && current[0].ends_on && (
        <p className="mt-1 font-mono text-[11px] text-ink-3">
          {fmtWindow(current[0].starts_on, current[0].ends_on)}
          {weeks != null && ` · ${pluralise(weeks, 'wk')} left`}
        </p>
      )}
    </div>
  )
}
