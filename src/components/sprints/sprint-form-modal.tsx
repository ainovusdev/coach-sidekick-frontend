'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
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
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SprintService } from '@/services/sprint-service'
import { SprintCreate } from '@/types/sprint'
import { useGoals } from '@/hooks/queries/use-goals'
import { GoalFormModal } from '@/components/goals/goal-form-modal'
import { toast } from 'sonner'
import { addWeeks, format } from 'date-fns'
import { CalendarIcon, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { queryKeys } from '@/lib/query-client'

interface SprintFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  onSuccess?: () => void
}

export function SprintFormModal({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: SprintFormModalProps) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(addWeeks(new Date(), 6))
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'active' as const, // Always default to active
    goal_id: null as string | null,
  })

  // Fetch active goals for the client
  const {
    data: goals = [],
    isLoading: goalsLoading,
    refetch: refetchGoals,
  } = useGoals(clientId)

  const handleGoalSelect = (value: string) => {
    if (value === 'create-new') {
      setIsGoalModalOpen(true)
    } else {
      setFormData({
        ...formData,
        goal_id: value === 'none' ? null : value,
      })
    }
  }

  const handleGoalCreated = () => {
    // Refetch goals to get the new goal
    refetchGoals()
    setIsGoalModalOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Sprint title is required')
      return
    }

    if (endDate <= startDate) {
      toast.error('End date must be after start date')
      return
    }

    setLoading(true)
    try {
      const sprintData: SprintCreate = {
        client_id: clientId,
        title: formData.title,
        description: formData.description || undefined,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        status: formData.status,
        goal_id: formData.goal_id || undefined,
      }

      await SprintService.createSprint(sprintData)

      // Invalidate sprint queries to refresh data across all components
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sprints.all,
      })

      toast.success('Sprint Created', {
        description: 'The sprint has been created successfully',
      })

      // Reset form
      setFormData({
        title: '',
        description: '',
        status: 'active',
        goal_id: null,
      })
      setStartDate(new Date())
      setEndDate(addWeeks(new Date(), 6))

      onOpenChange(false)

      // Trigger success callback for any additional refresh needs
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create sprint:', error)
      toast.error('Failed to create sprint')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Sprint</DialogTitle>
          <DialogDescription>
            Create a 6-8 week sprint to organize outcomes and desired wins. You
            can run multiple sprints concurrently.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Sprint Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Q4 2025 Growth Sprint"
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
                placeholder="What are the main focus areas for this sprint?"
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Goal Selector */}
            <div className="space-y-2">
              <Label htmlFor="goal">
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-600" />
                  Link to Goal (Optional)
                </span>
              </Label>
              <Select
                value={formData.goal_id || 'none'}
                onValueChange={handleGoalSelect}
              >
                <SelectTrigger id="goal" disabled={goalsLoading}>
                  <SelectValue placeholder="Select a goal to link..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-gray-500">No goal</span>
                  </SelectItem>
                  {goals
                    .filter((g: any) => g.status === 'active')
                    .map((goal: any) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{goal.title}</span>
                          {goal.target_date && (
                            <span className="text-xs text-gray-500">
                              Due:{' '}
                              {format(
                                new Date(goal.target_date),
                                'MMM d, yyyy',
                              )}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  {goals.filter((g: any) => g.status === 'active').length ===
                    0 && (
                    <SelectItem value="no-goals" disabled>
                      <span className="text-gray-400 text-sm">
                        No active goals found
                      </span>
                    </SelectItem>
                  )}
                  <SelectItem
                    value="create-new"
                    className="border-t border-gray-200 mt-1 pt-2"
                  >
                    <span className="text-primary font-medium">
                      + Create New Goal
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Link this sprint to a specific goal to track progress toward
                that outcome
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !startDate && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? (
                        format(startDate, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={date => date && setStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !endDate && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? (
                        format(endDate, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={date => date && setEndDate(date)}
                      initialFocus
                      disabled={date => date < startDate}
                    />
                  </PopoverContent>
                </Popover>
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
              {loading ? 'Creating...' : 'Create Sprint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Goal Creation Modal */}
      <GoalFormModal
        open={isGoalModalOpen}
        onOpenChange={setIsGoalModalOpen}
        clientId={clientId}
        onSuccess={handleGoalCreated}
      />
    </Dialog>
  )
}
