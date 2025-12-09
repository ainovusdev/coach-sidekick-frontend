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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { GoalService, GoalCreate, Goal } from '@/services/goal-service'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'

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
  const queryClient = useQueryClient()
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
      toast.error('Vision title is required')
      return
    }

    setLoading(true)

    // Optimistic ID for new goal
    const optimisticId = `temp-${Date.now()}`

    try {
      if (mode === 'edit' && goal) {
        // Update existing goal
        const updateData = {
          title: formData.title,
          description: formData.description || undefined,
          category: formData.category,
          status: formData.status,
        }

        // Optimistic update
        queryClient.setQueryData(
          queryKeys.goals.list({ client_id: clientId }),
          (old: any[] = []) => {
            return old.map(g =>
              g.id === goal.id ? { ...g, ...updateData } : g,
            )
          },
        )

        await GoalService.updateGoal(goal.id, updateData)
        toast.success('Vision Updated', {
          description: 'The vision has been updated successfully',
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

        // Optimistic update - add goal immediately
        const optimisticGoal = {
          id: optimisticId,
          ...goalData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: '',
          progress: 0,
          target_date: null,
        }

        queryClient.setQueryData(
          queryKeys.goals.list({ client_id: clientId }),
          (old: any[] = []) => {
            return [...old, optimisticGoal]
          },
        )

        // Close modal and show immediately
        onOpenChange(false)
        toast.success('Vision Created', {
          description: 'The vision has been created successfully',
        })

        // Actual API call
        await GoalService.createGoal(goalData)

        // Invalidate to get the real data from server
        queryClient.invalidateQueries({
          queryKey: queryKeys.goals.all,
        })
      }

      onSuccess?.()
    } catch (error) {
      console.error(`Failed to ${mode} goal:`, error)

      // Rollback optimistic update on error
      if (mode === 'create') {
        queryClient.setQueryData(
          queryKeys.goals.list({ client_id: clientId }),
          (old: any[] = []) => {
            return old.filter(g => g.id !== optimisticId)
          },
        )
      }

      toast.error(`Failed to ${mode} vision`, {
        description: 'Please try again',
      })

      // Invalidate to sync with server state
      queryClient.invalidateQueries({
        queryKey: queryKeys.goals.all,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Vision' : 'Create New Vision'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Update the vision details'
              : 'Create a long-term vision for your client to work towards'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Vision Title *</Label>
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
                placeholder="What does success look like for this vision?"
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Category</Label>
              <RadioGroup
                value={formData.category}
                onValueChange={value =>
                  setFormData({ ...formData, category: value })
                }
              >
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'career', label: 'Career' },
                    { value: 'personal', label: 'Personal' },
                    { value: 'health', label: 'Health' },
                    { value: 'financial', label: 'Financial' },
                    { value: 'education', label: 'Education' },
                    { value: 'general', label: 'General' },
                  ].map(option => (
                    <div
                      key={option.value}
                      className={cn(
                        'flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-colors',
                        formData.category === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300',
                      )}
                      onClick={() =>
                        setFormData({ ...formData, category: option.value })
                      }
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label
                        htmlFor={option.value}
                        className="flex-1 cursor-pointer font-medium text-sm"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
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
                  ? 'Update Vision'
                  : 'Create Vision'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
