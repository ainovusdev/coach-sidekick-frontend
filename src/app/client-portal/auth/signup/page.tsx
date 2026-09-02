'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { ApiClient } from '@/lib/api-client'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import authService from '@/services/auth-service'
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator'
import { validatePassword as checkPasswordStrength } from '@/lib/password-validation'

// Mirrors backend `InvitationValidation`. An unusable token comes back as
// `valid: false` + `reason` (HTTP 200, not 400) so we can branch on *why*:
// `already_accepted` is the everyday case — a client re-opens the original
// invite email long after signing up — and needs "sign in", not "ask your coach".
type InvalidInvitationReason = 'already_accepted' | 'expired' | 'invalid'

interface InvitationInfo {
  valid: boolean
  reason?: InvalidInvitationReason
  client_name?: string
  coach_name?: string
  email?: string
  expires_at?: string
  existing_user?: boolean // Whether email is already registered (active account)
  existing_roles?: string[] // Existing user's roles
}

function ClientSignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(
    null,
  )
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)

  // Password strength validation
  const passwordValidation = useMemo(
    () => checkPasswordStrength(password),
    [password],
  )

  useEffect(() => {
    if (token) {
      validateInvitation(token)
    } else {
      setError('No invitation token provided')
      setIsValidating(false)
    }
  }, [token])

  const validateInvitation = async (inviteToken: string) => {
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      const response: InvitationInfo = await ApiClient.get(
        `${apiUrl}/invitations/validate/${inviteToken}`,
      )
      setInvitationInfo(response)
      if (response.client_name) setFullName(response.client_name)
      if (!response.valid) {
        // Measures how often clients land on a dead invite link (and why) so
        // the "can't access my Sidekick" support pattern is visible.
        posthog.capture('client_invitation_link_unusable', {
          reason: response.reason ?? 'invalid',
        })
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired invitation link')
    } finally {
      setIsValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // For existing users, password is optional
    if (password || !invitationInfo?.existing_user) {
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      // Enforce strong password requirements
      if (password && !passwordValidation.isValid) {
        setError('Please meet all password requirements')
        return
      }
    }

    setIsLoading(true)
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

      // Make signup request
      const response = await ApiClient.post(`${apiUrl}/auth/client-signup`, {
        token,
        password,
        full_name: fullName,
      })

      // NEW: Use authService to store token properly
      authService['setAuthData']({
        access_token: response.access_token,
        token_type: 'bearer',
        user_id: response.user_id,
        email: response.email,
        full_name: response.full_name,
        roles: response.roles || ['client'],
        client_id: response.client_id,
      })

      // Identify and capture signup event. `email` + `client_id` are set so
      // errors/replays are attributable (matches the login/refresh identify).
      if (response.user_id) {
        posthog.identify(response.user_id, {
          name: response.full_name || undefined,
          email: response.email || undefined,
          roles: response.roles || ['client'],
          client_id: response.client_id || undefined,
        })
      }
      posthog.capture('client_portal_signed_up', {
        is_existing_user: invitationInfo?.existing_user ?? false,
      })

      // Redirect to dashboard
      router.push('/client-portal/dashboard')
    } catch (err: any) {
      setError(err.message || 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center  ">
        <LoadingSpinner />
      </div>
    )
  }

  if (!invitationInfo?.valid) {
    const reason = invitationInfo?.reason
    const email = invitationInfo?.email
    const emailQuery = email ? `&email=${encodeURIComponent(email)}` : ''
    const signInHref = email ? `/auth?${emailQuery.slice(1)}` : '/auth'
    const forgotHref = `/auth?forgot=1${emailQuery}`

    if (reason === 'already_accepted') {
      // The link was used to create the account (possibly weeks ago). Sending
      // them to "contact your coach" here is a dead end — the coach can't
      // re-invite a linked client either. Steer to sign-in / password reset.
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Your account is already set up</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                This invitation link was already used to create your Sidekick
                account
                {email ? (
                  <>
                    {' '}
                    for <strong>{email}</strong>
                  </>
                ) : null}
                . Invitation links only work once &mdash; sign in to open your
                Sidekick.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link href={signInHref}>Sign in</Link>
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Forgot your password?{' '}
                <Link href={forgotHref} className="underline">
                  Reset it here
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              {reason === 'expired'
                ? 'This invitation has expired'
                : 'Invalid invitation link'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {reason === 'expired'
                ? `Ask ${invitationInfo?.coach_name || 'your coach'} to send you a new invitation.`
                : error ||
                  'This invitation link is invalid or has expired. Please contact your coach for a new invitation.'}
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-center text-muted-foreground">
              Already have an account?{' '}
              <Link href={signInHref} className="underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center  p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {invitationInfo.existing_user
              ? 'Add Client Access'
              : 'Welcome to Coach Sidekick!'}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {invitationInfo.coach_name} has invited you to join the platform
          </p>
          {/* NEW: Show message if user already exists */}
          {invitationInfo.existing_user && invitationInfo.existing_roles && (
            <div className="mt-3 p-3 bg-ds-accent-bg border border-ds-accent rounded-lg">
              <p className="text-sm text-ds-accent">
                <strong>Existing Account Detected</strong>
              </p>
              <p className="text-xs text-ds-accent mt-1">
                You already have an account as a{' '}
                {invitationInfo.existing_roles
                  .map(r => r.replace('_', ' '))
                  .join(', ')}
                . This will add client access to your existing account.
              </p>
            </div>
          )}
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitationInfo.email}
                disabled
                className="bg-muted"
              />
              {invitationInfo.existing_user && (
                <p className="text-xs text-ds-accent mt-1">
                  This email is already registered in our system
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">
                {invitationInfo.existing_user
                  ? 'New Password (Optional)'
                  : 'Password'}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={
                  invitationInfo.existing_user
                    ? 'Leave blank to keep current password'
                    : 'Create a strong password'
                }
                required={!invitationInfo.existing_user}
              />
              {password && (
                <div className="mt-2">
                  <PasswordStrengthIndicator
                    strength={passwordValidation.strength}
                    score={passwordValidation.score}
                    showRequirements={true}
                  />
                </div>
              )}
              {!password && invitationInfo.existing_user && (
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank to keep your current password
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder={
                  invitationInfo.existing_user
                    ? 'Confirm new password (if changing)'
                    : 'Re-enter your password'
                }
                required={!invitationInfo.existing_user && password.length > 0}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="pt-6">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? invitationInfo.existing_user
                  ? 'Adding Client Access...'
                  : 'Creating Account...'
                : invitationInfo.existing_user
                  ? 'Add Client Access'
                  : 'Create Account'}
            </Button>
            {invitationInfo.existing_user && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                After completing this, you&apos;ll be able to switch between
                your coach and client views
              </p>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function ClientSignupPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ClientSignupContent />
    </Suspense>
  )
}
