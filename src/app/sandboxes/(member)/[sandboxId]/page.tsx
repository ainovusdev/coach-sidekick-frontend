'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Boxes } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { SandboxCockpit } from '@/components/sandboxes/sandbox-cockpit'
import { ClientView } from '@/components/sandboxes/client-view/client-view'
import { CockpitSkeleton } from '@/components/sandboxes/skeletons'
import {
  canPreviewClientView,
  isClientAudience,
  previewClientView,
  SandboxViewProvider,
  viewFromOverview,
} from '@/components/sandboxes/sandbox-view-context'
import { useAuth } from '@/contexts/auth-context'
import { useSandboxOverview } from '@/hooks/queries/use-sandboxes'

/**
 * `?view=client&from=admin|member` — our side asking to see the client layout.
 * Read straight from the URL rather than through `useSearchParams`, which
 * would cost the page its static shell; it is only read after the overview has
 * loaded, which is always after hydration.
 */
function previewRequest(): { asked: boolean; from: 'admin' | 'member' } {
  if (typeof window === 'undefined') return { asked: false, from: 'member' }
  const params = new URLSearchParams(window.location.search)
  return {
    asked: params.get('view') === 'client',
    from: params.get('from') === 'admin' ? 'admin' : 'member',
  }
}

export default function MemberSandboxPage() {
  const params = useParams<{ sandboxId: string }>()
  const router = useRouter()
  const { isAdmin, isCoach } = useAuth()
  const sandboxId = params?.sandboxId
  const { data, isLoading, isError } = useSandboxOverview(sandboxId)

  if (isLoading || (!data && !isError)) return <CockpitSkeleton />

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

  const admin = isAdmin()
  // The client layout, shown to our side under our own access. `from` is
  // allowlisted: it only decides where "Back to your view" goes.
  const { asked, from } = previewRequest()
  if (asked && canPreviewClientView(data, admin)) {
    return (
      <SandboxViewProvider value={previewClientView(from)}>
        <ClientView overview={data} preview={{ from }} />
      </SandboxViewProvider>
    )
  }

  // Which page someone gets is decided by the hats they hold *on this
  // sandbox*, never by the app role they happen to have elsewhere.
  const client = isClientAudience(data, admin)
  const view = viewFromOverview(data, {
    isAdmin: admin,
    isOurs: !client && (admin || isCoach()),
  })
  return (
    <SandboxViewProvider value={view}>
      {client ? (
        <ClientView overview={data} />
      ) : (
        <SandboxCockpit overview={data} />
      )}
    </SandboxViewProvider>
  )
}
