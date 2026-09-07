'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CommitmentService } from '@/services/commitment-service'
import { ClientCommitmentService } from '@/services/client-commitment-service'
import {
  useAddMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  useUploadAttachment,
  useDeleteAttachment,
} from '@/hooks/mutations/use-commitment-mutations'
import {
  useClientAddMilestone,
  useClientUpdateMilestone,
  useClientDeleteMilestone,
  useClientUploadAttachment,
  useClientDeleteAttachment,
} from '@/hooks/mutations/use-client-commitment-mutations'
import { queryKeys } from '@/lib/query-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { CommentThread } from '@/components/comments/comment-thread'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AutomaticChip } from './automatic-chip'
import { tomorrowIso } from '@/lib/commitments/automatic'
import { cn } from '@/lib/utils'
import {
  formatDate,
  formatDateOnly,
  parseDateForPicker,
} from '@/lib/date-utils'
import {
  X,
  MoreVertical,
  BellOff,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Sparkles,
  Clock,
  Paperclip,
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  File,
  Loader2,
  Zap,
  Maximize2,
  Link as LinkIcon,
  Lock,
} from 'lucide-react'
import type {
  Commitment,
  CommitmentAttachment,
  CommitmentPriority,
  Milestone,
} from '@/types/commitment'
import {
  PersonPicker,
  type PickedPerson,
} from '@/components/people/person-picker'
import { AssigneeChip } from '@/components/people/assignee-chip'
import { assigneeFromPick, assigneeOf } from '@/lib/commitments/assignee'
import {
  COMMITMENT_PRIORITY_LABEL,
  COMMITMENT_PRIORITY_TONE,
  COMMITMENT_STATUS_LABEL,
  COMMITMENT_STATUS_TONE,
  SETTABLE_STATUSES,
  TONE_CHIP,
  statusInfo,
} from '@/lib/commitments/labels'
import { TONE_DOT } from '@/lib/tone'
import { TargetService } from '@/services/target-service'
import { LiveMeetingService } from '@/services/live-meeting-service'
import { useTargets } from '@/hooks/queries/use-targets'
import { useSprints } from '@/hooks/queries/use-sprints'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'
import { useConfetti } from '@/hooks/use-confetti'

import {
  useCommitmentDetail,
  type GuestContext,
} from './detail/use-commitment-detail'
import { copyCommitmentLink } from './detail/commitment-links'

// Re-exported so the six existing mount sites keep importing GuestContext from
// here unchanged; the definition now lives with the shared controller.
export type { GuestContext }

interface CommitmentDetailPanelProps {
  commitmentId: string | null
  clientId?: string
  onClose: () => void
  onCommitmentUpdate?: () => void
  guestContext?: GuestContext
  clientMode?: boolean
  /** Show the "open full page" affordance. Coach surfaces only. */
  onOpenInPage?: () => void
}

