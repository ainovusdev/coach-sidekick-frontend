'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow, isPast, startOfDay } from 'date-fns'
import {
  CalendarClock,
  ArrowRight,
  Send,
  CheckCircle2,
  Clock,
  Mail,
  CalendarIcon,
  Pencil,
  Loader2,
  RotateCw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useUpcomingSessions } from '@/hooks/queries/use-questionnaire'
import {
  useSendQuestionnaire,
  useRescheduleSession,
} from '@/hooks/mutations/use-questionnaire-mutations'
import { useUpdateSession } from '@/hooks/mutations/use-session-mutations'

interface ClientUpcomingSessionsProps {
  clientId: string
}

export function ClientUpcomingSessions({
  clientId,
}: ClientUpcomingSessionsProps) {
  const router = useRouter()
  const { data: sessions, isLoading } = useUpcomingSessions(clientId)
  const sendQuestionnaire = useSendQuestionnaire()
  const reschedule = useRescheduleSession()
  const updateSession = useUpdateSession()
  const [openCalendarId, setOpenCalendarId] = useState<string | null>(null)
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingTitleId && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [editingTitleId])

  if (isLoading || !sessions || sessions.length === 0) return null

  const handleReschedule = (sessionId: string, newDate: Date | undefined) => {
    if (!newDate) return
    const session = sessions.find(s => s.id === sessionId)
    if (session?.scheduled_for) {
      const original = new Date(session.scheduled_for)
      newDate.setHours(original.getHours(), original.getMinutes(), 0, 0)
    }
    reschedule.mutate({ sessionId, scheduledFor: newDate.toISOString() })
    setOpenCalendarId(null)
  }

  const handleTitleSave = (sessionId: string) => {
    const trimmed = editingTitle.trim()
    if (trimmed) {
      updateSession.mutate({ sessionId, data: { title: trimmed } })
    }
    setEditingTitleId(null)
  }

  const startEditingTitle = (session: { id: string; title: string | null }) => {
    setEditingTitleId(session.id)
    setEditingTitle(session.title || '')
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock className="h-4 w-4 text-ink-4" />
        <h3 className="text-sm font-semibold text-ink ">Upcoming Sessions</h3>
        <span className="text-xs text-ink-4 font-medium">
          {sessions.length}
        </span>
      </div>

      <div className="space-y-2">
        {sessions.map(session => {
          const scheduledDate = session.scheduled_for
            ? new Date(session.scheduled_for)
            : null
          const isOverdue = scheduledDate ? isPast(scheduledDate) : false

          return (
            <div
              key={session.id}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-line bg-paper/50 hover:bg-paper transition-colors group"
            >
              {/* Title (editable) */}
              <div className="flex-1 min-w-0">
                {editingTitleId === session.id ? (
                  <input
                    ref={titleInputRef}
                    value={editingTitle}
                    onChange={e => setEditingTitle(e.target.value)}
                    onBlur={() => handleTitleSave(session.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleTitleSave(session.id)
                      if (e.key === 'Escape') setEditingTitleId(null)
                    }}
                    className="w-full text-sm font-medium bg-surface-1 border border-line-strong rounded px-2 py-0.5 outline-none focus:border-line "
                  />
                ) : (
                  <button
                    onClick={() => startEditingTitle(session)}
                    className="text-sm font-medium text-ink truncate block text-left group/title hover:text-ink-3 transition-colors"
                    title="Click to edit title"
                  >
                    {session.title || 'Scheduled Session'}
                    <Pencil className="h-2.5 w-2.5 ml-1.5 inline opacity-0 group-hover:opacity-40 transition-opacity" />
                  </button>
                )}
              </div>

              {/* Date (reschedule) */}
              <Popover
                open={openCalendarId === session.id}
                onOpenChange={open =>
                  setOpenCalendarId(open ? session.id : null)
                }
              >
                <PopoverTrigger asChild>
                  <button
                    className={`flex items-center gap-1 text-xs shrink-0 hover:underline ${
                      isOverdue ? 'text-vermillion' : 'text-ink-3 '
                    }`}
                    title="Click to reschedule"
                  >
                    <Clock className="h-3 w-3" />
                    {scheduledDate
                      ? `${format(scheduledDate, 'MMM d, h:mm a')} (${formatDistanceToNow(scheduledDate, { addSuffix: true })})`
                      : 'No date'}
                    <CalendarIcon className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={scheduledDate || undefined}
                    onSelect={date => handleReschedule(session.id, date)}
                    disabled={date => date < startOfDay(new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Q&A status + resend */}
              <div className="flex items-center gap-1.5 shrink-0">
                {session.questionnaire_completed ? (
                  <Badge
                    variant="secondary"
                    className="bg-forest-bg text-forest border-forest text-[10px] px-1.5 py-0 h-5"
                  >
                    <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                    Answered
                  </Badge>
                ) : session.questionnaire_sent ? (
                  <>
                    <Badge
                      variant="secondary"
                      className="bg-ds-accent-bg text-ds-accent border-ds-accent text-[10px] px-1.5 py-0 h-5"
                    >
                      <Mail className="h-2.5 w-2.5 mr-0.5" />
                      Sent
                    </Badge>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        if (session.client_id) {
                          sendQuestionnaire.mutate({
                            sessionId: session.id,
                            clientId: session.client_id,
                          })
                        }
                      }}
                      disabled={sendQuestionnaire.isPending}
                      className="text-[10px] text-ink-4 hover:text-ink-3 transition-colors disabled:opacity-50"
                      title="Resend questionnaire"
                    >
                      {sendQuestionnaire.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RotateCw className="h-3 w-3" />
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      if (session.client_id) {
                        sendQuestionnaire.mutate({
                          sessionId: session.id,
                          clientId: session.client_id,
                        })
                      }
                    }}
                    disabled={sendQuestionnaire.isPending}
                    className="flex items-center gap-1 text-[10px] font-medium text-ink-3 hover:text-ink-2 transition-colors disabled:opacity-50"
                  >
                    <Send className="h-2.5 w-2.5" />
                    Send Q&A
                  </button>
                )}
              </div>

              {/* Open */}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 shrink-0 text-ink-3 hover:text-ink "
                onClick={() => router.push(`/sessions/${session.id}`)}
              >
                Open
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
