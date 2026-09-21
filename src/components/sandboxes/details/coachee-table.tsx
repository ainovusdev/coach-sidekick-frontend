'use client'

import Link from 'next/link'
import { CalendarX } from 'lucide-react'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { PaceChip } from '@/components/sandboxes/pace-chip'
import { ProgressRail } from '@/components/sandboxes/progress-rail'
import { Empty, Section } from '@/components/sandboxes/section'
import { fmtHoursShort } from '@/lib/sandbox/delivery'
import { sandboxEntityHref } from '@/lib/sandbox/detail-links'
import { coacheeRows, nothingBooked } from '@/lib/sandbox/detail-view'
import { fmtDay, pluralise } from '@/lib/sandbox/format'
import type { SandboxEntityDetail } from '@/types/sandbox-details'

/**
 * Everyone coached on this page, the ones who need someone first.
 *
 * A table only where there is room for seven columns: the breakpoint is on the
 * section's own width (`@container`), because the rail takes 340px of a
 * laptop screen and a phone-width rule would crush the table long before that.
 */
export function CoacheeTable({ data }: { data: SandboxEntityDetail }) {
  const rows = coacheeRows(data)
  const unbooked = nothingBooked(data.relationships).length
  return (
    <Section
      id="coachees"
      title="Coachees"
      sub={rows.length ? String(rows.length) : undefined}
      testId="detail-coachees"
      bodyClassName="p-0"
      aside={
        unbooked > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-token">
            <CalendarX className="h-3.5 w-3.5" aria-hidden />
            {pluralise(unbooked, 'coachee')} with nothing booked
          </span>
        )
      }
    >
      {rows.length === 0 ? (
        <div className="px-5 py-4">
          <Empty>No current coachees in this view.</Empty>
        </div>
      ) : (
        <div className="@container">
          <div
            className="hidden grid-cols-[minmax(0,1.6fr)_7.5rem_minmax(0,1.2fr)_5rem_5rem_5.5rem] gap-4 border-b border-line px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3 @3xl:grid"
            aria-hidden
          >
            <span>Coachee</span>
            <span>Pace</span>
            <span>Hours</span>
            <span>Last</span>
            <span>Next</span>
            <span className="text-right">Outcomes</span>
          </div>
          <ul className="divide-y divide-line">
            {rows.map(row => {
              const r = row.relationship
              return (
                <li
                  key={`${row.memberId}:${r.group_id}`}
                  className="grid gap-x-4 gap-y-2 px-5 py-3 @3xl:grid-cols-[minmax(0,1.6fr)_7.5rem_minmax(0,1.2fr)_5rem_5rem_5.5rem] @3xl:items-center"
                  data-testid="detail-coachee-row"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <PersonAvatar name={row.name} size="sm" />
                    <div className="min-w-0">
                      <Link
                        href={sandboxEntityHref(
                          data.sandbox_id,
                          'client',
                          row.memberId,
                        )}
                        className="block truncate text-sm font-medium text-ink hover:text-ds-accent hover:underline"
                      >
                        {row.name}
                      </Link>
                      {data.entity.kind === 'coach' && (
                        <p className="truncate text-xs text-ink-3">
                          {r.group_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <PaceChip state={r.state} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs tabular-nums text-ink-3">
                      <span className="text-ink-2">
                        {fmtHoursShort(r.hours_received)}
                      </span>
                      {r.hours_promised == null
                        ? ' · no hours agreed'
                        : ` of ${fmtHoursShort(r.hours_promised)}`}
                    </p>
                    {r.hours_promised != null && (
                      <ProgressRail
                        className="mt-1.5"
                        value={r.hours_received}
                        max={r.hours_promised}
                      />
                    )}
                  </div>
                  <p className="text-xs tabular-nums text-ink-3">
                    <span className="@3xl:hidden">Last </span>
                    {r.last_activity_on ? fmtDay(r.last_activity_on) : '—'}
                  </p>
                  <p className="text-xs tabular-nums text-ink-3">
                    <span className="@3xl:hidden">Next </span>
                    {r.next_activity_on ? (
                      fmtDay(r.next_activity_on)
                    ) : r.state === 'complete' ? (
                      '—'
                    ) : (
                      <span className="font-medium text-amber-token">None</span>
                    )}
                  </p>
                  <p className="text-xs tabular-nums text-ink-3 @3xl:text-right">
                    <span className="@3xl:hidden">Outcomes </span>
                    {row.outcomesTotal === 0 ? (
                      'None yet'
                    ) : (
                      <>
                        <span className="text-ink-2">{row.outcomesAgreed}</span>{' '}
                        of {row.outcomesTotal} agreed
                      </>
                    )}
                  </p>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Section>
  )
}
