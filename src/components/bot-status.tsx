'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Circle, Square, ExternalLink } from 'lucide-react'

interface Bot {
  id: string
  status: string | undefined
  meeting_url: string
  transcript_url?: string
}

interface BotStatusProps {
  bot: Bot
  onStop: () => void
  compact?: boolean
}

export function BotStatus({ bot, onStop, compact = false }: BotStatusProps) {
  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'blue'

    switch (status.toLowerCase()) {
      case 'joining':
        return 'yellow'
      case 'in_meeting':
      case 'in_call_recording':
      case 'recording':
        return 'green'
      case 'done':
        return 'gray'
      case 'error':
        return 'red'
      default:
        return 'blue'
    }
  }

  const getStatusText = (status: string | undefined) => {
    if (!status) return 'Connecting...'

    switch (status.toLowerCase()) {
      case 'joining':
        return 'Joining Meeting'
      case 'in_meeting':
        return 'In Meeting'
      case 'in_call_recording':
        return 'Recording'
      case 'recording':
        return 'Recording Active'
      case 'done':
        return 'Complete'
      case 'error':
        return 'Error'
      default:
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  const getStatusVariant = (status: string | undefined) => {
    const color = getStatusColor(status)
    switch (color) {
      case 'green':
        return 'default'
      case 'gray':
        return 'secondary'
      case 'red':
        return 'destructive'
      case 'yellow':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const statusColor = getStatusColor(bot.status)
  const statusText = getStatusText(bot.status)
  const isActive = statusColor === 'green'

  // Compact version for header
  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <Circle
          className={`w-2 h-2 ${
            statusColor === 'green'
              ? 'text-green-500 fill-green-500'
              : statusColor === 'yellow'
              ? 'text-yellow-500 fill-yellow-500'
              : statusColor === 'red'
              ? 'text-red-500 fill-red-500'
              : statusColor === 'gray'
              ? 'text-gray-400 fill-gray-400'
              : 'text-blue-500 fill-blue-500'
          } ${isActive ? 'animate-pulse' : ''}`}
        />
        <Badge variant={getStatusVariant(bot.status)} className="text-xs">
          {statusText}
        </Badge>
      </div>
    )
  }

  // Full version
  return (
    <div className="space-y-4">
      {/* Status Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Circle
              className={`w-3 h-3 ${
                statusColor === 'green'
                  ? 'text-green-500 fill-green-500'
                  : statusColor === 'yellow'
                  ? 'text-yellow-500 fill-yellow-500'
                  : statusColor === 'red'
                  ? 'text-red-500 fill-red-500'
                  : statusColor === 'gray'
                  ? 'text-gray-400 fill-gray-400'
                  : 'text-blue-500 fill-blue-500'
              } ${isActive ? 'animate-pulse' : ''}`}
            />
          </div>
          <div>
            <p className="text-sm font-medium">Recording Bot</p>
            <Badge variant={getStatusVariant(bot.status)} className="text-xs">
              {statusText}
            </Badge>
          </div>
        </div>

        {bot.status !== 'done' && bot.status !== 'stopping' && (
          <Button
            variant="outline"
            size="sm"
            onClick={onStop}
            className="text-destructive hover:text-destructive"
          >
            <Square className="w-3 h-3 mr-1" />
            Stop
          </Button>
        )}
      </div>

      {/* Bot Details */}
      <div className="space-y-3 pt-3 border-t">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Bot ID</span>
          <span className="font-mono">{bot.id.slice(0, 8)}...</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Meeting</span>
          <Button
            variant="link"
            size="sm"
            asChild
            className="h-auto p-0 text-xs"
          >
            <a
              href={bot.meeting_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1"
            >
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
