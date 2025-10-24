'use client'

import { useState, useEffect } from 'react'
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
import { User, FileText, Loader2, X } from 'lucide-react'

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
  const [formData, setFormData] = useState({
    name: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Reset form when modal opens or client changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: client?.name || '',
        notes: client?.notes || '',
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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      const clientData = {
        name: formData.name.trim(),
        notes: formData.notes.trim() || undefined,
      }

      // If onSubmit is provided, use it; otherwise handle internally
      if (onSubmit) {
        await onSubmit(clientData)
      } else if (mode === 'edit' && client) {
        // Handle update internally
        await ClientService.updateClient(client.id, clientData)
      } else if (mode === 'create') {
        // Handle create internally
        await ClientService.createClient(clientData)
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
              className="block text-sm font-medium text-gray-700"
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

          {/* Notes Field */}
          <div className="space-y-2">
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700"
            >
              Notes{' '}
              <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <textarea
                id="notes"
                value={formData.notes}
                onChange={e => handleFieldChange('notes', e.target.value)}
                className="w-full px-4 py-3 pl-11 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-400 min-h-[120px] resize-y transition-all"
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

          {/* Error message */}
          {errors.submit && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800 font-medium">
                {errors.submit}
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
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
        </form>
      </DialogContent>
    </Dialog>
  )
}
