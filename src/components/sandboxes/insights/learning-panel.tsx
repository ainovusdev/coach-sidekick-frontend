'use client'

import { useState } from 'react'
import { ProgressRail } from '@/components/sandboxes/progress-rail'
import { Button } from '@/components/ui/button'
import type { SandboxReporting } from '@/hooks/queries/use-sandbox-insights'
import { fmtDay } from '@/lib/sandbox/format'

export function LearningPanel({
  reporting,
  preview = false,
  allowGenerate = true,
  onNavigate,
}: {
  reporting: SandboxReporting
  preview?: boolean
  /**
   * Off where the reader cannot be the one to run it: the client view reads
   * the summary, and the client layout shown to our side reads it too rather
   * than offering a button that would write from behind a preview.
   */
  allowGenerate?: boolean
  onNavigate: (anchor: string) => void
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const data = reporting.insights
  const personal = data?.presentation_mode === 'personal'
  const named = data?.presentation_mode === 'named'
  const individual = personal || named
  const active =
    reporting.generating ||
    data?.status === 'queued' ||
    data?.status === 'generating'
  const result = data?.status === 'invalidated' ? null : data?.result
  const findings = preview
    ? result?.findings
        .filter(
          (finding, index, all) =>
            all.findIndex(item => item.theme === finding.theme) === index,
        )
        .slice(0, 3)
    : result?.findings
  const labels = {
    working_on: personal
      ? 'What you have been working on'
      : named
        ? 'What this person is working on'
        : 'What people are working on',
    reported_practice: personal
      ? 'Changes you have described'
      : named
        ? 'Changes this person has described'
        : 'What is changing',
    barrier: 'What is getting in the way',
  }
  return (
    <section
      className="space-y-4 rounded-xl border border-line bg-paper p-5"
      data-testid={preview ? 'learning-preview' : 'learning-panel'}
      aria-label="Learning insights"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">
          {personal
            ? 'Your learning'
            : named
              ? 'Learning from coaching'
              : 'What we’re learning'}
        </h2>
        {preview && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('insights')}
          >
            View insights
          </Button>
        )}
      </div>
      {reporting.error ? (
        <p role="alert" className="text-sm text-ink-2">
          Learning could not be loaded.{' '}
          <button className="underline" onClick={reporting.retry}>
            Try again
          </button>
        </p>
      ) : !data ? (
        <p role="status" className="text-sm text-ink-3">
          Loading learning insights…
        </p>
      ) : (
        <>
          <div
            aria-live="polite"
            className="text-sm text-ink-2"
            data-testid="insight-state"
            data-state={data.status}
          >
            {data.status === 'never_generated' && (
              <p>
                {personal
                  ? 'Generate a summary of what you have worked on, changes you have described, and ideas for your next session.'
                  : named
                    ? 'Generate a grounded summary of this person’s work themes and reported changes from the sessions you may read.'
                    : 'Generate shared work themes, reported changes, and ideas for the next discussion. Each finding needs evidence from at least three coachees.'}
              </p>
            )}
            {data.status === 'insufficient_evidence' && (
              <p>
                {personal
                  ? 'There is not enough attributable learning evidence for your summary yet.'
                  : named
                    ? 'There is not enough attributable learning evidence for this summary yet.'
                    : 'There is not enough shared evidence yet. A theme needs support from at least three distinct coachees.'}{' '}
                Delivery remains available.
              </p>
            )}
            {data.status === 'invalidated' && (
              <p>
                The previous insights no longer match your access or the
                available evidence. Generate a new summary.
              </p>
            )}
            {(data.status === 'stale' || data.stale) && (
              <p>
                The reporting period or evidence has changed. These insights
                cover the previous evidence; update for this selection.
              </p>
            )}
            {data.status === 'failed' && (
              <p>
                Insights could not be generated. Try again. Any valid previous
                result is shown below.
              </p>
            )}
            {active && (
              <p role="status">
                {data.status === 'queued'
                  ? 'Insights are queued.'
                  : 'Generating insights…'}{' '}
                {data.run &&
                  data.run.progress_total > 0 &&
                  `${data.run.progress_done} of ${data.run.progress_total} sources processed.`}{' '}
                You can leave this tab and return later.
              </p>
            )}
          </div>
          {result && (
            <>
              <p className="text-xs text-ink-3">
                {result.starts_on && result.ends_on
                  ? `${fmtDay(result.starts_on, true)} – ${fmtDay(result.ends_on, true)}`
                  : 'Reporting dates unavailable'}
                {data.generated_at &&
                  ` · Generated ${new Date(data.generated_at).toLocaleString()}`}
              </p>
              {(preview
                ? ['preview']
                : ['working_on', 'reported_practice', 'barrier']
              ).map(kind => {
                const cards =
                  findings?.filter(
                    f => kind === 'preview' || f.kind === kind,
                  ) ?? []
                if (!cards.length) {
                  if (preview || result.status === 'insufficient_evidence')
                    return null
                  const subject =
                    kind === 'reported_practice'
                      ? 'reported changes'
                      : kind === 'barrier'
                        ? 'recurring barriers'
                        : 'current work themes'
                  return (
                    <div key={kind} className="space-y-1">
                      <h3 className="text-sm font-semibold text-ink">
                        {labels[kind as keyof typeof labels]}
                      </h3>
                      <p className="max-w-prose text-sm text-ink-3">
                        The available evidence does not yet support{' '}
                        {individual ? 'a finding' : 'a shared finding'} about{' '}
                        {subject}.
                      </p>
                    </div>
                  )
                }
                return (
                  <div key={kind} className="space-y-3">
                    {!preview && (
                      <h3 className="text-sm font-semibold text-ink">
                        {labels[kind as keyof typeof labels]}
                      </h3>
                    )}
                    {(expanded[kind] ? cards : cards.slice(0, 3)).map(
                      finding => (
                        <article
                          key={finding.id}
                          className="border-l-2 border-line pl-3"
                          data-testid="learning-finding"
                        >
                          <h4 className="text-sm font-medium text-ink">
                            {finding.title}
                          </h4>
                          <p className="mt-1 max-w-prose text-sm text-ink-2">
                            {finding.description}
                          </p>
                          <p className="mt-1 text-xs text-ink-3">
                            {finding.sessions} supporting{' '}
                            {finding.sessions === 1 ? 'session' : 'sessions'}
                            {!personal &&
                              ` · ${finding.coachees} coachees`} ·{' '}
                            {fmtDay(finding.starts_on)} –{' '}
                            {fmtDay(finding.ends_on)}
                          </p>
                          {!preview && (
                            <>
                              <div
                                role="meter"
                                aria-label={`${finding.title}: supporting sessions`}
                                aria-valuemin={0}
                                aria-valuemax={Math.max(
                                  result.coverage.sessions,
                                  finding.sessions,
                                  1,
                                )}
                                aria-valuenow={finding.sessions}
                                aria-valuetext={`${finding.sessions} supporting ${finding.sessions === 1 ? 'session' : 'sessions'}`}
                                className="mt-2 w-full max-w-xs"
                              >
                                <ProgressRail
                                  value={finding.sessions}
                                  max={Math.max(
                                    result.coverage.sessions,
                                    finding.sessions,
                                    1,
                                  )}
                                />
                              </div>
                              {finding.trend && (
                                <p className="mt-2 max-w-prose text-sm text-ink-2">
                                  {finding.trend.description}
                                </p>
                              )}
                            </>
                          )}
                        </article>
                      ),
                    )}
                    {!preview && cards.length > 3 && (
                      <button
                        className="text-sm text-ds-accent underline underline-offset-4"
                        aria-expanded={!!expanded[kind]}
                        onClick={() =>
                          setExpanded(current => ({
                            ...current,
                            [kind]: !current[kind],
                          }))
                        }
                      >
                        {expanded[kind]
                          ? 'Show fewer findings'
                          : `Show all ${cards.length} findings`}
                      </button>
                    )}
                  </div>
                )
              })}
              {!preview && (
                <>
                  <p className="text-xs text-ink-3">
                    Theme counts overlap; one session can support several
                    themes.
                  </p>
                  {result.suggestions.length > 0 && (
                    <div className="space-y-3 border-t border-line pt-4">
                      <h3 className="text-sm font-semibold text-ink">
                        {personal
                          ? 'Ideas for your next session'
                          : 'What to discuss next'}
                      </h3>
                      {result.suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="max-w-prose text-sm text-ink-2"
                        >
                          <p>{suggestion.description}</p>
                          {suggestion.outcome_note && (
                            <p className="mt-1 text-xs text-ink-3">
                              {suggestion.outcome_note}
                            </p>
                          )}
                          <button
                            className="mt-1 text-ds-accent underline underline-offset-4"
                            onClick={() => onNavigate(suggestion.destination)}
                          >
                            View {suggestion.destination}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              <p className="max-w-prose text-xs text-ink-3">
                Based on {result.coverage.sessions} eligible sessions
                {!personal &&
                  ` from ${result.coverage.coachees} coachees`}.{' '}
                {result.limitation}
              </p>
            </>
          )}
          {reporting.generationError && (
            <p role="alert" className="text-sm text-vermillion">
              The generation request failed. Please try again.
            </p>
          )}
          {allowGenerate &&
            data.can_generate &&
            (data.status !== 'ready' || data.stale) && (
              <Button
                size="sm"
                disabled={active}
                onClick={reporting.generate}
                data-testid="generate-insights"
              >
                {active
                  ? 'Generating…'
                  : data.status === 'failed'
                    ? 'Retry insights'
                    : result || data.stale
                      ? 'Update insights'
                      : 'Generate insights'}
              </Button>
            )}
        </>
      )}
    </section>
  )
}
