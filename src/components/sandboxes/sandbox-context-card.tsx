'use client'

import Link from 'next/link'
import { ArrowRight, Boxes } from 'lucide-react'
import { StatStrip } from '@/components/ui/stat-strip'
import { PaceChip } from '@/components/sandboxes/pace-chip'
import { ProgressRail } from '@/components/sandboxes/progress-rail'
import { WindowChip } from '@/components/sandboxes/window-chip'
import { useClientSandboxContext } from '@/hooks/queries/use-sandboxes'
import { fmtHoursShort, NO_CONTRACT_COPY } from '@/lib/sandbox/delivery'
import { fmtDay, pluralise } from '@/lib/sandbox/format'
import type { ClientSandboxContext } from '@/types/sandbox-delivery'

function ContextCard({ ctx }: { ctx: ClientSandboxContext }) {
  const window = ctx.current_event ?? ctx.next_event
  const expected = ctx.expected_sessions
  return (
    <div
      className="rounded-xl border border-line bg-paper p-5"
      data-testid="sandbox-context-card"
      data-sandbox={ctx.sandbox_id}
      data-state={ctx.pace.state}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
            <Boxes className="h-3.5 w-3.5" /> Sandbox
          </p>
          <p className="mt-1 text-sm text-ink-2">
            Part of{' '}
            <span className="font-semibold text-ink">{ctx.sandbox_name}</span>{' '}
            with {ctx.organisation} · {ctx.group_name}
          </p>
          {ctx.cadence_text && (
            <p className="mt-0.5 font-mono text-[11px] text-ink-3">
              {ctx.cadence_text}
              {expected != null &&
                ` · contract expects ${pluralise(expected, 'session')}`}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PaceChip pace={ctx.pace} startsOn={ctx.starts_on} />
          {window && <WindowChip event={window} today={ctx.today} />}
        </div>
      </div>

      {expected != null ? (
        <>
          <StatStrip
            className="mt-4"
            size="sm"
            items={[
              {
                label: 'Hours',
                value: `${fmtHoursShort(ctx.delivered.hours)} of ${fmtHoursShort(ctx.hours_per_coachee)}`,
                testId: 'ctx-hours',
              },
              {
                label: 'Sessions',
                value: `${ctx.delivered.sessions} of ${expected}`,
                sub:
                  ctx.pace.expected_by_today != null
                    ? `about ${Math.round(ctx.pace.expected_by_today)} expected by now`
                    : undefined,
                testId: 'ctx-sessions',
              },
              {
                label: 'Last session',
                value: ctx.delivered.last_on
                  ? fmtDay(ctx.delivered.last_on)
                  : '—',
                testId: 'ctx-last',
              },
              {
                label: 'Next',
                value: ctx.delivered.next_scheduled_on
                  ? fmtDay(ctx.delivered.next_scheduled_on)
                  : window
                    ? window.label
                    : '—',
                sub:
                  !ctx.delivered.next_scheduled_on && window
                    ? fmtDay(window.window_start)
                    : undefined,
                testId: 'ctx-next',
              },
            ]}
          />
          <ProgressRail
            className="mt-4"
            value={ctx.delivered.sessions}
            max={expected}
            marker={ctx.pace.expected_by_today}
            markerLabel="Expected by today"
            captions={[
              fmtDay(ctx.starts_on),
              ctx.pace.sentence,
              fmtDay(ctx.term_end),
            ]}
          />
        </>
      ) : (
        <p className="mt-4 rounded-md bg-surface-2 px-3 py-2 text-xs text-ink-3">
          {NO_CONTRACT_COPY} {pluralise(ctx.delivered.sessions, 'session')} so
          far.
        </p>
      )}

      <Link
        href={`/sandboxes/${ctx.sandbox_id}`}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-ink-2 underline-offset-2 hover:text-ink hover:underline"
        data-testid="ctx-open"
      >
        Open sandbox <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

/** Client profile → the sandbox this client is coached in (nothing for other clients). */
export function SandboxContextCard({ clientId }: { clientId: string }) {
  const { data } = useClientSandboxContext(clientId)
  if (!data || data.length === 0) return null
  return (
    <div className="space-y-4">
      {data.map(ctx => (
        <ContextCard key={`${ctx.sandbox_id}-${ctx.group_id}`} ctx={ctx} />
      ))}
    </div>
  )
}
