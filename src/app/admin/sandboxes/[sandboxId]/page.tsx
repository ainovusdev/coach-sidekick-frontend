'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Boxes } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { CockpitSkeleton } from '@/components/sandboxes/skeletons'
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
