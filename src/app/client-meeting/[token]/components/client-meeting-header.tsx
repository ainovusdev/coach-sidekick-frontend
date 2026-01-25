/**
 * Client Meeting Header
 * Shows branding, coach name, session timer, and live status
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, User, Circle, RefreshCw, Sparkles } from 'lucide-react'
import { formatDuration } from '../hooks/use-meeting-status'

interface ClientMeetingHeaderProps {
  coachName: string | null
  clientName: string | null
  durationSeconds: number
  isEnded: boolean
  onRefresh?: () => void
}

export function ClientMeetingHeader({
  coachName,
  clientName,
  durationSeconds,
  isEnded,
  onRefresh,
}: ClientMeetingHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Session Info */}
          <div className="flex items-center gap-6">
            {/* Brand Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Coach Sidekick
                </h1>
                <p className="text-xs text-gray-400">Live Session</p>
              </div>
            </div>

            <div className="hidden md:block h-8 w-px bg-gray-700" />

            {/* Session Info */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-white">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-300" />
                </div>
                <div>
                  <p className="font-medium text-white">
                    {coachName
                      ? `Session with ${coachName}`
                      : 'Coaching Session'}
                  </p>
                  {clientName && (
                    <p className="text-xs text-gray-400">
                      Welcome back, {clientName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Timer and Status */}
          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-4 py-2 border border-gray-700">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="font-mono text-xl font-semibold text-white tabular-nums">
                {formatDuration(durationSeconds)}
              </span>
            </div>

            {/* Refresh Button */}
            {onRefresh && !isEnded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="text-gray-400 hover:text-white hover:bg-gray-700"
                title="Refresh data"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}

            {/* Status Badge */}
            {isEnded ? (
              <Badge
                variant="secondary"
                className="bg-gray-700 text-gray-300 flex items-center gap-1.5 px-3 py-1.5"
              >
                <Circle className="h-2 w-2 fill-gray-500" />
                Session Ended
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 px-3 py-1.5"
              >
                <Circle className="h-2 w-2 fill-emerald-500 animate-pulse" />
                Live
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
