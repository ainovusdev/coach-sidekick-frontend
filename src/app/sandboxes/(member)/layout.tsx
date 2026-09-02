'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { SandboxChrome } from '@/components/sandboxes/chrome/sandbox-chrome'

/**
 * The member view of a sandbox. Authentication is the only client-side gate:
 * the API answers 404 for anyone who is not on the sandbox, and the overview
 * says what the caller may do. The invite and welcome pages sit outside this
 * route group so they stay public.
 */
export default function SandboxMemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute loadingMessage="Loading your sandbox...">
      <SandboxChrome>{children}</SandboxChrome>
    </ProtectedRoute>
  )
}
