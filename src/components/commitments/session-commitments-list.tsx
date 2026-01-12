'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { formatRelativeTime } from '@/lib/date-utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Loader2,
  Pencil,
  Trash2,
  X,
  Check,
  CalendarIcon,
  Target,
  User,
  Briefcase,
} from 'lucide-react'
import { useCommitments } from '@/hooks/queries/use-commitments'
import {
  useUpdateCommitment,
  useDiscardCommitment,
} from '@/hooks/mutations/use-commitment-mutations'
import { Commitment } from '@/types/commitment'
import { cn } from '@/lib/utils'

interface SessionCommitmentsListProps {
  sessionId: string
  clientId: string
}

export function SessionCommitmentsList({
  sessionId,
  clientId,
}: SessionCommitmentsListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState<Date | undefined>(undefined)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const { data, isLoading } = useCommitments(
    {
      session_id: sessionId,
      client_id: clientId,
      include_drafts: true,
    },
    {
      // Poll every 30 seconds to pick up commitments created by the client
      refetchInterval: 30000,
    },
  )
  const updateCommitment = useUpdateCommitment()
  const discardCommitment = useDiscardCommitment()

  const commitments = data?.commitments ?? []

  // Sort by created_at descending (newest first)
  const sortedCommitments = [...commitments].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  const handleStartEdit = (commitment: Commitment) => {
    setEditingId(commitment.id)
    setEditTitle(commitment.title)
    setEditDate(
      commitment.target_date ? new Date(commitment.target_date) : undefined,
    )
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditDate(undefined)
  }

  const handleSaveEdit = async (commitmentId: string) => {
    if (!editTitle.trim() || updateCommitment.isPending) return

    await updateCommitment.mutateAsync({
      commitmentId,
      data: {
        title: editTitle.trim(),
        target_date: editDate ? format(editDate, 'yyyy-MM-dd') : undefined,
      },
    })

    setEditingId(null)
    setEditTitle('')
    setEditDate(undefined)
  }

  const handleDelete = async (commitmentId: string) => {
    await discardCommitment.mutateAsync(commitmentId)
    setDeleteConfirmId(null)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="border-t border-gray-100 px-4 py-4">
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading commitments...</span>
        </div>
      </div>
    )
  }

  if (sortedCommitments.length === 0) {
    return (
      <div className="border-t border-gray-100 px-4 py-4">
        <div className="text-center">
          <Target className="h-6 w-6 text-gray-300 mx-auto mb-1" />
          <p className="text-xs text-gray-400">No commitments captured yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-gray-100">
      <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">
          Session Commitments
        </span>
        <Badge variant="secondary" className="text-xs">
          {sortedCommitments.length}
        </Badge>
      </div>
      <div className="max-h-[200px] overflow-y-auto">
        {sortedCommitments.map(commitment => (
          <div
            key={commitment.id}
            className="px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50"
          >
            {editingId === commitment.id ? (
              // Edit mode
              <div className="space-y-2">
                <Input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="h-9 text-sm border-gray-200"
                  placeholder="Commitment title"
                  autoFocus
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal h-8 text-xs border-gray-200',
                        !editDate && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {editDate ? (
                        format(editDate, 'PPP')
                      ) : (
                        <span>Pick due date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editDate}
                      onSelect={setEditDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    className="h-7 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSaveEdit(commitment.id)}
                    disabled={!editTitle.trim() || updateCommitment.isPending}
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                  >
                    {updateCommitment.isPending ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3 mr-1" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              // View mode
              <div>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-700 line-clamp-2 flex-1">
                    {commitment.title}
                  </p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleStartEdit(commitment)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      title="Edit commitment"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <Popover
                      open={deleteConfirmId === commitment.id}
                      onOpenChange={open =>
                        setDeleteConfirmId(open ? commitment.id : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <button
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                          title="Delete commitment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3" align="end">
                        <p className="text-sm text-gray-700 mb-2">
                          Delete this commitment?
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirmId(null)}
                            className="h-7 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(commitment.id)}
                            disabled={discardCommitment.isPending}
                            className="h-7 text-xs"
                          >
                            {discardCommitment.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Delete'
                            )}
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {/* Assignee badge */}
                  <Badge
                    variant="outline"
                    className={`text-xs px-1.5 py-0 h-5 ${
                      commitment.is_coach_commitment
                        ? 'border-purple-200 text-purple-700 bg-purple-50'
                        : 'border-blue-200 text-blue-700 bg-blue-50'
                    }`}
                  >
                    {commitment.is_coach_commitment ? (
                      <Briefcase className="h-2.5 w-2.5 mr-1" />
                    ) : (
                      <User className="h-2.5 w-2.5 mr-1" />
                    )}
                    {commitment.is_coach_commitment ? 'Coach' : 'Client'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs px-1.5 py-0 h-5 ${getPriorityColor(
                      commitment.priority,
                    )}`}
                  >
                    {commitment.priority}
                  </Badge>
                  {commitment.target_date && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {format(new Date(commitment.target_date), 'MMM d')}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {formatRelativeTime(commitment.created_at)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
