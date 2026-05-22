'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { formatDate } from '@/lib/date-utils'
import { useCreateCommitment } from '@/hooks/mutations/use-commitment-mutations'
import { useSprints } from '@/hooks/queries/use-sprints'
import { useTargets } from '@/hooks/queries/use-targets'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
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
import { cn } from '@/lib/utils'
import { X, User, Briefcase, Calendar as CalendarIcon, Zap } from 'lucide-react'
import type {
  Commitment,
  CommitmentCreate,
  CommitmentPriority,
} from '@/types/commitment'

interface CommitmentCreatePanelProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: (commitment: Commitment) => void
  clientId: string
  sessionId?: string
}

export function CommitmentCreatePanel({
  isOpen,
  onClose,
  onCreated,
  clientId,
  sessionId,
}: CommitmentCreatePanelProps) {
  const { user, isCoach } = useAuth()
  const createCommitment = useCreateCommitment()
  const panelRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assigneeType, setAssigneeType] = useState<'client' | 'coach'>('client')
  const [priority, setPriority] = useState<CommitmentPriority>('medium')
  const [targetDate, setTargetDate] = useState<string | undefined>()
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([])
  const [selectedSprintIds, setSelectedSprintIds] = useState<string[]>([])
  const [dueDateOpen, setDueDateOpen] = useState(false)

  // Fetch sprints and targets for linking
  const { data: allSprints = [] } = useSprints({ client_id: clientId })
  const { data: clientTargets = [] } = useTargets({ client_id: clientId })

  // Reset form when panel opens
  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setDescription('')
      setAssigneeType('client')
      setPriority('medium')
      setTargetDate(undefined)
      setSelectedTargetIds([])
      setSelectedSprintIds([])
      // Focus title after panel animation
      setTimeout(() => titleInputRef.current?.focus(), 350)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleSubmit = async () => {
    if (!title.trim()) return

    const data: CommitmentCreate = {
      client_id: clientId,
      session_id: sessionId,
      title: title.trim(),
      description: description.trim() || undefined,
      type: 'commitment',
      priority,
      target_date: targetDate,
      assigned_to_id: assigneeType === 'coach' ? user?.id : undefined,
      target_ids: selectedTargetIds.length > 0 ? selectedTargetIds : undefined,
      metadata:
        selectedSprintIds.length > 0
          ? { linked_sprint_ids: selectedSprintIds }
          : undefined,
    }

    createCommitment.mutate(data, {
      onSuccess: newCommitment => {
        onCreated?.(newCommitment)
        onClose()
      },
    })
  }

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-overlay animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'fixed right-0 top-0 h-full w-full md:w-[640px] z-[70] bg-surface-1 border-l border-line shadow-2xl',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="h-full flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Header — Title + Close (mirrors PanelHeader) */}
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <Input
                    ref={titleInputRef}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Commitment title..."
                    className="text-xl font-bold border-none shadow-none focus-visible:ring-0 px-2 py-1 -mx-2 h-auto placeholder:text-ink-4 placeholder:font-bold"
                    maxLength={200}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Assign To — coach only */}
              {isCoach() && (
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant={
                        assigneeType === 'client' ? 'default' : 'outline'
                      }
                      onClick={() => setAssigneeType('client')}
                      className="flex-1"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Client Task
                    </Button>
                    <Button
                      type="button"
                      variant={assigneeType === 'coach' ? 'default' : 'outline'}
                      onClick={() => setAssigneeType('coach')}
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
              )}

              {/* Fields Grid — mirrors FieldsGrid from detail panel */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-paper rounded-lg">
                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-ink-3 ">
                    Priority
                  </label>
                  <Select
                    value={priority}
                    onValueChange={value =>
                      setPriority(value as CommitmentPriority)
                    }
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn('w-2 h-2 rounded-full', 'bg-line')}
                          />
                          Low
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full',
                              'bg-amber-token',
                            )}
                          />
                          Medium
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full',
                              'bg-amber-token',
                            )}
                          />
                          High
                        </div>
                      </SelectItem>
                      <SelectItem value="urgent">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full',
                              'bg-vermillion',
                            )}
                          />
                          Urgent
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Due Date */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-ink-3 ">
                    Due Date
                  </label>
                  <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'h-9 w-full justify-start text-left text-sm font-normal',
                          !targetDate && 'text-ink-3',
                        )}
                      >
                        <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                        {targetDate
                          ? formatDate(targetDate, 'MMM d, yyyy')
                          : 'Set date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={targetDate ? new Date(targetDate) : undefined}
                        onSelect={date => {
                          setTargetDate(
                            date ? format(date, 'yyyy-MM-dd') : undefined,
                          )
                          setDueDateOpen(false)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Outcomes — tag UI matching LinkedOutcomesSection */}
              {clientTargets.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-ink-2 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-ds-accent" />
                    Meta Performance Outcomes
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {clientTargets.map((target: any) => {
                      const isSelected = selectedTargetIds.includes(target.id)
                      return (
                        <button
                          key={target.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTargetIds(prev =>
                                prev.filter(id => id !== target.id),
                              )
                            } else {
                              setSelectedTargetIds(prev => [...prev, target.id])
                            }
                          }}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
                            isSelected
                              ? 'bg-ds-accent-bg text-ds-accent border-ds-accent '
                              : 'bg-surface-1 text-ink-3 border-line hover:border-ds-accent hover:text-ds-accent ',
                          )}
                        >
                          {isSelected && (
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                          {target.title}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Sprints — tag UI matching LinkedOutcomesSection */}
              {allSprints.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-ink-2 flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5 text-forest" />
                    Sprints
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {allSprints.map((sprint: any) => {
                      const isLinked = selectedSprintIds.includes(sprint.id)
                      return (
                        <button
                          key={sprint.id}
                          type="button"
                          onClick={() => {
                            if (isLinked) {
                              setSelectedSprintIds(prev =>
                                prev.filter(id => id !== sprint.id),
                              )
                            } else {
                              setSelectedSprintIds(prev => [...prev, sprint.id])
                            }
                          }}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
                            isLinked
                              ? 'bg-forest-bg text-forest border-forest '
                              : 'bg-surface-1 text-ink-3 border-line hover:border-forest hover:text-forest ',
                          )}
                        >
                          {isLinked && (
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                          {sprint.status === 'active' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-forest" />
                          )}
                          {sprint.title}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Description — mirrors DescriptionSection with RichTextEditor */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-ink-2 ">
                  Description
                </label>
                <RichTextEditor
                  content={description}
                  onChange={setDescription}
                  placeholder="Add a description..."
                  minHeight="100px"
                />
              </div>
            </div>
          </ScrollArea>

          {/* Sticky Footer */}
          <div className="border-t border-line p-4 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || createCommitment.isPending}
            >
              {createCommitment.isPending ? 'Creating...' : 'Create Commitment'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
