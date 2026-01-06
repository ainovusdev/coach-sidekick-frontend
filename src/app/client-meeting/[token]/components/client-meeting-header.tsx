/**
 * Client Meeting Header
 * Shows coach name, session timer, and live status
 */

import { Badge } from '@/components/ui/badge'
import { Clock, User, Circle } from 'lucide-react'
import { formatDuration } from '../hooks/use-meeting-status'

interface ClientMeetingHeaderProps {
  coachName: string | null
  clientName: string | null
  durationSeconds: number
  isEnded: boolean
}

export function ClientMeetingHeader({
  coachName,
  clientName,
  durationSeconds,
  isEnded,
}: ClientMeetingHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Session Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <User className="h-5 w-5 text-gray-500" />
              <span className="font-medium">
                {coachName ? `Session with ${coachName}` : 'Coaching Session'}
              </span>
            </div>

            {clientName && (
              <>
                <div className="h-5 w-px bg-gray-300" />
                <span className="text-sm text-gray-500">
                  Welcome, {clientName}
                </span>
              </>
            )}
          </div>

          {/* Right: Timer and Status */}
          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="font-mono text-lg font-medium">
                {formatDuration(durationSeconds)}
              </span>
            </div>

            <div className="h-5 w-px bg-gray-300" />

            {/* Status Badge */}
            {isEnded ? (
              <Badge
                variant="secondary"
                className="bg-gray-100 text-gray-700 flex items-center gap-1.5"
              >
                <Circle className="h-2 w-2 fill-gray-400" />
                Ended
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 flex items-center gap-1.5"
              >
                <Circle className="h-2 w-2 fill-green-500 animate-pulse" />
                Live
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
