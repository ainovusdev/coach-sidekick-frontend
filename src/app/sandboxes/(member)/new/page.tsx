'use client'

import { useRouter } from 'next/navigation'
import { Boxes } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { NewSandboxForm } from '@/components/sandboxes/new-sandbox-form'
import { useAuth } from '@/contexts/auth-context'

/**
 * `/sandboxes/new` — a coach opens a sandbox and becomes its account
 * executive. The API refuses anyone who is not our staff; this page just
 * says so instead of showing a form that cannot submit.
 */
export default function NewSandboxMemberPage() {
  const router = useRouter()
  const { isAdmin, isCoach } = useAuth()

  if (!isAdmin() && !isCoach()) {
    return (
      <div className="max-w-xl" data-testid="new-sandbox-refused">
        <EmptyState
          icon={Boxes}
          title="Sandboxes are opened by our team"
          description="Your account executive sets up the sandbox and adds you to it."
          action={{
            label: 'Your sandboxes',
            onClick: () => router.push('/sandboxes'),
          }}
        />
      </div>
    )
  }

  return <NewSandboxForm audience={isAdmin() ? 'admin' : 'coach'} />
}
