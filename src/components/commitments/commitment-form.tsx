'use client'

import React, { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Commitment,
  CommitmentCreate,
  CommitmentType,
  CommitmentPriority,
} from '@/types/commitment'

interface CommitmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CommitmentCreate) => Promise<void>
  commitment?: Commitment | null
  clientId?: string
  sessionId?: string
}

const typeOptions: { value: CommitmentType; label: string }[] = [
  { value: 'action', label: 'Action - One-time task' },
  { value: 'habit', label: 'Habit - Recurring behavior' },
  { value: 'milestone', label: 'Milestone - Major achievement' },
  { value: 'learning', label: 'Learning - Skill/knowledge to acquire' },
]

const priorityOptions: { value: CommitmentPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export function CommitmentForm({
  open,
  onOpenChange,
  onSubmit,
  commitment,
  clientId: defaultClientId,
  sessionId: defaultSessionId,
}: CommitmentFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CommitmentCreate>({
    client_id: defaultClientId || '',
    session_id: defaultSessionId,
    title: '',
    description: '',
    type: 'action',
    priority: 'medium',
    start_date: undefined,
    target_date: undefined,
    measurement_criteria: '',
  })

  // Reset form when dialog opens/closes or commitment changes
  useEffect(() => {
    if (open) {
      if (commitment) {
        setFormData({
          client_id: commitment.client_id,
          session_id: commitment.session_id,
          title: commitment.title,
          description: commitment.description || '',
          type: commitment.type,
          priority: commitment.priority,
          start_date: commitment.start_date,
          target_date: commitment.target_date,
          measurement_criteria: commitment.measurement_criteria || '',
        })
      } else {
        setFormData({
          client_id: defaultClientId || '',
          session_id: defaultSessionId,
          title: '',
          description: '',
          type: 'action',
          priority: 'medium',
          start_date: undefined,
          target_date: undefined,
          measurement_criteria: '',
        })
      }
    }
  }, [open, commitment, defaultClientId, defaultSessionId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save commitment:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateField = <K extends keyof CommitmentCreate>(
    field: K,
    value: CommitmentCreate[K],
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {commitment ? 'Edit Commitment' : 'Create New Commitment'}
          </DialogTitle>
          <DialogDescription>
            {commitment
              ? 'Update the commitment details below'
              : 'Create a new commitment for your client'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => updateField('title', e.target.value)}
                placeholder="e.g., Exercise 3 times per week"
                required
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => updateField('description', e.target.value)}
                placeholder="Add more context about this commitment..."
                rows={3}
              />
            </div>

            {/* Type and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={value =>
                    updateField('type', value as CommitmentType)
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={value =>
                    updateField('priority', value as CommitmentPriority)
                  }
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date || ''}
                  onChange={e =>
                    updateField('start_date', e.target.value || undefined)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_date">Target Date</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={formData.target_date || ''}
                  onChange={e =>
                    updateField('target_date', e.target.value || undefined)
                  }
                />
              </div>
            </div>

            {/* Measurement Criteria */}
            <div className="space-y-2">
              <Label htmlFor="measurement_criteria">Success Criteria</Label>
              <Textarea
                id="measurement_criteria"
                value={formData.measurement_criteria}
                onChange={e =>
                  updateField('measurement_criteria', e.target.value)
                }
                placeholder="How will success be measured?"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Define clear, measurable criteria for success
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title}>
              {loading ? 'Saving...' : commitment ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
