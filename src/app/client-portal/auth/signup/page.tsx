'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import authService from '@/services/auth-service' // NEW

interface InvitationInfo {
  valid: boolean
  client_name: string
  coach_name: string
  email: string
  expires_at: string
  existing_user?: boolean // NEW: Whether email is already registered
  existing_roles?: string[] // NEW: Existing user's roles
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
      const response = await ApiClient.get(
        `${apiUrl}/invitations/validate/${inviteToken}`,
      )
      setInvitationInfo(response)
      setFullName(response.client_name)
    } catch (err: any) {
      setError(err.message || 'Invalid or expired invitation link')
    } finally {
      setIsValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // NEW: For existing users, password is optional
    if (password || !invitationInfo?.existing_user) {
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      if (password && password.length < 8) {
        setError('Password must be at least 8 characters')
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <LoadingSpinner />
      </div>
    )
  }

  if (!invitationInfo?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Alert className="max-w-md">
          <AlertDescription>
            {error || 'This invitation link is invalid or has expired.'}
            <br />
            Please contact your coach for a new invitation.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
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
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Existing Account Detected</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
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
                <p className="text-xs text-blue-600 mt-1">
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
                    : 'At least 8 characters'
                }
                required={!invitationInfo.existing_user}
                minLength={8}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {invitationInfo.existing_user
                  ? 'Leave blank to keep your current password'
                  : 'Must be at least 8 characters'}
              </p>
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
