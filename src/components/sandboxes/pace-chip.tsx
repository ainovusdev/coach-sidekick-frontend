import {
  paceLabel,
  STATE_LABEL,
  stateTone,
  TONE_CLASS,
  TONE_DOT,
} from '@/lib/sandbox/delivery'
import { cn } from '@/lib/utils'
import type { DeliveryState, Pace } from '@/types/sandbox-delivery'

/** `6 of 18 · behind by 2` — the only place pace is rendered as a chip. */
export function PaceChip({
  pace,
  state,
  startsOn,
  size = 'sm',
  className,
}: {
  pace?: Pace
  state?: DeliveryState
  startsOn?: string | null
  size?: 'sm' | 'md'
  className?: string
}) {
  const resolvedState = pace?.state ?? state ?? 'unknown'
  const tone = stateTone(resolvedState)
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full font-medium',
        size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs',
        TONE_CLASS[tone],
        className,
      )}
      title={pace?.sentence ?? STATE_LABEL[resolvedState]}
      data-testid="pace-chip"
      data-state={resolvedState}
    >
      <span
        className={cn('h-1.5 w-1.5 shrink-0 rounded-full', TONE_DOT[tone])}
        aria-hidden
      />
      <span className="truncate">
        {pace ? paceLabel(pace, startsOn) : STATE_LABEL[resolvedState]}
      </span>
    </span>
  )
}
