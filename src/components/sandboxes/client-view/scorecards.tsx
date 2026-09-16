import { Award } from 'lucide-react'
import { fmtDay, pluralise } from '@/lib/sandbox/format'
import { fmtHoursShort, stateTone } from '@/lib/sandbox/delivery'
import { TONE_DOT } from '@/lib/tone'
import { cn } from '@/lib/utils'
import { expectedBy } from './client-view-copy'
import type { ClientViewModel } from './client-view-model'
import type { SandboxAnalytics } from '@/types/sandbox-analytics'
import { PaceRing } from './pace-ring'

const SEGMENTS = [
  { key: 'sealed', label: 'Gold sealed', className: 'bg-forest' },
  { key: 'proposed', label: 'Waiting for a seal', className: 'bg-amber-token' },
  {
    key: 'changes_requested',
    label: 'Sent back',
    className: 'bg-vermillion',
  },
  { key: 'drafting', label: 'Drafting', className: 'bg-ink-4' },
  { key: 'none', label: 'No outcome yet', className: 'bg-surface-3' },
] as const

function Card({
  label,
  children,
  note,
  testId,
}: {
  label: string
  children: React.ReactNode
  note?: React.ReactNode
  testId: string
}) {
  return (
    <div
      className="flex min-w-0 flex-col rounded-xl border border-line bg-paper p-4"
      data-testid={testId}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
        {label}
      </p>
      <div className="mt-2 flex-1">{children}</div>
      {note && <p className="mt-3 text-xs text-ink-3">{note}</p>}
    </div>
  )
}

/** The bar of outcome states — the same five colours as the Outcomes board. */
export function OutcomeStateBar({
  totals,
}: {
  totals: ClientViewModel['outcomeTotals']
}) {
  if (!totals) return null
  const shown = SEGMENTS.filter(s => totals[s.key] > 0)
  if (!shown.length) return null
  return (
    <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-surface-3">
      {shown.map(s => (
        <span
          key={s.key}
          className={s.className}
          style={{ flex: totals[s.key] }}
          title={`${s.label}: ${totals[s.key]}`}
        />
      ))}
    </div>
  )
}

export function OutcomeStateLegend({
  totals,
}: {
  totals: ClientViewModel['outcomeTotals']
}) {
  if (!totals) return null
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1">
      {SEGMENTS.filter(s => totals[s.key] > 0).map(s => (
        <li
          key={s.key}
          className="flex items-center gap-1.5 text-xs text-ink-3"
        >
          <span
            className={cn('h-2 w-2 rounded-full', s.className)}
            aria-hidden
          />
          {s.label}
          <b className="font-medium tabular-nums text-ink">{totals[s.key]}</b>
        </li>
      ))}
    </ul>
  )
}

/**
 * The four numbers a sponsor asks for first. Each one says what it cannot
 * say: a ring needs promised hours, a fraction needs someone measurable, and
 * "last 30 days" comes from its own read — never from adding up weeks.
 */
