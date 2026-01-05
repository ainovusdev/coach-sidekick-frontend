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
import { SprintService } from '@/services/sprint-service'
import { SprintCreate } from '@/types/sprint'
import { toast } from 'sonner'
import { addWeeks, format } from 'date-fns'
import { CalendarIcon, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { queryKeys } from '@/lib/query-client'
import { useTargets } from '@/hooks/queries/use-targets'
import { useGoals } from '@/hooks/queries/use-goals'

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
  const [selectedOutcomeIds, setSelectedOutcomeIds] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'active' as const, // Always default to active
  })

  // Fetch goals and targets for the client
  const { data: goals = [] } = useGoals(clientId)
  const { data: allTargets = [] } = useTargets()

  // Filter targets that belong to this client (via goals)
  const clientTargets = allTargets.filter((t: any) =>
    t.goal_ids?.some((gid: string) => goals.some((g: any) => g.id === gid)),
  )

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

    if (selectedOutcomeIds.length === 0) {
      toast.error('At least one outcome is required', {
        description:
          'Please select or create an outcome before creating a sprint',
      })
      return
    }

    setLoading(true)

    // Optimistic ID for new sprint
    const optimisticId = `temp-${Date.now()}`

    try {
      const sprintData: SprintCreate = {
        client_id: clientId,
        title: formData.title,
        description: formData.description || undefined,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        status: formData.status,
        target_ids: selectedOutcomeIds, // Required - linked outcomes
      }

      // Optimistic update - add sprint immediately
      const optimisticSprint = {
        id: optimisticId,
        ...sprintData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        progress_percentage: 0,
      }

      queryClient.setQueryData(
        queryKeys.sprints.list({ client_id: clientId }),
        (old: any[] = []) => {
          return [...old, optimisticSprint]
        },
      )

      // Close modal and show immediately
      onOpenChange(false)
      toast.success('Sprint Created', {
        description: 'The sprint has been created successfully',
      })

      // Reset form
      setFormData({
        title: '',
        description: '',
        status: 'active',
      })
      setStartDate(new Date())
      setEndDate(addWeeks(new Date(), 6))
      setSelectedOutcomeIds([])

      // Create sprint with linked outcomes (handled atomically by backend)
      await SprintService.createSprint(sprintData)

      // Invalidate sprint queries to get real data from server
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sprints.all,
      })

      // Also invalidate targets since we updated their sprint links
      await queryClient.invalidateQueries({
        queryKey: queryKeys.targets.all,
      })

      // Trigger success callback for any additional refresh needs
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create sprint:', error)

      // Rollback optimistic update on error
      queryClient.setQueryData(
        queryKeys.sprints.list({ client_id: clientId }),
        (old: any[] = []) => {
          return old.filter(s => s.id !== optimisticId)
        },
      )

      toast.error('Failed to create sprint', {
        description: 'Please try again',
      })

      // Invalidate to sync with server state
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sprints.all,
      })
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

            {/* Outcome Selection - Required */}
            <div className="space-y-3">
              <Label>Link Outcomes * (select at least one)</Label>
              {clientTargets.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
                  {clientTargets.map((outcome: any) => {
                    const isSelected = selectedOutcomeIds.includes(outcome.id)
                    const goalTitle =
                      outcome.goal_titles?.[0] || 'Unknown Vision'

                    return (
                      <div
                        key={outcome.id}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                          isSelected
                            ? 'bg-primary/5 border-primary'
                            : 'bg-white border-gray-200 hover:border-gray-300',
                        )}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedOutcomeIds(prev =>
                              prev.filter(id => id !== outcome.id),
                            )
                          } else {
                            setSelectedOutcomeIds(prev => [...prev, outcome.id])
                          }
                        }}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                            isSelected
                              ? 'bg-primary border-primary'
                              : 'border-gray-300',
                          )}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900">
                            {outcome.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Vision: {goalTitle}
                          </div>
                          {outcome.description && (
                            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {outcome.description}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-sm text-amber-700 p-4 border border-amber-200 rounded-lg bg-amber-50">
                  <strong>No outcomes available.</strong> You must create at
                  least one outcome before creating a sprint. Go to the Outcomes
                  section to create one first.
                </div>
              )}
              {selectedOutcomeIds.length > 0 && (
                <div className="text-xs text-gray-600">
                  {selectedOutcomeIds.length} outcome(s) selected
                </div>
              )}
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
            <Button
              type="submit"
              disabled={loading || clientTargets.length === 0}
              title={
                clientTargets.length === 0 ? 'Create outcomes first' : undefined
              }
            >
              {loading ? 'Creating...' : 'Create Sprint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
