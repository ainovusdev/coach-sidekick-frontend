'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Boxes } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { PeoplePage } from '@/components/sandboxes/people/people-page'
import { PeopleSkeleton } from '@/components/sandboxes/skeletons'
import {
  SandboxViewProvider,
  viewFromOverview,
} from '@/components/sandboxes/sandbox-view-context'
import { useAuth } from '@/contexts/auth-context'
import { useSandboxOverview } from '@/hooks/queries/use-sandboxes'

export default function MemberSandboxPeoplePage() {
  const params = useParams<{ sandboxId: string }>()
  const router = useRouter()
  const { isAdmin, isCoach } = useAuth()
  const sandboxId = params?.sandboxId
  const { data, isLoading, isError } = useSandboxOverview(sandboxId)

  if (isLoading || (!data && !isError)) return <PeopleSkeleton />

  if (isError || !data) {
    return (
      <div className="max-w-xl">
        <Link href="/sandboxes" className="text-sm text-ink-3 hover:text-ink">
          ← Sandboxes
        </Link>
        <EmptyState
          icon={Boxes}
          title="Sandbox not found"
          description="You may not be on this sandbox, or the link is wrong."
          action={{
            label: 'Your sandboxes',
            onClick: () => router.push('/sandboxes'),
          }}
        />
      </div>
    )
  }

  const view = viewFromOverview(data, {
    isAdmin: isAdmin(),
    isOurs: isAdmin() || isCoach(),
  })
  return (
    <SandboxViewProvider value={view}>
      <PeoplePage overview={data} />
    </SandboxViewProvider>
  )
}
