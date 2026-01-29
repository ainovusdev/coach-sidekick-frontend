/**
 * Client Commitment Panel
 * Allows clients to create and view commitments during the session
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Calendar as CalendarIcon,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { format, addDays, addWeeks } from 'date-fns'
import { toast } from 'sonner'
import {
  LiveMeetingService,
  ClientCommitment,
} from '@/services/live-meeting-service'

interface ClientCommitmentPanelProps {
  meetingToken: string
  guestToken: string | null
  refreshKey?: number
}

export function ClientCommitmentPanel({
  meetingToken,
  guestToken,
  refreshKey,
}: ClientCommitmentPanelProps) {
  const [commitments, setCommitments] = useState<ClientCommitment[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [targetDate, setTargetDate] = useState<Date | undefined>(
    addWeeks(new Date(), 2),
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false) // Calendar hidden by default

  // Fetch commitments with polling
  useEffect(() => {
    if (!guestToken) return

    const fetchCommitments = async (showLoading = false) => {
      if (showLoading) setIsLoading(true)
      try {
        const data = await LiveMeetingService.getCommitments(
          meetingToken,
          guestToken,
        )
        setCommitments(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Failed to fetch commitments:', err)
      } finally {
        if (showLoading) setIsLoading(false)
      }
    }

    // Initial fetch with loading state
    fetchCommitments(true)

    // Poll every 30 seconds for updates (coach may add commitments)
    const interval = setInterval(() => fetchCommitments(false), 30000)

    return () => clearInterval(interval)
  }, [meetingToken, guestToken, refreshKey])

  const handleCreateCommitment = async () => {
    if (!newTitle.trim() || !guestToken) return

    setIsSaving(true)
    try {
      const commitment = await LiveMeetingService.createCommitment(
        meetingToken,
        guestToken,
        {
          title: newTitle.trim(),
          priority: 'medium',
          type: 'action',
          target_date: targetDate
            ? format(targetDate, 'yyyy-MM-dd')
            : undefined,
        },
      )
      setCommitments([commitment, ...commitments])
      setNewTitle('')
      setTargetDate(addWeeks(new Date(), 2)) // Reset to default
      setShowForm(false)
      toast.success('Commitment added')
    } catch (err) {
      toast.error('Failed to create commitment')
      console.error('Failed to create commitment:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleComplete = async (commitment: ClientCommitment) => {
    if (!guestToken) return

    const newStatus = commitment.status === 'completed' ? 'active' : 'completed'
    const newProgress = newStatus === 'completed' ? 100 : 0

    try {
      const updated = await LiveMeetingService.updateCommitment(
        meetingToken,
        guestToken,
        commitment.id,
        {
          status: newStatus,
          progress_percentage: newProgress,
        },
      )
      setCommitments(
        commitments.map(c => (c.id === commitment.id ? updated : c)),
      )
    } catch (err) {
      toast.error('Failed to update commitment')
      console.error('Failed to update commitment:', err)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400'
      case 'medium':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
      case 'low':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  // Handle Enter to save
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCreateCommitment()
    }
    if (e.key === 'Escape') {
      setShowForm(false)
      setNewTitle('')
    }
  }

  // Quick date options
  const quickDates = [
    { label: 'Tomorrow', date: addDays(new Date(), 1) },
    { label: 'In 3 days', date: addDays(new Date(), 3) },
    { label: 'In 1 week', date: addWeeks(new Date(), 1) },
    { label: 'In 2 weeks', date: addWeeks(new Date(), 2) },
  ]

  return (
    <Card className="border-gray-200 dark:border-gray-700 h-full flex flex-col shadow-sm dark:bg-gray-800">
      <CardHeader className="border-b border-gray-100 dark:border-gray-700 py-4 flex-shrink-0 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center">
              <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <span className="text-gray-900 dark:text-white">Commitments</span>
              {commitments.length > 0 && (
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">
                  ({commitments.length})
                </span>
              )}
            </div>
          </CardTitle>
          {!showForm && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(true)}
              disabled={!guestToken}
              className="border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* New Commitment Form - With Embedded Calendar */}
        {showForm && (
          <div className="flex-shrink-0 p-4 bg-gradient-to-b from-emerald-50/50 to-white dark:from-emerald-900/20 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700">
            <div className="space-y-4">
              {/* Commitment Title Input */}
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">
                  What do you commit to?
                </label>
                <Input
                  placeholder="e.g., Complete the weekly report"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-emerald-400 focus:ring-emerald-400/20"
                  autoFocus
                />
              </div>

              {/* Quick Date Options */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Due Date
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="h-6 px-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
                  {quickDates.map(option => (
                    <Button
                      key={option.label}
                      type="button"
                      size="sm"
                      variant={
                        targetDate?.toDateString() ===
                        option.date.toDateString()
                          ? 'default'
                          : 'outline'
                      }
                      onClick={() => setTargetDate(option.date)}
                      className={
                        targetDate?.toDateString() ===
                        option.date.toDateString()
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-emerald-300 dark:hover:border-emerald-600'
                      }
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>

                {/* Inline Calendar - hidden by default */}
                {showCalendar && (
                  <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 overflow-hidden">
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
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    Due: {format(targetDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowForm(false)
                    setNewTitle('')
                    setTargetDate(addWeeks(new Date(), 2))
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateCommitment}
                  disabled={!newTitle.trim() || isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Commitment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Commitments List */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Loader2 className="h-6 w-6 mx-auto animate-spin text-gray-400 dark:text-gray-500 mb-2" />
              <p className="text-sm">Loading commitments...</p>
            </div>
          ) : !commitments || commitments.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Target className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                No commitments yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px] mx-auto">
                Add commitments to track your progress
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {commitments.map(commitment => (
                <div
                  key={commitment.id}
                  className={`p-3 rounded-xl border transition-all duration-200 ${
                    commitment.status === 'completed'
                      ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleComplete(commitment)}
                      className="flex-shrink-0 mt-0.5"
                    >
                      {commitment.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300 dark:text-gray-500 hover:text-emerald-400 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          commitment.status === 'completed'
                            ? 'text-gray-500 dark:text-gray-400 line-through'
                            : 'text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {commitment.title}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getPriorityColor(commitment.priority)}`}
                        >
                          {commitment.priority}
                        </Badge>
                        {commitment.target_date && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {format(new Date(commitment.target_date), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
