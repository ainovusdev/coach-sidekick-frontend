'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Boxes } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { PeoplePage } from '@/components/sandboxes/people/people-page'
import { useSandboxOverview } from '@/hooks/queries/use-sandboxes'

export default function SandboxPeopleRoute() {
  const params = useParams<{ sandboxId: string }>()
  const router = useRouter()
  const sandboxId = params?.sandboxId
  const { data, isLoading, isError } = useSandboxOverview(sandboxId)

  if (isLoading || (!data && !isError)) return <PeopleSkeleton />

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

  return <PeoplePage overview={data} />
}

function PeopleSkeleton() {
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
