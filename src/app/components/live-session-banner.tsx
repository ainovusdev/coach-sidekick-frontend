'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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

  // Phase 1.6: surface a one-shot toast the moment a session goes live, so
  // coaches mid-task on the dashboard get an unmissable nudge alongside the
  // banner. Tracks the previously-known set of bot ids to fire only on
  // genuinely new live sessions, not on re-renders of an existing one.
  // Initial mount silently seeds the set so we don't toast for sessions
  // that were already running before the coach loaded the page.
  const seenBotIdsRef = useRef<Set<string>>(new Set())
  const seededRef = useRef(false)
  useEffect(() => {
    const seen = seenBotIdsRef.current
    if (!seededRef.current) {
      sessions.forEach(s => s.bot_id && seen.add(s.bot_id))
      seededRef.current = true
      return
    }
    sessions.forEach(s => {
      if (!s.bot_id || seen.has(s.bot_id)) return
      seen.add(s.bot_id)
      const who = s.is_group_session
        ? 'Group session'
        : s.client_name
          ? `Session with ${s.client_name}`
          : 'Session'
      toast.success(`${who} is live now`, {
        action: {
          label: 'Open live view',
          onClick: () => router.push(`/meeting/${s.bot_id}`),
        },
      })
    })
  }, [sessions, router])

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
            className="relative overflow-hidden rounded-xl border border-forest  "
          >
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                {/* Pulsing live indicator */}
                <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-forest-bg ">
                  <Radio className="h-5 w-5 text-forest " />
                  <span className="absolute inset-0 rounded-full bg-forest/30 animate-ping" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink ">{title}</h3>
                    {session.is_group_session && (
                      <Users className="h-3.5 w-3.5 text-ink-3" />
                    )}
                  </div>
                  <p className="text-xs text-ink-3 mt-0.5">
                    Started {formatRelativeTime(session.created_at)}
                  </p>
                </div>
              </div>

              <Button
                onClick={() =>
                  router.push(
                    session.bot_id
                      ? `/meeting/${session.bot_id}`
                      : `/sessions/${session.id}`,
                  )
                }
                size="sm"
                className="bg-forest hover:bg-forest text-ink-on-dark"
              >
                {session.bot_id ? 'Rejoin Session' : 'View Session'}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
