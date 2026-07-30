'use client'

import { cn } from '@/lib/utils'
import type { CheckinBucket } from '../utils/checkin-view'

const TONES: Record<CheckinBucket, string> = {
  overdue: 'text-vermillion',
  week: 'text-ink-2',
  later: 'text-ink-3',
  undated: 'text-ink-3',
  done: 'text-forest',
}

interface CheckinSectionProps {
  bucket: CheckinBucket
  title: string
  count: number
  children: React.ReactNode
}

export function CheckinSection({
  bucket,
  title,
  count,
  children,
}: CheckinSectionProps) {
  return (
    <section className="mb-6" aria-label={`${title} (${count})`}>
      <h2
        className={cn(
          'px-1 mb-2 text-[11px] font-bold uppercase tracking-[0.08em]',
          TONES[bucket],
        )}
      >
        {title} · {count}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
