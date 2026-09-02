'use client'

import type { ReactNode } from 'react'
import Navigation from '@/components/layout/navigation'
import { ClientNavigation } from '@/components/client-portal/client-navigation'
import { SandboxHeader } from '@/components/sandboxes/chrome/sandbox-header'
import { useAuth } from '@/contexts/auth-context'
import { useMySandboxes } from '@/hooks/queries/use-sandboxes'

export type SandboxAudienceChrome = 'ours' | 'coachee' | 'theirs'

/** Which header a signed-in person gets on the member routes. */
export function useSandboxChrome(): SandboxAudienceChrome {
  const { isCoach, isAdmin, hasAnyRole, canAccessClientView } = useAuth()
  if (isCoach() || isAdmin() || hasAnyRole(['viewer'])) return 'ours'
  if (canAccessClientView()) return 'coachee'
  return 'theirs'
}

/**
 * One route tree, three audiences. Our side keeps the coach header; a
 * coachee keeps the portal header; a primary client, their admin or a
 * supervisor — who may hold no app role at all — get the minimal header.
 */
export function SandboxChrome({ children }: { children: ReactNode }) {
  const chrome = useSandboxChrome()
  const mine = useMySandboxes(chrome === 'theirs')
  const count = mine.data?.total ?? 0

  return (
    <div
      className="min-h-screen bg-surface-2"
      data-testid="sandbox-view"
      data-audience={chrome}
    >
      {chrome === 'ours' ? (
        <Navigation />
      ) : chrome === 'coachee' ? (
        <ClientNavigation />
      ) : (
        <SandboxHeader showIndexLink={count > 1} />
      )}
      <main>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
