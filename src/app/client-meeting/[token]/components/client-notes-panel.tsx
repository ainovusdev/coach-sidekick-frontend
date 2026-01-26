/**
 * Client Notes Panel
 * Enhanced note-taking experience for clients during live sessions
 * Uses rich text editor matching the coach-side experience
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  RichTextEditor,
  htmlToPlainText,
} from '@/components/ui/rich-text-editor'
import { Pencil, Trash2, Check, X, FileText, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { LiveMeetingService, ClientNote } from '@/services/live-meeting-service'

interface ClientNotesPanelProps {
  meetingToken: string
  guestToken: string | null
  refreshKey?: number
}

export function ClientNotesPanel({
  meetingToken,
  guestToken,
  refreshKey,
}: ClientNotesPanelProps) {
  const [notes, setNotes] = useState<ClientNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const hasContent = (html: string) => {
    return htmlToPlainText(html).trim().length > 0
  }

  // Fetch notes with polling
  useEffect(() => {
    if (!guestToken) return

    const fetchNotes = async (showLoading = false) => {
      if (showLoading) setIsLoading(true)
      try {
        const data = await LiveMeetingService.getNotes(meetingToken, guestToken)
        setNotes(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Failed to fetch notes:', err)
      } finally {
        if (showLoading) setIsLoading(false)
      }
    }

    // Initial fetch with loading state
    fetchNotes(true)

    // Poll every 30 seconds for updates
    const interval = setInterval(() => fetchNotes(false), 30000)

    return () => clearInterval(interval)
  }, [meetingToken, guestToken, refreshKey])

  const handleSaveNote = async () => {
    if (!hasContent(newNote) || !guestToken) return

    setIsSaving(true)
    try {
      const note = await LiveMeetingService.createNote(
        meetingToken,
        guestToken,
        { content: newNote },
      )
      setNotes([note, ...notes])
      setNewNote('')
      toast.success('Note saved successfully')
    } catch (err) {
      toast.error('Failed to save note')
      console.error('Failed to save note:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateNote = async (noteId: string) => {
    if (!hasContent(editContent) || !guestToken) return

    try {
      const updated = await LiveMeetingService.updateNote(
        meetingToken,
        guestToken,
        noteId,
        { content: editContent },
      )
      setNotes(notes.map(n => (n.id === noteId ? updated : n)))
      setEditingId(null)
      setEditContent('')
      toast.success('Note updated')
    } catch (err) {
      toast.error('Failed to update note')
      console.error('Failed to update note:', err)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!guestToken) return

    try {
      await LiveMeetingService.deleteNote(meetingToken, guestToken, noteId)
      setNotes(notes.filter(n => n.id !== noteId))
      toast.success('Note deleted')
    } catch (err) {
      toast.error('Failed to delete note')
      console.error('Failed to delete note:', err)
    }
  }

  const startEditing = (note: ClientNote) => {
    setEditingId(note.id)
    setEditContent(note.content)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditContent('')
  }

  return (
    <Card className="border-gray-200 h-full flex flex-col shadow-sm">
      <CardHeader className="border-b border-gray-100 py-3 flex-shrink-0 bg-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-700" />
            <span>Session Notes</span>
            {notes.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {notes.length}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Editor - top half */}
        <div className="h-1/2 p-4 flex flex-col min-h-0 border-b border-gray-100">
          <div className="flex-1 min-h-0">
            <RichTextEditor
              content={newNote}
              onChange={setNewNote}
              placeholder="Capture your thoughts, insights, or action items..."
              className="h-full"
              disabled={!guestToken}
            />
          </div>

          <div className="flex items-center justify-end mt-3 flex-shrink-0">
            <Button
              onClick={handleSaveNote}
              disabled={!hasContent(newNote) || isSaving || !guestToken}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Save Note
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Notes List - bottom half */}
        {isLoading ? (
          <div className="h-1/2 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-6 w-6 mx-auto animate-spin text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Loading your notes...</p>
            </div>
          </div>
        ) : notes.length > 0 ? (
          <div className="h-1/2 flex flex-col min-h-0">
            <div className="px-4 py-2 bg-gray-50 flex items-center justify-between flex-shrink-0">
              <span className="text-xs font-medium text-gray-600">
                Your Notes
              </span>
              <Badge variant="secondary" className="text-xs">
                {notes.length}
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notes.map(note => (
                <div
                  key={note.id}
                  className="px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50"
                >
                  {editingId === note.id ? (
                    <div className="space-y-2">
                      <RichTextEditor
                        content={editContent}
                        onChange={setEditContent}
                        minHeight="80px"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditing}
                          className="h-7 text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateNote(note.id)}
                          disabled={!hasContent(editContent)}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className="text-sm text-gray-700 line-clamp-3 flex-1 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:my-0.5"
                          dangerouslySetInnerHTML={{ __html: note.content }}
                        />
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => startEditing(note)}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                            title="Edit note"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                            title="Delete note"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 mt-1.5 block">
                        {formatDistanceToNow(new Date(note.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-1/2 flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-6 w-6 text-gray-300 mx-auto mb-1" />
              <p className="text-xs text-gray-400">No notes captured yet</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
