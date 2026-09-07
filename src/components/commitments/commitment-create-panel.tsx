'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { format } from 'date-fns'
import { formatDateOnly, parseDateForPicker } from '@/lib/date-utils'
import { useCreateCommitment } from '@/hooks/mutations/use-commitment-mutations'
import { useSprints } from '@/hooks/queries/use-sprints'
import { useTargets } from '@/hooks/queries/use-targets'
import { useClient } from '@/hooks/queries/use-clients'
import { useAuth } from '@/contexts/auth-context'
import { useViewerId } from '@/hooks/use-viewer-id'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
import ClientSelector from '@/components/clients/client-selector'
import {
  PersonPicker,
  type PickedPerson,
} from '@/components/people/person-picker'
import { assigneeHint } from '@/lib/commitments/assignee'
import {
  COMMITMENT_PRIORITY_LABEL,
  COMMITMENT_PRIORITY_TONE,
} from '@/lib/commitments/labels'
import { TONE_DOT } from '@/lib/tone'
import { cn } from '@/lib/utils'
import { X, Calendar as CalendarIcon, Zap, Lock } from 'lucide-react'
import type {
  Commitment,
  CommitmentCreate,
  CommitmentPriority,
} from '@/types/commitment'

/** The client a commitment is about — enough to offer "the client themself". */
export interface CreatePanelClient {
  id: string
  name: string | null
  email?: string | null
  /** Their login, when they have one. */
  user_id?: string | null
}

interface CommitmentCreatePanelProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: (commitment: Commitment) => void
  /** Optional: a commitment can be about a client, a sandbox, or just a person. */
  clientId?: string
  /** Pass when the caller already has the client; saves a fetch. */
  client?: CreatePanelClient | null
  sessionId?: string
  /** Where the panel sits. A sandbox offers the private-visibility switch. */
  context?: { sandboxId?: string; sandboxName?: string | null }
  /** The client portal: the viewer is the client themself. Detected from the URL when omitted. */
  clientMode?: boolean
  /** Pre-pick someone (e.g. an admin's "for Marcus" button). */
  defaultAssignee?: PickedPerson | null
  /** Sandbox context: start with the private switch on (our side, their side present). */
  defaultPrivate?: boolean
}

