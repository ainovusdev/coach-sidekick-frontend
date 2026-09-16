'use client'

import { DetailChart } from '@/components/sandboxes/details/detail-chart'
import { fmtDay } from '@/lib/sandbox/format'
import { cn } from '@/lib/utils'
import { PERIOD_LABEL } from './client-view-copy'
import { Empty } from '@/components/sandboxes/section'
import type {
  InsightSelection,
  ReportingPeriod,
} from '@/types/sandbox-analytics'
import type { SandboxReporting } from '@/hooks/queries/use-sandbox-insights'

const PERIODS: ReportingPeriod[] = ['term', '90d', '30d']

/**
 * Hours received against the contracted pace.
 *
 * The chart itself is the one the detail pages use: it already carries the
 * cumulative/weekly selector, the aria description and the data table, so
 * there is one accessible chart in the product rather than two.
 */
export function ProgressSection({
  reporting,
  selection,
  onSelection,
}: {
  reporting: SandboxReporting
  selection: InsightSelection
  onSelection: (next: InsightSelection) => void
}) {
  const analytics = reporting.analytics
  const groups = analytics?.available_groups ?? []

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      {groups.length > 1 && (
        <select
          className="rounded-lg border border-line bg-paper px-2.5 py-1 text-xs text-ink focus-visible:outline-2 focus-visible:outline-ds-accent"
          aria-label="Group"
          value={selection.group_id ?? ''}
          onChange={e =>
            onSelection({ ...selection, group_id: e.target.value || null })
          }
          data-testid="progress-group"
        >
          <option value="">All groups</option>
          {groups.map(g => (
            <option key={g.group_id} value={g.group_id}>
              {g.display_name}
            </option>
          ))}
        </select>
      )}
      <div
        className="flex rounded-lg border border-line p-0.5"
        role="group"
        aria-label="Reporting period"
      >
        {PERIODS.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => onSelection({ ...selection, period: p })}
            aria-pressed={selection.period === p}
            data-testid={`progress-period-${p}`}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs transition-colors',
              selection.period === p
                ? 'bg-ink text-paper'
                : 'text-ink-3 hover:text-ink',
            )}
          >
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <section
      id="insights"
      data-testid="client-section-insights"
      className="scroll-mt-(--section-offset) space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-base font-semibold text-ink">Progress</h2>
        {controls}
      </div>
      {reporting.error ? (
        <div className="rounded-xl border border-line bg-paper px-5 py-4">
          <p role="alert" className="text-sm text-ink-2">
            Progress could not be loaded.{' '}
            <button className="underline" onClick={reporting.retry}>
              Try again
            </button>
          </p>
        </div>
      ) : !analytics ? (
        <div className="rounded-xl border border-line bg-paper px-5 py-4">
          <Empty>Loading delivery…</Empty>
        </div>
      ) : (
        <>
          <DetailChart data={analytics} />
          <p className="max-w-prose text-xs leading-relaxed text-ink-3">
            Hours are credited per participating coachee: a one-hour group
            meeting with four participants counts as four hours received.
            {analytics.dates.available &&
              analytics.dates.starts_on &&
              analytics.dates.ends_on &&
              ` Showing ${fmtDay(analytics.dates.starts_on)} – ${fmtDay(analytics.dates.ends_on)}.`}
          </p>
        </>
      )}
    </section>
  )
}
