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

interface InvitationInfo {
  valid: boolean
  client_name: string
  coach_name: string
  email: string
  expires_at: string
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

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      const response = await ApiClient.post(`${apiUrl}/auth/client-signup`, {
        token,
        password,
        full_name: fullName,
      })

      // Store auth token
      localStorage.setItem('client_auth_token', response.access_token)
      localStorage.setItem(
        'client_user_data',
        JSON.stringify({
          id: response.user_id,
          email: response.email,
          fullName: response.full_name,
          clientId: response.client_id,
          roles: ['client'],
        }),
      )

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
          <CardTitle>Welcome to Coach Sidekick!</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {invitationInfo.coach_name} has invited you to join the platform
          </p>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Must be at least 8 characters
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
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
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
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
