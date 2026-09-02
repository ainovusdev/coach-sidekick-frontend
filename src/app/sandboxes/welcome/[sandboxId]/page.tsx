'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuth } from '@/contexts/auth-context'
import { useSandboxWelcome } from '@/hooks/queries/use-sandboxes'
import { fmtDay } from '@/lib/sandbox/format'

export default function SandboxWelcomePage() {
  const params = useParams<{ sandboxId: string }>()
  const router = useRouter()
  const { isAuthenticated, loading, signOut, user } = useAuth()
  const sandboxId = params?.sandboxId ?? null
  const welcome = useSandboxWelcome(
    !loading && isAuthenticated ? sandboxId : null,
  )

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/auth')
  }, [loading, isAuthenticated, router])

  const data = welcome.data

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <Card
        className="w-full max-w-lg border-line"
        data-testid="sandbox-welcome"
      >
        {welcome.isLoading || loading || !data ? (
          welcome.isError ? (
            <CardHeader className="text-center">
              <CardTitle>Nothing here for you yet</CardTitle>
              <CardDescription>
                This sandbox isn’t linked to your account.
              </CardDescription>
            </CardHeader>
          ) : (
            <div className="flex items-center justify-center py-10">
              <LoadingSpinner />
            </div>
          )
        ) : (
          <>
            <CardHeader>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                You’re in
              </p>
              <CardTitle className="text-2xl leading-snug">
                {data.sandbox_name}
              </CardTitle>
              <CardDescription>
                {data.organisation} · {fmtDay(data.term_start, true)} to{' '}
                {fmtDay(data.term_end, true)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                <dt className="text-ink-3">Your role</dt>
                <dd className="text-ink">
                  {data.role_labels.join(', ') || 'Member'}
                </dd>
                <dt className="text-ink-3">Signed in as</dt>
                <dd className="text-ink">{user?.email}</dd>
              </dl>
              <p className="rounded-lg border border-line bg-surface-2 px-4 py-3 text-ink-2">
                Nothing to do here yet.
                {data.account_executive ? (
                  <>
                    {' '}
                    {data.account_executive.name ??
                      'Your account executive'}{' '}
                    will be in touch
                    {data.account_executive.email && (
                      <>
                        {' '}
                        ·{' '}
                        <a
                          className="text-ds-accent hover:underline"
                          href={`mailto:${data.account_executive.email}`}
                        >
                          {data.account_executive.email}
                        </a>
                      </>
                    )}
                    .
                  </>
                ) : (
                  ' Your account executive will be in touch.'
                )}
              </p>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-ink-3"
                  onClick={() => signOut()}
                >
                  Sign out
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
