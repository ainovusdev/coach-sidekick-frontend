'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StickyNote, FileText, Loader2, ArrowRight } from 'lucide-react'
import { SessionNotesService } from '@/services/session-notes-service'
import { SessionNote } from '@/types/session-note'
import { formatRelativeTime } from '@/lib/date-utils'

interface SessionNotesCompactProps {
  sessionId: string
  onViewAll: () => void
}

export function SessionNotesCompact({
  sessionId,
  onViewAll,
}: SessionNotesCompactProps) {
  const [notes, setNotes] = useState<SessionNote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotes()
  }, [sessionId])

  const fetchNotes = async () => {
    try {
      const data = await SessionNotesService.getNotes(sessionId)
      // Show only the 3 most recent notes
      setNotes(data.slice(0, 3))
    } catch (error) {
      console.error('Failed to fetch notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getNoteTypeLabel = (type: string) => {
    switch (type) {
      case 'coach_private':
        return 'Private'
      case 'shared':
        return 'Shared'
      case 'client_reflection':
        return 'Reflection'
      default:
        return type
    }
  }

  const getNoteTypeBadge = (type: string) => {
    switch (type) {
      case 'coach_private':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'shared':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'client_reflection':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-50 rounded-lg">
              <StickyNote className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-black">
                Session Notes
              </h2>
              <p className="text-sm text-gray-500">
                {notes.length} recent {notes.length === 1 ? 'note' : 'notes'}
              </p>
            </div>
          </div>
          {notes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="hover:bg-gray-50"
            >
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-900 font-medium mb-1">No notes yet</h3>
            <p className="text-sm text-gray-500">
              Add notes to capture key moments from this session
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map(note => (
              <div
                key={note.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-white"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="font-medium text-sm text-black line-clamp-1">
                    {note.title}
                  </h4>
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 ${getNoteTypeBadge(note.note_type)}`}
                  >
                    {getNoteTypeLabel(note.note_type)}
                  </Badge>
                </div>

                {note.content && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {note.content}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{formatRelativeTime(note.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
