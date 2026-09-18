'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarClock, Play, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GroupSessionDialog } from '@/components/sandboxes/group-session-dialog'
import { PaceChip } from '@/components/sandboxes/pace-chip'
import { ProgressRail } from '@/components/sandboxes/progress-rail'
import { ScheduleSessionModal } from '@/components/sessions/schedule-session-modal'
import { useAuth } from '@/contexts/auth-context'
import { useClientsSimple } from '@/hooks/queries/use-clients'
import { useSandboxDashboard } from '@/hooks/queries/use-sandboxes'
import { useFeatureFlagEnabled } from '@/hooks/use-feature-flag'
import { fmtContract, fmtDay } from '@/lib/sandbox/format'
import { cn } from '@/lib/utils'
import type { SimpleClient } from '@/services/client-service'
import type {
  CoacheeDelivery,
  GroupDelivery,
  SandboxCard,
} from '@/types/sandbox-delivery'

type Dialog =
  | {
      kind: 'group'
      group: GroupDelivery
      sandbox: SandboxCard
      mode: 'start' | 'schedule'
    }
  | { kind: 'one-to-one'; clientId: string }

/**
 * This coach's own client row for a coachee.
 *
 * Matched by email against the caller's own client list, which is already
 * scoped to them — `CoacheeDelivery.client_ids` is a union across every coach in
 * the group, so it can name a row this coach does not own.
 */
function myClientId(
  coachee: CoacheeDelivery,
  clients: SimpleClient[],
): string | undefined {
  const email = coachee.email?.toLowerCase()
  if (!email) return undefined
  return clients.find(
    c => c.is_my_client !== false && (c.email || '').toLowerCase() === email,
  )?.id
}

function UpcomingLine({ group }: { group: GroupDelivery }) {
  if (!group.upcoming_sessions.length) return null
  return (
    <ul className="space-y-1" data-testid="group-upcoming">
      {group.upcoming_sessions.slice(0, 3).map(session => (
        <li
          key={session.session_id}
          className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-3"
        >
          <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <Link
            href={
              session.is_group_session
                ? `/sessions/group/${session.session_id}`
                : `/sessions/${session.session_id}`
            }
            className="font-medium text-ink-2 hover:underline"
          >
            {fmtDay(session.on_day, true)}
          </Link>
          <span className="truncate">
            {session.participant_names.join(', ')}
          </span>
          {session.meeting_url && (
            <a
              href={session.meeting_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-ds-accent hover:underline"
            >
              <Video className="h-3 w-3" aria-hidden />
              Join
            </a>
          )}
        </li>
      ))}
    </ul>
  )
}

function GroupRow({
  group,
  card,
  clients,
  onOpen,
}: {
  group: GroupDelivery
  card: SandboxCard
  clients: SimpleClient[]
  onOpen: (dialog: Dialog) => void
}) {
  const expected = group.expected_total
  return (
    <article
      className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-4"
      data-testid="sandbox-group-row"
      data-group={group.group_id}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-ink">
            {group.display_name}
          </h3>
          <p className="truncate text-xs text-ink-3">
            <Link
              href={`/sandboxes/${card.sandbox.id}`}
              className="hover:underline"
            >
              {card.sandbox.name}
            </Link>
            {' · '}
            {fmtContract(group)}
            {group.cadence_text ? ` · ${group.cadence_text}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            onClick={() =>
              onOpen({ kind: 'group', group, sandbox: card, mode: 'start' })
            }
            data-testid="start-group-session"
          >
            <Play className="h-3.5 w-3.5" aria-hidden />
            Start group session
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onOpen({ kind: 'group', group, sandbox: card, mode: 'schedule' })
            }
            data-testid="schedule-group-session"
          >
            Schedule
          </Button>
        </div>
      </div>

      {expected != null && expected > 0 && (
        <ProgressRail
          value={group.delivered_sessions}
          max={expected}
          captions={[
            `${group.delivered_sessions} of ${expected} sessions`,
            null,
            group.coachees.length === 1
              ? null
              : `${group.coachees.length} coachees`,
          ]}
        />
      )}

      <ul className="space-y-1.5">
        {group.coachees.map(coachee => {
          const clientId = myClientId(coachee, clients)
          return (
            <li
              key={coachee.member_id}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm text-ink-2">
                  {coachee.name || coachee.email}
                </span>
                <PaceChip pace={coachee.pace} startsOn={group.starts_on} />
              </span>
              {clientId && (
                <button
                  type="button"
                  className="text-xs text-ink-3 underline-offset-2 hover:text-ink hover:underline"
                  onClick={() => onOpen({ kind: 'one-to-one', clientId })}
                  data-testid="schedule-one-to-one"
                >
                  Schedule 1:1
                </button>
              )}
            </li>
          )
        })}
      </ul>

      <UpcomingLine group={group} />
    </article>
  )
}

/**
 * "Your groups" on the coach home and on `/sandboxes`.
 *
 * Only groups this viewer actually coaches — `can_start` is computed server-side
 * from the coach enrollments, so a lead coach or account executive, who can see
 * every group in the sandbox, gets no Start button and therefore no section.
 */
export function SandboxGroupsSection({
  className,
  heading = 'Your groups',
}: {
  className?: string
  heading?: string
}) {
  const { isCoach, isAdmin } = useAuth()
  // Behind `sandboxes`: this sits on the coach home page, so with the flag off
  // it must not even ask the dashboard endpoint.
  const flagOn = useFeatureFlagEnabled('sandboxes')
  const enabled = flagOn && (isCoach() || isAdmin())
  const { data } = useSandboxDashboard(false, enabled)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const rows = (data?.cards ?? []).flatMap(card =>
    card.my_groups.filter(g => g.can_start).map(group => ({ card, group })),
  )
  // Only ask for the client list once there is somewhere to use it.
  const { data: clientsData } = useClientsSimple({ enabled: rows.length > 0 })

  if (!enabled || rows.length === 0) return null
  const clients = clientsData?.clients ?? []

  return (
    <section className={cn('mb-6', className)} data-testid="sandbox-groups">
      <h2 className="mb-3 text-base font-semibold text-ink">
        {heading}
        <span className="ml-1.5 text-sm font-normal text-ink-3">
          {rows.length}
        </span>
      </h2>
      <ul className="grid gap-3 xl:grid-cols-2">
        {rows.map(({ card, group }) => (
          <li key={group.group_id}>
            <GroupRow
              group={group}
              card={card}
              clients={clients}
              onOpen={setDialog}
            />
          </li>
        ))}
      </ul>

      {dialog?.kind === 'group' && (
        <GroupSessionDialog
          group={dialog.group}
          sandboxId={dialog.sandbox.sandbox.id}
          sandboxName={dialog.sandbox.sandbox.name}
          mode={dialog.mode}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'one-to-one' && (
        <ScheduleSessionModal
          isOpen
          onClose={() => setDialog(null)}
          preselectedClientId={dialog.clientId}
        />
      )}
    </section>
  )
}
