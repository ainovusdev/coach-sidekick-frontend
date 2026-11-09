'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from '@/hooks/mutations/use-note-mutations'
import { useSessionNotes } from '@/hooks/queries/use-sessions'
import { RichTextContent } from '@/components/ui/rich-text-content'
import { NoteDefaultTypeSetting } from '@/components/ui/enter-key-setting'
import {
  saveKeyLabel,
  useEditorPreferences,
} from '@/contexts/editor-preferences-context'
import { normalizeEditorHtml } from '@/lib/rich-text'

interface QuickNoteProps {
  sessionId: string
  /** Starting type. Omit to use the coach's "New notes start as" setting. */
  noteType?: 'coach_private' | 'shared'
  clientId?: string
  onNoteCreated?: () => void
  isMeetingEnded?: boolean
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
  noteType,
  clientId,
  onNoteCreated,
  isMeetingEnded,
}: QuickNoteProps) {
  const [content, setContent] = useState('')
  const { enterKey, notesDefaultType, loaded } = useEditorPreferences()
  const [selectedType, setSelectedType] = useState<'coach_private' | 'shared'>(
    noteType ?? notesDefaultType,
  )
  // The stored default arrives after the first render: adopt it, unless the
  // coach has already picked a type for this note.
  const typeTouched = useRef(false)
  useEffect(() => {
    if (!noteType && loaded && !typeTouched.current) {
      setSelectedType(notesDefaultType)
    }
  }, [noteType, loaded, notesDefaultType])
  const pickType = (type: 'coach_private' | 'shared') => {
    typeTouched.current = true
    setSelectedType(type)
  }
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [notesListOpen, setNotesListOpen] = useState(true)

  const createNote = useCreateNote(sessionId, clientId)
  const updateNote = useUpdateNote(sessionId, clientId)
  const deleteNote = useDeleteNote(sessionId, clientId)
  const { data: notes = [], isLoading: notesLoading } = useSessionNotes(
    sessionId,
    clientId,
  )

  // Keep a ref to content so effects always have the latest value
  const contentRef = useRef(content)
  contentRef.current = content

  // Check if content has actual text (not just empty HTML tags)
  const hasContent = (html: string) => {
    const plainText = htmlToPlainText(html)
    return plainText.trim().length > 0
  }

  const handleSave = () => {
    if (!hasContent(content)) return

    // Fire and forget - clear form immediately for optimistic UX
    const noteContent = normalizeEditorHtml(content)
    const noteType = selectedType
    setContent('')

    createNote.mutate({
      note_type: noteType,
      title: `Quick note - ${new Date().toLocaleTimeString()}`,
      content: noteContent,
      ...(clientId ? { client_id: clientId } : {}),
    })

    onNoteCreated?.()
  }

  // Auto-save unsaved note when meeting ends (before redirect)
  useEffect(() => {
    if (isMeetingEnded && hasContent(contentRef.current)) {
      handleSave()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMeetingEnded])

  // Warn user on tab close/reload if they have unsaved note text
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasContent(contentRef.current)) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

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
      data: { content: normalizeEditorHtml(editContent) },
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
    <div className="border border-line rounded-xl bg-surface-1 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-line flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-ink-2 " />
          <span className="text-sm font-semibold text-ink ">Notes</span>
        </div>

        {/* Note type toggle */}
        <div className="flex items-center gap-0.5 bg-surface-3 rounded-md p-0.5">
          <button
            onClick={() => pickType('coach_private')}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              selectedType === 'coach_private'
                ? 'bg-surface-1 text-ink shadow-sm'
                : 'text-ink-3 hover:text-ink-2 '
            }`}
          >
            <Lock className="h-3 w-3" />
            Private
          </button>
          <button
            onClick={() => pickType('shared')}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              selectedType === 'shared'
                ? 'bg-surface-1 text-ink shadow-sm'
                : 'text-ink-3 hover:text-ink-2 '
            }`}
          >
            <Users className="h-3 w-3" />
            Shared
          </button>
        </div>
      </div>

      {/* Editor - takes priority space */}
      <div className="flex-[3] p-4 flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          <RichTextEditor
            content={content}
            onChange={setContent}
            onSave={handleSave}
            settingsExtra={
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-3">
                  New notes start as
                </p>
                <NoteDefaultTypeSetting idPrefix="quick-note-type" />
              </div>
            }
            placeholder="Capture important moments during the session..."
            className="h-full"
          />
        </div>

        <div className="flex items-center justify-end mt-3 flex-shrink-0">
          <Button
            onClick={handleSave}
            disabled={!hasContent(content)}
            size="sm"
            title={`Save Note (${saveKeyLabel(enterKey)})`}
            className="bg-ink hover:bg-ink-2 "
          >
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Save Note
            <kbd className="ml-1.5 text-[10px] opacity-60 font-normal">
              {saveKeyLabel(enterKey)}
            </kbd>
          </Button>
        </div>
      </div>

      {/* Session Notes List - collapsible */}
      {sortedNotes.length > 0 && (
        <div
          className={`${notesListOpen ? 'flex-[2]' : 'flex-shrink-0'} min-h-0 border-t border-line flex flex-col`}
        >
          <button
            onClick={() => setNotesListOpen(!notesListOpen)}
            className="px-4 py-2 bg-paper flex items-center justify-between flex-shrink-0 hover:bg-surface-3 transition-colors w-full"
          >
            <span className="text-xs font-medium text-ink-3 ">
              Session Notes
            </span>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-xs">
                {sortedNotes.length}
              </Badge>
              {notesListOpen ? (
                <ChevronUp className="h-3 w-3 text-ink-4" />
              ) : (
                <ChevronDown className="h-3 w-3 text-ink-4" />
              )}
            </div>
          </button>
          {notesListOpen && (
            <div className="flex-1 overflow-y-auto">
              {sortedNotes.map(note => (
                <div
                  key={note.id}
                  className="px-4 py-3 border-b border-line last:border-b-0 hover:bg-paper/50 "
                >
                  {editingNoteId === note.id ? (
                    // Edit mode
                    <div className="space-y-2">
                      <RichTextEditor
                        content={editContent}
                        onChange={setEditContent}
                        onSave={() => handleSaveEdit(note.id)}
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
                          className="h-7 text-xs bg-ink hover:bg-ink-2 "
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
                        <RichTextContent
                          value={note.content}
                          clamp={3}
                          className="text-sm text-ink-2 flex-1 min-w-0"
                        />
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleStartEdit(note)}
                            className="p-1 text-ink-4 hover:text-ink-3 hover:bg-surface-3 rounded"
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
                                className="p-1 text-ink-4 hover:text-vermillion hover:bg-vermillion-bg rounded"
                                title="Delete note"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-3 " align="end">
                              <p className="text-sm text-ink-2 mb-2">
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
                              ? 'border-line-strong text-ink-2 bg-paper '
                              : 'border-ds-accent text-ds-accent bg-ds-accent-bg '
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
                        <span className="text-xs text-ink-4">
                          {formatRelativeTime(note.created_at)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state for notes (only show after loading) */}
      {!notesLoading && sortedNotes.length === 0 && (
        <div className="flex-shrink-0 border-t border-line px-4 py-3 flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-6 w-6 text-ink-2 mx-auto mb-1" />
            <p className="text-xs text-ink-4">No notes captured yet</p>
          </div>
        </div>
      )}
    </div>
  )
}
