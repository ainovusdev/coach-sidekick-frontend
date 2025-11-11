'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Client } from '@/types/meeting'
import { ClientService } from '@/services/client-service'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  User,
  FileText,
  Loader2,
  X,
  Mail,
  Send,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: Partial<Client>) => Promise<void>
  onSuccess?: () => void
  client?: Client | null
  mode: 'create' | 'edit'
}

export default function ClientModal({
  isOpen,
  onClose,
  onSubmit,
  onSuccess,
  client,
  mode,
}: ClientModalProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notes: '',
    meta_performance_vision: '',
    inviteToPortal: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Reset form when modal opens or client changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: client?.name || '',
        email: client?.email || '',
        notes: client?.notes || '',
        meta_performance_vision: client?.meta_performance_vision || '',
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
      newErrors.email = 'Email is required to invite client to portal'
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
        notes: formData.notes.trim() || undefined,
        meta_performance_vision:
          formData.meta_performance_vision.trim() || undefined,
      }

      // If onSubmit is provided, use it; otherwise handle internally
      if (onSubmit) {
        await onSubmit(clientData)
      } else if (mode === 'edit' && client) {
        // Handle update internally
        await ClientService.updateClient(client.id, clientData)
      } else if (mode === 'create') {
        // Handle create internally
        const createdClient = await ClientService.createClient(clientData)

        // Send invitation if checkbox is checked and email is provided
        if (
          formData.inviteToPortal &&
          formData.email.trim() &&
          createdClient?.id
        ) {
          try {
            const apiUrl =
              process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
            const response = await fetch(
              `${apiUrl}/clients/${createdClient.id}/invite`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                },
                body: JSON.stringify({ email: formData.email.trim() }),
              },
            )

            if (response.ok) {
              console.log(
                'Invitation sent successfully to:',
                formData.email.trim(),
              )
            } else {
              console.error('Failed to send invitation')
            }
          } catch (inviteError) {
            console.error('Failed to send invitation:', inviteError)
            // Continue even if invitation fails - client is created
          }
        }

        // Navigate to client details page after creation
        if (createdClient?.id) {
          onClose()
          router.push(`/clients/${createdClient.id}`)
          return
        }
      }

      // Call onSuccess callback if provided
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

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleDelete = async () => {
    if (!client?.id) return

    setIsDeleting(true)
    try {
      await ClientService.deleteClient(client.id)

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }

      // Close the main modal
      onClose()

      // Navigate back to clients page
      router.push('/clients')
      // Dialog will close when component unmounts
    } catch (error) {
      console.error('Error deleting client:', error)
      setErrors({ submit: 'Failed to delete client. Please try again.' })
      setShowDeleteDialog(false)
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 shadow-xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Add New Client' : 'Edit Client'}
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'create'
              ? 'Create a new client profile to track coaching sessions.'
              : 'Update client information and notes.'}
          </p>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 opacity-70 ring-offset-white transition-all hover:opacity-100 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-base font-medium text-gray-900"
            >
              Client Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleFieldChange('name', e.target.value)}
                className={`pl-11 py-2.5 ${
                  errors.name
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100'
                } rounded-lg transition-all`}
                placeholder="Enter client's full name"
                disabled={isLoading}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <div className="p-1 bg-gray-100 rounded">
                  <User className="h-3.5 w-3.5 text-gray-600" />
                </div>
              </div>
            </div>
            {errors.name && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-base font-medium text-gray-900"
            >
              Email Address{' '}
              <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => handleFieldChange('email', e.target.value)}
                className={`pl-11 py-2.5 ${
                  errors.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100'
                } rounded-lg transition-all`}
                placeholder="client@example.com"
                disabled={isLoading}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <div className="p-1 bg-gray-100 rounded">
                  <Mail className="h-3.5 w-3.5 text-gray-600" />
                </div>
              </div>
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                {errors.email}
              </p>
            )}
          </div>

          {/* Invite to Portal Checkbox */}
          {mode === 'create' && formData.email && (
            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Checkbox
                id="inviteToPortal"
                checked={formData.inviteToPortal}
                onCheckedChange={checked =>
                  setFormData(prev => ({
                    ...prev,
                    inviteToPortal: checked as boolean,
                  }))
                }
                disabled={isLoading}
                className="mt-0.5"
              />
              <div className="flex-1">
                <label
                  htmlFor="inviteToPortal"
                  className="text-sm font-medium text-gray-900 cursor-pointer flex items-center gap-2"
                >
                  <Send className="h-4 w-4 text-gray-600" />
                  Invite client to portal
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Send an email invitation to give this client access to their
                  coaching portal
                </p>
              </div>
            </div>
          )}

          {/* Notes Field */}
          <div className="space-y-2">
            <label
              htmlFor="notes"
              className="block text-base font-medium text-gray-900"
            >
              Notes{' '}
              <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => handleFieldChange('notes', e.target.value)}
                className="pl-11 min-h-[120px] resize-y"
                placeholder="Add background information, outcomes, or any relevant notes..."
                disabled={isLoading}
              />
              <div className="absolute left-3 top-3">
                <div className="p-1 bg-gray-100 rounded">
                  <FileText className="h-3.5 w-3.5 text-gray-600" />
                </div>
              </div>
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {formData.notes.length}/500
              </div>
            </div>
          </div>

          {/* Meta Performance Vision */}
          <div>
            <label
              htmlFor="meta_performance_vision"
              className="block text-base font-medium text-gray-900 mb-2"
            >
              Meta Performance Vision{' '}
              <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              The client&apos;s super long-term vision - their ultimate
              transformation and legacy
            </p>
            <Textarea
              id="meta_performance_vision"
              rows={5}
              value={formData.meta_performance_vision}
              onChange={e =>
                handleFieldChange('meta_performance_vision', e.target.value)
              }
              className="resize-y"
              placeholder="e.g., Build a legacy as an innovative leader who transforms organizational culture, inspires thousands through authentic leadership, and creates lasting impact that outlives their career..."
              disabled={isLoading}
            />
          </div>

          {/* Error message */}
          {errors.submit && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800 font-medium">
                {errors.submit}
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-100">
            {/* Delete Button for Edit Mode */}
            {mode === 'edit' && client && (
              <div className="mb-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                  disabled={isLoading || isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Client
                </Button>
              </div>
            )}

            {/* Main Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 rounded-lg py-2.5 transition-all"
                disabled={isLoading}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isLoading || !formData.name.trim()}
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white rounded-lg py-2.5 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  <>{mode === 'create' ? 'Create Client' : 'Save Changes'}</>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={open => {
          // Prevent closing while deleting
          if (!isDeleting) {
            setShowDeleteDialog(open)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <AlertDialogTitle>Delete Client</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to delete <strong>{client?.name}</strong>?
              </p>
              <p className="text-sm text-red-600 font-medium">
                This action cannot be undone. All associated sessions, notes,
                and coaching history will be permanently deleted.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Client
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
