'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  format,
  addDays,
  isToday,
  isTomorrow,
  startOfDay,
  isSameDay,
} from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useClientsSimple } from '@/hooks/queries/use-clients'
import { useScheduleSession } from '@/hooks/mutations/use-questionnaire-mutations'

interface ScheduleSessionModalProps {
  isOpen: boolean
  onClose: () => void
  preselectedClientId?: string
}

// Quick-pick date options
function getQuickDates() {
  const today = startOfDay(new Date())
  return [
    { label: 'Today', date: today },
    { label: 'Tomorrow', date: addDays(today, 1) },
    { label: format(addDays(today, 2), 'EEE, MMM d'), date: addDays(today, 2) },
    { label: format(addDays(today, 3), 'EEE, MMM d'), date: addDays(today, 3) },
    {
      label: `Next ${format(addDays(today, 7), 'EEEE')}`,
      date: addDays(today, 7),
    },
  ]
}

function formatDateLabel(date: Date | undefined) {
  if (!date) return 'Pick a date'
  if (isToday(date)) return `Today, ${format(date, 'MMM d')}`
  if (isTomorrow(date)) return `Tomorrow, ${format(date, 'MMM d')}`
  return format(date, 'EEE, MMM d, yyyy')
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = ['00', '15', '30', '45']

export function ScheduleSessionModal({
  isOpen,
  onClose,
  preselectedClientId,
}: ScheduleSessionModalProps) {
  const router = useRouter()
  const { data: clientsData, isLoading: loadingClients } = useClientsSimple()
  const clients = clientsData?.clients || []
  const scheduleSession = useScheduleSession()

  const [clientId, setClientId] = useState(preselectedClientId || '')
  const [sessionDate, setSessionDate] = useState<Date | undefined>(undefined)
  const [hour, setHour] = useState('10')
  const [minute, setMinute] = useState('00')
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM')
  const [title, setTitle] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [sendQuestionnaire, setSendQuestionnaire] = useState(true)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const quickDates = useMemo(() => getQuickDates(), [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clientId || !sessionDate) return

    // Convert 12h to 24h
    let h = parseInt(hour)
    if (period === 'AM' && h === 12) h = 0
    if (period === 'PM' && h !== 12) h += 12

    const scheduledFor = new Date(sessionDate)
    scheduledFor.setHours(h, parseInt(minute), 0, 0)

    const result = await scheduleSession.mutateAsync({
      client_id: clientId,
      scheduled_for: scheduledFor.toISOString(),
      title: title || undefined,
      meeting_url: meetingUrl || undefined,
      send_questionnaire: sendQuestionnaire,
    })

    onClose()
    router.push(`/sessions/${result.id}`)
  }

  const handleClose = () => {
    setClientId(preselectedClientId || '')
    setSessionDate(undefined)
    setHour('10')
    setMinute('00')
    setPeriod('AM')
    setTitle('')
    setMeetingUrl('')
    setSendQuestionnaire(true)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Schedule Session</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Schedule an upcoming session and send a pre-session questionnaire to
            your client
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Client Selection */}
          {!preselectedClientId && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Client <span className="text-red-500">*</span>
              </Label>
              {loadingClients ? (
                <div className="flex items-center justify-center p-3 border rounded-md">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : (
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Date <span className="text-red-500">*</span>
            </Label>

            {/* Quick date pills */}
            <div className="flex flex-wrap gap-1.5">
              {quickDates.map(qd => (
                <button
                  key={qd.label}
                  type="button"
                  onClick={() => setSessionDate(qd.date)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-full border transition-all',
                    sessionDate && isSameDay(sessionDate, qd.date)
                      ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:border-gray-500',
                  )}
                >
                  {qd.label}
                </button>
              ))}
            </div>

            {/* Calendar picker */}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !sessionDate && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateLabel(sessionDate)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={sessionDate}
                  onSelect={date => {
                    setSessionDate(date)
                    setCalendarOpen(false)
                  }}
                  disabled={date => date < startOfDay(new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Time</Label>
            <div className="flex items-center gap-2">
              {/* Hour */}
              <Select value={hour} onValueChange={setHour}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[200px]">
                    {HOURS.map(h => (
                      <SelectItem key={h} value={String(h)}>
                        {String(h).padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>

              <span className="text-lg font-medium text-muted-foreground">
                :
              </span>

              {/* Minute */}
              <Select value={minute} onValueChange={setMinute}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MINUTES.map(m => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* AM/PM toggle */}
              <div className="flex rounded-lg border border-input overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPeriod('AM')}
                  className={cn(
                    'px-3 py-2 text-sm font-medium transition-colors',
                    period === 'AM'
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'bg-white text-gray-500 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400',
                  )}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('PM')}
                  className={cn(
                    'px-3 py-2 text-sm font-medium transition-colors',
                    period === 'PM'
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'bg-white text-gray-500 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400',
                  )}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Title{' '}
              <span className="text-muted-foreground font-normal">
                (Optional)
              </span>
            </Label>
            <Input
              placeholder="e.g., Weekly Check-in"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Meeting URL */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Meeting URL{' '}
              <span className="text-muted-foreground font-normal">
                (Optional)
              </span>
            </Label>
            <Input
              placeholder="https://zoom.us/j/..."
              value={meetingUrl}
              onChange={e => setMeetingUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              You can add this later before starting the session
            </p>
          </div>

          {/* Send Questionnaire */}
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
            <Checkbox
              id="send-questionnaire"
              checked={sendQuestionnaire}
              onCheckedChange={checked =>
                setSendQuestionnaire(checked as boolean)
              }
            />
            <div>
              <Label
                htmlFor="send-questionnaire"
                className="text-sm font-medium cursor-pointer"
              >
                Send pre-session questionnaire
              </Label>
              <p className="text-xs text-muted-foreground">
                Client will receive 5 reflection questions via email
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={scheduleSession.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                scheduleSession.isPending ||
                !clientId ||
                !sessionDate ||
                loadingClients
              }
              className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900"
            >
              {scheduleSession.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Schedule Session
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
