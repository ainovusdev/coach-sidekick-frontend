/**
 * Client Meeting Header
 * Shows branding, coach name, session timer, and live status
 */

'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, User, Circle, RefreshCw, Moon, Sun } from 'lucide-react'
import Image from 'next/image'
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
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Session Info */}
          <div className="flex items-center gap-6">
            {/* Brand Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg p-1.5">
                <Image
                  src="/novus-global-logo.webp"
                  alt="Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Coach Sidekick
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block">
                  Live Session
                </p>
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

            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="text-gray-400 hover:text-white hover:bg-gray-700"
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
                className="bg-white/20 text-white border border-white/30 flex items-center gap-1.5 px-3 py-1.5"
              >
                <Circle className="h-2 w-2 fill-white animate-pulse" />
                Live
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
