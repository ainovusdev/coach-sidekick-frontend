'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Client } from '@/types/meeting'
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
} from 'lucide-react'

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Client>) => Promise<void>
  client?: Client | null
  mode: 'create' | 'edit'
}

export default function ClientModal({
  isOpen,
  onClose,
  onSubmit,
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
      await onSubmit({
        name: formData.name.trim(),
        notes: formData.notes.trim() || undefined,
      })
      onClose()
    } catch (error) {
      console.error('Error submitting client form:', error)
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-neutral-900">
            {mode === 'create' ? 'New Client' : 'Edit Client'}
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Name Field */}
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-neutral-700"
            >
              Name
            </label>
            <div className="relative">
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleFieldChange('name', e.target.value)}
                className={`pl-10 ${
                  errors.name
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-neutral-200 focus:border-neutral-400 focus:ring-0'
                }`}
                placeholder="Enter client name"
                disabled={isLoading}
              />
              <User className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
            </div>
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Notes Field */}
          <div className="space-y-2">
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-neutral-700"
            >
              Notes
            </label>
            <div className="relative">
              <textarea
                id="notes"
                value={formData.notes}
                onChange={e => handleFieldChange('notes', e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-neutral-200 rounded-lg focus:outline-none focus:ring-0 focus:border-neutral-400 min-h-[100px] resize-y"
                placeholder="Add any notes about the client..."
                disabled={isLoading}
              />
              <FileText className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-neutral-300 hover:bg-neutral-50 text-neutral-700"
              disabled={isLoading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Create' : 'Update'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}