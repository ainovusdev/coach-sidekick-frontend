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
import { Check } from 'lucide-react'
import { TargetService } from '@/services/target-service'
import { TargetCreate } from '@/types/sprint'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'

interface TargetFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sprintId?: string
  goals?: Array<{ id: string; title: string }>
  clientId?: string
  onSuccess?: () => void
}

export function TargetFormModal({
  open,
  onOpenChange,
  sprintId,
  goals = [],
  clientId: _clientId,
  onSuccess,
}: TargetFormModalProps) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'active' as const,
  })

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        title: '',
        description: '',
        status: 'active',
      })
      setSelectedGoalIds([])
    }
  }, [open, goals])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Outcome title is required')
      return
    }

    if (selectedGoalIds.length === 0) {
      toast.error('Please select at least one goal for this outcome')
      return
    }

    setLoading(true)

    // Optimistic ID for new outcome
    const optimisticId = `temp-${Date.now()}`

    try {
      const targetData: TargetCreate = {
        goal_ids: selectedGoalIds,
        sprint_ids: sprintId ? [sprintId] : [],
        title: formData.title,
        description: formData.description || undefined,
        status: formData.status,
      }

      // Optimistic update - add outcome immediately
      const optimisticOutcome = {
        id: optimisticId,
        ...targetData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        progress_percentage: 0,
        order_index: 0,
        commitment_count: 0,
        completed_commitment_count: 0,
        goal_titles: goals
          .filter(g => selectedGoalIds.includes(g.id))
          .map(g => g.title),
      }

      queryClient.setQueryData(queryKeys.targets.all, (old: any[] = []) => {
        return [...old, optimisticOutcome]
      })

      // Close modal and show immediately
      onOpenChange(false)
      toast.success('Outcome Created', {
        description: `The outcome has been linked to ${selectedGoalIds.length} goal(s)`,
      })

      // Actual API call
      await TargetService.createTarget(targetData)

      // Invalidate to get the real data from server
      queryClient.invalidateQueries({
        queryKey: queryKeys.targets.all,
      })

      onSuccess?.()
    } catch (error) {
      console.error('Failed to create outcome:', error)

      // Rollback optimistic update on error
      queryClient.setQueryData(queryKeys.targets.all, (old: any[] = []) => {
        return old.filter(t => t.id !== optimisticId)
      })

      toast.error('Failed to create outcome', {
        description: 'Please check your inputs and try again',
      })

      // Invalidate to sync with server state
      queryClient.invalidateQueries({
        queryKey: queryKeys.targets.all,
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
              <Label>Link to Goals * (select one or more)</Label>
              {goals.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {goals.map(goal => {
                    const isSelected = selectedGoalIds.includes(goal.id)
                    return (
                      <div
                        key={goal.id}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors',
                          isSelected
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white border-gray-300 hover:border-gray-400',
                        )}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedGoalIds(prev =>
                              prev.filter(id => id !== goal.id),
                            )
                          } else {
                            setSelectedGoalIds(prev => [...prev, goal.id])
                          }
                        }}
                      >
                        <div
                          className={cn(
                            'w-4 h-4 rounded border-2 flex items-center justify-center',
                            isSelected
                              ? 'bg-white border-white'
                              : 'bg-white border-gray-300',
                          )}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-primary" />
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          {goal.title}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No active goals</div>
              )}
              {selectedGoalIds.length > 0 && (
                <p className="text-xs text-gray-600">
                  {selectedGoalIds.length} goal
                  {selectedGoalIds.length !== 1 ? 's' : ''} selected
                </p>
              )}
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
