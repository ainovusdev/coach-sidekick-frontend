import { fmtDay, fmtWindow } from '@/lib/sandbox/format'
import {
  STATE_LABEL,
  TONE_CLASS,
  TONE_DOT,
  stateTone,
} from '@/lib/sandbox/delivery'
import { cn } from '@/lib/utils'
import type { ClientViewModel } from './client-view-model'
import type { SandboxAnalytics } from '@/types/sandbox-analytics'

/**
 * Who this is for, what it is for, and where the term has got to. The pace
 * pill says "Delivery pace" out loud: it is a rate, not the state of the
 * contract, and those two get confused whenever the label is left off.
 */
export function StatusHero({
  model,
  contract,
  scopeLine,
}: {
  model: ClientViewModel
  contract: SandboxAnalytics['current_contract'] | null
  scopeLine: string
}) {
  const { sandbox, life } = model
  const state = contract?.state ?? 'unknown'
  const tone = stateTone(state)
  return (
    <section
      id="vision"
      data-testid="client-hero"
      className="scroll-mt-28 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]"
    >
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-3">
          {sandbox.organisation} · {scopeLine}
        </p>
        <h1 className="mt-1.5 text-3xl font-semibold leading-tight text-ink">
          {sandbox.name}
        </h1>
        {sandbox.vision && (
          <blockquote
            className="mt-3 max-w-prose border-l-2 border-line pl-4 text-[15px] leading-relaxed text-ink-2"
            data-testid="client-vision"
          >
            {sandbox.vision}
          </blockquote>
        )}
      </div>

      <div className="rounded-xl border border-line bg-paper p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
          Delivery pace
        </p>
        <span
          className={cn(
            'mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium',
            TONE_CLASS[tone],
          )}
          data-testid="client-pace"
          data-state={state}
        >
          <span
            className={cn('h-1.5 w-1.5 rounded-full', TONE_DOT[tone])}
            aria-hidden
          />
          {STATE_LABEL[state]}
        </span>
        <p
          className="mt-4 text-sm font-medium text-ink"
          data-testid="client-week"
        >
          {life.label}
        </p>
        <p className="font-mono text-[11px] text-ink-3">
          {fmtWindow(sandbox.term_start, sandbox.term_end)}
        </p>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-ink transition-[width]"
            style={{ width: `${(life.fraction * 100).toFixed(1)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-ink-3">
          {life.kind === 'upcoming'
            ? 'Nothing to report yet'
            : contract
              ? `As of ${fmtDay(contract.as_of)}`
              : `Today ${fmtDay(model.today)}`}
        </p>
      </div>
    </section>
  )
}
