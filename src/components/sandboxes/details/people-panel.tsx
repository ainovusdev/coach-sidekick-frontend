'use client'

import Link from 'next/link'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { PaceChip } from '@/components/sandboxes/pace-chip'
import { Empty, Section } from '@/components/sandboxes/section'
import { fmtHoursShort } from '@/lib/sandbox/delivery'
import { fmtDay } from '@/lib/sandbox/format'
import type { SandboxEntityDetail } from '@/types/sandbox-details'

export function PeoplePanel({ data }: { data: SandboxEntityDetail }) {
  const kinds =
    data.entity.kind === 'coach'
      ? ['coachee']
      : ['coach', 'coachee', 'supervisor']
  return (
    <div className="space-y-5">
      {kinds.map(kind => {
        const people = data.people.filter(p => p.kind === kind)
        return (
          <Section
            key={kind}
            id={`people-${kind}`}
            testId={`detail-people-${kind}`}
            title={
              kind === 'coachee'
                ? 'Coachees'
                : kind === 'coach'
                  ? 'Coaches'
                  : 'Supervisors'
            }
            sub={people.length ? String(people.length) : undefined}
          >
            {!people.length ? (
              <Empty>
                No {kind === 'coachee' ? 'coachees' : `${kind}s`} visible in
                this selection.
              </Empty>
            ) : (
              <ul className="divide-y divide-line">
                {people.map(person => {
                  const relationships = data.relationships.filter(
                    r => r.member_id === person.member_id && r.current,
                  )
                  return (
                    <li
                      key={`${person.kind}:${person.user_id}`}
                      className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <PersonAvatar name={person.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        {person.href ? (
                          <Link
                            href={person.href}
                            className="text-sm font-medium text-ink hover:text-ds-accent hover:underline"
                          >
                            {person.name}
                          </Link>
                        ) : (
                          <span className="text-sm font-medium text-ink">
                            {person.name}
                          </span>
                        )}
                        <p className="mt-1 text-xs text-ink-3">
                          {!person.active
                            ? 'Former participant'
                            : relationships.map(r => r.group_name).join(', ') ||
                              'Current participant'}
                        </p>
                        {relationships.map((r, i) => (
                          <div
                            key={`${r.group_id}:${i}`}
                            className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-3"
                          >
                            <PaceChip state={r.state} />
                            <span>
                              {fmtHoursShort(r.hours_received)} received
                              {r.hours_promised == null
                                ? ''
                                : ` of ${fmtHoursShort(r.hours_promised)}`}
                            </span>
                            <span>
                              Last:{' '}
                              {r.last_activity_on
                                ? fmtDay(r.last_activity_on)
                                : 'None recorded'}
                              . Next:{' '}
                              {r.next_activity_on
                                ? fmtDay(r.next_activity_on)
                                : 'None scheduled'}
                              .
                            </span>
                          </div>
                        ))}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Section>
        )
      })}
    </div>
  )
}
