'use client'

import { useState, useEffect } from 'react'
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
import { TargetService } from '@/services/target-service'
import { TargetCreate } from '@/types/sprint'
import { toast } from 'sonner'

interface TargetFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sprintId: string
  goals: Array<{ id: string; title: string }>
  onSuccess?: () => void
}

export function TargetFormModal({
  open,
  onOpenChange,
  sprintId,
  goals,
  onSuccess,
}: TargetFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_id: '',
    status: 'active' as const,
  })

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        title: '',
        description: '',
        goal_id: goals[0]?.id || '',
        status: 'active',
      })
    }
  }, [open, goals])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Desired Win title is required')
      return
    }

    if (!formData.goal_id) {
      toast.error('Please select an outcome for this desired win')
      return
    }

    setLoading(true)
    try {
      const targetData: TargetCreate = {
        goal_id: formData.goal_id,
        sprint_id: sprintId,
        title: formData.title,
        description: formData.description || undefined,
        status: formData.status,
      }

      await TargetService.createTarget(targetData)
      toast.success('Desired Win Created', {
        description: 'The desired win has been added to the sprint',
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create target:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Desired Win</DialogTitle>
          <DialogDescription>
            Add a short-term desired win to this sprint
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="goal_id">Link to Outcome *</Label>
              <Select
                value={formData.goal_id}
                onValueChange={value =>
                  setFormData({ ...formData, goal_id: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an outcome" />
                </SelectTrigger>
                <SelectContent>
                  {goals.map(goal => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Desired Win Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Complete 3 weekly 1-on-1s"
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
                placeholder="What does success look like?"
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
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
              {loading ? 'Creating...' : 'Create Desired Win'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
