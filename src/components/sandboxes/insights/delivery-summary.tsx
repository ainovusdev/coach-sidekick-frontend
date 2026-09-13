import { StatStrip } from '@/components/ui/stat-strip'
import { ProgressRail } from '@/components/sandboxes/progress-rail'
import {
  STATE_LABEL,
  stateTone,
  TONE_CLASS,
  fmtHoursShort,
} from '@/lib/sandbox/delivery'
import { fmtDay } from '@/lib/sandbox/format'
import type { SandboxAnalytics } from '@/types/sandbox-analytics'

export function DeliverySummary({
  data,
  period = false,
}: {
  data: SandboxAnalytics
  period?: boolean
}) {
  const personal = data.presentation_mode === 'personal'
  const current = data.current_contract
  const headcount = (v: { count: number; total: number }) =>
    `${v.count} / ${v.total}`
  return (
    <section
      className="space-y-4"
      aria-label="Delivery summary"
      data-testid="delivery-summary"
    >
      <h2 className="text-lg font-semibold text-ink">
        {period
          ? 'Activity in the selected period'
          : 'Your coaching at a glance'}
      </h2>
      <StatStrip
        items={[
          {
            label: personal ? 'Your sessions held' : 'Sessions held',
            value: data.metrics.sessions_held,
            testId: 'analytics-sessions',
          },
          {
            label: personal ? 'Your hours received' : 'Hours received',
            value: fmtHoursShort(data.metrics.hours_received),
          },
          period
            ? {
                label: 'Recorded participation',
                value: personal
                  ? data.metrics.participation.count
                    ? 'Recorded'
                    : 'None recorded'
                  : headcount(data.metrics.participation),
                sub: 'Not verified attendance',
              }
            : personal
              ? {
                  label: 'Your current pace',
                  value: (
                    <span className="text-base">
                      {STATE_LABEL[current.state]}
                    </span>
                  ),
                }
              : {
                  label: 'Coachees on track',
                  value: current.coachees_on_track.total
                    ? headcount(current.coachees_on_track)
                    : 'Unavailable',
                  sub: 'Started, measurable coaching',
                },
          {
            label: personal ? 'Your agreed outcomes' : 'Agreed outcomes',
            value: personal
              ? data.metrics.agreed_outcomes.count
                ? 'Sealed'
                : 'Not sealed'
              : headcount(data.metrics.agreed_outcomes),
            sub: personal
              ? 'Agreement, not achievement'
              : 'Coachees with a sealed outcome',
          },
        ]}
      />
      <p className="text-xs text-ink-3">
        Hours are credited per participating coachee: a one-hour group meeting
        with four participants counts as four hours received, and one session
        held.
      </p>
      <div className="space-y-3 rounded-xl border border-line bg-paper p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium text-ink">
            Delivery against the contract
          </h3>
          <span
            className={`rounded-full px-2 py-1 text-xs ${TONE_CLASS[stateTone(current.state)]}`}
          >
            {STATE_LABEL[current.state]}
          </span>
        </div>
        <p className="text-xs text-ink-3">
          Current contract status as of {fmtDay(current.as_of, true)}
        </p>
        <p className="text-sm text-ink-2">
          {fmtHoursShort(current.hours_received)} received
          {current.hours_promised == null
            ? ' · Promised hours unavailable'
            : ` of ${fmtHoursShort(current.hours_promised)} promised`}
        </p>
        {current.hours_promised != null && current.hours_promised > 0 && (
          <ProgressRail
            value={current.hours_received}
            max={current.hours_promised}
            marker={
              current.expectation_available ? current.expected_hours : null
            }
            markerLabel={`Expected by today: ${fmtHoursShort(current.expected_hours)}`}
            captions={[
              '0 h',
              `Promised ${fmtHoursShort(current.hours_promised)}`,
            ]}
          />
        )}
        <p className="text-xs text-ink-3">
          {current.expectation_available
            ? `Expected by today: ${fmtHoursShort(current.expected_hours)} (the vertical marker).`
            : 'Expected delivery is unavailable until contract hours and dates are set.'}
          {current.coachees_unmeasurable > 0 &&
            ` ${current.coachees_unmeasurable} coachees have unmeasurable coaching relationships.`}
        </p>
      </div>
    </section>
  )
}