export function CommitmentDetailPanel({
  commitmentId,
  clientId: clientIdProp,
  onClose,
  onCommitmentUpdate,
  guestContext,
  clientMode,
  onOpenInPage,
}: CommitmentDetailPanelProps) {
  // All data + mutation logic is shared with the /commitments/[id] page.
  const {
    commitment,
    isLoading,
    capabilities,
    handleFieldUpdate,
    handleFieldsUpdate,
    handleDelete,
  } = useCommitmentDetail({
    commitmentId,
    clientId: clientIdProp,
    guestContext,
    clientMode,
    onCommitmentUpdate,
    onDeleted: onClose,
  })

  const panelRef = useRef<HTMLDivElement>(null)

  // Deep link from a notification: `?open=<id>&comment=<cid>` (hub) or
  // `?commitment=<id>&comment=<cid>` (portal dashboard). Read once per open.
  const [highlightCommentId, setHighlightCommentId] = useState<string | null>(
    null,
  )
  useEffect(() => {
    if (!commitmentId) {
      setHighlightCommentId(null)
      return
    }
    setHighlightCommentId(
      new URLSearchParams(window.location.search).get('comment'),
    )
  }, [commitmentId])

  // Close on Escape. Panel-only: on the page route this would navigate away,
  // which is hostile.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // A picker or menu inside that already took Escape leaves the panel open.
      if (e.key === 'Escape' && !e.defaultPrevented) onClose()
    }
    if (commitmentId) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [commitmentId, onClose])

  const isOpen = !!commitmentId

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
        data-testid="commitment-detail-panel"
        data-open={isOpen ? 'true' : 'false'}
        className={cn(
          'fixed right-0 top-0 h-full w-full md:w-[640px] z-[70] bg-surface-1 border-l border-line shadow-2xl',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="h-full flex flex-col">
          {isLoading ? (
            <PanelSkeleton />
          ) : commitment ? (
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Header */}
                <PanelHeader
                  commitment={commitment}
                  onClose={onClose}
                  onFieldUpdate={handleFieldUpdate}
                  onDelete={handleDelete}
                  onOpenInPage={
                    capabilities.canOpenInPage ? onOpenInPage : undefined
                  }
                  onCopyLink={
                    capabilities.canOpenInPage
                      ? () => copyCommitmentLink(commitment.id)
                      : undefined
                  }
                />

                {/* Fields Grid */}
                <FieldsGrid
                  commitment={commitment}
                  onFieldUpdate={handleFieldUpdate}
                  onFieldsUpdate={handleFieldsUpdate}
                />

                {/* Linked Meta Performance Outcomes & Sprints - hidden in client mode (no client-portal TargetService) and for commitments with no client */}
                {!clientMode && commitment.client_id && (
                  <LinkedOutcomesSection
                    commitment={commitment}
                    commitmentId={commitmentId!}
                    onCommitmentUpdate={onCommitmentUpdate}
                    guestContext={guestContext}
                  />
                )}

                {/* Description */}
                <DescriptionSection
                  commitment={commitment}
                  onFieldUpdate={handleFieldUpdate}
                />

                {/* Attachments - hidden in guest mode (no guest API) */}
                {!guestContext && (
                  <AttachmentsSection
                    commitment={commitment}
                    commitmentId={commitmentId!}
                    clientMode={clientMode}
                  />
                )}

                {/* Milestones - hidden in guest mode (no guest API) */}
                {!guestContext && (
                  <MilestonesSection
                    commitment={commitment}
                    commitmentId={commitmentId!}
                    clientMode={clientMode}
                  />
                )}

                {/* Comments - hidden in guest mode (no guest API) */}
                {!guestContext && (
                  <ActivitySection
                    commitment={commitment}
                    commitmentId={commitmentId!}
                    highlightCommentId={highlightCommentId}
                  />
                )}

                {/* Metadata Footer */}
                <MetadataFooter commitment={commitment} />
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-full text-ink-3">
              Commitment not found
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// === Header Section ===

export function PanelHeader({
  commitment,
  onClose,
  onFieldUpdate,
  onDelete,
  onOpenInPage,
  onCopyLink,
}: {
  commitment: Commitment
  onClose: () => void
  onFieldUpdate: (field: string, value: any) => void
  onDelete: () => void
  onOpenInPage?: () => void
  onCopyLink?: () => void
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(commitment.title)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const isAutomatic = commitment.source === 'rule'
  const isOpenStatus =
    commitment.status !== 'completed' && commitment.status !== 'abandoned'

  useEffect(() => {
    setTitleValue(commitment.title)
  }, [commitment.title])

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus()
  }, [isEditingTitle])

  const saveTitle = () => {
    const trimmed = titleValue.trim()
    if (trimmed && trimmed !== commitment.title) {
      onFieldUpdate('title', trimmed)
    } else {
      setTitleValue(commitment.title)
    }
    setIsEditingTitle(false)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Title */}
      <div className="flex-1 min-w-0">
        {isEditingTitle ? (
          <Input
            ref={titleInputRef}
            value={titleValue}
            onChange={e => setTitleValue(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => {
              if (e.key === 'Enter') saveTitle()
              if (e.key === 'Escape') {
                setTitleValue(commitment.title)
                setIsEditingTitle(false)
              }
            }}
            className="text-xl font-bold"
          />
        ) : (
          <h2
            className="text-xl font-bold text-ink cursor-pointer hover:bg-surface-3 rounded px-2 py-1 -mx-2 break-words"
            onClick={() => setIsEditingTitle(true)}
          >
            {commitment.title}
          </h2>
        )}
        {isAutomatic && (
          <div className="mt-1.5">
            <AutomaticChip commitment={commitment} />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Coach surfaces only — guests and the client portal have no
            /commitments/[id] route, so the affordance simply isn't rendered. */}
        {onOpenInPage && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onOpenInPage}
            title="Open as full page"
            aria-label="Open as full page"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              aria-label="More actions"
              data-testid="commitment-menu"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[80]">
            {onCopyLink && (
              <DropdownMenuItem onClick={onCopyLink}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Copy link
              </DropdownMenuItem>
            )}
            {isAutomatic && isOpenStatus && (
              <>
                <DropdownMenuItem
                  onClick={() => onFieldUpdate('target_date', tomorrowIso())}
                  data-testid="commitment-snooze"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Snooze to tomorrow
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onFieldUpdate('status', 'abandoned')}
                  data-testid="commitment-dismiss"
                >
                  <BellOff className="h-4 w-4 mr-2" />
                  Dismiss
                </DropdownMenuItem>
              </>
            )}
            {commitment.can_delete !== false && (
              <DropdownMenuItem onClick={onDelete} className="text-vermillion">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// === Fields Grid ===

export function FieldsGrid({
  commitment,
  onFieldUpdate,
  onFieldsUpdate,
}: {
  commitment: Commitment
  onFieldUpdate: (field: string, value: any) => void
  /** Optional multi-field patch with its own optimistic shape (assignee). */
  onFieldsUpdate?: (
    patch: Record<string, any>,
    optimistic?: Record<string, any>,
  ) => void
}) {
  const [calendarOpen, setCalendarOpen] = useState(false)

  // The viewer may read this row but not change it (assignee-only, viewer
  // role, another coach's private note). The API says so per row.
  const readOnly = commitment.can_edit === false

  // Settable statuses. `in_progress` MUST be here: the kanban board and three
  // other surfaces write it, so without it an In Progress commitment opened
  // here showed no selected chip and picking any option silently lost the state.
  //
  // Guard the whole class of bug rather than the one instance: any status that
  // isn't settable here (today `draft`) still renders, read-only, so the
  // control can never show "nothing selected".
  const isKnownStatus = (SETTABLE_STATUSES as string[]).includes(
    commitment.status,
  )

  // Milestone-derived progress, used when reopening a completed commitment so
  // we restore real progress instead of hard-zeroing it.
  const milestones = commitment.milestones || []
  const derivedProgress = milestones.length
    ? Math.round(
        (milestones.filter(m => m.status === 'completed').length /
          milestones.length) *
          100,
      )
    : 0

  const assignee = assigneeOf(commitment)
  const pickerValue: PickedPerson | null = assignee
    ? {
        user_id: assignee.user_id,
        client_id: assignee.client_id,
        name: assignee.name,
        email: assignee.email,
        has_account: assignee.has_account,
        roles: assignee.roles,
      }
    : null

  const handleAssign = (next: PickedPerson | null) => {
    // null user_id = the client themself (login or not); a user id = that person.
    const assignedToId = next?.user_id ?? null
    const optimisticAssignee = assigneeFromPick(next, commitment.client_id)
    const optimistic = {
      assigned_to_id: assignedToId,
      assigned_to_name: assignedToId ? (next?.name ?? null) : null,
      assignee: optimisticAssignee,
      assignee_kind: assignedToId
        ? 'user'
        : commitment.client_id
          ? 'client'
          : 'none',
      is_coach_commitment: !!assignedToId,
    }
    if (onFieldsUpdate)
      onFieldsUpdate({ assigned_to_id: assignedToId }, optimistic)
    else onFieldUpdate('assigned_to_id', assignedToId)
  }

  return (
    <div
      className="p-4 bg-paper rounded-lg space-y-4"
      data-testid="commitment-fields"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* Assignee — first: who it's for is the first thing to know */}
        <div className="space-y-1 min-w-0">
          <label className="text-xs font-medium text-ink-3 ">Assignee</label>
          {readOnly ? (
            <div className="h-9 flex items-center">
              <AssigneeChip assignee={assignee} size="sm" />
            </div>
          ) : (
            <PersonPicker
              value={pickerValue}
              onChange={handleAssign}
              context={{
                clientId: commitment.client_id ?? null,
                sandboxId: commitment.sandbox_id ?? null,
              }}
              clientOption={
                commitment.client_id
                  ? {
                      client_id: commitment.client_id,
                      name: commitment.client_name ?? null,
                      // Known only while the client is the assignee; the picker
                      // then folds their login into the one "client" row.
                      user_id: assignee?.client_id
                        ? assignee.user_id
                        : undefined,
                    }
                  : null
              }
              allowClear={!commitment.client_id}
              className="h-9 w-full"
              contentClassName="z-[80]"
              data-testid="detail-assignee-picker"
            />
          )}
        </div>

        {/* Priority */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-3 ">Priority</label>
          <Select
            value={commitment.priority}
            onValueChange={value => onFieldUpdate('priority', value)}
            disabled={readOnly}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[80]">
              {(
                Object.keys(COMMITMENT_PRIORITY_LABEL) as CommitmentPriority[]
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
          <label className="text-xs font-medium text-ink-3 ">Due Date</label>
          <Popover
            open={calendarOpen}
            onOpenChange={readOnly ? undefined : setCalendarOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={readOnly}
                className={cn(
                  'h-9 w-full justify-start text-left text-sm font-normal',
                  !commitment.target_date && 'text-ink-3',
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                {commitment.target_date
                  ? formatDateOnly(commitment.target_date, 'MMM d, yyyy')
                  : 'Set date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[80]" align="start">
              <Calendar
                mode="single"
                selected={parseDateForPicker(commitment.target_date)}
                onSelect={date => {
                  onFieldUpdate(
                    'target_date',
                    date ? date.toISOString().split('T')[0] : null,
                  )
                  setCalendarOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-3 ">Status</label>
        <div
          className="flex flex-wrap gap-1.5"
          data-testid="commitment-status-chips"
        >
          {!isKnownStatus && (
            <span
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border',
                TONE_CHIP[COMMITMENT_STATUS_TONE[commitment.status] ?? 'muted']
                  .selected,
              )}
              title="Current status — set elsewhere and not directly settable here"
            >
              {statusInfo(commitment.status).label}
            </span>
          )}
          {SETTABLE_STATUSES.map(value => {
            const isSelected = commitment.status === value
            const chip = TONE_CHIP[COMMITMENT_STATUS_TONE[value]]
            return (
              <button
                key={value}
                type="button"
                disabled={readOnly && !isSelected}
                onClick={() => {
                  if (isSelected || readOnly) return
                  onFieldUpdate('status', value)
                  // Progress rules live here, in one place, rather than being
                  // implied by whichever button was pressed.
                  if (value === 'completed') {
                    onFieldUpdate('progress_percentage', 100)
                  } else if (commitment.status === 'completed') {
                    // Reopening: restore milestone-derived progress rather than
                    // hard-zeroing work that was actually done.
                    onFieldUpdate('progress_percentage', derivedProgress)
                  }
                  // Moving to in_progress with no milestones leaves progress
                  // alone — we don't invent a number.
                }}
                aria-pressed={isSelected}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                  isSelected ? chip.selected : chip.unselected,
                  readOnly && !isSelected && 'opacity-40 cursor-not-allowed',
                )}
              >
                {COMMITMENT_STATUS_LABEL[value]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Visibility — only meaningful on a sandbox, where two sides can look */}
      {commitment.sandbox_id && (
        <label
          className={cn(
            'flex items-center gap-2 text-xs text-ink-2',
            readOnly ? 'cursor-default' : 'cursor-pointer',
          )}
        >
          <Checkbox
            checked={commitment.visibility === 'private'}
            disabled={readOnly}
            onCheckedChange={v =>
              onFieldUpdate('visibility', v === true ? 'private' : 'shared')
            }
            data-testid="detail-private-toggle"
          />
          <Lock className="h-3 w-3 text-ink-3" />
          Only people on this commitment can see it
        </label>
      )}
    </div>
  )
}

// === Linked Outcomes & Sprints Section ===

export function LinkedOutcomesSection({
  commitment,
  commitmentId,
  onCommitmentUpdate,
  guestContext,
}: {
  commitment: Commitment
  commitmentId: string
  onCommitmentUpdate?: () => void
  guestContext?: GuestContext
}) {
  const queryClient = useQueryClient()
  // In guest mode, disable fetching — cache is pre-seeded by ClientCommitmentPanel
  const guestQueryOpts = guestContext
    ? { enabled: false, staleTime: Infinity }
    : {}
  const { data: allTargets = [] } = useTargets(
    commitment.client_id ? { client_id: commitment.client_id } : undefined,
    guestQueryOpts,
  )
  const { data: allSprints = [] } = useSprints(
    commitment.client_id ? { client_id: commitment.client_id } : undefined,
    guestQueryOpts,
  )

  const linkedTargetIds = new Set(
    (commitment.target_links || []).map((tl: any) => tl.target_id),
  )

  // Independent sprint IDs from commitment metadata
  const linkedSprintIds = new Set<string>(
    (commitment as any).linked_sprint_ids || [],
  )

  // Optimistic toggle outcome
  const handleToggleOutcome = async (targetId: string, isLinked: boolean) => {
    const detailKey = queryKeys.commitments.detail(commitmentId)
    const previous = queryClient.getQueryData(detailKey)

    queryClient.setQueryData(detailKey, (old: any) => {
      if (!old) return old
      if (isLinked) {
        return {
          ...old,
          target_links: (old.target_links || []).filter(
            (tl: any) => tl.target_id !== targetId,
          ),
          linked_target_ids: (old.linked_target_ids || []).filter(
            (id: string) => id !== targetId,
          ),
        }
      } else {
        return {
          ...old,
          target_links: [
            ...(old.target_links || []),
            {
              target_id: targetId,
              commitment_id: commitmentId,
              created_at: new Date().toISOString(),
            },
          ],
          linked_target_ids: [...(old.linked_target_ids || []), targetId],
        }
      }
    })

    try {
      if (guestContext) {
        // Guest mode: compute new target_ids list and update via LiveMeetingService
        const currentTargetIds = [...linkedTargetIds]
        const newTargetIds = isLinked
          ? currentTargetIds.filter(id => id !== targetId)
          : [...currentTargetIds, targetId]
        await LiveMeetingService.updateCommitment(
          guestContext.meetingToken,
          guestContext.guestToken,
          commitmentId,
          { target_ids: newTargetIds },
        )
      } else {
        if (isLinked) {
          await TargetService.unlinkCommitment(targetId, commitmentId)
        } else {
          await TargetService.linkCommitment(targetId, commitmentId)
        }
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.targets.all })
      onCommitmentUpdate?.()
    } catch {
      queryClient.setQueryData(detailKey, previous)
      toast.error(
        isLinked ? 'Failed to unlink outcome' : 'Failed to link outcome',
      )
    }
  }

  // Toggle sprint independently via commitment metadata
  const handleToggleSprint = async (sprintId: string, isLinked: boolean) => {
    const detailKey = queryKeys.commitments.detail(commitmentId)
    const previous = queryClient.getQueryData(detailKey)

    const currentIds = [...linkedSprintIds]
    const newIds = isLinked
      ? currentIds.filter(id => id !== sprintId)
      : [...currentIds, sprintId]

    // Optimistic update
    queryClient.setQueryData(detailKey, (old: any) => {
      if (!old) return old
      return { ...old, linked_sprint_ids: newIds }
    })

    try {
      if (guestContext) {
        // Guest mode: we can't update metadata directly, so skip sprint linking
        // Sprint linking requires coach-level access to metadata
        toast.info('Sprint linking is not available in guest mode')
        queryClient.setQueryData(detailKey, previous)
        return
      }
      await CommitmentService.updateCommitment(commitmentId, {
        metadata: { linked_sprint_ids: newIds },
      } as any)
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })
      onCommitmentUpdate?.()
    } catch {
      queryClient.setQueryData(detailKey, previous)
      toast.error('Failed to update sprint link')
    }
  }

  if (allTargets.length === 0 && allSprints.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Outcomes as tags */}
      {allTargets.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink-2 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-ds-accent" />
            Meta Performance Outcomes
          </label>
          <div className="flex flex-wrap gap-1.5">
            {allTargets.map((target: any) => {
              const isLinked = linkedTargetIds.has(target.id)
              return (
                <button
                  key={target.id}
                  onClick={() => handleToggleOutcome(target.id, isLinked)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
                    isLinked
                      ? 'bg-ds-accent-bg text-ds-accent border-ds-accent '
                      : 'bg-surface-1 text-ink-3 border-line hover:border-ds-accent hover:text-ds-accent ',
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
                  {target.title}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Sprints as tags */}
      {allSprints.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink-2 flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-forest" />
            Sprints
          </label>
          <div className="flex flex-wrap gap-1.5">
            {allSprints.map((sprint: any) => {
              const isLinked = linkedSprintIds.has(sprint.id)
              return (
                <button
                  key={sprint.id}
                  onClick={() => handleToggleSprint(sprint.id, isLinked)}
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
    </div>
  )
}

// === Description Section ===

export function DescriptionSection({
  commitment,
  onFieldUpdate,
}: {
  commitment: Commitment
  onFieldUpdate: (field: string, value: any) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [descValue, setDescValue] = useState(commitment.description || '')

  useEffect(() => {
    setDescValue(commitment.description || '')
  }, [commitment.description])

  const handleSave = () => {
    onFieldUpdate('description', descValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDescValue(commitment.description || '')
    setIsEditing(false)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-ink-2 ">Description</label>
      {isEditing ? (
        <div className="space-y-2">
          <RichTextEditor
            content={descValue}
            onChange={setDescValue}
            placeholder="Add a description..."
            minHeight="100px"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="min-h-[40px] p-3 rounded-lg border border-line cursor-pointer hover:bg-paper transition-colors"
          onClick={() => setIsEditing(true)}
        >
          {commitment.description ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-ink-2 "
              dangerouslySetInnerHTML={{ __html: commitment.description }}
            />
          ) : (
            <p className="text-sm text-ink-4 italic">Add a description...</p>
          )}
        </div>
      )}
    </div>
  )
}

// === Attachments Section ===

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

function getFileIcon(contentType: string) {
  if (contentType.startsWith('image/')) return ImageIcon
  if (contentType === 'application/pdf') return FileText
  if (contentType.startsWith('video/')) return Video
  return File
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AttachmentsSection({
  commitment,
  commitmentId,
  clientMode,
}: {
  commitment: Commitment
  commitmentId: string
  clientMode?: boolean
}) {
  const coachUploadAttachment = useUploadAttachment(commitmentId)
  const clientUploadAttachment = useClientUploadAttachment(commitmentId)
  const uploadAttachment = clientMode
    ? clientUploadAttachment
    : coachUploadAttachment
  const coachDeleteAttachment = useDeleteAttachment(commitmentId)
  const clientDeleteAttachment = useClientDeleteAttachment(commitmentId)
  const deleteAttachment = clientMode
    ? clientDeleteAttachment
    : coachDeleteAttachment
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const attachments = commitment.attachments || []

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      for (const file of fileArray) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`"${file.name}" exceeds 25MB limit`)
          continue
        }
        setUploadProgress(0)
        try {
          await uploadAttachment.mutateAsync({
            file,
            onProgress: setUploadProgress,
          })
        } catch {
          // Error toast handled by mutation hook
        }
        setUploadProgress(null)
      }
    },
    [uploadAttachment],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles],
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleOpenAttachment = async (attachment: CommitmentAttachment) => {
    // Check if URL might be expired (uploaded_at + 7 days < now)
    const uploadedAt = new Date(attachment.uploaded_at)
    const expiresAt = new Date(uploadedAt.getTime() + 7 * 24 * 60 * 60 * 1000)
    let url = attachment.file_url

    if (new Date() > expiresAt) {
      try {
        const refreshed = clientMode
          ? await ClientCommitmentService.refreshAttachmentUrl(
              commitmentId,
              attachment.id,
            )
          : await CommitmentService.refreshAttachmentUrl(
              commitmentId,
              attachment.id,
            )
        url = refreshed.file_url
      } catch {
        toast.error('Failed to refresh download link')
        return
      }
    }

    window.open(url, '_blank')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-ink-2 flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5" />
          Attachments
          {attachments.length > 0 && (
            <span className="text-xs text-ink-4">({attachments.length})</span>
          )}
        </label>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3 w-3 mr-1" />
          Attach file
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => {
            if (e.target.files?.length) {
              handleFiles(e.target.files)
              e.target.value = ''
            }
          }}
        />
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'border-2 border-dashed rounded-lg p-3 transition-colors text-center',
          isDragging ? 'border-ds-accent bg-ds-accent-bg ' : 'border-line ',
          attachments.length === 0 && !uploadProgress ? 'py-6' : 'py-2',
        )}
      >
        {uploadProgress !== null ? (
          <div className="space-y-2 px-2">
            <div className="flex items-center gap-2 text-sm text-ink-3 ">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Uploading... {uploadProgress}%
            </div>
            <Progress value={uploadProgress} className="h-1.5" />
          </div>
        ) : attachments.length === 0 ? (
          <div className="text-sm text-ink-4 ">
            <p>Drop files here or click &ldquo;Attach file&rdquo;</p>
            <p className="text-xs mt-1">Max 25MB per file</p>
          </div>
        ) : (
          <p className="text-xs text-ink-4 ">Drop files to attach</p>
        )}
      </div>

      {/* Attachment list */}
      {attachments.length > 0 && (
        <div className="space-y-1">
          {attachments.map(attachment => {
            const isUploading = (attachment as any).uploading
            const Icon = getFileIcon(attachment.content_type)

            return (
              <div
                key={attachment.id}
                className="flex items-center gap-2 group py-1.5 px-2 rounded hover:bg-paper "
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 text-ink-4 animate-spin flex-shrink-0" />
                ) : (
                  <Icon className="h-4 w-4 text-ink-4 flex-shrink-0" />
                )}
                <button
                  className="text-sm text-ink-2 hover:text-ds-accent truncate flex-1 text-left"
                  onClick={() =>
                    !isUploading && handleOpenAttachment(attachment)
                  }
                  disabled={isUploading}
                >
                  {attachment.filename}
                </button>
                <span className="text-xs text-ink-4 flex-shrink-0">
                  {formatFileSize(attachment.file_size)}
                </span>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                    onClick={() => setDeleteConfirmId(attachment.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={open => !open && setDeleteConfirmId(null)}
      >
        {/* Both classes are required: the panel is z-70, and the dialog's own
            backdrop defaults to z-50, so lifting only the content would leave
            the scrim rendering behind the panel. */}
        <AlertDialogContent className="z-[80]" overlayClassName="z-[80]">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the file. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  deleteAttachment.mutate(deleteConfirmId)
                  setDeleteConfirmId(null)
                }
              }}
              className="bg-vermillion hover:bg-vermillion"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// === Milestones Section ===

export function MilestonesSection({
  commitment,
  commitmentId,
  clientMode,
}: {
  commitment: Commitment
  commitmentId: string
  clientMode?: boolean
}) {
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('')
  const coachAddMilestone = useAddMilestone(commitmentId)
  const clientAddMilestone = useClientAddMilestone(commitmentId)
  const addMilestone = clientMode ? clientAddMilestone : coachAddMilestone
  const coachUpdateMilestone = useUpdateMilestone(commitmentId)
  const clientUpdateMilestone = useClientUpdateMilestone(commitmentId)
  const updateMilestone = clientMode
    ? clientUpdateMilestone
    : coachUpdateMilestone
  const coachDeleteMilestone = useDeleteMilestone(commitmentId)
  const clientDeleteMilestone = useClientDeleteMilestone(commitmentId)
  const deleteMilestone = clientMode
    ? clientDeleteMilestone
    : coachDeleteMilestone
  const { fireConfetti } = useConfetti()

  const milestones = commitment.milestones || []
  const completedCount = milestones.filter(m => m.status === 'completed').length

  const handleAddMilestone = () => {
    const title = newMilestoneTitle.trim()
    if (!title) return
    addMilestone.mutate({ title })
    setNewMilestoneTitle('')
  }

  const toggleMilestoneStatus = (milestone: Milestone) => {
    // Don't toggle temp milestones that haven't been saved yet
    if (milestone.id.startsWith('temp-')) return
    const newStatus = milestone.status === 'completed' ? 'pending' : 'completed'
    updateMilestone.mutate({
      milestoneId: milestone.id,
      data: { status: newStatus },
    })
    if (newStatus === 'completed') {
      fireConfetti({ intensity: 'subtle' })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-ink-2 ">Subtasks</label>
        {milestones.length > 0 && (
          <span className="text-xs text-ink-3 ">
            {completedCount}/{milestones.length}
          </span>
        )}
      </div>

      {/* Milestone list */}
      <div className="space-y-1">
        {milestones.map(milestone => (
          <MilestoneItem
            key={milestone.id}
            milestone={milestone}
            onToggle={() => toggleMilestoneStatus(milestone)}
            onDelete={() => deleteMilestone.mutate(milestone.id)}
            onUpdateTitle={(title: string) =>
              updateMilestone.mutate({
                milestoneId: milestone.id,
                data: { title },
              })
            }
          />
        ))}
      </div>

      {/* Add milestone input */}
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-ink-4 flex-shrink-0" />
        <Input
          value={newMilestoneTitle}
          onChange={e => setNewMilestoneTitle(e.target.value)}
          placeholder="Add a subtask..."
          className="h-8 text-sm border-none shadow-none focus-visible:ring-0 px-0"
          onKeyDown={e => {
            if (e.key === 'Enter') handleAddMilestone()
          }}
        />
      </div>
    </div>
  )
}

function MilestoneItem({
  milestone,
  onToggle,
  onDelete,
  onUpdateTitle,
}: {
  milestone: Milestone
  onToggle: () => void
  onDelete: () => void
  onUpdateTitle: (title: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [titleValue, setTitleValue] = useState(milestone.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTitleValue(milestone.title)
  }, [milestone.title])

  useEffect(() => {
    if (isEditing) inputRef.current?.focus()
  }, [isEditing])

  const saveTitle = () => {
    const trimmed = titleValue.trim()
    if (trimmed && trimmed !== milestone.title) {
      onUpdateTitle(trimmed)
    } else {
      setTitleValue(milestone.title)
    }
    setIsEditing(false)
  }

  const isCompleted = milestone.status === 'completed'

  return (
    <div className="flex items-center gap-2 group py-1 px-2 rounded hover:bg-paper ">
      <Checkbox
        checked={isCompleted}
        onCheckedChange={onToggle}
        className="flex-shrink-0"
      />
      {isEditing ? (
        <Input
          ref={inputRef}
          value={titleValue}
          onChange={e => setTitleValue(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={e => {
            if (e.key === 'Enter') saveTitle()
            if (e.key === 'Escape') {
              setTitleValue(milestone.title)
              setIsEditing(false)
            }
          }}
          className="h-7 text-sm flex-1 border-none shadow-none focus-visible:ring-0 px-1"
        />
      ) : (
        <span
          className={cn(
            'text-sm flex-1 cursor-pointer',
            isCompleted && 'line-through text-ink-4 ',
          )}
          onClick={() => setIsEditing(true)}
        >
          {milestone.title}
        </span>
      )}
      {milestone.target_date && (
        <span className="text-xs text-ink-4 ">
          {formatDateOnly(milestone.target_date, 'MMM d')}
        </span>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
        onClick={onDelete}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

// === Comments Section ===

export function ActivitySection({
  commitment,
  commitmentId,
  highlightCommentId,
}: {
  commitment: Commitment
  commitmentId: string
  /** Deep link (`?comment=<id>`): scroll to and ring that comment. */
  highlightCommentId?: string | null
}) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-ink-2 ">Comments</label>

      <CommentThread
        targetType="commitment"
        targetId={commitmentId}
        context={{
          clientId: commitment.client_id ?? undefined,
          sandboxId: commitment.sandbox_id ?? undefined,
        }}
        initialComments={commitment.comments}
        highlightId={highlightCommentId}
      />
    </div>
  )
}

// === Metadata Footer ===

export function MetadataFooter({ commitment }: { commitment: Commitment }) {
  return (
    <div className="pt-4 border-t border-line space-y-1">
      <div className="flex items-center gap-2 text-xs text-ink-4 ">
        <Clock className="h-3 w-3" />
        Created {formatDate(commitment.created_at, 'MMM d, yyyy')}
      </div>
      <div className="flex items-center gap-2 text-xs text-ink-4 ">
        <Clock className="h-3 w-3" />
        Updated {formatRelativeTime(commitment.updated_at)}
      </div>
      {commitment.extracted_from_transcript && (
        <div className="flex items-center gap-2 text-xs text-indigo ">
          <Sparkles className="h-3 w-3" />
          AI Extracted
          {commitment.extraction_confidence &&
            ` (${Math.round(commitment.extraction_confidence * 100)}% confidence)`}
        </div>
      )}
    </div>
  )
}

// === Loading Skeleton ===

export function PanelSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        <Skeleton className="h-8 w-3/4" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <Skeleton className="h-24" />
      <Skeleton className="h-32" />
    </div>
  )
}

// === Helpers ===

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateStr, 'MMM d, yyyy')
}
