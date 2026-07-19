// design-sync shim for @/contexts/permission-context.
//
// The real module chains to auth-context → next/navigation + axios + posthog,
// none of which can exist in the claude.ai/design runtime (and pulling them in
// crashes every preview with `process is not defined`). Designs have no auth,
// so permission-gated UI renders as fully permitted. Only the surface consumed
// by bundled components (ClientCard) is provided.
import React from 'react'

const GRANT_ALL = {
  hasPermission: (_resource: string, _action: string) => true,
  canViewTranscript: (_clientId?: string) => true,
  canGenerateInsights: (_clientId?: string) => true,
  isViewer: () => false,
  permissions: {} as Record<string, Record<string, boolean>>,
}

export function usePermissions() {
  return GRANT_ALL
}

export function PermissionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

export function PermissionGate({
  children,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
  resource?: string
  action?: string
  require?: unknown
}) {
  return <>{children}</>
}
