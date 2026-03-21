'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CommitmentService } from '@/services/commitment-service'
import {
  useUpdateCommitment,
  useUpdateCommitmentProgress,
  useAddMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  useDiscardCommitment,
  useUploadAttachment,
  useDeleteAttachment,
} from '@/hooks/mutations/use-commitment-mutations'
import { queryKeys } from '@/lib/query-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/date-utils'
import {
  X,
  MoreVertical,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Sparkles,
  Clock,
  Trophy,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Paperclip,
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  File,
  Loader2,
  Zap,
} from 'lucide-react'
import type {
  Commitment,
  CommitmentAttachment,
  Milestone,
} from '@/types/commitment'
import { TargetService } from '@/services/target-service'
import { useTargets } from '@/hooks/queries/use-targets'
import { useSprints } from '@/hooks/queries/use-sprints'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'

interface CommitmentDetailPanelProps {
  commitmentId: string | null
  clientId?: string
  onClose: () => void
  onCommitmentUpdate?: () => void
}

function useCommitment(commitmentId: string | null) {
  return useQuery({
    queryKey: queryKeys.commitments.detail(commitmentId || ''),
    queryFn: () => CommitmentService.getCommitment(commitmentId!),
    enabled: !!commitmentId,
    staleTime: 2 * 60 * 1000,
  })
}

export function CommitmentDetailPanel({
  commitmentId,
  clientId: clientIdProp,
  onClose,
  onCommitmentUpdate,
}: CommitmentDetailPanelProps) {
  const { data: commitment, isLoading } = useCommitment(commitmentId)
  const resolvedClientId = clientIdProp || commitment?.client_id

  // Prefetch targets & sprints immediately using the known clientId
  // so they're cached before LinkedOutcomesSection mounts
  useTargets(resolvedClientId ? { client_id: resolvedClientId } : undefined)
  useSprints(resolvedClientId ? { client_id: resolvedClientId } : undefined)
  const updateCommitment = useUpdateCommitment({ silent: true })
  const discardCommitment = useDiscardCommitment()
  const queryClient = useQueryClient()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (commitmentId) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [commitmentId, onClose])

  const handleFieldUpdate = useCallback(
    (field: string, value: any) => {
      if (!commitmentId) return

      // Optimistically update the detail cache immediately
      queryClient.setQueryData(
        queryKeys.commitments.detail(commitmentId),
        (old: any) => {
          if (!old) return old
          return { ...old, [field]: value }
        },
      )

      updateCommitment.mutate(
        { commitmentId, data: { [field]: value } },
        {
          onSuccess: () => {
            onCommitmentUpdate?.()
          },
        },
      )
    },
    [commitmentId, updateCommitment, queryClient, onCommitmentUpdate],
  )

  const handleDelete = () => {
    if (!commitmentId) return
    discardCommitment.mutate(commitmentId, {
      onSuccess: () => {
        onClose()
        onCommitmentUpdate?.()
      },
    })
    setDeleteDialogOpen(false)
  }

  const isOpen = !!commitmentId

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'fixed right-0 top-0 h-full w-full md:w-[640px] z-[70] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl',
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
                  onDelete={() => setDeleteDialogOpen(true)}
                />

                {/* Fields Grid */}
                <FieldsGrid
                  commitment={commitment}
                  onFieldUpdate={handleFieldUpdate}
                />

                {/* Linked Outcomes & Sprints */}
                <LinkedOutcomesSection
                  commitment={commitment}
                  commitmentId={commitmentId!}
                  onCommitmentUpdate={onCommitmentUpdate}
                />

                {/* Description */}
                <DescriptionSection
                  commitment={commitment}
                  onFieldUpdate={handleFieldUpdate}
                />

                {/* Attachments */}
                <AttachmentsSection
                  commitment={commitment}
                  commitmentId={commitmentId!}
                />

                {/* Milestones */}
                <MilestonesSection
                  commitment={commitment}
                  commitmentId={commitmentId!}
                />

                {/* Comments */}
                <ActivitySection
                  commitment={commitment}
                  commitmentId={commitmentId!}
                  onCommitmentUpdate={onCommitmentUpdate}
                />

                {/* Metadata Footer */}
                <MetadataFooter commitment={commitment} />
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Commitment not found
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Commitment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{commitment?.title}
              &rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// === Header Section ===

