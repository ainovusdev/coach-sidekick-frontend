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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { TargetService } from '@/services/target-service'
import { TargetCreate } from '@/types/sprint'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
      toast.error('Please select a goal for this outcome')
      return
    }

    if (!sprintId) {
      toast.error('Please create a sprint first before adding outcomes')
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
      toast.success('Outcome Created', {
        description: 'The outcome has been added successfully',
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create outcome:', error)
      toast.error('Failed to create outcome', {
        description: 'Please check your inputs and try again',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Outcome</DialogTitle>
          <DialogDescription>
            Add a short-term outcome to track progress toward a goal
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Link to Goal *</Label>
              <RadioGroup
                value={formData.goal_id}
                onValueChange={value =>
                  setFormData({ ...formData, goal_id: value })
                }
              >
                <div className="space-y-2">
                  {goals.map(goal => (
                    <div
                      key={goal.id}
                      className={cn(
                        'flex items-center space-x-3 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors',
                        formData.goal_id === goal.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200',
                      )}
                      onClick={() =>
                        setFormData({ ...formData, goal_id: goal.id })
                      }
                    >
                      <RadioGroupItem value={goal.id} id={goal.id} />
                      <Label
                        htmlFor={goal.id}
                        className="flex-1 cursor-pointer font-medium"
                      >
                        {goal.title}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Outcome Title *</Label>
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
              {loading ? 'Creating...' : 'Create Outcome'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
