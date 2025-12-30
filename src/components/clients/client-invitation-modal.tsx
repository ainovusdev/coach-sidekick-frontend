'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner' // NEW: Use Sonner instead of custom hook
import { Send, Mail, CheckCircle, AlertCircle } from 'lucide-react'

interface ClientInvitationModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  clientName: string
  clientEmail?: string
  invitationStatus?: 'not_invited' | 'invited' | 'accepted'
  onInvitationSent?: () => void
}

export function ClientInvitationModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  clientEmail,
  invitationStatus,
  onInvitationSent,
}: ClientInvitationModalProps) {
  const [email, setEmail] = useState(clientEmail || '')
  const [isSending, setIsSending] = useState(false)
  const [invitationSent, setInvitationSent] = useState(false)
  const [error, setError] = useState('')
  const [invitationType, setInvitationType] = useState<string>('')
  const [responseMessage, setResponseMessage] = useState('')

  const handleSendInvitation = async () => {
    if (!email) {
      setError('Please enter an email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsSending(true)
    setError('')

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${apiUrl}/clients/${clientId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: 'Failed to send invitation' }))
        throw new Error(errorData.detail || 'Failed to send invitation')
      }

      const data = await response.json()

      // NEW: Handle different response types
      setInvitationType(data.type || 'signup_invitation_sent')
      setResponseMessage(data.message || 'Invitation sent successfully')

      // NEW: Show different messages based on invitation type
      if (data.type === 'already_connected') {
        toast.info('Client Already Connected', {
          description:
            'This client already has access to their portal for your coaching.',
          duration: 4000,
        })
        if (onInvitationSent) onInvitationSent()
        setTimeout(() => handleClose(), 2000)
        return
      }

      if (
        data.type === 'already_invited' ||
        data.type === 'signup_invitation_pending'
      ) {
        toast.info('Invitation Already Sent', {
          description:
            'An invitation is already pending for this client. They should check their email.',
          duration: 4000,
        })
        if (onInvitationSent) onInvitationSent()
        setTimeout(() => handleClose(), 2000)
        return
      }

      setInvitationSent(true)

      // Show success toast based on type
      const isAccessInvitation = data.type === 'access_invitation_sent'

      if (isAccessInvitation) {
        toast.success('Access Invitation Sent!', {
          description: `${email} will receive an invitation to add your coaching to their existing account.`,
          duration: 5000,
        })
      } else {
        toast.success('Signup Invitation Sent!', {
          description: `${email} will receive instructions to create their client portal account.`,
          duration: 5000,
        })
      }

      // Call callback if provided
      if (onInvitationSent) {
        onInvitationSent()
      }

      // Close modal after delay
      setTimeout(() => {
        handleClose()
      }, 4000)
    } catch (err: any) {
      console.error('Error sending invitation:', err)
      const errorMessage =
        err.message || 'Failed to send invitation. Please try again.'
      setError(errorMessage)
      toast.error('Failed to Send Invitation', {
        description: errorMessage,
        duration: 5000,
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    setEmail(clientEmail || '')
    setError('')
    setInvitationSent(false)
    setInvitationType('') // NEW: Reset type
    setResponseMessage('') // NEW: Reset message
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {invitationStatus === 'invited'
              ? 'Resend Invitation'
              : 'Invite Client to Portal'}
          </DialogTitle>
          <DialogDescription>
            {invitationStatus === 'invited'
              ? `Resend the invitation to ${clientName}. They'll receive a new email with a fresh link to set up their account.`
              : `Send an invitation to ${clientName} to create their client portal account. They'll receive an email with a secure link to set up their access.`}
          </DialogDescription>
        </DialogHeader>

        {!invitationSent ? (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="client@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isSending}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  The invitation will be sent to this email address
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The invitation link will be valid for 7 days. The client can
                  use it to:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Create a secure password for their account</li>
                    <li>Access their coaching session history</li>
                    <li>View session insights and commitments</li>
                    <li>Track their progress over time</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button onClick={handleSendInvitation} disabled={isSending}>
                {isSending ? (
                  <>
                    <span className="animate-pulse">Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {invitationStatus === 'invited'
                      ? 'Resend Invitation'
                      : 'Send Invitation'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-8">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 animate-in fade-in zoom-in duration-500">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">
                {invitationType === 'access_invitation_sent'
                  ? 'Access Invitation Sent!'
                  : 'Invitation Sent Successfully!'}
              </h3>
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  <Mail className="inline-block h-4 w-4 mr-1" />
                  Sent to: <span className="text-gray-900">{email}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {responseMessage ||
                    `${clientName} will receive an email with a secure link.`}
                </p>
              </div>

              <div className="mt-6 rounded-lg bg-blue-50 p-4 text-left">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  What happens next:
                </h4>
                {invitationType === 'access_invitation_sent' ? (
                  <ul className="space-y-1.5 text-xs text-blue-700">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>
                        The client will receive an email with an invitation link
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>
                        They can accept to add your coaching to their existing
                        account
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>
                        They can manage multiple coaches from one account
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>The invitation link expires in 7 days</span>
                    </li>
                  </ul>
                ) : (
                  <ul className="space-y-1.5 text-xs text-blue-700">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>
                        The client will receive an email within a few minutes
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>
                        They can click the secure link to create their password
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>The invitation link expires in 7 days</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>
                        Once registered, they&apos;ll have access to their
                        dashboard and sessions
                      </span>
                    </li>
                  </ul>
                )}
              </div>

              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="min-w-[120px]"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
