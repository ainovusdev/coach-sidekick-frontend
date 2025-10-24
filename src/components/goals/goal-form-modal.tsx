'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { GoalService, GoalCreate, Goal } from '@/services/goal-service'
import { toast } from 'sonner'
import { useEffect } from 'react'

interface GoalFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  goal?: Goal | null
  mode?: 'create' | 'edit'
  onSuccess?: () => void
}

export function GoalFormModal({
  open,
  onOpenChange,
  clientId,
  goal,
  mode = 'create',
  onSuccess,
}: GoalFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'career',
    status: 'active',
  })

  // Load goal data when editing
  useEffect(() => {
    if (open && goal && mode === 'edit') {
      setFormData({
        title: goal.title,
        description: goal.description || '',
        category: goal.category,
        status: goal.status,
      })
    } else if (open && mode === 'create') {
      // Reset form for create mode
      setFormData({
        title: '',
        description: '',
        category: 'career',
        status: 'active',
      })
    }
  }, [open, goal, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Outcome title is required')
      return
    }

    setLoading(true)
    try {
      if (mode === 'edit' && goal) {
        // Update existing goal
        const updateData = {
          title: formData.title,
          description: formData.description || undefined,
          category: formData.category,
          status: formData.status,
        }

        await GoalService.updateGoal(goal.id, updateData)
        toast.success('Outcome Updated', {
          description: 'The outcome has been updated successfully',
        })
      } else {
        // Create new goal
        const goalData: GoalCreate = {
          client_id: clientId,
          title: formData.title,
          description: formData.description || undefined,
          category: formData.category,
          status: formData.status,
        }

        await GoalService.createGoal(goalData)
        toast.success('Outcome Created', {
          description: 'The outcome has been created successfully',
        })
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error(`Failed to ${mode} goal:`, error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Outcome' : 'Create New Outcome'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Update the outcome details'
              : 'Create a long-term outcome for your client to work towards'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Outcome Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Become an Effective Leader"
                value={formData.title}
                onChange={e =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What does success look like for this outcome?"
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={value =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="career">Career</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="relationship">Relationship</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={value =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? mode === 'edit'
                  ? 'Updating...'
                  : 'Creating...'
                : mode === 'edit'
                  ? 'Update Outcome'
                  : 'Create Outcome'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
