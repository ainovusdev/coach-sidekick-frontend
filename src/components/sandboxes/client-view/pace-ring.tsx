import { cn } from '@/lib/utils'
import type { Tone } from '@/lib/tone'

const STROKE: Record<Tone, string> = {
  good: 'stroke-forest',
  warning: 'stroke-amber-token',
  danger: 'stroke-vermillion',
  muted: 'stroke-ink-4',
  default: 'stroke-ds-accent',
}

/**
 * Delivered against promised, with a bead on the dial for where the contract
 * expects us to be today.
 *
 * A bead rather than a tick: on the unfilled part of a small ring a short line
 * reads as a stray dash beside the number, while a dot on the ring's own
 * centreline reads as a marker on it.
 */
export function PaceRing({
  value,
  expected,
  size = 76,
  width = 8,
  tone = 'default',
  label,
  children,
  className,
}: {
  /** 0…1 of the ring that is filled. */
  value: number
  /** 0…1 where the expectation notch sits, or null for no notch. */
  expected?: number | null
  size?: number
  width?: number
  tone?: Tone
  label: string
  children?: React.ReactNode
  className?: string
}) {
  const r = (size - width) / 2
  const c = 2 * Math.PI * r
  const mid = size / 2
  const filled = Math.max(0, Math.min(1, value))
  const notch =
    expected == null
      ? null
      : Math.max(0, Math.min(1, expected)) * 2 * Math.PI - Math.PI / 2
  /** Past the bead, the dial itself already says where we should be. */
  const beadOnFill = expected != null && filled >= expected
  return (
    <span
      className={cn('relative inline-flex shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={label}
        data-testid="pace-ring"
      >
        <circle
          cx={mid}
          cy={mid}
          r={r}
          fill="none"
          strokeWidth={width}
          className="stroke-surface-3"
        />
        {filled > 0 && (
          <circle
            cx={mid}
            cy={mid}
            r={r}
            fill="none"
            strokeWidth={width}
            strokeLinecap="butt"
            strokeDasharray={`${(c * filled).toFixed(2)} ${c.toFixed(2)}`}
            transform={`rotate(-90 ${mid} ${mid})`}
            className={STROKE[tone]}
          />
        )}
        {notch != null && (
          <circle
            cx={(mid + r * Math.cos(notch)).toFixed(2)}
            cy={(mid + r * Math.sin(notch)).toFixed(2)}
            r={Math.max(2, width / 2 - 1.5)}
            className={beadOnFill ? 'fill-paper' : 'fill-ink-3'}
            data-testid="pace-ring-expected"
          >
            <title>Expected by now</title>
          </circle>
        )}
      </svg>
      {children && (
        <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          {children}
        </span>
      )}
    </span>
  )
}
