'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Boxes } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { SandboxCockpit } from '@/components/sandboxes/sandbox-cockpit'
import { useSandboxOverview } from '@/hooks/queries/use-sandboxes'

export default function SandboxOverviewPage() {
  const params = useParams<{ sandboxId: string }>()
  const router = useRouter()
  const sandboxId = params?.sandboxId
  const { data, isLoading, isError } = useSandboxOverview(sandboxId)

  if (isLoading || (!data && !isError)) return <CockpitSkeleton />

  if (isError || !data) {
    return (
      <div className="max-w-xl">
        <Link
          href="/admin/sandboxes"
          className="text-sm text-ink-3 hover:text-ink"
        >
          ← Sandboxes
        </Link>
        <EmptyState
          icon={Boxes}
          title="Sandbox not found"
          description="It may have been removed, or the link is wrong."
          action={{
            label: 'Back to sandboxes',
            onClick: () => router.push('/admin/sandboxes'),
          }}
        />
      </div>
    )
  }

  return <SandboxCockpit overview={data} />
}

function CockpitSkeleton() {
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
