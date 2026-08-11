import { Skeleton } from 'coach-sidekick'

export const ClientCardSkeleton = () => (
  <div className="w-72 rounded-lg border border-line bg-card p-4">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-44" />
      </div>
    </div>
  </div>
)

export const TableRowsSkeleton = () => (
  <div className="w-full max-w-lg divide-y divide-line rounded-lg border border-line bg-card">
    {[0, 1, 2].map(row => (
      <div key={row} className="flex items-center gap-4 px-4 py-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="ml-auto h-5 w-16 rounded-md" />
      </div>
    ))}
  </div>
)

export const SessionSummarySkeleton = () => (
  <div className="w-full max-w-md space-y-3">
    <Skeleton className="h-6 w-56" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
  </div>
)
