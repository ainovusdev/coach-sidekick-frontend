'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, AlertCircle, Users, Mail } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import authService from '@/services/auth-service'
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator'
import { validatePassword } from '@/lib/password-validation'
import { formatDate } from '@/lib/date-utils'
import { toast } from 'sonner'

interface InvitationDetails {
  valid: boolean
  client_name: string
  coach_name: string
  coach_email: string
  message?: string
  expires_at: string
  already_has_access: boolean
  invitee_email: string
  existing_user: boolean
}

export default function ClientAccessInvitationPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const { isAuthenticated, user, loading: authLoading } = useAuth()

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (token) {
      validateInvitation()
    }
  }, [token])

  const validateInvitation = async () => {
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(
        `${apiUrl}/client-access-invitations/validate/${token}`,
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Invalid or expired invitation')
      }

      const data = await response.json()
      setInvitation(data)
    } catch (err: any) {
      setError(err.message || 'Failed to validate invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!isAuthenticated) {
      sessionStorage.setItem('pending_invitation_token', token)
      toast.info('Please log in to accept this invitation')
      router.push(
        `/auth?redirect=${encodeURIComponent(`/invitations/client-access/${token}`)}`,
      )
      return
    }

    setAccepting(true)
    setError('')

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      const authToken = localStorage.getItem('auth_token')

      const response = await fetch(
        `${apiUrl}/client-access-invitations/accept`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ token }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to accept invitation')
      }

      await response.json()
      setSuccess(true)

      toast.success('Invitation Accepted!', {
        description: `You now have access to ${invitation?.client_name}'s coaching with ${invitation?.coach_name}.`,
      })

      setTimeout(() => {
        router.push('/client-portal/dashboard')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation')
      toast.error('Failed to Accept', {
        description: err.message,
      })
    } finally {
      setAccepting(false)
    }
  }

  const handleDecline = async () => {
    if (!isAuthenticated) {
      return // Unauthenticated users can just close the page
    }

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      const authToken = localStorage.getItem('auth_token')

      await fetch(`${apiUrl}/client-access-invitations/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token }),
      })

      toast.success('Invitation Declined')
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Failed to decline invitation')
      toast.error('Failed to Decline', {
        description: err.message,
      })
    }
  }

  const passwordValidation = useMemo(
    () => validatePassword(password),
    [password],
  )

  const handleAcceptSignup = async () => {
    setError('')

    const isNewUser = !invitation?.existing_user

    // Validate form
    if (isNewUser && !fullName.trim()) {
      setError('Please enter your full name')
      return
    }
    if (!password) {
      setError('Please enter a password')
      return
    }
    if (isNewUser) {
      if (!passwordValidation.isValid) {
        setError('Password does not meet requirements')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
    }

    setSubmitting(true)

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

      const response = await fetch(
        `${apiUrl}/client-access-invitations/accept-signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            password,
            full_name: isNewUser ? fullName.trim() : undefined,
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to accept invitation')
      }

      const data = await response.json()

      // Set auth data (same pattern as coach-signup and client-portal signup)
      authService['setAuthData'](data)

      setSuccess(true)
      toast.success('Invitation Accepted!', {
        description: `You now have access to ${invitation?.client_name}'s coaching with ${invitation?.coach_name}.`,
      })

      // Force full AuthProvider re-mount
      setTimeout(() => {
        window.location.href = '/client-portal/dashboard'
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation')
      toast.error('Failed', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading invitation...
          </p>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <Card className="max-w-md w-full border-gray-200 dark:border-gray-800">
          <CardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Invalid Invitation
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <Button
              onClick={() => router.push('/')}
              className="mt-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <Card className="max-w-md w-full border-gray-200 dark:border-gray-800">
          <CardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-white dark:text-gray-900" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Invitation Accepted!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              You now have access to coaching with{' '}
              <strong className="text-gray-900 dark:text-white">
                {invitation?.coach_name}
              </strong>
              .
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Redirecting to your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <Card className="max-w-lg w-full border-gray-200 dark:border-gray-800">
        <CardHeader className="text-center border-b border-gray-100 dark:border-gray-800">
          <div className="mx-auto w-16 h-16 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-white dark:text-gray-900" />
          </div>
          <CardTitle className="text-2xl text-gray-900 dark:text-white">
            Coaching Invitation
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            You&apos;ve been invited to join a coaching program
          </p>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {/* Coach Info */}
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              <strong className="text-gray-900 dark:text-white">
                {invitation?.coach_name}
              </strong>{' '}
              has invited you to join their coaching program
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Mail className="h-3 w-3" />
              <span>{invitation?.coach_email}</span>
            </div>
          </div>

          {/* Personal Message */}
          {invitation?.message && (
            <div className="bg-gray-50 dark:bg-gray-800 border-l-4 border-gray-900 dark:border-white p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">
                Personal message:
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                &quot;{invitation.message}&quot;
              </p>
            </div>
          )}

          {/* Benefits */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white">
              What you&apos;ll get:
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-gray-700 dark:text-gray-300 mr-2 mt-0.5 flex-shrink-0" />
                <span>Access to your personalized coaching dashboard</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-gray-700 dark:text-gray-300 mr-2 mt-0.5 flex-shrink-0" />
                <span>Track progress and insights from your sessions</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-gray-700 dark:text-gray-300 mr-2 mt-0.5 flex-shrink-0" />
                <span>View session commitments and next steps</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-gray-700 dark:text-gray-300 mr-2 mt-0.5 flex-shrink-0" />
                <span>Manage multiple coaches from one account</span>
              </li>
            </ul>
          </div>

          {/* Already Has Access */}
          {invitation?.already_has_access && (
            <Alert className="border-gray-200 dark:border-gray-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You already have access to this coaching program.
              </AlertDescription>
            </Alert>
          )}

          {/* Inline Signup/Login Form */}
          {!isAuthenticated && !authLoading && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {invitation?.existing_user
                  ? 'Log in to accept'
                  : 'Create your account'}
              </h3>

              {/* Email (readonly) */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={invitation?.invitee_email || ''}
                  readOnly
                  className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                />
              </div>

              {/* Full Name (new users only) */}
              {!invitation?.existing_user && (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="fullName"
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>
              )}

              {/* Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={
                    invitation?.existing_user
                      ? 'Enter your password'
                      : 'Create a password'
                  }
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              {/* Confirm Password + Strength Indicator (new users only) */}
              {!invitation?.existing_user && (
                <>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-600">
                        Passwords do not match
                      </p>
                    )}
                  </div>
                  {password && (
                    <PasswordStrengthIndicator
                      strength={passwordValidation.strength}
                      score={passwordValidation.score}
                      compact
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Current User */}
          {isAuthenticated && user && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Logged in as:{' '}
                <strong className="text-gray-900 dark:text-white">
                  {user.email}
                </strong>
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex gap-3 pt-6">
          <Button
            variant="outline"
            className="flex-1 border-gray-300 dark:border-gray-600"
            onClick={handleDecline}
            disabled={
              accepting ||
              submitting ||
              invitation?.already_has_access ||
              !isAuthenticated
            }
          >
            <XCircle className="h-4 w-4 mr-2" />
            Decline
          </Button>
          <Button
            className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
            onClick={isAuthenticated ? handleAccept : handleAcceptSignup}
            disabled={accepting || submitting || invitation?.already_has_access}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {accepting || submitting
              ? 'Accepting...'
              : isAuthenticated
                ? 'Accept Invitation'
                : invitation?.existing_user
                  ? 'Log In & Accept'
                  : 'Create Account & Accept'}
          </Button>
        </CardFooter>

        {/* Expiration */}
        <div className="px-6 pb-4 border-t border-gray-100 dark:border-gray-800 pt-4">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            This invitation expires on{' '}
            {invitation?.expires_at
              ? formatDate(invitation.expires_at, 'EEEE, MMMM d, yyyy')
              : ''}
          </p>
        </div>
      </Card>
    </div>
  )
}
