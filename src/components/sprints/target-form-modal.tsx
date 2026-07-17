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
import { DueDateField } from '@/components/ui/due-date-field'
import { Check } from 'lucide-react'
import { TargetService } from '@/services/target-service'
import { TargetCreate, TargetUpdate } from '@/types/sprint'
import { toast } from 'sonner'
import posthog from 'posthog-js'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'

interface TargetFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  sprintId?: string
  goals?: Array<{ id: string; title: string }>
  onSuccess?: () => void
  target?: any
  mode?: 'create' | 'edit'
}

export function TargetFormModal({
  open,
  onOpenChange,
  clientId,
  sprintId,
  goals = [],
  onSuccess,
  target,
  mode = 'create',
}: TargetFormModalProps) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_date: null as string | null,
    status: 'active' as const,
  })

  const isEdit = mode === 'edit' && !!target

  // Reset form when modal opens — populate for edit
  useEffect(() => {
    if (open) {
      if (isEdit) {
        setFormData({
          title: target.title || '',
          description: target.description || '',
          target_date: target.target_date ?? null,
          status: target.status || 'active',
        })
        setSelectedGoalIds(target.goal_ids || [])
      } else {
        setFormData({
          title: '',
          description: '',
          target_date: null,
          status: 'active',
        })
        setSelectedGoalIds([])
      }
    }
  }, [open, goals, isEdit, target])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Outcome title is required')
      return
    }

    setLoading(true)

    try {
      if (isEdit) {
        const updateData: TargetUpdate = {
          title: formData.title,
          description: formData.description || undefined,
          target_date: formData.target_date ?? null,
          status: formData.status,
          goal_ids: selectedGoalIds,
        }

        await TargetService.updateTarget(target.id, updateData)

        onOpenChange(false)
        toast.success('Outcome Updated')

        queryClient.invalidateQueries({
          queryKey: queryKeys.targets.all,
        })

        onSuccess?.()
      } else {
        // Optimistic ID for new outcome
        const optimisticId = `temp-${Date.now()}`

        const targetData: TargetCreate = {
          client_id: clientId,
          goal_ids: selectedGoalIds,
          sprint_ids: sprintId ? [sprintId] : [],
          title: formData.title,
          description: formData.description || undefined,
          target_date: formData.target_date ?? null,
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
          description:
            selectedGoalIds.length > 0
              ? `The outcome has been linked to ${selectedGoalIds.length} vision(s)`
              : undefined,
        })

        // Actual API call
        await TargetService.createTarget(targetData)

        posthog.capture('target_created', {
          client_id: clientId,
          goal_link_count: selectedGoalIds.length,
          has_target_date: !!formData.target_date,
          status: formData.status,
        })

        // Invalidate to get the real data from server
        queryClient.invalidateQueries({
          queryKey: queryKeys.targets.all,
        })

        onSuccess?.()
      }
    } catch (error) {
      console.error(`Failed to ${isEdit ? 'update' : 'create'} outcome:`, error)

      if (!isEdit) {
        // Rollback optimistic update on error
        queryClient.setQueryData(queryKeys.targets.all, (old: any[] = []) => {
          return old.filter(t => !t.id.startsWith('temp-'))
        })
      }

      toast.error(`Failed to ${isEdit ? 'update' : 'create'} outcome`, {
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
          <DialogTitle>
            {isEdit ? 'Edit Outcome' : 'Add a contract outcome'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the outcome details'
              : 'Add a short-term outcome to track progress toward a vision'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Link to Vision (optional)</Label>
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
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-surface-1 border-line-strong hover:border-line-strong ',
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
                              ? 'bg-surface-1 border-paper'
                              : 'bg-surface-1 border-line-strong',
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
                <div className="text-sm text-ink-3 ">No active visions</div>
              )}
              {selectedGoalIds.length > 0 && (
                <p className="text-xs text-ink-3 ">
                  {selectedGoalIds.length} vision
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

            <DueDateField
              id="outcome-due-date"
              value={formData.target_date}
              onChange={value =>
                setFormData({ ...formData, target_date: value })
              }
            />
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
                ? isEdit
                  ? 'Saving...'
                  : 'Creating...'
                : isEdit
                  ? 'Save Changes'
                  : 'Create Outcome'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
