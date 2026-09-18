import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * A thin bar with an optional "where we should be" marker. The term bar on
 * the identity card and every delivered-vs-expected bar use it.
 */
export function ProgressRail({
  value,
  max,
  marker,
  markerLabel,
  captions,
  tone = 'ink',
  className,
}: {
  value: number
  max: number
  /** Position of the expectation marker, in the same unit as `value`. */
  marker?: number | null
  markerLabel?: string
  /** Up to three small captions under the bar (left · middle · right). */
  captions?: ReactNode[]
  tone?: 'ink' | 'good' | 'warning' | 'danger'
  className?: string
}) {
  const safeMax = max > 0 ? max : 1
  const pct = Math.max(0, Math.min(100, (value / safeMax) * 100))
  const markerPct =
    marker == null ? null : Math.max(0, Math.min(100, (marker / safeMax) * 100))
  const fill =
    tone === 'good'
      ? 'bg-forest'
      : tone === 'warning'
        ? 'bg-amber-token'
        : tone === 'danger'
          ? 'bg-vermillion'
          : 'bg-ink'
  return (
    <div className={className} data-testid="progress-rail">
      <div className="relative h-1.5 rounded-full bg-surface-3">
        <div
          className={cn('h-full rounded-full transition-[width]', fill)}
          style={{ width: `${pct.toFixed(1)}%` }}
        />
        {markerPct != null && (
          <span
            className="absolute -top-[3px] h-3 w-0.5 rounded bg-vermillion"
            style={{ left: `calc(${markerPct.toFixed(1)}% - 1px)` }}
            title={markerLabel}
            aria-label={markerLabel}
            data-testid="progress-marker"
          />
        )}
      </div>
      {captions && captions.length > 0 && (
        <div className="mt-1.5 flex justify-between gap-2 font-mono text-[11px] text-ink-3">
          {captions.map((c, i) => (
            <span key={i} className="truncate">
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