function PanelHeader({
  commitment,
  onClose,
  onFieldUpdate,
  onDelete,
}: {
  commitment: Commitment
  onClose: () => void
  onFieldUpdate: (field: string, value: any) => void
  onDelete: () => void
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(commitment.title)
  const titleInputRef = useRef<HTMLInputElement>(null)

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
            className="text-xl font-bold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1 -mx-2 truncate"
            onClick={() => setIsEditingTitle(true)}
          >
            {commitment.title}
          </h2>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
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

function FieldsGrid({
  commitment,
  onFieldUpdate,
}: {
  commitment: Commitment
  onFieldUpdate: (field: string, value: any) => void
}) {
  const [calendarOpen, setCalendarOpen] = useState(false)

  const _priorityColors: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    medium:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      {/* Priority */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Priority
        </label>
        <Select
          value={commitment.priority}
          onValueChange={value => onFieldUpdate('priority', value)}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', 'bg-gray-400')} />
                Low
              </div>
            </SelectItem>
            <SelectItem value="medium">
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', 'bg-yellow-400')} />
                Medium
              </div>
            </SelectItem>
            <SelectItem value="high">
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', 'bg-orange-400')} />
                High
              </div>
            </SelectItem>
            <SelectItem value="urgent">
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', 'bg-red-500')} />
                Urgent
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Due Date */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Due Date
        </label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'h-9 w-full justify-start text-left text-sm font-normal',
                !commitment.target_date && 'text-gray-500',
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5 mr-2" />
              {commitment.target_date
                ? formatDate(commitment.target_date, 'MMM d, yyyy')
                : 'Set date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={
                commitment.target_date
                  ? new Date(commitment.target_date)
                  : undefined
              }
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
  )
}

// === Linked Outcomes & Sprints Section ===

function LinkedOutcomesSection({
  commitment,
  commitmentId,
  onCommitmentUpdate,
}: {
  commitment: Commitment
  commitmentId: string
  onCommitmentUpdate?: () => void
}) {
  const queryClient = useQueryClient()
  const { data: allTargets = [] } = useTargets(
    commitment.client_id ? { client_id: commitment.client_id } : undefined,
  )
  const { data: allSprints = [] } = useSprints(
    commitment.client_id ? { client_id: commitment.client_id } : undefined,
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
      if (isLinked) {
        await TargetService.unlinkCommitment(targetId, commitmentId)
      } else {
        await TargetService.linkCommitment(targetId, commitmentId)
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
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-blue-500" />
            Outcomes
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
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400',
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
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-green-500" />
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
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:text-green-600 dark:hover:text-green-400',
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
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
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

function DescriptionSection({
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
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Description
      </label>
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
          className="min-h-[40px] p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          onClick={() => setIsEditing(true)}
        >
          {commitment.description ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: commitment.description }}
            />
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">
              Add a description...
            </p>
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

function AttachmentsSection({
  commitment,
  commitmentId,
}: {
  commitment: Commitment
  commitmentId: string
}) {
  const uploadAttachment = useUploadAttachment(commitmentId)
  const deleteAttachment = useDeleteAttachment(commitmentId)
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
        const refreshed = await CommitmentService.refreshAttachmentUrl(
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
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5" />
          Attachments
          {attachments.length > 0 && (
            <span className="text-xs text-gray-400">
              ({attachments.length})
            </span>
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
          isDragging
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700',
          attachments.length === 0 && !uploadProgress ? 'py-6' : 'py-2',
        )}
      >
        {uploadProgress !== null ? (
          <div className="space-y-2 px-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Uploading... {uploadProgress}%
            </div>
            <Progress value={uploadProgress} className="h-1.5" />
          </div>
        ) : attachments.length === 0 ? (
          <div className="text-sm text-gray-400 dark:text-gray-500">
            <p>Drop files here or click &ldquo;Attach file&rdquo;</p>
            <p className="text-xs mt-1">Max 25MB per file</p>
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Drop files to attach
          </p>
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
                className="flex items-center gap-2 group py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin flex-shrink-0" />
                ) : (
                  <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
                <button
                  className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 truncate flex-1 text-left"
                  onClick={() =>
                    !isUploading && handleOpenAttachment(attachment)
                  }
                  disabled={isUploading}
                >
                  {attachment.filename}
                </button>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
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
        <AlertDialogContent>
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
              className="bg-red-600 hover:bg-red-700"
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

function MilestonesSection({
  commitment,
  commitmentId,
}: {
  commitment: Commitment
  commitmentId: string
}) {
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('')
  const addMilestone = useAddMilestone(commitmentId)
  const updateMilestone = useUpdateMilestone(commitmentId)
  const deleteMilestone = useDeleteMilestone(commitmentId)

  const milestones = commitment.milestones || []
  const completedCount = milestones.filter(m => m.status === 'completed').length

  const handleAddMilestone = () => {
    const title = newMilestoneTitle.trim()
    if (!title) return
    addMilestone.mutate({ title })
    setNewMilestoneTitle('')
  }

  const toggleMilestoneStatus = (milestone: Milestone) => {
    const newStatus = milestone.status === 'completed' ? 'pending' : 'completed'
    updateMilestone.mutate({
      milestoneId: milestone.id,
      data: { status: newStatus },
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Subtasks
        </label>
        {milestones.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
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
        <Plus className="h-4 w-4 text-gray-400 flex-shrink-0" />
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
    <div className="flex items-center gap-2 group py-1 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
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
            isCompleted && 'line-through text-gray-400 dark:text-gray-500',
          )}
          onClick={() => setIsEditing(true)}
        >
          {milestone.title}
        </span>
      )}
      {milestone.target_date && (
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {formatDate(milestone.target_date, 'MMM d')}
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

function ActivitySection({
  commitment,
  commitmentId,
  onCommitmentUpdate,
}: {
  commitment: Commitment
  commitmentId: string
  onCommitmentUpdate?: () => void
}) {
  const [note, setNote] = useState('')
  const [showExtras, setShowExtras] = useState(false)
  const [wins, setWins] = useState('')
  const [blockers, setBlockers] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const _queryClient = useQueryClient()
  const updateProgress = useUpdateCommitmentProgress()

  const updates = [...(commitment.updates || [])].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  const handleSubmit = () => {
    const data: any = {}
    if (note.trim()) data.note = note.trim()
    if (wins.trim()) data.wins = wins.trim()
    if (blockers.trim()) data.blockers = blockers.trim()

    if (Object.keys(data).length === 0) return

    // Clear form instantly — the mutation hook handles the optimistic update
    setNote('')
    setWins('')
    setBlockers('')
    setShowExtras(false)

    updateProgress.mutate(
      { commitmentId, data },
      {
        onSettled: () => {
          onCommitmentUpdate?.()
        },
      },
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Comments
      </label>

      {/* Always-visible comment input */}
      <div className="space-y-2">
        <Textarea
          ref={inputRef}
          value={note}
          onChange={e => setNote(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment..."
          rows={2}
          className="resize-none text-sm"
        />

        {/* Expandable wins/blockers */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
            onClick={() => setShowExtras(!showExtras)}
          >
            {showExtras ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            Wins & Blockers
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+Enter
            </span>
            <Button
              size="sm"
              className="h-7 text-xs px-3"
              onClick={handleSubmit}
              disabled={!note.trim() && !wins.trim() && !blockers.trim()}
            >
              Post
            </Button>
          </div>
        </div>

        {showExtras && (
          <div className="space-y-2">
            <div>
              <label className="text-xs text-green-600 font-medium">Wins</label>
              <Textarea
                value={wins}
                onChange={e => setWins(e.target.value)}
                placeholder="What went well?"
                rows={1}
                className="resize-none text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-red-600 font-medium">
                Blockers
              </label>
              <Textarea
                value={blockers}
                onChange={e => setBlockers(e.target.value)}
                placeholder="What's blocking progress?"
                rows={1}
                className="resize-none text-sm mt-1"
              />
            </div>
          </div>
        )}
      </div>

      {/* Comments feed */}
      {updates.length > 0 ? (
        <div className="space-y-2">
          {updates.map(update => (
            <div
              key={update.id}
              className="pl-3 border-l-2 border-gray-200 dark:border-gray-700 space-y-1.5"
            >
              {/* Timestamp */}
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {formatRelativeTime(update.created_at)}
              </span>

              {/* Note */}
              {update.note && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {update.note}
                </p>
              )}

              {/* Wins */}
              {update.wins && (
                <div className="flex items-start gap-2 px-2 py-1.5 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                  <Trophy className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-green-800 dark:text-green-300">
                    {update.wins}
                  </span>
                </div>
              )}

              {/* Blockers */}
              {update.blockers && (
                <div className="flex items-start gap-2 px-2 py-1.5 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-red-800 dark:text-red-300">
                    {update.blockers}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">
          No comments yet
        </p>
      )}
    </div>
  )
}

// === Metadata Footer ===

function MetadataFooter({ commitment }: { commitment: Commitment }) {
  return (
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <Clock className="h-3 w-3" />
        Created {formatDate(commitment.created_at, 'MMM d, yyyy')}
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <Clock className="h-3 w-3" />
        Updated {formatRelativeTime(commitment.updated_at)}
      </div>
      {commitment.extracted_from_transcript && (
        <div className="flex items-center gap-2 text-xs text-purple-500 dark:text-purple-400">
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

function PanelSkeleton() {
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
