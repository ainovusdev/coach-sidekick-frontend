'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { PaceChip } from '@/components/sandboxes/pace-chip'
import { ProgressRail } from '@/components/sandboxes/progress-rail'
import { fmtDay, pluralise } from '@/lib/sandbox/format'
import { fmtHoursShort } from '@/lib/sandbox/delivery'
import { sandboxEntityHref } from '@/lib/sandbox/detail-links'
import { whenLabel } from './client-view-copy'
import type { ClientGroup } from './client-view-model'
import { Empty } from '@/components/sandboxes/section'

/** Every group on one line: who coaches it, where its hours are, what is next. */
export function GroupsTable({
  groups,
  sandboxId,
  today,
}: {
  groups: ClientGroup[]
  sandboxId: string
  today: string
}) {
  if (!groups.length) return <Empty>Groups are being set up.</Empty>
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-ink-3">
            <th scope="col" className="py-2 pr-3 font-medium">
              Group
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Pace
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Hours received
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              On track
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Last
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Next
            </th>
            <th scope="col" className="w-6" />
          </tr>
        </thead>
        <tbody>
          {groups.map(g => (
            <tr
              key={g.groupId}
              className="border-t border-line align-middle"
              data-testid="client-group-row"
              data-group={g.groupId}
            >
              <td className="py-3 pr-3">
                <Link
                  href={sandboxEntityHref(sandboxId, 'group', g.groupId)}
                  className="font-medium text-ink hover:text-ds-accent hover:underline"
                >
                  {g.displayName}
                </Link>
                <p className="text-xs text-ink-3">
                  {g.coachNames.join(', ') || 'No coach yet'} ·{' '}
                  {pluralise(g.coacheeCount, 'coachee')}
                </p>
              </td>
              <td className="px-3 py-3">
                <PaceChip state={g.state} />
              </td>
              <td className="px-3 py-3">
                <ProgressRail
                  className="w-32"
                  value={g.hoursReceived}
                  max={g.hoursPromised ?? g.hoursReceived}
                  captions={[
                    `${fmtHoursShort(g.hoursReceived)}${
                      g.hoursPromised == null
                        ? ''
                        : ` of ${fmtHoursShort(g.hoursPromised)}`
                    }`,
                  ]}
                />
              </td>
              <td className="px-3 py-3 tabular-nums">
                {g.onTrack.total
                  ? `${g.onTrack.count} of ${g.onTrack.total}`
                  : '—'}
                {g.yetToStart > 0 && (
                  <p className="text-xs text-ink-3">
                    {g.yetToStart} yet to start
                  </p>
                )}
              </td>
              <td className="px-3 py-3 text-xs text-ink-2">
                {g.lastActivityOn ? fmtDay(g.lastActivityOn) : '—'}
              </td>
              <td className="px-3 py-3 text-xs text-ink-2">
                {g.nextActivityOn ? whenLabel(g.nextActivityOn, today) : '—'}
              </td>
              <td className="py-3">
                <ChevronRight className="h-4 w-4 text-ink-4" aria-hidden />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
