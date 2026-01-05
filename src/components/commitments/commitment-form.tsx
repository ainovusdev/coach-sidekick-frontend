'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Commitment,
  CommitmentCreate,
  CommitmentType,
  CommitmentPriority,
} from '@/types/commitment'
import { useGoals } from '@/hooks/queries/use-goals'
import { useSprints } from '@/hooks/queries/use-sprints'
import { useTargets } from '@/hooks/queries/use-targets'
import { useAuth } from '@/contexts/auth-context'
import { Check, User, Briefcase, CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [assigneeType, setAssigneeType] = useState<'client' | 'coach'>('client')
  const { user } = useAuth()
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
    assigned_to_id: undefined,
  })

  // Fetch goals, sprints, and targets (outcomes) for linking
  const { data: goals = [] } = useGoals(defaultClientId)
  const { data: sprints = [] } = useSprints({
    client_id: defaultClientId,
    status: 'active',
  })
  const { data: allTargets = [] } = useTargets()

  // Filter targets by client's goals (check goal_ids array)
  const clientTargets = allTargets.filter((t: any) =>
    goals.some((g: any) => t.goal_ids?.includes(g.id)),
  )

  // Load linked targets for existing commitment
  useEffect(() => {
    if (open && commitment) {
      setSelectedTargetIds(commitment.linked_target_ids || [])
    } else if (open) {
      setSelectedTargetIds([])
    }
  }, [open, commitment])

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
          goal_id: commitment.goal_id || null,
          sprint_id: commitment.sprint_id || null,
          assigned_to_id: commitment.assigned_to_id,
        })
        // Set assignee type based on existing commitment
        setAssigneeType(commitment.assigned_to_id ? 'coach' : 'client')
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
          goal_id: null,
          sprint_id: null,
          assigned_to_id: undefined,
        })
        setAssigneeType('client')
      }
    }
  }, [open, commitment, defaultClientId, defaultSessionId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Include selected targets (outcomes) only
      const dataWithLinks = {
        ...formData,
        target_ids:
          selectedTargetIds.length > 0 ? selectedTargetIds : undefined,
      }
      await onSubmit(dataWithLinks)
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

            {/* Assign To */}
            <div className="space-y-2">
              <Label>Assign To</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={assigneeType === 'client' ? 'default' : 'outline'}
                  onClick={() => {
                    setAssigneeType('client')
                    updateField('assigned_to_id', undefined)
                  }}
                  className="flex-1"
                >
                  <User className="h-4 w-4 mr-2" />
                  Client Task
                </Button>
                <Button
                  type="button"
                  variant={assigneeType === 'coach' ? 'default' : 'outline'}
                  onClick={() => {
                    setAssigneeType('coach')
                    updateField('assigned_to_id', user?.id)
                  }}
                  className="flex-1"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  My Task (Coach)
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {assigneeType === 'client'
                  ? 'This commitment is for your client to complete'
                  : 'This is your own action item related to this client'}
              </p>
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

            {/* Link to Outcomes (Checkbox Buttons) */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Link to Outcomes</Label>
              {clientTargets.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
                  {clientTargets.map((target: any) => {
                    const isSelected = selectedTargetIds.includes(target.id)
                    // Get first goal and sprint (targets can have multiple)
                    const goalInfo =
                      target.goal_ids?.length > 0
                        ? goals.find((g: any) => g.id === target.goal_ids[0])
                        : null
                    const sprintInfo =
                      target.sprint_ids?.length > 0
                        ? sprints.find(
                            (s: any) => s.id === target.sprint_ids[0],
                          )
                        : null

                    return (
                      <div
                        key={target.id}
                        className={cn(
                          'flex items-start gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors min-w-[200px]',
                          isSelected
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white border-gray-300 hover:border-gray-400 hover:bg-gray-50',
                        )}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTargetIds(prev =>
                              prev.filter(id => id !== target.id),
                            )
                          } else {
                            setSelectedTargetIds(prev => [...prev, target.id])
                          }
                        }}
                      >
                        <div
                          className={cn(
                            'w-4 h-4 rounded border-2 flex items-center justify-center mt-0.5',
                            isSelected
                              ? 'bg-white border-white'
                              : 'bg-white border-gray-300',
                          )}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {target.title}
                          </div>
                          <div
                            className={cn(
                              'text-xs mt-0.5',
                              isSelected ? 'opacity-90' : 'text-gray-600',
                            )}
                          >
                            {goalInfo && <div>Vision: {goalInfo.title}</div>}
                            {sprintInfo && (
                              <div>Sprint: {sprintInfo.title}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg">
                  No outcomes available. Create outcomes first.
                </div>
              )}
              {selectedTargetIds.length > 0 && (
                <p className="text-xs text-gray-600">
                  {selectedTargetIds.length} outcome
                  {selectedTargetIds.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Due Date - Always visible */}
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.target_date && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.target_date ? (
                      format(new Date(formData.target_date), 'PPP')
                    ) : (
                      <span>Pick a due date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      formData.target_date
                        ? new Date(formData.target_date)
                        : undefined
                    }
                    onSelect={date =>
                      updateField(
                        'target_date',
                        date ? format(date, 'yyyy-MM-dd') : undefined,
                      )
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Show More Details Toggle */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full text-gray-600 hover:text-gray-900"
            >
              {showAdvanced ? '▼ Hide Details' : '▶ Show More Details'}
            </Button>

            {/* Advanced Fields (Collapsible) */}
            {showAdvanced && (
              <div className="space-y-4 pt-4 border-t">
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

                {/* Start Date */}
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.start_date && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.start_date ? (
                          format(new Date(formData.start_date), 'PPP')
                        ) : (
                          <span>Pick a start date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          formData.start_date
                            ? new Date(formData.start_date)
                            : undefined
                        }
                        onSelect={date =>
                          updateField(
                            'start_date',
                            date ? format(date, 'yyyy-MM-dd') : undefined,
                          )
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
            )}
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
