'use client'

import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import {
  CalendarClock,
  Play,
  Send,
  CheckCircle2,
  Clock,
  Mail,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUpcomingSessions } from '@/hooks/queries/use-questionnaire'
import { useSendQuestionnaire } from '@/hooks/mutations/use-questionnaire-mutations'

export function UpcomingSessions() {
  const router = useRouter()
  const { data: sessions, isLoading } = useUpcomingSessions()
  const sendQuestionnaire = useSendQuestionnaire()

  if (isLoading || !sessions || sessions.length === 0) return null

  return (
    <Card className="border-gray-200 dark:border-gray-700 mb-6">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-gray-500" />
            <CardTitle className="text-base font-semibold">
              Upcoming Sessions
            </CardTitle>
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
              {sessions.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-gray-100 dark:divide-gray-800">
        {sessions.map(session => {
          const scheduledDate = session.scheduled_for
            ? new Date(session.scheduled_for)
            : null
          const isOverdue = scheduledDate ? isPast(scheduledDate) : false

          return (
            <div
              key={session.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/sessions/${session.id}`)}
            >
              {/* Left: Client + Time */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {session.client_name || 'Unknown Client'}
                  </span>
                  {session.title && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:inline">
                      {session.title}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span
                    className={`text-xs ${isOverdue ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    {scheduledDate
                      ? `${format(scheduledDate, 'MMM d, h:mm a')} (${formatDistanceToNow(scheduledDate, { addSuffix: true })})`
                      : 'No date set'}
                  </span>
                </div>
              </div>

              {/* Center: Questionnaire Status */}
              <div className="flex items-center gap-2 mx-4">
                {session.questionnaire_completed ? (
                  <Badge
                    variant="secondary"
                    className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Answered
                  </Badge>
                ) : session.questionnaire_sent ? (
                  <Badge
                    variant="secondary"
                    className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Sent
                  </Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-gray-500 hover:text-gray-700"
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
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Send Q&A
                  </Button>
                )}
              </div>

              {/* Right: View Button */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs shrink-0"
                onClick={e => {
                  e.stopPropagation()
                  router.push(`/sessions/${session.id}`)
                }}
              >
                <Play className="h-3 w-3 mr-1" />
                Open
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
