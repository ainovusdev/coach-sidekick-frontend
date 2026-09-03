import {
  paceLabel,
  stateTone,
  TONE_CLASS,
  TONE_DOT,
} from '@/lib/sandbox/delivery'
import { cn } from '@/lib/utils'
import type { Pace } from '@/types/sandbox-delivery'

/** `6 of 18 · behind by 2` — the only place pace is rendered as a chip. */
export function PaceChip({
  pace,
  startsOn,
  size = 'sm',
  className,
}: {
  pace: Pace
  startsOn?: string | null
  size?: 'sm' | 'md'
  className?: string
}) {
  const tone = stateTone(pace.state)
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full font-medium',
        size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs',
        TONE_CLASS[tone],
        className,
      )}
      title={pace.sentence}
      data-testid="pace-chip"
      data-state={pace.state}
    >
      <span
        className={cn('h-1.5 w-1.5 shrink-0 rounded-full', TONE_DOT[tone])}
        aria-hidden
      />
      <span className="truncate">{paceLabel(pace, startsOn)}</span>
    </span>
  )
}
