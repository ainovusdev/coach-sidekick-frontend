'use client'

import React, { useState, useEffect } from 'react'
import { formatDate } from '@/lib/date-utils'
import {
  Trophy,
  Loader2,
  Calendar,
  User,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WinsService } from '@/services/wins-service'
import { ProgramWinsResponse } from '@/types/win'
import Link from 'next/link'

interface ProgramWinsProps {
  programId: string
}

export function ProgramWins({ programId }: ProgramWinsProps) {
  const [data, setData] = useState<ProgramWinsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadWins = async () => {
      try {
        const response = await WinsService.getProgramWins(programId)
        setData(response)
        // Auto-expand clients with wins
        const clientsWithWins = response.clients
          .filter(c => c.total_wins > 0)
          .map(c => c.client_id)
        setExpandedClients(new Set(clientsWithWins.slice(0, 3))) // Expand first 3
      } catch (error) {
        console.error('Failed to load program wins:', error)
      } finally {
        setLoading(false)
      }
    }

    loadWins()
  }, [programId])

  const toggleClient = (clientId: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev)
      if (newSet.has(clientId)) {
        newSet.delete(clientId)
      } else {
        newSet.add(clientId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Unable to load wins data</p>
        </CardContent>
      </Card>
    )
  }

  const clientsWithWins = data.clients.filter(c => c.total_wins > 0)
  const clientsWithoutWins = data.clients.filter(c => c.total_wins === 0)
  const approvedWinsCount = data.clients.reduce(
    (sum, c) => sum + c.wins.filter(w => w.is_approved).length,
    0,
  )

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Sandbox Wins</CardTitle>
                <CardDescription>
                  Achievements and breakthroughs across all clients
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-amber-700">
                {data.total_wins}
              </p>
              <p className="text-sm text-amber-600">
                Total Wins ({approvedWinsCount} approved)
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/60 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {data.clients.length}
              </p>
              <p className="text-xs text-gray-600">Total Clients</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {clientsWithWins.length}
              </p>
              <p className="text-xs text-gray-600">Clients with Wins</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {data.total_wins > 0
                  ? Math.round(
                      (data.total_wins / clientsWithWins.length) * 10,
                    ) / 10
                  : 0}
              </p>
              <p className="text-xs text-gray-600">Avg Wins/Client</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(
                  (approvedWinsCount / Math.max(data.total_wins, 1)) * 100,
                )}
                %
              </p>
              <p className="text-xs text-gray-600">Approval Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients with Wins */}
      {clientsWithWins.length > 0 ? (
        <Card>
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-lg">Wins by Client</CardTitle>
            <CardDescription>
              Click on a client to expand and see their wins
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {clientsWithWins
                .sort((a, b) => b.total_wins - a.total_wins)
                .map(client => (
                  <div key={client.client_id} className="bg-white">
                    {/* Client Header */}
                    <button
                      onClick={() => toggleClient(client.client_id)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {expandedClients.has(client.client_id) ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-medium text-gray-900">
                            {client.client_name}
                          </h4>
                        </div>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        {client.total_wins} win
                        {client.total_wins !== 1 ? 's' : ''}
                      </Badge>
                    </button>

                    {/* Expanded Wins List */}
                    {expandedClients.has(client.client_id) && (
                      <div className="px-6 pb-4 pt-0 ml-14 space-y-3">
                        {client.wins.map(win => (
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
                                  win.is_approved
                                    ? 'bg-amber-100'
                                    : 'bg-amber-200'
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
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h5 className="font-medium text-gray-900">
                                    {win.title}
                                  </h5>
                                  <div className="flex gap-1.5 flex-shrink-0">
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
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  {win.session_date && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(
                                        win.session_date,
                                        'MMM d, yyyy',
                                      )}
                                    </span>
                                  )}
                                  <Link
                                    href={`/sessions/${win.session_id}`}
                                    className="flex items-center gap-1 text-blue-600 hover:underline"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    View Session
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* View All Link */}
                        <Link href={`/clients/${client.client_id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-gray-600 hover:text-gray-900"
                          >
                            View Client Profile
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No wins recorded yet
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Wins will appear here as they are recorded during coaching
              sessions. Use AI extraction from session details or add wins
              manually.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Clients without Wins */}
      {clientsWithoutWins.length > 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base text-gray-600">
              Clients Without Recorded Wins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {clientsWithoutWins.map(client => (
                <Link
                  key={client.client_id}
                  href={`/clients/${client.client_id}`}
                >
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    {client.client_name}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
