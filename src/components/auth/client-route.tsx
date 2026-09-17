'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useMySandboxes } from '@/hooks/queries/use-sandboxes'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ClientRouteProps {
  children: React.ReactNode
}

export function ClientRoute({ children }: ClientRouteProps) {
  const { isAuthenticated, loading, canAccessClientView, signOut } = useAuth()
  const router = useRouter()

  const handleGoBackToSignIn = async () => {
    await signOut()
  }

  // Require a usable client profile — role alone isn't enough: users hit by
  // the onboarding gap have the client role but no client profile row, and
  // rendering the portal for them just turns every backend call into a 403/404
  // (or is impersonating as super_admin)
  // `sessionStorage` does not exist on the server, so reading it while
  // rendering makes the server and the first client render disagree — and this
  // value feeds `noProfile`, which feeds a query's `enabled`, so the mismatch
  // reaches React Query as well as the markup. Read it once after mount and
  // hold the spinner until then, rather than guessing "not impersonating" and
  // flashing the no-access wall at a super admin viewing a client portal.
  const [impersonationChecked, setImpersonationChecked] = useState(false)
  const [isImpersonating, setIsImpersonating] = useState(false)
  useEffect(() => {
    setIsImpersonating(!!sessionStorage.getItem('view_as_client_id'))
    setImpersonationChecked(true)
  }, [])

  const noProfile =
    impersonationChecked &&
    !loading &&
    isAuthenticated &&
    !canAccessClientView() &&
    !isImpersonating

  // Someone with the client role but no coaching profile may still be on a
  // sandbox (a primary client or supervisor whose account was made that way).
  // The sandbox is their whole product, so send them there instead of a wall.
  const { data: mine, isLoading: mineLoading } = useMySandboxes(noProfile)
  const onSandboxes = (mine?.sandboxes?.length ?? 0) > 0

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Only redirect to auth if not authenticated
      router.push('/auth')
    }
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (noProfile && onSandboxes) router.replace('/sandboxes')
  }, [noProfile, onSandboxes, router])

  // Don't redirect other non-clients here - just don't show content
  // This prevents loops with the auth page

  if (
    loading ||
    !impersonationChecked ||
    (noProfile && (mineLoading || onSandboxes))
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-ink-4" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (noProfile) {
    // Not a client - show friendly message instead of redirecting
    return (
      <div className="flex items-center justify-center min-h-screen bg-paper">
        <div className="text-center space-y-4">
          <p className="text-ink-3">
            You don&apos;t have access to the portal.
          </p>
          <p className="text-sm text-ink-3">
            Please contact your administrator.
          </p>
          <Button variant="outline" onClick={handleGoBackToSignIn}>
            Go back to sign in
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
