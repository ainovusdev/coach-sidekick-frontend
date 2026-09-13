'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { SandboxChrome } from '@/components/sandboxes/chrome/sandbox-chrome'

export default function SandboxDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute loadingMessage="Loading your sandbox…">
      <SandboxChrome>{children}</SandboxChrome>
    </ProtectedRoute>
  )
}
