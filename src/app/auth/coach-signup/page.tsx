'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
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
import authService from '@/services/auth-service'
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator'
import { validatePassword as checkPasswordStrength } from '@/lib/password-validation'
import { Users, BarChart3, Brain, Sparkles } from 'lucide-react'

interface InvitationInfo {
  valid: boolean
  email: string
  invited_by_name: string | null
  expires_at: string
  existing_user: boolean
  existing_roles: string[]
}

function CoachSignupContent() {
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
      const response = await ApiClient.get(
        `${apiUrl}/auth/coach-invitations/validate/${inviteToken}`,
      )
      setInvitationInfo(response)
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

    if (!fullName.trim()) {
      setError('Please enter your full name')
      return
    }

    setIsLoading(true)
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

      // Make signup request
      const response = await ApiClient.post(`${apiUrl}/auth/coach-signup`, {
        token,
        password,
        full_name: fullName,
      })

      // Use authService to store token properly
      authService['setAuthData']({
        access_token: response.access_token,
        token_type: 'bearer',
        user_id: response.user_id,
        email: response.email,
        full_name: response.full_name,
        roles: response.roles || ['coach'],
      })

      // Redirect to coach dashboard (root)
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    )
  }

  if (!invitationInfo?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>
                {error || 'This invitation link is invalid or has expired.'}
                <br />
                <span className="text-sm mt-2 block">
                  Please contact your administrator for a new invitation.
                </span>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left side - Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 text-white p-12 flex-col justify-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-4">Welcome to Coach Sidekick</h1>
          <p className="text-gray-400 text-lg mb-12">
            Your AI-powered coaching assistant for better sessions and insights.
          </p>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Client Management</h3>
                <p className="text-gray-400 text-sm">
                  Organize and track your coaching clients with ease.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI-Powered Insights</h3>
                <p className="text-gray-400 text-sm">
                  Get real-time coaching suggestions during sessions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Progress Tracking</h3>
                <p className="text-gray-400 text-sm">
                  Monitor client progress with comprehensive analytics.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Session Transcription</h3>
                <p className="text-gray-400 text-sm">
                  Automatic transcription with key insights extraction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {invitationInfo.existing_user
                ? 'Add Coach Access'
                : 'Create Your Account'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {invitationInfo.invited_by_name
                ? `You've been invited by ${invitationInfo.invited_by_name}`
                : "You've been invited to join as a coach"}
            </p>
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
                  . This will add coach access to your existing account.
                </p>
              </div>
            )}
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={invitationInfo.email}
                  disabled
                  className="bg-gray-100"
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
                  placeholder="Enter your full name"
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
                  required={
                    !invitationInfo.existing_user && password.length > 0
                  }
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-6">
              <Button
                type="submit"
                className="w-full bg-gray-900 hover:bg-gray-800"
                disabled={isLoading}
              >
                {isLoading
                  ? invitationInfo.existing_user
                    ? 'Adding Coach Access...'
                    : 'Creating Account...'
                  : invitationInfo.existing_user
                    ? 'Add Coach Access'
                    : 'Create Account'}
              </Button>
              {invitationInfo.existing_user && (
                <p className="text-xs text-center text-muted-foreground">
                  After completing this, you&apos;ll be able to access the coach
                  dashboard
                </p>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default function CoachSignupPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CoachSignupContent />
    </Suspense>
  )
}
