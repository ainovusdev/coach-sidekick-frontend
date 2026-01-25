/**
 * Client Notes Panel
 * Enhanced note-taking experience for clients during live sessions
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Pencil, Trash2, Save, X, FileText, Send, Loader2 } from 'lucide-react'
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
      toast.success('Note saved successfully')
      // Focus back on textarea for continuous note-taking
      textareaRef.current?.focus()
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
    <Card className="border-gray-200 h-full flex flex-col shadow-sm">
      <CardHeader className="border-b border-gray-100 py-4 flex-shrink-0 bg-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <span>Session Notes</span>
              {notes.length > 0 && (
                <span className="text-xs font-normal text-gray-500 ml-2">
                  ({notes.length} {notes.length === 1 ? 'note' : 'notes'})
                </span>
              )}
            </div>
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* New Note Input - Prominent at the top */}
        <div className="flex-shrink-0 p-4 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder="Capture your thoughts, insights, or action items..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              onKeyDown={handleKeyDown}
              className="resize-none min-h-[120px] border-gray-200 focus:border-emerald-400 focus:ring-emerald-400/20 pr-12 text-base rounded-xl shadow-sm"
              disabled={!guestToken}
            />
            {/* Character count */}
            <div className="absolute bottom-3 left-3 text-xs text-gray-400">
              {newNote.length > 0 && `${newNote.length} characters`}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Press{' '}
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono text-xs">
                Cmd/Ctrl + Enter
              </kbd>{' '}
              to save quickly
            </span>
            <Button
              size="default"
              onClick={handleSaveNote}
              disabled={!newNote.trim() || isSaving || !guestToken}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Save Note
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Notes List */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              <Loader2 className="h-6 w-6 mx-auto animate-spin text-gray-400 mb-2" />
              <p className="text-sm">Loading your notes...</p>
            </div>
          ) : !notes || notes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-700 mb-1">No notes yet</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Start capturing your thoughts and key takeaways from this
                session above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map(note => (
                <div
                  key={note.id}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    editingId === note.id
                      ? 'border-emerald-300 bg-emerald-50/50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  {editingId === note.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        className="resize-none min-h-[80px] border-gray-200 focus:border-emerald-400 rounded-lg"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditing}
                          className="text-gray-600"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateNote(note.id)}
                          disabled={!editContent.trim()}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {note.content}
                      </p>
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                          {formatDistanceToNow(new Date(note.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                            onClick={() => startEditing(note)}
                            title="Edit note"
                          >
                            <Pencil className="h-3.5 w-3.5 text-gray-500" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-red-50"
                            onClick={() => handleDeleteNote(note.id)}
                            title="Delete note"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-gray-500 hover:text-red-500" />
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
