'use client'

import { useRef, useState } from 'react'
import { Clock, MessageSquare, Play, User, Users, Video } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatDate, formatRelativeTime } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface SharedSessionRowSession {
  id: string
  title?: string | null
  status: string
  created_at: string
  duration_seconds?: number | null
  coach_name?: string | null
  client_name?: string | null
  meeting_url?: string | null
  video_url?: string | null
  video_unavailable?: boolean
  is_group_session?: boolean
  participant_count?: number | null
}

interface SharedSessionRowProps {
  session: SharedSessionRowSession
  onOpen: (sessionId: string) => void
}

function platformLabel(url: string | null | undefined): string {
  if (!url) return 'Meeting'
  if (url.includes('zoom.us')) return 'Zoom'
  if (url.includes('meet.google.com')) return 'Google Meet'
  if (url.includes('teams.microsoft.com')) return 'Teams'
  return 'Meeting'
}

function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds || seconds <= 0) return null
  const m = Math.floor(seconds / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m`
  return `${m}m`
}

export function SharedSessionRow({ session, onOpen }: SharedSessionRowProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [thumbReady, setThumbReady] = useState(false)
  const [thumbFailed, setThumbFailed] = useState(false)

  const platform = platformLabel(session.meeting_url)
  const dateLabel = formatDate(session.created_at, 'EEE, MMM d, yyyy')
  const relative = formatRelativeTime(session.created_at)
  const duration = formatDuration(session.duration_seconds)
  const title =
    session.title ||
    `${platform} — ${formatDate(session.created_at, 'MMM d, yyyy')}`

  const hasVideo = !!session.video_url && !session.video_unavailable

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpen(session.id)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(session.id)
        }
      }}
      className={cn(
        'group flex flex-col sm:flex-row gap-4 p-4 cursor-pointer',
        'border border-app-border bg-white dark:bg-gray-900',
        'hover:border-indigo-300 hover:shadow-md transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2',
      )}
    >
      {/* Thumbnail */}
      <div
        className={cn(
          'relative flex-shrink-0 overflow-hidden rounded-lg bg-gray-900',
          'w-full sm:w-64 aspect-video',
        )}
      >
        {hasVideo && !thumbFailed ? (
          <>
            <video
              ref={videoRef}
              src={session.video_url ?? undefined}
              preload="metadata"
              muted
              playsInline
              onLoadedData={() => setThumbReady(true)}
              onError={() => setThumbFailed(true)}
              className={cn(
                'h-full w-full object-cover transition-opacity duration-300',
                thumbReady ? 'opacity-100' : 'opacity-0',
              )}
            />
            {!thumbReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <Video className="h-8 w-8 text-gray-500 animate-pulse" />
              </div>
            )}
            {/* Play overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
              <div className="rounded-full bg-white/90 p-3 shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-transform">
                <Play className="h-5 w-5 text-gray-900 fill-current" />
              </div>
            </div>
            {duration && (
              <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                {duration}
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800">
            <Video className="h-8 w-8 text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {session.video_unavailable
                ? 'Recording unavailable'
                : 'No recording yet'}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 min-w-0 flex-col justify-between gap-2">
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-app-primary truncate">
            {title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-app-secondary">
            {session.coach_name && (
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-app-secondary" />
                <span>
                  Shared by{' '}
                  <span className="font-medium text-app-primary">
                    {session.coach_name}
                  </span>
                </span>
              </span>
            )}
            {session.client_name && (
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-app-secondary" />
                <span>
                  Client:{' '}
                  <span className="font-medium text-app-primary">
                    {session.client_name}
                  </span>
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3 text-xs text-app-secondary">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {dateLabel} · {relative}
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 group-hover:text-indigo-700">
            <MessageSquare className="h-3.5 w-3.5" />
            Open review
          </span>
        </div>
      </div>
    </Card>
  )
}
