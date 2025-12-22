'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Trophy, Loader2, Calendar, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WinsService } from '@/services/wins-service'
import { SessionWin } from '@/types/win'
import Link from 'next/link'

interface ClientWinsTimelineProps {
  clientId: string
}

interface WinsBySession {
  sessionId: string
  sessionTitle: string | null
  sessionDate: string | null
  wins: SessionWin[]
}

export function ClientWinsTimeline({ clientId }: ClientWinsTimelineProps) {
  const [wins, setWins] = useState<SessionWin[]>([])
  const [_clientName, setClientName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadWins = async () => {
      try {
        const response = await WinsService.getClientWins(clientId)
        setWins(response.wins)
        setClientName(response.client_name)
      } catch (error) {
        console.error('Failed to load client wins:', error)
      } finally {
        setLoading(false)
      }
    }

    loadWins()
  }, [clientId])

  if (loading) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  // Group wins by session
  const winsBySession: WinsBySession[] = []
  const sessionMap = new Map<string, WinsBySession>()

  for (const win of wins) {
    if (!sessionMap.has(win.session_id)) {
      sessionMap.set(win.session_id, {
        sessionId: win.session_id,
        sessionTitle: win.session_title || null,
        sessionDate: win.session_date || null,
        wins: [],
      })
    }
    sessionMap.get(win.session_id)!.wins.push(win)
  }

  // Convert to array and sort by date (newest first)
  winsBySession.push(...sessionMap.values())
  winsBySession.sort((a, b) => {
    if (!a.sessionDate && !b.sessionDate) return 0
    if (!a.sessionDate) return 1
    if (!b.sessionDate) return -1
    return new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
  })

  const approvedWins = wins.filter(w => w.is_approved)
  const pendingWins = wins.filter(w => !w.is_approved)

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Client Wins</CardTitle>
              <p className="text-sm text-gray-500">
                Achievements and breakthroughs from all sessions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
              {approvedWins.length} wins
            </Badge>
            {pendingWins.length > 0 && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                {pendingWins.length} pending
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {winsBySession.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {winsBySession.map(sessionGroup => (
              <div key={sessionGroup.sessionId} className="p-6">
                {/* Session Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {sessionGroup.sessionTitle || 'Coaching Session'}
                      </h4>
                      {sessionGroup.sessionDate && (
                        <p className="text-sm text-gray-500">
                          {format(
                            new Date(sessionGroup.sessionDate),
                            'MMMM d, yyyy',
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link href={`/sessions/${sessionGroup.sessionId}`}>
                    <Button variant="ghost" size="sm" className="text-gray-500">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Session
                    </Button>
                  </Link>
                </div>

                {/* Wins for this session */}
                <div className="space-y-3 ml-7">
                  {sessionGroup.wins.map(win => (
                    <div
                      key={win.id}
                      className={`p-4 rounded-lg border ${
                        win.is_approved
                          ? 'bg-white border-gray-200'
                          : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            win.is_approved ? 'bg-amber-100' : 'bg-amber-200'
                          }`}
                        >
                          <Trophy
                            className={`h-4 w-4 ${
                              win.is_approved
                                ? 'text-amber-600'
                                : 'text-amber-700'
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-medium text-gray-900">
                              {win.title}
                            </h5>
                            <div className="flex gap-1.5">
                              {win.is_ai_generated && (
                                <Badge
                                  variant="secondary"
                                  className="bg-gray-100 text-gray-500 text-xs"
                                >
                                  AI
                                </Badge>
                              )}
                              {!win.is_approved && (
                                <Badge
                                  variant="secondary"
                                  className="bg-amber-100 text-amber-700 text-xs"
                                >
                                  Pending
                                </Badge>
                              )}
                            </div>
                          </div>
                          {win.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {win.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No wins recorded yet
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Wins will appear here as they are recorded during coaching
              sessions. Use AI extraction or add them manually from session
              details.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
