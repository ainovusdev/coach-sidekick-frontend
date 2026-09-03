'use client'

import { SandboxDashboardPage } from '@/components/sandboxes/dashboard/sandbox-dashboard'
import { useAuth } from '@/contexts/auth-context'

/** `/sandboxes` — the dashboard for whoever is signed in (persona from the API). */
export default function MySandboxesPage() {
  const { isAdmin } = useAuth()
  return (
    <div data-testid="my-sandboxes">
      <SandboxDashboardPage isAdmin={isAdmin()} />
    </div>
  )
}
