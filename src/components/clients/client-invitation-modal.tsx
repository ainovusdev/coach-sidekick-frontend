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
import { useToast } from '@/hooks/use-toast'
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
  const { toast } = useToast()
  const [email, setEmail] = useState(clientEmail || '')
  const [isSending, setIsSending] = useState(false)
  const [invitationSent, setInvitationSent] = useState(false)
  const [error, setError] = useState('')

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
        const errorData = await response.text()
        throw new Error(errorData || 'Failed to send invitation')
      }

      await response.json()

      setInvitationSent(true)

      // Show success toast with more details
      toast({
        title: '✉️ Invitation Sent Successfully!',
        description: `An invitation has been sent to ${email}. They'll receive instructions to set up their account.`,
        duration: 5000,
      })

      // Call callback if provided
      if (onInvitationSent) {
        onInvitationSent()
      }

      // Close modal after a longer delay to let user read the success message
      setTimeout(() => {
        handleClose()
      }, 4000)
    } catch (err: any) {
      console.error('Error sending invitation:', err)
      setError(err.message || 'Failed to send invitation. Please try again.')
      toast({
        title: 'Error',
        description: err.message || 'Failed to send invitation',
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    setEmail(clientEmail || '')
    setError('')
    setInvitationSent(false)
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
                    <li>View session insights and action items</li>
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
                Invitation Sent Successfully!
              </h3>
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  <Mail className="inline-block h-4 w-4 mr-1" />
                  Sent to: <span className="text-gray-900">{email}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {clientName} will receive an email with a secure link to set
                  up their account.
                </p>
              </div>

              <div className="mt-6 rounded-lg bg-blue-50 p-4 text-left">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  What happens next:
                </h4>
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
