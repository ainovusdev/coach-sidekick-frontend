'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Clock,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'

interface Session {
  id: string
  session_date: string
  duration_minutes: number
  status: string
  summary?: string
  sentiment_score?: number
  engagement_level?: string
  tasks_assigned: number
  materials_shared: number
  key_topics: string[]
  action_items: string[]
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
      // FIXED: Use unified auth_token, not old client_auth_token
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date unavailable'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return 'Invalid date'
    }
  }

  const _formatTime = (dateString: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  const filteredSessions = sessions.filter(session => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      session.summary?.toLowerCase().includes(searchLower) ||
      session.key_topics?.some(topic =>
        topic.toLowerCase().includes(searchLower),
      ) ||
      formatDate(session.session_date).toLowerCase().includes(searchLower)
    )
  })

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
          <p className="text-red-500">Error: {error}</p>
          <Button
            onClick={fetchSessions}
            className="mt-4 bg-white text-black hover:bg-zinc-200"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Sessions</h1>
        <p className="text-gray-600 mt-2">
          Review your coaching sessions and track your progress
        </p>
      </div>

      {/* Search Bar */}
      <Card className="mb-6 bg-white border-gray-200">
        <CardContent className="py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search sessions by date, topic, or summary..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="text-center py-12">
            {searchTerm ? (
              <p className="text-gray-500">
                No sessions found matching &quot;{searchTerm}&quot;
              </p>
            ) : (
              <p className="text-gray-500">
                No sessions yet. Your sessions will appear here after your
                coaching calls.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map(session => (
            <Link
              key={session.id}
              href={`/client-portal/sessions/${session.id}`}
              className="block"
            >
              <Card className="bg-white border-2 border-gray-200 hover:border-gray-400 transition-all shadow-sm hover:shadow-md group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      {/* Header with Date and Status */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-gray-900">
                            <Calendar className="h-4 w-4 text-gray-700" />
                            <span className="font-semibold text-base">
                              {formatDate(session.session_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">
                              {session.duration_minutes || 0} min
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-gray-300 text-gray-700 capitalize px-3 py-1"
                        >
                          {session.status}
                        </Badge>
                      </div>

                      {/* Summary */}
                      {session.summary ? (
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                            {session.summary}
                          </p>
                        </div>
                      ) : (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 italic">
                            No summary available yet
                          </p>
                        </div>
                      )}

                      {/* Key Topics */}
                      {session.key_topics && session.key_topics.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {session.key_topics
                              .slice(0, 4)
                              .map((topic, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="bg-gray-100 text-gray-900 border border-gray-300 text-xs"
                                >
                                  {topic}
                                </Badge>
                              ))}
                            {session.key_topics.length > 4 && (
                              <Badge
                                variant="secondary"
                                className="bg-gray-100 text-gray-600 border border-gray-300 text-xs"
                              >
                                +{session.key_topics.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Session Stats */}
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        {session.tasks_assigned > 0 && (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{session.tasks_assigned} tasks</span>
                          </div>
                        )}
                        {session.materials_shared > 0 && (
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-4 w-4" />
                            <span>{session.materials_shared} materials</span>
                          </div>
                        )}
                        {session.engagement_level && (
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="h-4 w-4" />
                            <span className="capitalize">
                              {session.engagement_level} engagement
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Arrow Icon */}
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center transition-colors">
                        <ChevronRight className="h-5 w-5 text-gray-700 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {sessions.length > 0 && (
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <span className="text-sm text-gray-600">Page {currentPage}</span>

          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={filteredSessions.length < itemsPerPage}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
