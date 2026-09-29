'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarX, Flag } from 'lucide-react'
import { PaceChip } from '@/components/sandboxes/pace-chip'
import { Empty, Panel } from '@/components/sandboxes/section'
import { fmtHoursShort } from '@/lib/sandbox/delivery'
import { sandboxEntityHref } from '@/lib/sandbox/detail-links'
import { comingUp } from '@/lib/sandbox/detail-view'
import { fmtDay, fmtWindow } from '@/lib/sandbox/format'
import { cn } from '@/lib/utils'
import type {
  SandboxEntityDetail,
  SandboxRelationship,
} from '@/types/sandbox-details'

type Attention = SandboxEntityDetail['attention'][number]

const FLAG_TONE: Record<string, string> = {
  urgent: 'text-vermillion',
  warn: 'text-amber-token',
  info: 'text-ink-3',
}

function AttentionRow({
  item,
  onCommitment,
}: {
  item: Attention
  onCommitment: (id: string) => void
}) {
  return (
    <li className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
      <Flag
        className={cn(
          'mt-0.5 h-3.5 w-3.5 flex-none',
          FLAG_TONE[item.severity] ?? 'text-ink-3',
        )}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="text-sm font-medium leading-snug text-ink">
          {item.headline}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-3">
          {item.detail}
        </p>
        {item.commitment_id ? (
          <button
            type="button"
            className="mt-1 text-xs font-medium text-ds-accent"
            onClick={() => onCommitment(item.commitment_id!)}
          >
            View follow-up
          </button>
        ) : (
          item.href && (
            <Link
              className="mt-1 inline-block text-xs font-medium text-ds-accent"
              href={item.href}
            >
              View details
            </Link>
          )
        )}
      </div>
    </li>
  )
}

/** What needs someone, worst first. Three, then the rest on request. */
export function AttentionPanel({
  items,
  onCommitment,
  className,
}: {
  items: Attention[]
  onCommitment: (id: string) => void
  className?: string
}) {
  const [all, setAll] = useState(false)
  const shown = all ? items : items.slice(0, 3)
  return (
    <Panel
      id="attention"
      title="Needs attention"
      testId="detail-attention"
      className={className}
      aside={
        items.length > 3 && (
          <button
            type="button"
            className="text-xs font-medium text-ds-accent"
            onClick={() => setAll(!all)}
          >
            {all ? 'Show less' : `View all ${items.length}`}
          </button>
        )
      }
    >
      {items.length === 0 ? (
        <Empty>Nothing needs attention in this view.</Empty>
      ) : (
        <ul className="divide-y divide-line">
          {shown.map(item => (
            <AttentionRow
              key={item.id}
              item={item}
              onCommitment={onCommitment}
            />
          ))}
        </ul>
      )}
    </Panel>
  )
}

/**
 * The same list for a narrow screen, where the rail drops under eight sections:
 * one line under the numbers, the rest on a tap.
 */
