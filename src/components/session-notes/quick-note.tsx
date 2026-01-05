'use client'

import React, { useState } from 'react'
import { formatRelativeTime } from '@/lib/date-utils'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Check,
  Loader2,
  Lock,
  Users,
  Zap,
  Pencil,
  Trash2,
  X,
  FileText,
} from 'lucide-react'
import {
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from '@/hooks/mutations/use-note-mutations'
import { useSessionNotes } from '@/hooks/queries/use-sessions'

interface QuickNoteProps {
  sessionId: string
  noteType?: 'coach_private' | 'shared'
  onNoteCreated?: () => void
}

interface SessionNote {
  id: string
  note_type: 'coach_private' | 'shared'
  title: string
  content: string
  created_at: string
  updated_at: string
}

export function QuickNote({
  sessionId,
  noteType = 'coach_private',
  onNoteCreated,
}: QuickNoteProps) {
  const [content, setContent] = useState('')
  const [selectedType, setSelectedType] = useState<'coach_private' | 'shared'>(
    noteType,
  )
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const createNote = useCreateNote(sessionId)
  const updateNote = useUpdateNote(sessionId)
  const deleteNote = useDeleteNote(sessionId)
  const { data: notes = [], isLoading: notesLoading } =
    useSessionNotes(sessionId)

  const handleSave = () => {
    if (!content.trim()) return

    // Fire and forget - clear form immediately for optimistic UX
    const noteContent = content.trim()
    const noteType = selectedType
    setContent('')

    createNote.mutate({
      note_type: noteType,
      title: `Quick note - ${new Date().toLocaleTimeString()}`,
      content: noteContent,
    })

    onNoteCreated?.()
  }

  const handleStartEdit = (note: SessionNote) => {
    setEditingNoteId(note.id)
    setEditContent(note.content)
  }

  const handleCancelEdit = () => {
    setEditingNoteId(null)
    setEditContent('')
  }

  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim() || updateNote.isPending) return

    await updateNote.mutateAsync({
      noteId,
      data: { content: editContent.trim() },
    })

    setEditingNoteId(null)
    setEditContent('')
  }

  const handleDelete = async (noteId: string) => {
    await deleteNote.mutateAsync(noteId)
    setDeleteConfirmId(null)
  }

  // Sort notes by created_at descending (newest first)
  const sortedNotes = [...(notes as SessionNote[])].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-900">
            Quick Note
          </span>
          <span className="text-xs text-gray-500">(Live Session)</span>
        </div>

        {/* Note type toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setSelectedType('coach_private')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              selectedType === 'coach_private'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Lock className="h-3 w-3" />
            Private
          </button>
          <button
            onClick={() => setSelectedType('shared')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              selectedType === 'shared'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="h-3 w-3" />
            Shared
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Textarea
          placeholder="Capture important moments during the session..."
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault()
              handleSave()
            }
          }}
          className="min-h-[100px] resize-none border-gray-200 focus:border-gray-400 text-sm bg-white placeholder:text-gray-400"
        />

        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-500">
            Press{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-mono">
              ⌘ Enter
            </kbd>{' '}
            to save
          </p>
          <Button
            onClick={handleSave}
            disabled={!content.trim()}
            size="sm"
            className="bg-gray-900 hover:bg-gray-800"
          >
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Save Note
          </Button>
        </div>
      </div>

      {/* Session Notes List */}
      {sortedNotes.length > 0 && (
        <div className="border-t border-gray-100">
          <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">
              Session Notes
            </span>
            <Badge variant="secondary" className="text-xs">
              {sortedNotes.length}
            </Badge>
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {sortedNotes.map(note => (
              <div
                key={note.id}
                className="px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50"
              >
                {editingNoteId === note.id ? (
                  // Edit mode
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="min-h-[80px] resize-none border-gray-200 text-sm"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        className="h-7 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(note.id)}
                        disabled={!editContent.trim() || updateNote.isPending}
                        className="h-7 text-xs bg-gray-900 hover:bg-gray-800"
                      >
                        {updateNote.isPending ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3 mr-1" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-700 line-clamp-3 flex-1">
                        {note.content}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleStartEdit(note)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          title="Edit note"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <Popover
                          open={deleteConfirmId === note.id}
                          onOpenChange={open =>
                            setDeleteConfirmId(open ? note.id : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <button
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                              title="Delete note"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-3" align="end">
                            <p className="text-sm text-gray-700 mb-2">
                              Delete this note?
                            </p>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteConfirmId(null)}
                                className="h-7 text-xs"
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(note.id)}
                                disabled={deleteNote.isPending}
                                className="h-7 text-xs"
                              >
                                {deleteNote.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Delete'
                                )}
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge
                        variant="outline"
                        className={`text-xs px-1.5 py-0 h-5 ${
                          note.note_type === 'coach_private'
                            ? 'border-purple-200 text-purple-700 bg-purple-50'
                            : 'border-blue-200 text-blue-700 bg-blue-50'
                        }`}
                      >
                        {note.note_type === 'coach_private' ? (
                          <Lock className="h-2.5 w-2.5 mr-1" />
                        ) : (
                          <Users className="h-2.5 w-2.5 mr-1" />
                        )}
                        {note.note_type === 'coach_private'
                          ? 'Private'
                          : 'Shared'}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(note.created_at)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for notes (only show after loading) */}
      {!notesLoading && sortedNotes.length === 0 && (
        <div className="border-t border-gray-100 px-4 py-4">
          <div className="text-center">
            <FileText className="h-6 w-6 text-gray-300 mx-auto mb-1" />
            <p className="text-xs text-gray-400">No notes captured yet</p>
          </div>
        </div>
      )}
    </div>
  )
}
