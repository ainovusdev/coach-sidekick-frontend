'use client'

import React, { useState, useEffect } from 'react'
import { format, isPast, addDays, addWeeks } from 'date-fns'
import { formatRelativeTime } from '@/lib/date-utils'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Check,
  Target,
  CalendarIcon,
  User,
  Briefcase,
  Loader2,
  Pencil,
  Trash2,
  X,
  Clock,
  TrendingUp,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  useCreateCommitment,
  useUpdateCommitment,
  useDiscardCommitment,
} from '@/hooks/mutations/use-commitment-mutations'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { CommitmentService } from '@/services/commitment-service'
import { Commitment } from '@/types/commitment'

interface QuickCommitmentProps {
  sessionId: string
  clientId: string
}

type TabType = 'session' | 'active'

export function QuickCommitment({ sessionId, clientId }: QuickCommitmentProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined)
  const [assigneeType, setAssigneeType] = useState<'client' | 'coach'>('client')
  const [activeTab, setActiveTab] = useState<TabType>('session')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState<Date | undefined>(undefined)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showCalendar, setShowCalendar] = useState(false) // Calendar hidden by default

  // All active commitments for the client
  const [allActiveCommitments, setAllActiveCommitments] = useState<
    Commitment[]
  >([])
  const [loadingActive, setLoadingActive] = useState(false)

  const createCommitment = useCreateCommitment()
  const updateCommitment = useUpdateCommitment()
  const discardCommitment = useDiscardCommitment()

  // Session commitments
  const { data: sessionData, isLoading: loadingSession } = useCommitments(
    {
      session_id: sessionId,
      client_id: clientId,
      include_drafts: true,
    },
    {
      refetchInterval: 30000,
    },
  )

  const sessionCommitments = sessionData?.commitments ?? []
  const sortedSessionCommitments = [...sessionCommitments].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  // Fetch all active commitments
  useEffect(() => {
    const fetchActiveCommitments = async (showLoading = false) => {
      try {
        if (showLoading) setLoadingActive(true)
        const response = await CommitmentService.listCommitments({
          client_id: clientId,
          status: 'active',
        })
        setAllActiveCommitments(response.commitments)
      } catch (error) {
        console.error('Failed to fetch active commitments:', error)
      } finally {
        if (showLoading) setLoadingActive(false)
      }
    }

    if (clientId) {
      fetchActiveCommitments(true)
      const interval = setInterval(() => fetchActiveCommitments(false), 30000)
      return () => clearInterval(interval)
    }
  }, [clientId])

  const handleSave = () => {
    if (!title.trim()) return

    const commitmentTitle = title.trim()
    const commitmentDate = targetDate
      ? format(targetDate, 'yyyy-MM-dd')
      : undefined
    const commitmentAssignee = assigneeType === 'coach' ? user?.id : undefined

    setTitle('')
    setTargetDate(undefined)
    setAssigneeType('client')

    createCommitment.mutate({
      client_id: clientId,
      session_id: sessionId,
      title: commitmentTitle,
      target_date: commitmentDate,
      type: 'action',
      priority: 'medium',
      assigned_to_id: commitmentAssignee,
    })
  }

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

  const handleToggleComplete = async (commitment: Commitment) => {
    const newStatus = commitment.status === 'completed' ? 'active' : 'completed'
    await updateCommitment.mutateAsync({
      commitmentId: commitment.id,
      data: { status: newStatus },
    })
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

  const renderCommitmentItem = (
    commitment: Commitment,
    showCompleteToggle: boolean = false,
  ) => {
    const isOverdue =
      commitment.target_date &&
      isPast(new Date(commitment.target_date)) &&
      commitment.status !== 'completed'
    const progress = commitment.progress_percentage || 0

    if (editingId === commitment.id) {
      return (
        <div className="space-y-2 p-3 bg-blue-50 rounded-lg">
          <Input
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            className="h-9 text-sm border-gray-200 bg-white"
            placeholder="Commitment title"
            autoFocus
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal h-8 text-xs border-gray-200 bg-white',
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
      )
    }

    return (
      <div
        className={cn(
          'group p-3 rounded-lg border transition-all',
          commitment.status === 'completed'
            ? 'bg-gray-50 border-gray-200'
            : isOverdue
              ? 'bg-red-50 border-red-200'
              : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm',
        )}
      >
        <div className="flex items-start gap-3">
          {/* Completion toggle */}
          {showCompleteToggle && (
            <button
              onClick={() => handleToggleComplete(commitment)}
              className={cn(
                'mt-0.5 flex-shrink-0 transition-colors',
                commitment.status === 'completed'
                  ? 'text-green-500'
                  : 'text-gray-300 hover:text-green-500',
              )}
            >
              {commitment.status === 'completed' ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p
                className={cn(
                  'text-sm font-medium line-clamp-2',
                  commitment.status === 'completed'
                    ? 'text-gray-500 line-through'
                    : 'text-gray-900',
                )}
              >
                {commitment.title}
              </p>
              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleStartEdit(commitment)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="Edit"
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
                      title="Delete"
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

            {/* Meta info row */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {/* Assignee */}
              <Badge
                variant="outline"
                className={cn(
                  'text-xs px-1.5 py-0 h-5',
                  commitment.is_coach_commitment
                    ? 'border-gray-300 text-gray-700 bg-gray-50'
                    : 'border-blue-200 text-blue-700 bg-blue-50',
                )}
              >
                {commitment.is_coach_commitment ? (
                  <Briefcase className="h-2.5 w-2.5 mr-1" />
                ) : (
                  <User className="h-2.5 w-2.5 mr-1" />
                )}
                {commitment.is_coach_commitment ? 'Coach' : 'Client'}
              </Badge>

              {/* Priority */}
              {(commitment.priority === 'high' ||
                commitment.priority === 'urgent') && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs px-1.5 py-0 h-5',
                    getPriorityColor(commitment.priority),
                  )}
                >
                  {commitment.priority}
                </Badge>
              )}

              {/* Progress */}
              {progress > 0 && commitment.status !== 'completed' && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  {progress}%
                </span>
              )}

              {/* Due date */}
              {commitment.target_date && (
                <span
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    isOverdue ? 'text-red-600 font-medium' : 'text-gray-500',
                  )}
                >
                  <CalendarIcon className="h-3 w-3" />
                  {isOverdue && 'Overdue: '}
                  {format(new Date(commitment.target_date), 'MMM d')}
                </span>
              )}

              {/* Time ago */}
              <span className="text-xs text-gray-400">
                {formatRelativeTime(commitment.created_at)}
              </span>
            </div>

            {/* Progress bar */}
            {progress > 0 &&
              progress < 100 &&
              commitment.status !== 'completed' && (
                <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
          </div>
        </div>
      </div>
    )
  }

  const sessionCount = sortedSessionCommitments.length
  const activeCount = allActiveCommitments.filter(
    c => c.status === 'active',
  ).length

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-gray-700" />
          <span className="text-sm font-semibold text-gray-900">
            Commitments
          </span>
        </div>

        {/* Assignee toggle */}
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-md p-0.5">
          <button
            onClick={() => setAssigneeType('client')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors',
              assigneeType === 'client'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            <User className="h-3 w-3" />
            Client
          </button>
          <button
            onClick={() => setAssigneeType('coach')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors',
              assigneeType === 'coach'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            <Briefcase className="h-3 w-3" />
            Coach
          </button>
        </div>
      </div>

      {/* Form */}
      <CardContent className="p-4 flex-shrink-0">
        <div className="space-y-3">
          <Input
            placeholder={
              assigneeType === 'client'
                ? 'What will the client commit to?'
                : 'What will you (coach) commit to?'
            }
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                handleSave()
              }
            }}
            className="border-gray-200 focus:border-blue-400 text-sm h-10"
            maxLength={200}
          />

          {/* Due Date Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-600">
                Due Date
              </label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowCalendar(!showCalendar)}
                className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
              >
                {showCalendar ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Hide calendar
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show calendar
                  </>
                )}
              </Button>
            </div>

            {/* Quick date buttons */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { label: 'Tomorrow', date: addDays(new Date(), 1) },
                { label: '3 days', date: addDays(new Date(), 3) },
                { label: '1 week', date: addWeeks(new Date(), 1) },
                { label: '2 weeks', date: addWeeks(new Date(), 2) },
              ].map(option => (
                <Button
                  key={option.label}
                  type="button"
                  size="sm"
                  variant={
                    targetDate?.toDateString() === option.date.toDateString()
                      ? 'default'
                      : 'outline'
                  }
                  onClick={() => setTargetDate(option.date)}
                  className={cn(
                    'h-7 text-xs',
                    targetDate?.toDateString() === option.date.toDateString()
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300',
                  )}
                >
                  {option.label}
                </Button>
              ))}
              {targetDate && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setTargetDate(undefined)}
                  className="h-7 text-xs text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Inline Calendar - hidden by default */}
            {showCalendar && (
              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <Calendar
                  mode="single"
                  selected={targetDate}
                  onSelect={setTargetDate}
                  disabled={date => date < new Date()}
                  className="mx-auto"
                />
              </div>
            )}

            {targetDate && (
              <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                Due: {format(targetDate, 'EEEE, MMMM d, yyyy')}
              </p>
            )}
          </div>

          {/* Add Button */}
          <Button
            onClick={handleSave}
            disabled={!title.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 h-9"
          >
            <Check className="h-4 w-4 mr-1" />
            Add Commitment
          </Button>
        </div>
      </CardContent>

      {/* Tabs */}
      <div className="border-t border-gray-100 flex-shrink-0">
        <div className="flex">
          <button
            onClick={() => setActiveTab('session')}
            className={cn(
              'flex-1 py-2.5 text-xs font-medium transition-colors border-b-2',
              activeTab === 'session'
                ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50',
            )}
          >
            <Clock className="h-3.5 w-3.5 inline mr-1.5" />
            This Session
            {sessionCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1.5 text-xs px-1.5 py-0 h-4"
              >
                {sessionCount}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={cn(
              'flex-1 py-2.5 text-xs font-medium transition-colors border-b-2',
              activeTab === 'active'
                ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50',
            )}
          >
            <Target className="h-3.5 w-3.5 inline mr-1.5" />
            All Active
            {activeCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1.5 text-xs px-1.5 py-0 h-4"
              >
                {activeCount}
              </Badge>
            )}
          </button>
        </div>
      </div>

      {/* Commitments List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'session' ? (
          // Session Commitments
          loadingSession ? (
            <div className="p-4 flex items-center justify-center gap-2 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Loading...</span>
            </div>
          ) : sortedSessionCommitments.length === 0 ? (
            <div className="p-6 text-center">
              <Target className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                No commitments this session
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Add one above to get started
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {sortedSessionCommitments.map(commitment => (
                <div key={commitment.id}>
                  {renderCommitmentItem(commitment, false)}
                </div>
              ))}
            </div>
          )
        ) : // All Active Commitments
        loadingActive ? (
          <div className="p-4 flex items-center justify-center gap-2 text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Loading...</span>
          </div>
        ) : allActiveCommitments.length === 0 ? (
          <div className="p-6 text-center">
            <Target className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No active commitments</p>
            <p className="text-xs text-gray-400 mt-1">
              All commitments have been completed!
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {allActiveCommitments.map(commitment => (
              <div key={commitment.id}>
                {renderCommitmentItem(commitment, true)}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
