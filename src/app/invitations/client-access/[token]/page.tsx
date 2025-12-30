'use client'

import { useState, useEffect } from 'react'
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
import { CheckCircle, XCircle, AlertCircle, Users, Mail } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

interface InvitationDetails {
  valid: boolean
  client_name: string
  coach_name: string
  coach_email: string
  message?: string
  expires_at: string
  already_has_access: boolean
}

export default function ClientAccessInvitationPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const { isAuthenticated, user } = useAuth()

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
      // Store token in sessionStorage and redirect to login
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

      // Redirect to client portal after 2 seconds
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
      toast.info('Please log in to decline this invitation')
      router.push('/auth')
      return
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => router.push('/')} className="mt-6">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invitation Accepted!</h2>
            <p className="text-gray-600">
              You now have access to coaching with{' '}
              <strong>{invitation?.coach_name}</strong>.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center border-b">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-purple-600" />
          </div>
          <CardTitle className="text-2xl">Coaching Invitation</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            You&apos;ve been invited to join a coaching program
          </p>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {/* Coach & Client Info */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-900 mb-2">
              <strong>{invitation?.coach_name}</strong> has invited you to join
              their coaching program
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-700">
              <Mail className="h-3 w-3" />
              <span>{invitation?.coach_email}</span>
            </div>
          </div>

          {/* Personal Message */}
          {invitation?.message && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-sm text-gray-700 font-medium mb-1">
                Personal message:
              </p>
              <p className="text-sm text-gray-600 italic">
                &quot;{invitation.message}&quot;
              </p>
            </div>
          )}

          {/* Benefits */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">What you&apos;ll get:</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Access to your personalized coaching dashboard</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Track progress and insights from your sessions</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>View session commitments and next steps</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Manage multiple coaches from one account</span>
              </li>
            </ul>
          </div>

          {/* Already Has Access Warning */}
          {invitation?.already_has_access && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You already have access to this coaching program.
              </AlertDescription>
            </Alert>
          )}

          {/* Login Required Notice */}
          {!isAuthenticated && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Please log in to accept this invitation</span>
              </p>
            </div>
          )}

          {/* Current User Info */}
          {isAuthenticated && user && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                Logged in as: <strong>{user.email}</strong>
              </p>
            </div>
          )}

          {/* Error Display */}
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
            className="flex-1"
            onClick={handleDecline}
            disabled={accepting || invitation?.already_has_access}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Decline
          </Button>
          <Button
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            onClick={handleAccept}
            disabled={accepting || invitation?.already_has_access}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {accepting ? 'Accepting...' : 'Accept Invitation'}
          </Button>
        </CardFooter>

        {/* Expiration Notice */}
        <div className="px-6 pb-4 border-t pt-4">
          <p className="text-xs text-center text-gray-500">
            This invitation expires on{' '}
            {invitation?.expires_at
              ? new Date(invitation.expires_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : ''}
          </p>
        </div>
      </Card>
    </div>
  )
}
