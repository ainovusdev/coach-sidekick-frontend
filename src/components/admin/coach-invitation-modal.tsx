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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
  const [role, setRole] = useState<'coach' | 'trainee'>('coach')
  const [isSending, setIsSending] = useState(false)
  const [invitationSent, setInvitationSent] = useState(false)
  const [error, setError] = useState('')

  const roleLabel = role === 'trainee' ? 'trainee' : 'coach'

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
      await adminService.sendCoachInvitation(email, role)

      setInvitationSent(true)

      toast.success(
        role === 'trainee'
          ? 'Trainee Invitation Sent!'
          : 'Coach Invitation Sent!',
        {
          description: `${email} will receive an email with instructions to create their account.`,
          duration: 5000,
        },
      )

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
    setRole('coach')
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
            Send an invitation to join the platform. They&apos;ll receive an
            email with a secure link to create their account.
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

              <div className="space-y-2">
                <Label>Role</Label>
                <RadioGroup
                  value={role}
                  onValueChange={value => setRole(value as 'coach' | 'trainee')}
                  disabled={isSending}
                  className="gap-2"
                >
                  <label
                    htmlFor="role-coach"
                    className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer has-[[data-state=checked]]:border-ink has-[[data-state=checked]]:bg-paper"
                  >
                    <RadioGroupItem
                      value="coach"
                      id="role-coach"
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-ink">Coach</p>
                      <p className="text-xs text-muted-foreground">
                        Full access, including AI coaching suggestions during
                        live meetings
                      </p>
                    </div>
                  </label>
                  <label
                    htmlFor="role-trainee"
                    className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer has-[[data-state=checked]]:border-ink has-[[data-state=checked]]:bg-paper"
                  >
                    <RadioGroupItem
                      value="trainee"
                      id="role-trainee"
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-ink">Trainee</p>
                      <p className="text-xs text-muted-foreground">
                        Coach in training — same access as a coach, but AI
                        suggestions are hidden during live meetings
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="rounded-lg bg-paper p-4 border">
                <h4 className="text-sm font-medium text-ink mb-3">
                  New {roleLabel === 'trainee' ? 'trainees' : 'coaches'} will
                  have access to:
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-ink-3">
                    <Users className="h-4 w-4 text-ink-4" />
                    <span>Client Management</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-ink-3">
                    <Brain className="h-4 w-4 text-ink-4" />
                    <span>AI Coaching Insights</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-ink-3">
                    <BarChart3 className="h-4 w-4 text-ink-4" />
                    <span>Progress Analytics</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-ink-3">
                    <Sparkles className="h-4 w-4 text-ink-4" />
                    <span>Session Recording</span>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The invitation link will be valid for <strong>7 days</strong>.
                  If the email is already registered, the {roleLabel} role will
                  be added to their existing account.
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
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest-bg animate-in fade-in zoom-in duration-500">
                <CheckCircle className="h-10 w-10 text-forest" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-ink">
                Invitation Sent Successfully!
              </h3>
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-ink-2">
                  <Mail className="inline-block h-4 w-4 mr-1" />
                  Sent to: <span className="text-ink">{email}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  The new {roleLabel} will receive an email with instructions to
                  set up their account.
                </p>
              </div>

              <div className="mt-6 rounded-lg bg-ds-accent-bg p-4 text-left">
                <h4 className="text-sm font-medium text-ds-accent mb-2">
                  What happens next:
                </h4>
                <ul className="space-y-1.5 text-xs text-ds-accent">
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
                      Once registered, they&apos;ll have{' '}
                      {roleLabel === 'trainee' ? 'trainee' : 'full coach'}{' '}
                      access
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