export function CommitmentCreatePanel({
  isOpen,
  onClose,
  onCreated,
  clientId,
  client,
  sessionId,
  context,
  clientMode,
  defaultAssignee,
  defaultPrivate = false,
}: CommitmentCreatePanelProps) {
  const { user } = useAuth()
  const userId = useViewerId()
  const pathname = usePathname()
  const portal = clientMode ?? !!pathname?.startsWith('/client-portal')
  const createCommitment = useCreateCommitment()
  const panelRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<CommitmentPriority>('medium')
  const [targetDate, setTargetDate] = useState<string | undefined>()
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([])
  const [selectedSprintIds, setSelectedSprintIds] = useState<string[]>([])
  const [dueDateOpen, setDueDateOpen] = useState(false)
  const [isPrivate, setIsPrivate] = useState(defaultPrivate)

  // Client: fixed by the caller, or picked here when the panel has none.
  const [pickedClient, setPickedClient] = useState<CreatePanelClient | null>(
    null,
  )
  const effectiveClientId = clientId ?? pickedClient?.id

  // The client's name/login when the caller only gave an id. Never from the
  // portal — a coachee can't read /clients/{id}, and doesn't need to.
  const { data: fetchedClient } = useClient(
    !portal && !client && clientId ? clientId : undefined,
  )
  const clientOption = useMemo<CreatePanelClient | null>(() => {
    if (client) return client
    if (pickedClient) return pickedClient
    if (fetchedClient) {
      return {
        id: fetchedClient.id,
        name: fetchedClient.name,
        email: fetchedClient.email ?? null,
        user_id: fetchedClient.user_id ?? null,
      }
    }
    return clientId ? { id: clientId, name: null } : null
  }, [client, pickedClient, fetchedClient, clientId])

  // Assignee: the client by default (or "you" in the portal); a person once picked.
  const [assignee, setAssignee] = useState<PickedPerson | null>(null)
  const [assigneeTouched, setAssigneeTouched] = useState(false)
  const defaultPick = useMemo<PickedPerson | null>(() => {
    if (defaultAssignee !== undefined) return defaultAssignee
    if (portal) {
      return userId
        ? {
            user_id: userId,
            name: user?.full_name ?? null,
            email: user?.email ?? null,
            has_account: true,
          }
        : null
    }
    if (clientOption) {
      return {
        user_id: null,
        client_id: clientOption.id,
        name: clientOption.name,
        email: clientOption.email ?? null,
        has_account: !!clientOption.user_id,
      }
    }
    return null
  }, [defaultAssignee, portal, userId, user, clientOption])
  const effectiveAssignee = assigneeTouched ? assignee : defaultPick
  const pickIsClient =
    !!effectiveAssignee &&
    (!effectiveAssignee.user_id ||
      (!!clientOption?.user_id &&
        effectiveAssignee.user_id === clientOption.user_id))
  const hint = effectiveAssignee
    ? assigneeHint(effectiveAssignee, userId, pickIsClient)
    : 'No one yet — it stays unassigned.'

  // Sprints and outcomes only exist against a client.
  const linkFilters = effectiveClientId
    ? { client_id: effectiveClientId }
    : undefined
  const linkOpts = { enabled: !!effectiveClientId }
  const { data: allSprints = [] } = useSprints(linkFilters, linkOpts)
  const { data: clientTargets = [] } = useTargets(linkFilters, linkOpts)

  // Reset form when panel opens
  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setTargetDate(undefined)
      setSelectedTargetIds([])
      setSelectedSprintIds([])
      setIsPrivate(defaultPrivate)
      setPickedClient(null)
      setAssignee(null)
      setAssigneeTouched(false)
      // Focus title after panel animation
      setTimeout(() => titleInputRef.current?.focus(), 350)
    }
  }, [isOpen, defaultPrivate])

  // Close on Escape — unless a picker or menu inside already took it.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // A commitment needs an anchor: a client, a sandbox, or a person.
  const anchored =
    !!effectiveClientId || !!context?.sandboxId || !!effectiveAssignee?.user_id
  const canSubmit = !!title.trim() && anchored && !createCommitment.isPending

  const handleSubmit = async () => {
    if (!canSubmit) return

    const data: CommitmentCreate = {
      client_id: effectiveClientId ?? null,
      sandbox_id: context?.sandboxId ?? null,
      session_id: sessionId,
      title: title.trim(),
      description: description.trim() || undefined,
      type: 'commitment',
      priority,
      target_date: targetDate,
      // null = the client themself (login or not); a user id = that person.
      assigned_to_id: effectiveAssignee?.user_id ?? null,
      visibility: context?.sandboxId && isPrivate ? 'private' : 'shared',
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
        data-testid="commitment-create-panel"
        aria-hidden={!isOpen}
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
                    data-testid="commitment-title-input"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 shrink-0"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Who + where */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-ink-3">
                    Assign to
                  </Label>
                  <PersonPicker
                    value={effectiveAssignee}
                    onChange={next => {
                      setAssignee(next)
                      setAssigneeTouched(true)
                    }}
                    context={{
                      clientId: effectiveClientId ?? null,
                      sandboxId: context?.sandboxId ?? null,
                    }}
                    clientOption={
                      clientOption && !portal
                        ? {
                            client_id: clientOption.id,
                            name: clientOption.name,
                            email: clientOption.email ?? null,
                            user_id: clientOption.user_id ?? null,
                          }
                        : null
                    }
                    allowClear={!clientOption}
                    contentClassName="z-[80]"
                    className="w-full"
                    data-testid="create-assignee-picker"
                  />
                  <p className="text-xs text-ink-3" data-testid="assignee-hint">
                    {hint}
                  </p>
                </div>

                {/* Client — optional when the caller didn't fix one */}
                {!clientId && !portal && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-ink-3">
                      Client <span className="text-ink-4">· optional</span>
                    </Label>
                    <ClientSelector
                      selectedClientId={pickedClient?.id}
                      placeholder="No client"
                      allowNone
                      onClientSelect={c => {
                        setPickedClient(
                          c
                            ? {
                                id: c.id,
                                name: c.name,
                                email: c.email ?? null,
                                user_id: c.user_id ?? null,
                              }
                            : null,
                        )
                        // A new client means a new default assignee.
                        setAssigneeTouched(false)
                        setAssignee(null)
                      }}
                    />
                  </div>
                )}

                {context?.sandboxId && (
                  <div className="space-y-2 sm:col-span-2">
                    <label className="flex items-start gap-2 text-sm text-ink-2 cursor-pointer">
                      <Checkbox
                        checked={isPrivate}
                        onCheckedChange={v => setIsPrivate(v === true)}
                        className="mt-0.5"
                        data-testid="create-private-toggle"
                      />
                      <span className="inline-flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-ink-3" />
                        Only people on this commitment can see it
                      </span>
                    </label>
                    <p className="text-xs text-ink-3 pl-6">
                      Otherwise our whole team on{' '}
                      {context.sandboxName || 'the sandbox'} can.
                    </p>
                  </div>
                )}
              </div>

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
                    <SelectContent className="z-[80]">
                      {(
                        Object.keys(
                          COMMITMENT_PRIORITY_LABEL,
                        ) as CommitmentPriority[]
                      ).map(p => (
                        <SelectItem key={p} value={p}>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                'w-2 h-2 rounded-full',
                                TONE_DOT[COMMITMENT_PRIORITY_TONE[p]],
                              )}
                            />
                            {COMMITMENT_PRIORITY_LABEL[p]}
                          </div>
                        </SelectItem>
                      ))}
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
                          ? formatDateOnly(targetDate, 'MMM d, yyyy')
                          : 'Set date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[80]" align="start">
                      <Calendar
                        mode="single"
                        selected={parseDateForPicker(targetDate)}
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

              {/* Outcomes — only against a client */}
              {effectiveClientId && clientTargets.length > 0 && (
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
                          {isSelected && <CheckMark />}
                          {target.title}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Sprints — only against a client */}
              {effectiveClientId && allSprints.length > 0 && (
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
                          {isLinked && <CheckMark />}
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
          <div className="border-t border-line p-4 flex items-center justify-between gap-3">
            <p className="text-xs text-ink-3 min-w-0 truncate">
              {!anchored && title.trim()
                ? 'Pick a person or a client first.'
                : ''}
            </p>
            <div className="flex gap-3 shrink-0">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                data-testid="commitment-create-submit"
              >
                {createCommitment.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function CheckMark() {
  return (
    <svg
      className="h-3 w-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}
