'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BotStatus } from '@/components/meeting/bot-status'
import { WebSocketStatus } from '@/components/meeting/websocket-status'
import { ClientMeetingLink } from '@/components/meeting/client-meeting-link'
import { Bot } from '@/types/meeting'
import {
  ArrowLeft,
  ExternalLink,
  Users,
  MessageSquare,
  Moon,
  Sun,
} from 'lucide-react'

interface MeetingHeaderProps {
  bot: Bot | null
  transcriptLength: number
  isStoppingBot: boolean
  sessionId?: string | null
  clientId?: string | null
  clientName?: string | null
  onStopBot: () => void
  onNavigateBack: () => void
}

export default function MeetingHeader({
  bot,
  transcriptLength,
  isStoppingBot,
  sessionId,
  clientId,
  clientName,
  onStopBot,
  onNavigateBack,
}: MeetingHeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigateBack}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>

            {bot && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />
                <Badge
                  variant="outline"
                  className="font-mono text-xs dark:border-gray-600 dark:text-gray-300"
                >
                  {bot.id}
                </Badge>
                <BotStatus bot={bot} onStop={onStopBot} compact />
                <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />
                <WebSocketStatus />
              </div>
            )}
          </div>

          {bot && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
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

              {/* Client Meeting Link - inline with actions */}
              {sessionId && (
                <>
                  <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                  <ClientMeetingLink
                    sessionId={sessionId}
                    clientId={clientId ?? null}
                    clientName={clientName}
                  />
                </>
              )}

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

              {/* Theme Toggle */}
              {mounted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  title={
                    theme === 'dark'
                      ? 'Switch to light mode'
                      : 'Switch to dark mode'
                  }
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              )}

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
