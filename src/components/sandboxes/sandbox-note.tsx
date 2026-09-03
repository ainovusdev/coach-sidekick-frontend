'use client'

import Link from 'next/link'
import { ArrowRight, Boxes } from 'lucide-react'
import { ProgressRail } from '@/components/sandboxes/progress-rail'
import { WindowChip } from '@/components/sandboxes/window-chip'
import { useCoacheeSandbox } from '@/hooks/queries/use-sandboxes'
import { fmtHoursShort } from '@/lib/sandbox/delivery'
import { fmtDay, listNames, pluralise } from '@/lib/sandbox/format'
import type { ClientSandboxContext } from '@/types/sandbox-delivery'

function line(ctx: ClientSandboxContext): string {
  const n = ctx.delivered.sessions
  if (ctx.status === 'upcoming')
    return `Your coaching starts ${fmtDay(ctx.starts_on, true)}. Nothing to do yet.`
  if (ctx.expected_sessions == null)
    return n === 0
      ? 'No sessions yet.'
      : `${pluralise(n, 'session')} · ${fmtHoursShort(ctx.delivered.hours)} so far`
  const hours = `${fmtHoursShort(ctx.delivered.hours)} of ${fmtHoursShort(ctx.hours_per_coachee)}`
  if (n === 0) return `No sessions yet · started ${fmtDay(ctx.starts_on)}`
  return `${n} of ${ctx.expected_sessions} sessions · ${hours}`
}

/**
 * The coachee's card on the client-portal dashboard: which sandbox, who
 * coaches them, how far along, and the next window they take part in.
 * Reads the active profile, so switching profiles switches the card.
 */
export function SandboxNote() {
  const { data } = useCoacheeSandbox()
  if (!data || data.length === 0) return null
  return (
    <div className="mb-6 space-y-3" data-testid="sandbox-note">
      {data.map(ctx => {
        const window = ctx.current_event ?? ctx.next_event
        return (
          <div
            key={`${ctx.sandbox_id}-${ctx.group_id}`}
            className="rounded-xl border border-line bg-paper p-5"
            data-testid="sandbox-card"
            data-sandbox={ctx.sandbox_id}
            data-state={ctx.pace.state}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                  <Boxes className="h-3.5 w-3.5" /> Your coaching
                </p>
                <p className="mt-1 text-sm text-ink-2">
                  <span className="font-semibold text-ink">
                    {ctx.sandbox_name}
                  </span>{' '}
                  with {ctx.organisation}
                  {ctx.coach_names.length > 0 &&
                    ` · coached by ${listNames(ctx.coach_names, 2)}`}
                </p>
              </div>
              {window && <WindowChip event={window} today={ctx.today} />}
            </div>

            <p className="mt-3 text-sm text-ink" data-testid="portal-progress">
              {line(ctx)}
            </p>
            {ctx.expected_sessions != null && ctx.status !== 'upcoming' && (
              <ProgressRail
                className="mt-2"
                value={ctx.delivered.sessions}
                max={ctx.expected_sessions}
                captions={[fmtDay(ctx.starts_on), fmtDay(ctx.term_end)]}
              />
            )}

            {ctx.vision && (
              <blockquote className="mt-3 border-l-2 border-line pl-3 text-sm italic text-ink-2">
                {ctx.vision}
              </blockquote>
            )}

            <Link
              href={`/sandboxes/${ctx.sandbox_id}`}
              className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-ink-2 underline-offset-2 hover:text-ink hover:underline"
              data-testid="portal-open-sandbox"
            >
              See the timeline <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )
      })}
    </div>
  )
}
