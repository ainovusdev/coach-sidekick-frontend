'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import posthog from 'posthog-js'
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator'
import { useAuth } from '@/contexts/auth-context'
import authService from '@/services/auth-service'
import { SandboxService } from '@/services/sandbox-service'
import { validatePassword } from '@/lib/password-validation'
import type {
  InvitationAcceptResponse,
  InvitationValidation,
} from '@/types/sandbox'

const REASON_COPY: Record<
  NonNullable<InvitationValidation['reason']>,
  { title: string; body: string; icon: typeof XCircle }
> = {
  invalid: {
    title: 'This link isn’t valid',
    body: 'It may have been copied incompletely, or it was replaced by a newer invitation.',
    icon: XCircle,
  },
  expired: {
    title: 'This invitation has expired',
    body: 'Links last 7 days. Ask for a fresh one and it will arrive in the same inbox.',
    icon: Clock,
  },
  revoked: {
    title: 'This invitation was withdrawn',
    body: 'A newer link may have been sent, or the invitation was cancelled.',
    icon: AlertCircle,
  },
  accepted: {
    title: 'Already accepted',
    body: 'This invitation has been used. Log in to continue.',
    icon: CheckCircle2,
  },
}

export default function SandboxInvitePage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const token = params?.token ?? ''
  const { isAuthenticated, user, loading: authLoading, signOut } = useAuth()

  const [invitation, setInvitation] = useState<InvitationValidation | null>(
    null,
  )
  const [checking, setChecking] = useState(true)
  const [checkError, setCheckError] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    SandboxService.validateInvitation(token)
      .then(data => {
        if (cancelled) return
        setInvitation(data)
        setFullName(data.name ?? '')
      })
      .catch(e => !cancelled && setCheckError(e.message))
      .finally(() => !cancelled && setChecking(false))
    return () => {
      cancelled = true
    }
  }, [token])

  const strength = useMemo(() => validatePassword(password), [password])
  const sameUser =
    isAuthenticated &&
    !!user &&
    !!invitation?.email &&
    user.email.toLowerCase() === invitation.email.toLowerCase()
  const otherUser =
    isAuthenticated && !!user && !!invitation?.email && !sameUser

  const land = (result: InvitationAcceptResponse) => {
    posthog.capture('sandbox_invitation_accepted', {
      sandbox_id: result.sandbox_id,
      landing: result.landing,
      roles: result.roles,
    })
    // Hard navigation so the auth context re-reads the freshly stored session.
    window.location.href =
      result.landing === 'client_portal'
        ? '/client-portal/dashboard'
        : `/sandboxes/welcome/${result.sandbox_id}`
  }

  const connectLoggedIn = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const result = await SandboxService.acceptAuthenticated(token)
      land(result)
    } catch (e) {
      setError((e as Error).message || 'Could not connect your account')
      setSubmitting(false)
    }
  }

  const acceptWithPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invitation) return
    setError(null)
    if (!invitation.existing_user) {
      if (!strength.isValid) {
        setError('Choose a stronger password')
        return
      }
      if (password !== confirm) {
        setError('The passwords don’t match')
        return
      }
    }
    setSubmitting(true)
    try {
      const result = await SandboxService.acceptSignup({
        token,
        password,
        full_name: invitation.existing_user
          ? undefined
          : fullName.trim() || undefined,
      })
      if (result.access_token) {
        authService['setAuthData']({
          access_token: result.access_token,
          token_type: result.token_type,
          user_id: result.user_id,
          email: result.email,
          full_name: result.full_name,
          roles: result.roles,
          client_id: result.client_id ?? undefined,
        })
        posthog.identify(result.user_id, {
          email: result.email,
          name: result.full_name,
        })
      }
      land(result)
    } catch (err) {
      setError((err as Error).message || 'Could not accept the invitation')
      setSubmitting(false)
    }
  }

  if (checking || authLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-10">
          <LoadingSpinner />
        </div>
      </Shell>
    )
  }

  if (checkError || !invitation) {
    return (
      <Shell>
        <CardHeader className="text-center">
          <XCircle className="mx-auto h-10 w-10 text-ink-3" />
          <CardTitle className="mt-2">Couldn’t check this invitation</CardTitle>
          <CardDescription>
            {checkError ?? 'Please try again in a moment.'}
          </CardDescription>
        </CardHeader>
      </Shell>
    )
  }

  if (!invitation.valid && invitation.reason) {
    const copy = REASON_COPY[invitation.reason]
    const Icon = copy.icon
    return (
      <Shell>
        <CardHeader className="text-center">
          <Icon className="mx-auto h-10 w-10 text-ink-3" />
          <CardTitle className="mt-2">{copy.title}</CardTitle>
          <CardDescription>{copy.body}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-center text-sm text-ink-3">
          {invitation.inviter_name && invitation.reason !== 'accepted' && (
            <p>
              Contact {invitation.inviter_name}
              {invitation.inviter_email && (
                <>
                  {' '}
                  at{' '}
                  <a
                    className="text-ds-accent hover:underline"
                    href={`mailto:${invitation.inviter_email}`}
                  >
                    {invitation.inviter_email}
                  </a>
                </>
              )}
              .
            </p>
          )}
          {invitation.reason === 'accepted' && (
            <Button
              className="bg-ink text-ink-on-dark hover:bg-ink/90"
              onClick={() => router.push('/auth')}
            >
              Log in
            </Button>
          )}
        </CardContent>
      </Shell>
    )
  }

  const roleText = invitation.role_labels.length
    ? invitation.role_labels.join(' and ')
    : 'a member'

  return (
    <Shell wide>
      <CardHeader>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
          Coach Sidekick
        </p>
        <CardTitle className="text-2xl leading-snug">
          {invitation.inviter_name ?? 'Novus'} invited you to{' '}
          {invitation.sandbox_name}
        </CardTitle>
        <CardDescription>
          {invitation.organisation} · as {roleText}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-ink-2">
          {invitation.is_coachee
            ? 'You’ll see your own sessions, commitments and notes from your coach.'
            : invitation.roles.includes('supervisor')
              ? 'You’ll see the groups you supervise.'
              : 'You’ll see the vision, the timeline and every group on this sandbox.'}
        </p>

        {error && (
          <p
            className="rounded-md bg-vermillion-bg px-3 py-2 text-sm text-vermillion"
            role="alert"
          >
            {error}
          </p>
        )}

        {otherUser ? (
          <div className="space-y-3 rounded-lg border border-line bg-surface-2 p-4 text-sm">
            <p className="text-ink-2">
              You’re logged in as{' '}
              <span className="font-medium text-ink">{user!.email}</span>, but
              this invitation is for{' '}
              <span className="font-medium text-ink">{invitation.email}</span>.
            </p>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Log out and try again
            </Button>
          </div>
        ) : sameUser ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-3">
              You’re logged in as {user!.email}. Connecting takes one click.
            </p>
            <Button
              className="w-full bg-ink text-ink-on-dark hover:bg-ink/90"
              disabled={submitting}
              onClick={connectLoggedIn}
              data-testid="connect-account"
            >
              {submitting ? 'Connecting…' : 'Connect my account'}
            </Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={acceptWithPassword}>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                value={invitation.email ?? ''}
                readOnly
                className="bg-surface-2 text-ink-2"
              />
            </div>
            {invitation.existing_user ? (
              <>
                <p className="text-sm text-ink-3">
                  You already have a Coach Sidekick account. Enter your password
                  to connect it.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="invite-password">Password</Label>
                  <Input
                    id="invite-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    autoFocus
                    data-testid="invite-password"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="invite-name">Full name</Label>
                  <Input
                    id="invite-name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    autoComplete="name"
                    data-testid="invite-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-password">Choose a password</Label>
                  <Input
                    id="invite-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    data-testid="invite-password"
                  />
                  {password && (
                    <PasswordStrengthIndicator
                      strength={strength.strength}
                      score={strength.score}
                      showRequirements
                      compact
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-confirm">Confirm password</Label>
                  <Input
                    id="invite-confirm"
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    data-testid="invite-confirm"
                  />
                </div>
              </>
            )}
            <Button
              type="submit"
              className="w-full bg-ink text-ink-on-dark hover:bg-ink/90"
              disabled={
                submitting ||
                !password ||
                (!invitation.existing_user &&
                  (!strength.isValid || password !== confirm))
              }
              data-testid="invite-submit"
            >
              {submitting
                ? 'One moment…'
                : invitation.existing_user
                  ? 'Connect my account'
                  : 'Create my account'}
            </Button>
            <p className="text-center text-xs text-ink-3">
              By continuing you accept the invitation. Nothing else is shared.
            </p>
          </form>
        )}
      </CardContent>
    </Shell>
  )
}

function Shell({
  children,
  wide,
}: {
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <Card
        className={
          wide ? 'w-full max-w-lg border-line' : 'w-full max-w-md border-line'
        }
      >
        {children}
      </Card>
    </div>
  )
}
