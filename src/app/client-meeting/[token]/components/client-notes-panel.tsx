/**
 * Client Notes Panel
 * Allows clients to take personal notes during the session
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Pencil, Trash2, Save, X, FileText, Plus } from 'lucide-react'
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
    if (!newNote.trim() || !guestToken) return

    setIsSaving(true)
    try {
      const note = await LiveMeetingService.createNote(
        meetingToken,
        guestToken,
        { content: newNote.trim() },
      )
      setNotes([note, ...notes])
      setNewNote('')
      toast.success('Note saved')
    } catch (err) {
      toast.error('Failed to save note')
      console.error('Failed to save note:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim() || !guestToken) return

    try {
      const updated = await LiveMeetingService.updateNote(
        meetingToken,
        guestToken,
        noteId,
        { content: editContent.trim() },
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

  // Handle Cmd/Ctrl + Enter to save
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSaveNote()
    }
  }

  return (
    <Card className="border-gray-200 h-full flex flex-col">
      <CardHeader className="border-b border-gray-100 py-3 flex-shrink-0">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-600" />
          My Notes
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* New Note Input */}
        <div className="flex-shrink-0 mb-4">
          <Textarea
            placeholder="Take a note... (Cmd/Ctrl + Enter to save)"
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
            className="resize-none min-h-[80px] border-gray-200 focus:border-gray-400"
            disabled={!guestToken}
          />
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              onClick={handleSaveNote}
              disabled={!newNote.trim() || isSaving || !guestToken}
            >
              <Plus className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Add Note'}
            </Button>
          </div>
        </div>

        {/* Notes List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">
              Loading notes...
            </div>
          ) : !notes || notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No notes yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Start taking notes above
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map(note => (
                <div
                  key={note.id}
                  className="p-3 rounded-lg border border-gray-200 bg-gray-50/50"
                >
                  {editingId === note.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        className="resize-none min-h-[60px] border-gray-200"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditing}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateNote(note.id)}
                          disabled={!editContent.trim()}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(note.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => startEditing(note)}
                          >
                            <Pencil className="h-3.5 w-3.5 text-gray-500" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-gray-500" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
