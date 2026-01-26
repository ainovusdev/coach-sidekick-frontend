'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { SessionNotesService } from '@/services/session-notes-service'
import { SessionNote, NoteType } from '@/types/session-note'
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Lock,
  Users,
  User,
  Clock,
  StickyNote,
  MessageSquare,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { formatRelativeTime } from '@/lib/date-utils'

interface NotesListProps {
  sessionId: string
  isClientPortal?: boolean
  compact?: boolean
  maxNotes?: number
}

// Note type configuration for grayscale aesthetic
const NOTE_TYPE_CONFIG: Record<
  NoteType,
  {
    label: string
    shortLabel: string
    icon: React.ElementType
    description: string
  }
> = {
  coach_private: {
    label: 'Coach Private',
    shortLabel: 'Private',
    icon: Lock,
    description: 'Only visible to coaches',
  },
  shared: {
    label: 'Shared Notes',
    shortLabel: 'Shared',
    icon: Users,
    description: 'Visible to coach and client',
  },
  client_reflection: {
    label: 'My Reflections',
    shortLabel: 'Reflection',
    icon: User,
    description: 'Your personal notes',
  },
  client_private: {
    label: 'Client Note',
    shortLabel: 'Client',
    icon: User,
    description: 'Notes from client during session',
  },
  pre_session: {
    label: 'Pre-Session',
    shortLabel: 'Pre',
    icon: Clock,
    description: 'Preparation notes',
  },
  post_session: {
    label: 'Post-Session',
    shortLabel: 'Post',
    icon: MessageSquare,
    description: 'Follow-up notes',
  },
}

