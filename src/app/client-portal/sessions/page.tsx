'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
} from 'lucide-react'

interface Session {
  id: string
  date: string
  duration_minutes: number
  status: string
  summary?: string
  has_transcript: boolean
  has_analysis: boolean
  key_topics: string[]
}

export default function ClientSessionsPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    checkAuth()
    fetchSessions()
  }, [currentPage])

  const checkAuth = () => {
    const token = localStorage.getItem('client_auth_token')
    if (!token) {
      router.push('/client-portal/auth/login')
    }
  }

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('client_auth_token')
      if (!token) {
        router.push('/client-portal/auth/login')
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
          router.push('/client-portal/auth/login')
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
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const filteredSessions = sessions.filter(session => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      session.summary?.toLowerCase().includes(searchLower) ||
      session.key_topics.some(topic =>
        topic.toLowerCase().includes(searchLower),
      ) ||
      formatDate(session.date).toLowerCase().includes(searchLower)
    )
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error: {error}</p>
        <Button
          onClick={fetchSessions}
          className="mt-4 bg-white text-black hover:bg-zinc-200"
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Your Sessions</h1>
        <p className="text-zinc-400 mt-2">
          Review your coaching sessions and track your progress
        </p>
      </div>

      {/* Search Bar */}
      <Card className="mb-6 bg-zinc-900 border-zinc-800">
        <CardContent className="py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search sessions by date, topic, or summary..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="text-center py-12">
            {searchTerm ? (
              <p className="text-zinc-500">
                No sessions found matching &quot;{searchTerm}&quot;
              </p>
            ) : (
              <p className="text-zinc-500">
                No sessions yet. Your sessions will appear here after your
                coaching calls.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map(session => (
            <Card
              key={session.id}
              className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-2 text-sm text-zinc-400">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(session.date)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-zinc-400">
                        <Clock className="h-4 w-4" />
                        <span>{session.duration_minutes} minutes</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-zinc-700 text-zinc-300"
                      >
                        {session.status}
                      </Badge>
                    </div>

                    {session.summary && (
                      <p className="text-sm text-zinc-400 mb-3">
                        {session.summary}
                      </p>
                    )}

                    {session.key_topics.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {session.key_topics.map((topic, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-zinc-800 text-zinc-300 border-zinc-700"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm">
                      {session.has_transcript && (
                        <div className="flex items-center space-x-1 text-green-500">
                          <FileText className="h-3 w-3" />
                          <span>Transcript</span>
                        </div>
                      )}
                      {session.has_analysis && (
                        <div className="flex items-center space-x-1 text-blue-500">
                          <FileText className="h-3 w-3" />
                          <span>Analysis</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Link href={`/client-portal/sessions/${session.id}`}>
                    <Button
                      variant="outline"
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    >
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
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
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <span className="text-sm text-zinc-400">Page {currentPage}</span>

          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={filteredSessions.length < itemsPerPage}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
