import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BotStatus } from '@/components/meeting/bot-status'
import { WebSocketStatus } from '@/components/meeting/websocket-status'
import { Bot } from '@/types/meeting'
import {
  ArrowLeft,
  ExternalLink,
  Users,
  MessageSquare,
  Bug,
  Pause,
  Play,
} from 'lucide-react'

interface MeetingHeaderProps {
  bot: Bot | null
  transcriptLength: number
  showDebug: boolean
  isStoppingBot: boolean
  isPaused: boolean
  onToggleDebug: () => void
  onStopBot: () => void
  onPauseResume: () => void
  onNavigateBack: () => void
}

export default function MeetingHeader({
  bot,
  transcriptLength,
  showDebug,
  isStoppingBot,
  isPaused,
  onToggleDebug,
  onStopBot,
  onPauseResume,
  onNavigateBack,
}: MeetingHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigateBack}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>

            {bot && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-px bg-gray-300" />
                <Badge variant="outline" className="font-mono text-xs">
                  {bot.id}
                </Badge>
                <BotStatus bot={bot} onStop={onStopBot} compact />
                <div className="h-8 w-px bg-gray-300" />
                <WebSocketStatus />
              </div>
            )}
          </div>

          {bot && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span className="capitalize">
                    {bot.platform || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{transcriptLength} entries</span>
                </div>
              </div>

              <div className="h-6 w-px bg-gray-300" />

              <Button
                variant={showDebug ? 'default' : 'outline'}
                size="sm"
                onClick={onToggleDebug}
              >
                <Bug className="h-4 w-4 mr-2" />
                Debug
              </Button>

              {bot.meeting_url !== '#' && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={bot.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Join Meeting
                  </a>
                </Button>
              )}
              
              <Button
                variant={isPaused ? 'default' : 'outline'}
                size="sm"
                onClick={onPauseResume}
                disabled={bot.status === 'call_ended' || isStoppingBot}
                className={isPaused ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={onStopBot}
                disabled={bot.status === 'call_ended' || isStoppingBot}
              >
                {isStoppingBot ? 'Stopping...' : 'Stop Bot'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}