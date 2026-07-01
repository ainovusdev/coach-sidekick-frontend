'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Client } from '@/types/meeting'
import {
  ClientService,
  type ClientEmailLookup,
} from '@/services/client-service'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Send, UserCheck, Clock } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Quick-pick lead times (hours before the session) for the pre-session
// questionnaire. The coach can also type any value LEAD_TIME_MIN–MAX in the
// custom field; the matching tag highlights when it equals a preset.
const LEAD_TIME_PRESETS = [1, 3, 12, 24, 48, 72]
const LEAD_TIME_MIN = 1
const LEAD_TIME_MAX = 168

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: Partial<Client>) => Promise<void>
  onSuccess?: () => void
  onClientCreated?: (client: Client) => void
  client?: Client | null
  mode: 'create' | 'edit'
}

export default function ClientModal({
  isOpen,
  onClose,
  onSubmit,
  onSuccess,
  onClientCreated,
  client,
  mode,
}: ClientModalProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    inviteToPortal: false,
    autoSendQuestionnaire: true,
    leadTimeHours: 24,
    autoSendThrillForm: true,
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  // Real-time recognition of an email that already belongs to a person.
  const [lookup, setLookup] = useState<ClientEmailLookup | null>(null)

  // Reset form when modal opens or client changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: client?.name || '',
        email: client?.email || '',
        inviteToPortal: false,
        autoSendQuestionnaire: client?.auto_send_questionnaire ?? true,
        leadTimeHours: client?.questionnaire_lead_time_hours ?? 24,
        autoSendThrillForm: client?.auto_send_thrill_form ?? true,
        notes: client?.notes || '',
      })
      setErrors({})
      setLookup(null)
    }
  }, [isOpen, client])

  // Debounced email lookup (create mode only) so the coach is offered "send a
  // request" when the email already belongs to someone, instead of a hard error.
  useEffect(() => {
    if (mode !== 'create') return
    const email = formData.email.trim().toLowerCase()
    if (!EMAIL_RE.test(email)) {
      setLookup(null)
      return
    }
    let cancelled = false
    const handle = setTimeout(async () => {
      try {
        const result = await ClientService.lookupEmail(email)
        if (!cancelled) setLookup(result)
      } catch {
        if (!cancelled) setLookup(null)
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [formData.email, mode])

  // Derived recognition state for the UI.
  const isExistingActive =
    !!lookup && lookup.exists && lookup.kind === 'active_user'
  const isExistingPending =
    !!lookup && lookup.exists && lookup.kind === 'pending_user'
  const alreadyMyClient = !!lookup && lookup.already_my_client

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset errors
    setErrors({})

    // Validate required fields
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    // Validate email if provided
    if (formData.email.trim()) {
      if (!EMAIL_RE.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address'
      }
    }

    // Email is required if inviting to portal
    if (formData.inviteToPortal && !formData.email.trim()) {
      newErrors.email = 'Email is required to send invitation'
    }

    // Validate the custom lead time when auto-send is on.
    if (
      formData.autoSendQuestionnaire &&
      (!formData.leadTimeHours ||
        formData.leadTimeHours < LEAD_TIME_MIN ||
        formData.leadTimeHours > LEAD_TIME_MAX)
    ) {
      newErrors.leadTime = `Enter a value between ${LEAD_TIME_MIN} and ${LEAD_TIME_MAX} hours`
    }

    // Already this coach's client (recognized in real time) → block.
    if (mode === 'create' && alreadyMyClient) {
      newErrors.email = 'You already have a client with this email'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      const clientData = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        notes: formData.notes,
        auto_send_questionnaire: formData.autoSendQuestionnaire,
        questionnaire_lead_time_hours: formData.leadTimeHours,
        auto_send_thrill_form: formData.autoSendThrillForm,
      }

      // If onSubmit is provided, use it; otherwise handle internally
      if (onSubmit) {
        await onSubmit(clientData)
      } else if (mode === 'edit' && client) {
        await ClientService.updateClient(client.id, clientData)
      } else if (mode === 'create') {
        const {
          client: createdClient,
          accessRequestSent,
          accessRequestName,
        } = await ClientService.createClient(clientData)

        if (accessRequestSent) {
          // Existing active user → an accept/decline request was emailed; they
          // link to this profile once they consent. Don't also fire the signup
          // invite (they already have an account).
          toast.success(
            `Request sent to ${accessRequestName || formData.email.trim()}`,
            {
              description:
                'They’ll appear as your client once they accept your coaching.',
            },
          )
        } else if (
          formData.inviteToPortal &&
          formData.email.trim() &&
          createdClient?.id
        ) {
          // No existing account → optional portal signup invitation.
          try {
            const apiUrl =
              process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
            await fetch(`${apiUrl}/clients/${createdClient.id}/invite`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
              },
              body: JSON.stringify({ email: formData.email.trim() }),
            })
          } catch (inviteError) {
            console.error('Failed to send invitation:', inviteError)
          }
        }

        // If onClientCreated callback is provided, use it (e.g., for auto-selecting in forms)
        // Otherwise, navigate to client details page
        if (createdClient?.id) {
          if (onClientCreated) {
            onClientCreated(createdClient as Client)
          } else {
            onClose()
            router.push(`/clients/${createdClient.id}`)
            return
          }
        }
      }

      if (onSuccess) {
        onSuccess()
      }

      onClose()
    } catch (error: any) {
      console.error('Error submitting client form:', error)
      // Check for duplicate email error from backend
      const errorMessage = (error?.message || error?.detail || '').toLowerCase()
      if (
        errorMessage.includes('email already exists') ||
        errorMessage.includes('already have a client')
      ) {
        setErrors({
          email: 'You already have a client with this email',
        })
      } else {
        setErrors({ submit: 'Failed to save client. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-lg font-semibold text-ink ">
            {mode === 'create' ? 'New Client' : 'Client settings'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 space-y-4 max-h-[65vh] overflow-y-auto">
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-ink-2 mb-1.5"
              >
                Name
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleFieldChange('name', e.target.value)}
                className={`h-10 ${
                  errors.name
                    ? 'border-vermillion focus:border-vermillion focus:ring-vermillion'
                    : 'border-line focus:border-line-strong '
                }`}
                placeholder="Client's full name"
                disabled={isLoading}
                autoFocus
              />
              {errors.name && (
                <p className="text-xs text-vermillion mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-ink-2 mb-1.5"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => handleFieldChange('email', e.target.value)}
                className={`h-10 ${
                  errors.email
                    ? 'border-vermillion focus:border-vermillion focus:ring-vermillion'
                    : 'border-line focus:border-line-strong '
                }`}
                placeholder="client@example.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-xs text-vermillion mt-1">{errors.email}</p>
              )}
            </div>

            {/* Recognized existing person → offer "send a request" instead of a
                hard duplicate error (multi-coach enrollment). */}
            {mode === 'create' &&
              !alreadyMyClient &&
              isExistingActive &&
              !errors.email && (
                <div className="flex items-start gap-2.5 py-3 px-4 bg-paper rounded-lg border border-line">
                  <UserCheck className="h-4 w-4 text-ink-2 mt-0.5 shrink-0" />
                  <p className="text-sm text-ink-2 leading-snug">
                    <span className="font-medium text-ink">
                      {lookup?.name || formData.email.trim()}
                    </span>{' '}
                    is already in Coach Sidekick. We’ll send them a request to
                    accept your coaching — they’ll appear as your client once
                    they accept.
                  </p>
                </div>
              )}

            {mode === 'create' &&
              !alreadyMyClient &&
              isExistingPending &&
              !errors.email && (
                <div className="flex items-start gap-2.5 py-3 px-4 bg-paper rounded-lg border border-line">
                  <Clock className="h-4 w-4 text-ink-3 mt-0.5 shrink-0" />
                  <p className="text-sm text-ink-2 leading-snug">
                    <span className="font-medium text-ink">
                      {lookup?.name || formData.email.trim()}
                    </span>{' '}
                    was invited but hasn’t set up their account yet — we’ll link
                    them to you.
                  </p>
                </div>
              )}

            {/* Invite Toggle - only when the email is NOT an existing account
                (an existing user already has a login / gets a consent request). */}
            {mode === 'create' &&
              formData.email.trim() &&
              !isExistingActive &&
              !isExistingPending &&
              !alreadyMyClient && (
                <div className="flex items-center justify-between py-3 px-4 bg-paper rounded-lg">
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-ink-3 " />
                    <span className="text-sm text-ink-2 ">
                      Send portal invitation
                    </span>
                  </div>
                  <Switch
                    checked={formData.inviteToPortal}
                    onCheckedChange={checked =>
                      setFormData(prev => ({
                        ...prev,
                        inviteToPortal: checked,
                      }))
                    }
                    disabled={isLoading}
                  />
                </div>
              )}

            {/* Pre-session questionnaire settings + notes */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between gap-3 py-3 px-4 bg-paper rounded-lg">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-ink-2">
                    Auto-send pre-session questionnaire
                  </span>
                  <span className="text-xs text-ink-3">
                    Email the questionnaire automatically before each session
                  </span>
                </div>
                <Switch
                  checked={formData.autoSendQuestionnaire}
                  onCheckedChange={checked =>
                    setFormData(prev => ({
                      ...prev,
                      autoSendQuestionnaire: checked,
                    }))
                  }
                  disabled={isLoading}
                />
              </div>

              {formData.autoSendQuestionnaire && (
                <div>
                  <label className="block text-sm font-medium text-ink-2 mb-1.5">
                    Send ahead of session
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {LEAD_TIME_PRESETS.map(preset => {
                      const active = formData.leadTimeHours === preset
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() =>
                            setFormData(prev => ({
                              ...prev,
                              leadTimeHours: preset,
                            }))
                          }
                          disabled={isLoading}
                          className={`h-8 px-3 rounded-full text-sm border transition-colors ${
                            active
                              ? 'bg-ink text-ink-on-dark border-ink'
                              : 'bg-paper text-ink-2 border-line hover:bg-surface-3'
                          }`}
                        >
                          {preset}h
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={LEAD_TIME_MIN}
                      max={LEAD_TIME_MAX}
                      value={formData.leadTimeHours || ''}
                      onChange={e => {
                        const raw = e.target.value
                        setFormData(prev => ({
                          ...prev,
                          leadTimeHours: raw === '' ? 0 : Number(raw),
                        }))
                        if (errors.leadTime) {
                          setErrors(prev => ({ ...prev, leadTime: '' }))
                        }
                      }}
                      className={`h-10 w-24 ${
                        errors.leadTime
                          ? 'border-vermillion focus:border-vermillion focus:ring-vermillion'
                          : 'border-line focus:border-line-strong'
                      }`}
                      placeholder="Hours"
                      disabled={isLoading}
                    />
                    <span className="text-sm text-ink-3">hours before</span>
                  </div>
                  {errors.leadTime && (
                    <p className="text-xs text-vermillion mt-1">
                      {errors.leadTime}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 py-3 px-4 bg-paper rounded-lg">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-ink-2">
                    Auto-send post-session Thrill Form
                  </span>
                  <span className="text-xs text-ink-3">
                    Email the Thrill Form automatically after each session
                  </span>
                </div>
                <Switch
                  checked={formData.autoSendThrillForm}
                  onCheckedChange={checked =>
                    setFormData(prev => ({
                      ...prev,
                      autoSendThrillForm: checked,
                    }))
                  }
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-ink-2 mb-1.5"
                >
                  Notes
                </label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, notes: e.target.value }))
                  }
                  className="min-h-[80px] border-line focus:border-line-strong"
                  placeholder="Private notes about this client"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Error message */}
            {errors.submit && (
              <div className="rounded-lg bg-vermillion-bg border border-vermillion p-3">
                <p className="text-sm text-vermillion ">{errors.submit}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 mt-4 border-t border-line bg-paper/50 ">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-10 border-line hover:bg-surface-3 text-ink-2 "
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="flex-1 h-10 bg-ink hover:bg-ink-2 text-ink-on-dark "
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Saving...'}
                </>
              ) : mode === 'create' ? (
                isExistingActive && !alreadyMyClient ? (
                  'Add & send request'
                ) : (
                  'Create Client'
                )
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