export function Scorecards({
  model,
  contract,
  metrics,
  sessionsLast30,
  weeks,
}: {
  model: ClientViewModel
  contract: SandboxAnalytics['current_contract'] | null
  metrics: SandboxAnalytics['metrics'] | null
  sessionsLast30: number | null
  weeks: SandboxAnalytics['weekly_series']
}) {
  if (!contract || !metrics) {
    return (
      <div
        className="rounded-xl border border-line bg-paper px-5 py-4"
        data-testid="scorecards-waiting"
      >
        <p className="text-base font-semibold text-ink">
          Reporting starts {fmtDay(model.sandbox.term_start)}
        </p>
        <p className="mt-1 text-sm text-ink-3">
          Hours, pace and outcomes appear once coaching begins.
        </p>
      </div>
    )
  }

  const promised = contract.hours_promised
  const filled = promised ? contract.hours_received / promised : 0
  const notch =
    promised &&
    contract.expectation_available &&
    contract.expected_hours != null
      ? contract.expected_hours / promised
      : null
  const tone = stateTone(contract.state)
  const busiest = Math.max(1, ...weeks.map(w => w.sessions_held ?? 0))

  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      data-testid="client-scorecards"
    >
      <Card
        label="Hours received"
        testId="scorecard-hours"
        note={
          notch != null && contract.expected_hours != null
            ? `${fmtHoursShort(contract.expected_hours)} ${expectedBy(model.life, contract.as_of)}`
            : 'Participant hours: a one-hour group meeting with four participants counts as four.'
        }
      >
        <div className="flex items-center gap-3">
          {promised ? (
            <PaceRing
              value={filled}
              expected={notch}
              tone={tone === 'muted' ? 'default' : tone}
              label={`${fmtHoursShort(contract.hours_received)} of ${fmtHoursShort(promised)} promised hours received`}
            />
          ) : null}
          <div className="min-w-0">
            <p className="text-2xl font-semibold tabular-nums text-ink">
              {fmtHoursShort(contract.hours_received)}
            </p>
            <p className="text-xs text-ink-3">
              {promised
                ? `of ${fmtHoursShort(promised)} promised`
                : 'Promised hours unavailable'}
            </p>
          </div>
        </div>
      </Card>

      <Card
        label="Coachees on track"
        testId="scorecard-on-track"
        note={
          contract.coachees_unmeasurable
            ? `${pluralise(contract.coachees_unmeasurable, 'coachee')} can’t be measured yet`
            : 'Counts coachees who have started and have hours to measure against.'
        }
      >
        <p className="text-2xl font-semibold tabular-nums text-ink">
          {contract.coachees_on_track.total ? (
            <>
              {contract.coachees_on_track.count}
              <span className="ml-1.5 text-xs font-normal text-ink-3">
                of {contract.coachees_on_track.total} started
              </span>
            </>
          ) : (
            <span className="text-base font-medium text-ink-3">
              Unavailable
            </span>
          )}
        </p>
        {model.people.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {model.people.map(p => (
              <span
                key={p.member_id}
                className={cn(
                  'h-2 w-2 rounded-full',
                  TONE_DOT[stateTone(p.pace.state)],
                )}
                title={`${p.name ?? p.email}: ${p.pace.sentence}`}
              />
            ))}
          </div>
        )}
      </Card>

      <Card
        label="Agreed outcomes"
        testId="scorecard-outcomes"
        note={
          <span className="inline-flex items-center gap-1">
            <Award className="h-3 w-3" aria-hidden />
            Gold sealed — agreement, not achievement
          </span>
        }
      >
        <p className="text-2xl font-semibold tabular-nums text-ink">
          {metrics.agreed_outcomes.count}
          <span className="ml-1.5 text-xs font-normal text-ink-3">
            of {metrics.agreed_outcomes.total} coachees
          </span>
        </p>
        <OutcomeStateBar totals={model.outcomeTotals} />
      </Card>

      <Card
        label="Sessions held"
        testId="scorecard-sessions"
        note={
          sessionsLast30 == null
            ? undefined
            : `${sessionsLast30} in the last 30 days`
        }
      >
        <p className="text-2xl font-semibold tabular-nums text-ink">
          {metrics.sessions_held}
          <span className="ml-1.5 text-xs font-normal text-ink-3">
            this term
          </span>
        </p>
        {weeks.length > 1 && (
          <div
            className="mt-2.5 flex h-6 items-end gap-px"
            aria-hidden
            title="Sessions each week"
          >
            {weeks.map(w => (
              <span
                key={w.starts_on}
                className={cn(
                  'min-w-0 flex-1 rounded-t-sm',
                  w.sessions_held ? 'bg-ink-4' : 'bg-surface-3',
                )}
                style={{
                  height: `${Math.max(10, ((w.sessions_held ?? 0) / busiest) * 100)}%`,
                }}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
