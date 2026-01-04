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
import { toast } from 'sonner'
import {
  Send,
  Mail,
  CheckCircle,
  AlertCircle,
  Users,
  BarChart3,
  Brain,
  Sparkles,
} from 'lucide-react'
import { adminService } from '@/services/admin-service'

interface CoachInvitationModalProps {
  isOpen: boolean
  onClose: () => void
  onInvitationSent?: () => void
}

export function CoachInvitationModal({
  isOpen,
  onClose,
  onInvitationSent,
}: CoachInvitationModalProps) {
  const [email, setEmail] = useState('')
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
      await adminService.sendCoachInvitation(email)

      setInvitationSent(true)

      toast.success('Coach Invitation Sent!', {
        description: `${email} will receive an email with instructions to create their account.`,
        duration: 5000,
      })

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
        err.response?.data?.detail ||
        err.message ||
        'Failed to send invitation. Please try again.'
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
    setEmail('')
    setError('')
    setInvitationSent(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite New Coach</DialogTitle>
          <DialogDescription>
            Send an invitation to a new coach to join the platform. They&apos;ll
            receive an email with a secure link to create their account.
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
                    placeholder="coach@example.com"
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

              <div className="rounded-lg bg-gray-50 p-4 border">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  New coaches will have access to:
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>Client Management</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Brain className="h-4 w-4 text-gray-400" />
                    <span>AI Coaching Insights</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BarChart3 className="h-4 w-4 text-gray-400" />
                    <span>Progress Analytics</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Sparkles className="h-4 w-4 text-gray-400" />
                    <span>Session Recording</span>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The invitation link will be valid for <strong>7 days</strong>.
                  If the email is already registered, the coach role will be
                  added to their existing account.
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
                    Send Invitation
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
                  The new coach will receive an email with instructions to set
                  up their account.
                </p>
              </div>

              <div className="mt-6 rounded-lg bg-blue-50 p-4 text-left">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  What happens next:
                </h4>
                <ul className="space-y-1.5 text-xs text-blue-700">
                  <li className="flex items-start">
                    <span className="mr-2">1.</span>
                    <span>
                      They&apos;ll receive an email with a secure signup link
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">2.</span>
                    <span>
                      They can create their password and set up their profile
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">3.</span>
                    <span>
                      Once registered, they&apos;ll have full coach access
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">4.</span>
                    <span>
                      You can manage their permissions in the admin panel
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