export function NotesList({
  sessionId,
  isClientPortal = false,
  compact = false,
  maxNotes,
}: NotesListProps) {
  const [notes, setNotes] = useState<SessionNote[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<NoteType | 'all'>('all')
  const [noteToDelete, setNoteToDelete] = useState<SessionNote | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editingNote, setEditingNote] = useState<SessionNote | null>(null)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteType, setNewNoteType] = useState<NoteType>(
    isClientPortal ? 'client_reflection' : 'coach_private',
  )
  const [creating, setCreating] = useState(false)

  // Get available note types based on portal type
  const availableTypes: NoteType[] = isClientPortal
    ? ['shared', 'client_reflection']
    : [
        'coach_private',
        'shared',
        'client_reflection',
        'pre_session',
        'post_session',
      ]

  // Fetch notes
  const fetchNotes = async () => {
    setLoading(true)
    try {
      const fetchedNotes = await SessionNotesService.getNotes(sessionId)
      setNotes(fetchedNotes)
    } catch (error) {
      console.error('Failed to fetch notes:', error)
      toast({
        title: 'Error',
        description: 'Failed to load notes',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [sessionId])

  // Filter notes
  const filteredNotes = notes.filter(note => {
    // First filter by available types for the portal
    if (!availableTypes.includes(note.note_type)) return false
    // Then filter by active filter
    if (activeFilter === 'all') return true
    return note.note_type === activeFilter
  })

  // Apply maxNotes limit
  const displayedNotes = maxNotes
    ? filteredNotes.slice(0, maxNotes)
    : filteredNotes

  // Group notes by type for counts
  const noteCounts = notes.reduce(
    (acc, note) => {
      if (availableTypes.includes(note.note_type)) {
        acc[note.note_type] = (acc[note.note_type] || 0) + 1
      }
      return acc
    },
    {} as Record<NoteType, number>,
  )

  // Handle delete note
  const handleDeleteNote = async () => {
    if (!noteToDelete) return

    setDeleting(true)
    try {
      await SessionNotesService.deleteNote(noteToDelete.id)
      toast({
        title: 'Note Deleted',
        description: 'The note has been deleted successfully',
      })
      await fetchNotes()
      setNoteToDelete(null)
    } catch (error) {
      console.error('Failed to delete note:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete note',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  // Handle edit note
  const startEditing = (note: SessionNote) => {
    setEditingNote(note)
    setEditContent(note.content)
  }

  const cancelEditing = () => {
    setEditingNote(null)
    setEditContent('')
  }

  const saveEdit = async () => {
    if (!editingNote) return

    setSaving(true)
    try {
      await SessionNotesService.updateNote(editingNote.id, {
        content: editContent,
      })
      toast({
        title: 'Note Updated',
        description: 'Your changes have been saved',
      })
      await fetchNotes()
      cancelEditing()
    } catch (error) {
      console.error('Failed to update note:', error)
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle create note
  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) return

    setCreating(true)
    try {
      // Auto-generate title from content or use timestamp
      const autoTitle =
        newNoteContent.trim().substring(0, 50) ||
        `Note - ${new Date().toLocaleTimeString()}`
      await SessionNotesService.createNote(sessionId, {
        title: autoTitle,
        content: newNoteContent.trim(),
        note_type: newNoteType,
      })
      toast({
        title: 'Note Created',
        description: 'Your note has been saved',
      })
      await fetchNotes()
      setShowCreateForm(false)
      setNewNoteContent('')
    } catch (error) {
      console.error('Failed to create note:', error)
      toast({
        title: 'Error',
        description: 'Failed to create note',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  // Render note card
  const renderNoteCard = (note: SessionNote) => {
    const config = NOTE_TYPE_CONFIG[note.note_type]
    const Icon = config.icon
    const isEditing = editingNote?.id === note.id

    if (isEditing) {
      return (
        <div
          key={note.id}
          className="border border-gray-300 rounded-xl p-4 bg-gray-50"
        >
          <Textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            placeholder="Note content"
            className="min-h-[120px] mb-3 border-gray-200 bg-white resize-none"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelEditing}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={saveEdit}
              disabled={saving || !editContent.trim()}
              className="bg-gray-900 hover:bg-gray-800"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div
        key={note.id}
        className="group border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all bg-white"
      >
        {/* Header with type badge and actions */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Icon className="h-3.5 w-3.5 text-gray-600" />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-medium text-gray-700">
                {config.shortLabel}
              </span>
              <span>•</span>
              <span>{formatRelativeTime(note.created_at)}</span>
              {note.updated_at !== note.created_at && (
                <>
                  <span>•</span>
                  <span className="text-gray-400">edited</span>
                </>
              )}
            </div>
          </div>

          {/* Actions - Show on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startEditing(note)}
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNoteToDelete(note)}
              className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div
          className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:my-1"
          dangerouslySetInnerHTML={{ __html: note.content }}
        />
      </div>
    )
  }

  // Compact mode render
  if (compact) {
    return (
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : displayedNotes.length > 0 ? (
          displayedNotes.map(renderNoteCard)
        ) : (
          <div className="text-center py-8">
            <StickyNote className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">No notes yet</p>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!noteToDelete}
          onOpenChange={open => !open && setNoteToDelete(null)}
        >
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Note?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                note.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteNote}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with filters and add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activeFilter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
            <span className="ml-1.5 text-xs opacity-70">
              {notes.filter(n => availableTypes.includes(n.note_type)).length}
            </span>
          </button>
          {availableTypes.map(type => {
            const count = noteCounts[type] || 0
            const config = NOTE_TYPE_CONFIG[type]
            return (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter === type
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {config.shortLabel}
                {count > 0 && (
                  <span className="ml-1.5 text-xs opacity-70">{count}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Add note button */}
        <Button
          onClick={() => setShowCreateForm(true)}
          size="sm"
          className="bg-gray-900 hover:bg-gray-800"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Note
        </Button>
      </div>

      {/* Create note form */}
      {showCreateForm && (
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">
                New Note
              </span>
            </div>
            {/* Note type selector - compact */}
            <div className="flex items-center gap-1">
              {availableTypes.map(type => {
                const config = NOTE_TYPE_CONFIG[type]
                const TypeIcon = config.icon
                return (
                  <button
                    key={type}
                    onClick={() => setNewNoteType(type)}
                    title={config.description}
                    className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                      newNoteType === type
                        ? 'bg-gray-900 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <TypeIcon className="h-3 w-3" />
                    {config.shortLabel}
                  </button>
                )
              })}
            </div>
          </div>

          <Textarea
            value={newNoteContent}
            onChange={e => setNewNoteContent(e.target.value)}
            placeholder="Capture your thoughts, observations, or action items..."
            className="min-h-[120px] mb-3 border-gray-200 bg-white resize-none"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCreateForm(false)
                setNewNoteContent('')
              }}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateNote}
              disabled={creating || !newNoteContent.trim()}
              className="bg-gray-900 hover:bg-gray-800"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Save Note
            </Button>
          </div>
        </div>
      )}

      {/* Notes list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : displayedNotes.length > 0 ? (
        <div className="space-y-3">{displayedNotes.map(renderNoteCard)}</div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <StickyNote className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="font-medium text-gray-900 mb-1">
            {activeFilter === 'all'
              ? 'No notes yet'
              : `No ${NOTE_TYPE_CONFIG[activeFilter as NoteType]?.label.toLowerCase() || 'notes'} yet`}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {isClientPortal
              ? 'Add your reflections and thoughts about this session'
              : 'Capture important observations and insights'}
          </p>
          <Button
            onClick={() => setShowCreateForm(true)}
            size="sm"
            variant="outline"
            className="border-gray-300"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add your first note
          </Button>
        </div>
      )}

      {/* Show more indicator */}
      {maxNotes && filteredNotes.length > maxNotes && (
        <p className="text-center text-sm text-gray-500">
          +{filteredNotes.length - maxNotes} more notes
        </p>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!noteToDelete}
        onOpenChange={open => !open && setNoteToDelete(null)}
      >
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">
              Delete Note
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to delete &quot;{noteToDelete?.title}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-gray-300 text-gray-900 hover:bg-gray-100"
              disabled={deleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNote}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
