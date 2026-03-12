'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Radio, ArrowRight, Users } from 'lucide-react'
import { formatRelativeTime } from '@/lib/date-utils'

interface LiveSession {
  id: string
  bot_id: string
  client_name?: string | null
  coach_name?: string | null
  is_group_session?: boolean
  participant_count?: number | null
  created_at: string
}

interface LiveSessionBannerProps {
  sessions: LiveSession[]
}

export default function LiveSessionBanner({
  sessions,
}: LiveSessionBannerProps) {
  const router = useRouter()

  if (sessions.length === 0) return null

  return (
    <div className="space-y-3 mb-6">
      {sessions.map(session => {
        const title = session.is_group_session
          ? `Group Session${session.participant_count ? ` (${session.participant_count} participants)` : ''}`
          : session.client_name
            ? `Session with ${session.client_name}`
            : 'Live Session'

        return (
          <div
            key={session.id}
            className="relative overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-950/30 dark:to-gray-800 dark:border-emerald-800"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                {/* Pulsing live indicator */}
                <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                  <Radio className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {title}
                    </h3>
                    {session.is_group_session && (
                      <Users className="h-3.5 w-3.5 text-gray-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Started {formatRelativeTime(session.created_at)}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => router.push(`/meeting/${session.bot_id}`)}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Rejoin Session
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
