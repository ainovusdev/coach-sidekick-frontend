/**
 * Active Sessions Card
 * Shows live coaching sessions that the client can join
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Radio, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ActiveSession {
  session_id: string
  meeting_url: string
  coach_name: string
  started_at: string
  duration_seconds: number
  client_meeting_url: string | null
}

export function ActiveSessionsCard() {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchActiveSessions()
    // Poll every 30 seconds
    const interval = setInterval(fetchActiveSessions, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchActiveSessions = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${apiUrl}/client-portal/active-sessions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setActiveSessions(data)
      }
    } catch (err) {
      console.error('Failed to fetch active sessions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const hours = Math.floor(mins / 60)
    if (hours > 0) {
      return `${hours}h ${mins % 60}m`
    }
    return `${mins}m`
  }

  // Don't render anything if no active sessions
  if (!isLoading && activeSessions.length === 0) {
    return null
  }

  if (isLoading) {
    return null // Don't show loading state to avoid layout shift
  }

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-green-800">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Live Session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeSessions.map(session => (
          <div
            key={session.session_id}
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200"
          >
            <div className="space-y-1">
              <p className="font-medium text-gray-900">
                Session with {session.coach_name}
              </p>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(session.duration_seconds)} elapsed
                </span>
                <span>
                  Started{' '}
                  {formatDistanceToNow(new Date(session.started_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>

            {session.client_meeting_url ? (
              <Link href={session.client_meeting_url}>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Radio className="h-4 w-4 mr-2" />
                  Join Session
                </Button>
              </Link>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                No link available
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
