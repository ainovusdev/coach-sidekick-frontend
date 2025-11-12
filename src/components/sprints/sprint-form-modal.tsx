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
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { queryKeys } from '@/lib/query-client'

interface SprintFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  hasActiveSprint?: boolean
  activeSprintTitle?: string
  onEndCurrentSprint?: () => void
  onSuccess?: () => void
}

export function SprintFormModal({
  open,
  onOpenChange,
  clientId,
  hasActiveSprint = false,
  activeSprintTitle = '',
  onEndCurrentSprint,
  onSuccess,
}: SprintFormModalProps) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(addWeeks(new Date(), 6))
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'active' as const, // Always default to active
  })

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
            Create a 6-8 week sprint to organize outcomes and desired wins
          </DialogDescription>
        </DialogHeader>

        {/* Warning if active sprint exists */}
        {hasActiveSprint && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-orange-100 rounded">
                <svg
                  className="h-5 w-5 text-orange-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-orange-900 mb-1">
                  Active Sprint Exists
                </h4>
                <p className="text-sm text-orange-800 mb-3">
                  You have an active sprint:{' '}
                  <strong>{activeSprintTitle}</strong>
                </p>
                <p className="text-sm text-orange-700 mb-3">
                  You must end the current sprint before creating a new one.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onEndCurrentSprint?.()
                    onOpenChange(false)
                  }}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  End Current Sprint
                </Button>
              </div>
            </div>
          </div>
        )}

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
                disabled={hasActiveSprint}
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
                disabled={hasActiveSprint}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={hasActiveSprint}
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
                      disabled={hasActiveSprint}
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
            <Button type="submit" disabled={loading || hasActiveSprint}>
              {loading ? 'Creating...' : 'Create Sprint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
