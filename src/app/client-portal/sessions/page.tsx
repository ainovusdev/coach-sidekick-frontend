'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ArrowRight,
  MessageSquare,
} from 'lucide-react'
import { formatDate, formatRelativeTime } from '@/lib/date-utils'

interface Session {
  id: string
  session_date: string
  duration_minutes: number
  summary?: string
  key_topics: string[]
  action_items: string[]
  sentiment_score?: number
  engagement_level?: string
  tasks_assigned: number
  materials_shared: number
}

export default function ClientSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchSessions()
  }, [currentPage])

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.error('No auth token found')
        return
      }

      const skip = (currentPage - 1) * itemsPerPage
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(
        `${apiUrl}/client/sessions?skip=${skip}&limit=${itemsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Unauthorized - token may be expired')
          return
        }
        throw new Error('Failed to fetch sessions')
      }

      const data = await response.json()
      setSessions(data)
    } catch (err: any) {
      console.error('Sessions fetch error:', err)
      setError(err.message || 'Failed to load sessions')
    } finally {
      setIsLoading(false)
    }
  }

  const formatSessionDate = (dateString: string) => {
    if (!dateString) return 'Date unavailable'
    return formatDate(dateString, 'EEEE, MMMM d, yyyy')
  }

  const filteredSessions = sessions.filter(session => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      session.summary?.toLowerCase().includes(searchLower) ||
      session.key_topics?.some(topic =>
        topic.toLowerCase().includes(searchLower),
      ) ||
      formatSessionDate(session.session_date)
        .toLowerCase()
        .includes(searchLower)
    )
  })

  // Calculate stats
  const totalSessions = sessions.length
  const totalDuration = sessions.reduce(
    (sum, s) => sum + (s.duration_minutes || 0),
    0,
  )
  const totalTasks = sessions.reduce(
    (sum, s) => sum + (s.tasks_assigned || 0),
    0,
  )

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <Button onClick={fetchSessions} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Sessions</h1>
          <p className="text-gray-500 mt-1">
            Review your coaching sessions and track your progress
          </p>
        </div>

        {/* Inline Stats */}
        <div className="flex items-center gap-6 md:gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
            <p className="text-xs text-gray-500">Sessions</p>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(totalDuration / 60)}
            </p>
            <p className="text-xs text-gray-500">Hours</p>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
            <p className="text-xs text-gray-500">Commitments</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by date, topic, or summary..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 h-11 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
        />
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="py-16 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            {searchTerm ? (
              <>
                <h3 className="font-medium text-gray-900 mb-2">
                  No sessions found
                </h3>
                <p className="text-sm text-gray-500">
                  No sessions matching &quot;{searchTerm}&quot;
                </p>
              </>
            ) : (
              <>
                <h3 className="font-medium text-gray-900 mb-2">
                  No sessions yet
                </h3>
                <p className="text-sm text-gray-500">
                  Your coaching sessions will appear here after your first call.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map(session => (
            <Link
              key={session.id}
              href={`/client-portal/sessions/${session.id}`}
              className="block group"
            >
              <div className="flex items-stretch border border-gray-200 rounded-xl bg-white hover:border-gray-300 hover:shadow-sm transition-all overflow-hidden">
                {/* Date Column */}
                <div className="w-24 md:w-32 flex-shrink-0 bg-gray-50 p-4 flex flex-col items-center justify-center border-r border-gray-100">
                  <span className="text-2xl font-bold text-gray-900">
                    {session.session_date
                      ? formatDate(session.session_date, 'd')
                      : '-'}
                  </span>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    {session.session_date
                      ? formatDate(session.session_date, 'MMM yyyy')
                      : ''}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 md:p-5 min-w-0">
                  {/* Top Row */}
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">
                        {session.session_date
                          ? formatDate(session.session_date, 'EEEE')
                          : 'Session'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(session.session_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-gray-600 text-xs"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {session.duration_minutes || 0} min
                      </Badge>
                      {session.engagement_level && (
                        <Badge
                          variant="secondary"
                          className="bg-gray-100 text-gray-600 text-xs capitalize"
                        >
                          {session.engagement_level}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  {session.summary ? (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {session.summary}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic mb-3">
                      No summary available
                    </p>
                  )}

                  {/* Bottom Row - Topics and Stats */}
                  <div className="flex items-center justify-between gap-4">
                    {/* Key Topics */}
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      {session.key_topics && session.key_topics.length > 0 ? (
                        <>
                          {session.key_topics.slice(0, 3).map((topic, idx) => (
                            <span
                              key={idx}
                              className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {topic}
                            </span>
                          ))}
                          {session.key_topics.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{session.key_topics.length - 3}
                            </span>
                          )}
                        </>
                      ) : null}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                      {session.tasks_assigned > 0 && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          {session.tasks_assigned} commitments
                        </span>
                      )}
                      {session.action_items &&
                        session.action_items.length > 0 && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5" />
                            {session.action_items.length} actions
                          </span>
                        )}
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center px-4 bg-gray-50 border-l border-gray-100 group-hover:bg-gray-100 transition-colors">
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {sessions.length > 0 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <Button
            variant="ghost"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>

          <span className="text-sm text-gray-500">Page {currentPage}</span>

          <Button
            variant="ghost"
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={filteredSessions.length < itemsPerPage}
            className="text-gray-600 hover:text-gray-900"
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
