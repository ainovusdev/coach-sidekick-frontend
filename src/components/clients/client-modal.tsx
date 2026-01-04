'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Client } from '@/types/meeting'
import { ClientService } from '@/services/client-service'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Send } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

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
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Reset form when modal opens or client changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: client?.name || '',
        email: client?.email || '',
        inviteToPortal: false,
      })
      setErrors({})
    }
  }, [isOpen, client])

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
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address'
      }
    }

    // Email is required if inviting to portal
    if (formData.inviteToPortal && !formData.email.trim()) {
      newErrors.email = 'Email is required to send invitation'
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
        notes: '',
      }

      // If onSubmit is provided, use it; otherwise handle internally
      if (onSubmit) {
        await onSubmit(clientData)
      } else if (mode === 'edit' && client) {
        await ClientService.updateClient(client.id, clientData)
      } else if (mode === 'create') {
        const createdClient = await ClientService.createClient(clientData)

        // Send invitation if toggle is on and email is provided
        if (
          formData.inviteToPortal &&
          formData.email.trim() &&
          createdClient?.id
        ) {
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
    } catch (error) {
      console.error('Error submitting client form:', error)
      setErrors({ submit: 'Failed to save client. Please try again.' })
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
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {mode === 'create' ? 'New Client' : 'Edit Client'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 space-y-4">
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Name
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleFieldChange('name', e.target.value)}
                className={`h-10 ${
                  errors.name
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-200 focus:border-gray-400'
                }`}
                placeholder="Client's full name"
                disabled={isLoading}
                autoFocus
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
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
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-200 focus:border-gray-400'
                }`}
                placeholder="client@example.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Invite Toggle - Only show in create mode when email is entered */}
            {mode === 'create' && formData.email.trim() && (
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
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

            {/* Error message */}
            {errors.submit && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 mt-4 border-t border-gray-100 bg-gray-50/50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-10 border-gray-200 hover:bg-gray-100 text-gray-700"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="flex-1 h-10 bg-gray-900 hover:bg-gray-800 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Saving...'}
                </>
              ) : mode === 'create' ? (
                'Create Client'
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
