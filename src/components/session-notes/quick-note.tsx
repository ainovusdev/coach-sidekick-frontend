'use client'

import React, { useState } from 'react'
import { formatRelativeTime } from '@/lib/date-utils'
import {
  RichTextEditor,
  htmlToPlainText,
} from '@/components/ui/rich-text-editor'
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

  // Check if content has actual text (not just empty HTML tags)
  const hasContent = (html: string) => {
    const plainText = htmlToPlainText(html)
    return plainText.trim().length > 0
  }

  const handleSave = () => {
    if (!hasContent(content)) return

    // Fire and forget - clear form immediately for optimistic UX
    const noteContent = content
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
    if (!hasContent(editContent) || updateNote.isPending) return

    await updateNote.mutateAsync({
      noteId,
      data: { content: editContent },
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
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Notes
          </span>
        </div>

        {/* Note type toggle */}
        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700 rounded-md p-0.5">
          <button
            onClick={() => setSelectedType('coach_private')}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              selectedType === 'coach_private'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Lock className="h-3 w-3" />
            Private
          </button>
          <button
            onClick={() => setSelectedType('shared')}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              selectedType === 'shared'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Users className="h-3 w-3" />
            Shared
          </button>
        </div>
      </div>

      {/* Editor - 50% height */}
      <div className="h-1/2 p-4 flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Capture important moments during the session..."
            className="h-full"
          />
        </div>

        <div className="flex items-center justify-end mt-3 flex-shrink-0">
          <Button
            onClick={handleSave}
            disabled={!hasContent(content)}
            size="sm"
            className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Save Note
          </Button>
        </div>
      </div>

      {/* Session Notes List - 50% height */}
      {sortedNotes.length > 0 && (
        <div className="h-1/2 border-t border-gray-100 dark:border-gray-700 flex flex-col min-h-0">
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Session Notes
            </span>
            <Badge variant="secondary" className="text-xs">
              {sortedNotes.length}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sortedNotes.map(note => (
              <div
                key={note.id}
                className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-gray-700/50"
              >
                {editingNoteId === note.id ? (
                  // Edit mode
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
                        onClick={handleCancelEdit}
                        className="h-7 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(note.id)}
                        disabled={
                          !hasContent(editContent) || updateNote.isPending
                        }
                        className="h-7 text-xs bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
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
                      <div
                        className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 flex-1 prose prose-sm dark:prose-invert max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:my-0.5"
                        dangerouslySetInnerHTML={{ __html: note.content }}
                      />
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleStartEdit(note)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
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
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                              title="Delete note"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-3 dark:bg-gray-800 dark:border-gray-700"
                            align="end"
                          >
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
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
                            ? 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700'
                            : 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
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

      {/* Empty state for notes (only show after loading) - 50% height */}
      {!notesLoading && sortedNotes.length === 0 && (
        <div className="h-1/2 border-t border-gray-100 dark:border-gray-700 px-4 py-4 flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-6 w-6 text-gray-300 dark:text-gray-600 mx-auto mb-1" />
            <p className="text-xs text-gray-400">No notes captured yet</p>
          </div>
        </div>
      )}
    </div>
  )
}
