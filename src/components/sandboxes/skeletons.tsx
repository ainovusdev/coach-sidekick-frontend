'use client'

import { Skeleton } from '@/components/ui/skeleton'

/** Mirrors the cockpit grid while the overview loads. */
export function CockpitSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]" aria-busy>
      <div className="space-y-4">
        <div className="space-y-3 rounded-xl border border-line bg-paper p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="space-y-3 rounded-xl border border-line bg-paper p-5">
          <Skeleton className="h-3 w-16" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  )
}

/** Mirrors the People page while the overview loads. */
export function PeopleSkeleton() {
  return (
    <div className="space-y-6" aria-busy>
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-9 w-full max-w-3xl" />
      <div className="space-y-px rounded-xl border border-line bg-paper p-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}
