import { StatStrip } from '@/components/ui/stat-strip'
import { ProgressRail } from '@/components/sandboxes/progress-rail'
import { Section } from '@/components/sandboxes/section'
import {
  STATE_LABEL,
  stateTone,
  TONE_CLASS,
  fmtHoursShort,
} from '@/lib/sandbox/delivery'
import { fmtDay } from '@/lib/sandbox/format'
import { cn } from '@/lib/utils'
import type { SandboxAnalytics } from '@/types/sandbox-analytics'

/**
 * The four numbers, and where they sit against the contract.
 *
 * `compact` is Today's version: the strip and one sentence with the state
 * pill, and nothing else. The rail, the expected-by-today marker and the
 * definitions are reporting, and reporting is a tab away — on Today they were
 * three screens of it above the work.
 */
export function DeliverySummary({
  data,
  period = false,
  compact = false,
}: {
  data: SandboxAnalytics
  period?: boolean
  compact?: boolean
}) {
  const personal = data.presentation_mode === 'personal'
  const current = data.current_contract
  const tone = stateTone(current.state)
  const headcount = (v: { count: number; total: number }) =>
    `${v.count} / ${v.total}`

  const strip = (
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
                // Nobody measurable yet is a stage of the programme, not a
                // fault in the data. "Unavailable" read as an error next to
                // the plain 0s beside it, and the same metric said "0/0" on
                // the detail page — one phrase now, everywhere.
                value: current.coachees_on_track.total
                  ? headcount(current.coachees_on_track)
                  : 'Not started',
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
  )

  const againstContract = (
    <p className="text-sm text-ink-2">
      {fmtHoursShort(current.hours_received)} received
      {current.hours_promised == null
        ? ' · promised hours unavailable'
        : ` of ${fmtHoursShort(current.hours_promised)} promised`}
    </p>
  )

  const pill = (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium',
        TONE_CLASS[tone],
      )}
      data-state={current.state}
    >
      {STATE_LABEL[current.state]}
    </span>
  )

  if (compact) {
    return (
      <Section
        id="at-a-glance"
        title={personal ? 'Your coaching at a glance' : 'At a glance'}
        testId="delivery-summary"
        dataState={current.state}
        aside={pill}
        bodyClassName="space-y-4"
      >
        {strip}
        {againstContract}
      </Section>
    )
  }

  return (
    <Section
      id="summary"
      title={
        period ? 'Activity in the selected period' : 'Your coaching at a glance'
      }
      testId="delivery-summary"
      dataState={current.state}
      aside={pill}
      note="Hours are credited per participating coachee: a one-hour group meeting with four participants counts as four hours received, and one session held."
      bodyClassName="space-y-4"
    >
      {strip}
      <div className="space-y-3 rounded-lg border border-line p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
          Delivery against the contract
          <span className="ml-2 font-normal normal-case tracking-normal text-ink-4">
            as of {fmtDay(current.as_of, true)}
          </span>
        </h3>
        {againstContract}
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
            (current.coachees_unmeasurable === 1
              ? ' 1 coachee has an unmeasurable coaching relationship.'
              : ` ${current.coachees_unmeasurable} coachees have unmeasurable coaching relationships.`)}
        </p>
      </div>
    </Section>
  )
}
