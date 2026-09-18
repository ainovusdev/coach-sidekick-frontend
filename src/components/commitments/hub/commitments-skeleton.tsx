'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function CommitmentsSkeleton() {
  return (
    <div>
      {/* Stats strip */}
      <div className="flex items-center gap-8 mb-6 px-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-20" />
        ))}
      </div>

      {/* Tabs + controls */}
      <div className="flex items-center gap-3 mb-6 pb-2 border-b border-line">
        <Skeleton className="h-5 w-64" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-44 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* Rows */}
      <Card className="border-line overflow-hidden py-0 gap-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-4 border-b border-line last:border-b-0"
          >
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
        ))}
      </Card>
    </div>
  )
}