export function AttentionSummary({
  items,
  onCommitment,
}: {
  items: Attention[]
  onCommitment: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  if (items.length === 0) return null
  const top = items[0]
  return (
    <div
      className="rounded-xl border border-line bg-paper xl:hidden"
      data-testid="detail-attention-summary"
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left"
      >
        <Flag
          className={cn(
            'h-3.5 w-3.5 flex-none',
            FLAG_TONE[top.severity] ?? 'text-ink-3',
          )}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate text-sm text-ink">
          {top.headline}
        </span>
        <span className="flex-none text-xs font-medium text-ds-accent">
          {open ? 'Hide' : `${items.length} to look at`}
        </span>
      </button>
      {open && (
        <ul className="divide-y divide-line border-t border-line px-4 py-3">
          {items.map(item => (
            <AttentionRow
              key={item.id}
              item={item}
              onCommitment={onCommitment}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function RelationshipRow({
  data,
  row,
}: {
  data: SandboxEntityDetail
  row: SandboxRelationship
}) {
  const client = data.entity.kind === 'client'
  return (
    <li className="py-2.5 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={sandboxEntityHref(
              data.sandbox_id,
              client ? 'group' : 'client',
              client ? row.group_id : row.member_id,
            )}
            className="block truncate text-sm font-medium text-ink hover:text-ds-accent hover:underline"
          >
            {client ? row.group_name : row.name}
          </Link>
          <p className="truncate text-xs text-ink-3">
            {!client && (
              <Link
                href={sandboxEntityHref(data.sandbox_id, 'group', row.group_id)}
                className="hover:underline"
              >
                {row.group_name}
              </Link>
            )}
            {!client && row.coach_names.length > 0 && ' · '}
            {row.coach_names.map((name, i) => (
              <span key={row.coach_ids[i] ?? name}>
                {i > 0 && ', '}
                <Link
                  className="hover:underline"
                  href={sandboxEntityHref(
                    data.sandbox_id,
                    'coach',
                    row.coach_ids[i],
                  )}
                >
                  {name}
                </Link>
              </span>
            ))}
          </p>
        </div>
        {row.current ? (
          <PaceChip state={row.state} className="flex-none" />
        ) : (
          <span className="flex-none text-xs text-ink-3">Ended</span>
        )}
      </div>
      <p className="mt-1.5 text-xs tabular-nums text-ink-3">
        <span className="text-ink-2">{fmtHoursShort(row.hours_received)}</span>
        {row.hours_promised == null
          ? ' received'
          : ` of ${fmtHoursShort(row.hours_promised)}`}
        {row.starts_on && row.ends_on && (
          <> · {fmtWindow(row.starts_on, row.ends_on)}</>
        )}
      </p>
      <p className="mt-0.5 text-xs text-ink-3">
        Last {row.last_activity_on ? fmtDay(row.last_activity_on) : '—'}
        {row.current && (
          <>
            {' · '}
            {row.next_activity_on ? (
              `next ${fmtDay(row.next_activity_on)}`
            ) : row.state === 'complete' ? (
              'complete'
            ) : (
              <span className="inline-flex items-center gap-1 font-medium text-amber-token">
                <CalendarX className="h-3 w-3" aria-hidden />
                nothing booked
              </span>
            )}
          </>
        )}
      </p>
    </li>
  )
}

/** Who coaches whom on this page — current first, then what has ended. */
export function CoachingPanel({
  data,
  max,
  onViewAll,
}: {
  data: SandboxEntityDetail
  /** Pages about many people show the first few and link to the full tab. */
  max?: number
  onViewAll?: () => void
}) {
  const current = data.relationships.filter(r => r.current)
  const former = data.relationships.filter(r => !r.current)
  if (!current.length && !former.length) return null
  const shown = max ? current.slice(0, max) : current
  return (
    <Panel
      id="coaching"
      title={data.entity.kind === 'coach' ? 'Assigned coaching' : 'Coaching'}
      testId="detail-coaching"
      aside={
        onViewAll &&
        max &&
        current.length > max && (
          <button
            type="button"
            className="text-xs font-medium text-ds-accent"
            onClick={onViewAll}
          >
            View all {current.length}
          </button>
        )
      }
    >
      {shown.length > 0 && (
        <ul className="divide-y divide-line">
          {shown.map((row, i) => (
            <RelationshipRow
              key={`${row.member_id}:${row.group_id}:${row.starts_on}:${i}`}
              data={data}
              row={row}
            />
          ))}
        </ul>
      )}
      {former.length > 0 && (
        <div
          className={cn(shown.length > 0 && 'mt-3 border-t border-line pt-3')}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
            Previous coaching relationships
          </p>
          <p className="mt-1 text-xs text-ink-3">
            Delivery at the end of each assignment, separate from current pace.
          </p>
          <ul className="mt-2 divide-y divide-line">
            {former.map((row, i) => (
              <RelationshipRow
                key={`${row.member_id}:${row.group_id}:${row.starts_on}:${i}`}
                data={data}
                row={row}
              />
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}

/** The sandbox's milestone windows that are open or still ahead. */
export function ComingUpPanel({ data }: { data: SandboxEntityDetail }) {
  const today = data.analytics.current_contract.as_of
  const rows = comingUp(data.milestones, today)
  if (!rows.length) return null
  return (
    <Panel id="coming-up" title="Coming up" testId="detail-coming-up">
      <ul className="space-y-2.5">
        {rows.map(m => (
          <li key={m.id} className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm text-ink">{m.label}</span>
            <span className="flex-none font-mono text-[11px] text-ink-3">
              {m.window_start <= today
                ? `open until ${fmtDay(m.window_end)}`
                : fmtWindow(m.window_start, m.window_end)}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
