import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type StatTone = 'default' | 'good' | 'warning' | 'danger' | 'muted'

export interface StatItem {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: StatTone
  testId?: string
}

const VALUE_TONE: Record<StatTone, string> = {
  default: 'text-ink',
  good: 'text-forest',
  warning: 'text-amber-token',
  danger: 'text-vermillion',
  muted: 'text-ink-3',
}

/**
 * A row of numbers with a label under each — the one stat primitive.
 * `sm` sits inside a card; `md` is a page-level strip.
 */
export function StatStrip({
  items,
  size = 'md',
  className,
}: {
  items: StatItem[]
  size?: 'sm' | 'md'
  className?: string
}) {
  if (items.length === 0) return null
  return (
    <dl
      className={cn(
        'grid divide-line',
        size === 'md'
          ? cn(
              'grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line',
              items.length >= 5 ? 'sm:grid-cols-5' : 'sm:grid-cols-4',
            )
          : 'grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap',
        className,
      )}
      data-testid="stat-strip"
    >
      {items.map((item, i) => (
        <div
          key={i}
          className={cn(size === 'md' ? 'bg-paper px-5 py-4' : 'min-w-[7rem]')}
          data-testid={item.testId}
        >
          <dd
            className={cn(
              'font-semibold tabular-nums leading-none',
              size === 'md' ? 'text-2xl' : 'text-lg',
              VALUE_TONE[item.tone ?? 'default'],
            )}
          >
            {item.value}
          </dd>
          <dt className="mt-1.5 text-xs text-ink-3">{item.label}</dt>
          {item.sub && <p className="mt-0.5 text-xs text-ink-4">{item.sub}</p>}
        </div>
      ))}
    </dl>
  )
}
