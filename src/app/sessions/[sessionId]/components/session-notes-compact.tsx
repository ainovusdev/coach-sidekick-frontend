'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
      case 'client_private':
        return 'Client Note'
      default:
        return type
    }
  }

  return (
    <Card className="border-app-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-app-secondary" />
            <h2 className="text-sm font-semibold text-app-primary">
              Session Notes
            </h2>
            {notes.length > 0 && (
              <span className="text-xs text-app-secondary">
                ({notes.length})
              </span>
            )}
          </div>
          {notes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="text-xs text-app-secondary hover:text-app-primary"
            >
              View All
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-app-secondary" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-app-surface rounded-lg mb-3">
              <FileText className="h-5 w-5 text-app-secondary" />
            </div>
            <p className="text-sm text-app-secondary">No notes yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map(note => (
              <div
                key={note.id}
                className="p-3 bg-app-surface rounded-lg border border-app-border hover:border-app-border transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-medium text-sm text-app-primary line-clamp-1">
                    {note.title}
                  </h4>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        note.note_type === 'shared'
                          ? 'bg-gray-900'
                          : 'bg-gray-400'
                      }`}
                    />
                    <span className="text-xs text-app-secondary">
                      {getNoteTypeLabel(note.note_type)}
                    </span>
                  </div>
                </div>

                {note.content && (
                  <div
                    className="text-sm text-app-secondary line-clamp-2 mb-2 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:my-0"
                    dangerouslySetInnerHTML={{ __html: note.content }}
                  />
                )}

                <p className="text-xs text-app-secondary">
                  {formatRelativeTime(note.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
