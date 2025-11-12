'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { NoteCard } from './note-card'
import { NoteEditor } from './note-editor'
import { GenerateSummaryButton } from './generate-summary-button'
import { SessionNotesService } from '@/services/session-notes-service'
import {
  SessionNote,
  SessionNoteCreate,
  SessionNoteUpdate,
  NoteType,
} from '@/types/session-note'
import { Plus, FileText, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface NotesListProps {
  sessionId: string
  isClientPortal?: boolean
  compact?: boolean
  maxNotes?: number
}

export function NotesList({
  sessionId,
  isClientPortal = false,
  compact = false,
  maxNotes,
}: NotesListProps) {
  const [notes, setNotes] = useState<SessionNote[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<NoteType>(
    isClientPortal ? 'client_reflection' : 'coach_private',
  )
  const [isEditing, setIsEditing] = useState(false)
  const [editingNote, setEditingNote] = useState<SessionNote | undefined>()
  const [saving, setSaving] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<SessionNote | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  // Filter notes by active tab
  const filteredNotes = notes.filter(note => note.note_type === activeTab)

  // Handle create/update note
  const handleSaveNote = async (
    data: SessionNoteCreate | SessionNoteUpdate,
  ) => {
    setSaving(true)
    try {
      if (editingNote) {
        // Update existing note
        await SessionNotesService.updateNote(editingNote.id, data)
        toast({
          title: 'Note Updated',
          description: 'Your note has been updated successfully',
        })
      } else {
        // Create new note
        await SessionNotesService.createNote(
          sessionId,
          data as SessionNoteCreate,
        )
        toast({
          title: 'Note Created',
          description: 'Your note has been saved successfully',
        })
      }

      // Refresh notes and close editor
      await fetchNotes()
      setIsEditing(false)
      setEditingNote(undefined)
    } catch (error) {
      console.error('Failed to save note:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to save note',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

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

      // Refresh notes
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

  // Start editing a note
  const handleEditNote = (note: SessionNote) => {
    setEditingNote(note)
    setIsEditing(true)
  }

  // Start creating a new note
  const handleCreateNote = () => {
    setEditingNote(undefined)
    setIsEditing(true)
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingNote(undefined)
  }

  // Get tabs based on portal type
  const getTabs = () => {
    if (isClientPortal) {
      return [
        { value: 'shared' as NoteType, label: 'Shared Notes' },
        { value: 'client_reflection' as NoteType, label: 'My Reflections' },
      ]
    }
    return [
      { value: 'coach_private' as NoteType, label: 'Coach Private' },
      { value: 'shared' as NoteType, label: 'Shared Notes' },
      { value: 'client_reflection' as NoteType, label: 'Client Reflections' },
    ]
  }

  const tabs = getTabs()

  // Apply maxNotes limit
  const displayedNotes = maxNotes
    ? filteredNotes.slice(0, maxNotes)
    : filteredNotes

  // Compact mode render
  if (compact) {
    return (
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : displayedNotes.length > 0 ? (
          displayedNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={handleEditNote}
              onDelete={note => setNoteToDelete(note)}
              isClientPortal={isClientPortal}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <FileText className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">No notes yet</p>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!noteToDelete}
          onOpenChange={open => !open && setNoteToDelete(null)}
        >
          <AlertDialogContent>
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
      {/* Editor */}
      {isEditing && (
        <NoteEditor
          sessionId={sessionId}
          existingNote={editingNote}
          defaultNoteType={activeTab}
          onSave={handleSaveNote}
          onCancel={handleCancelEdit}
          saving={saving}
          isClientPortal={isClientPortal}
        />
      )}

      {/* Notes List */}
      {!isEditing && (
        <Card className="bg-white border-gray-200">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Session Notes
              </CardTitle>
              <div className="flex gap-2">
                {!isClientPortal && activeTab !== 'client_reflection' && (
                  <GenerateSummaryButton
                    sessionId={sessionId}
                    onSummaryGenerated={_summary => {
                      // Auto-fill new note with summary
                      setEditingNote(undefined)
                      setIsEditing(true)
                      // We'll need to pass the summary somehow
                    }}
                  />
                )}
                <Button
                  onClick={handleCreateNote}
                  size="sm"
                  className="bg-gray-900 text-white hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Note
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <Tabs
              value={activeTab}
              onValueChange={value => setActiveTab(value as NoteType)}
            >
              <TabsList
                className={`grid w-full grid-cols-${isClientPortal ? '2' : tabs.length} bg-gray-100`}
              >
                {tabs.map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {tabs.map(tab => (
                <TabsContent
                  key={tab.value}
                  value={tab.value}
                  className="space-y-4 mt-4"
                >
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : filteredNotes.length > 0 ? (
                    <div className="space-y-4">
                      {filteredNotes.map(note => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onEdit={handleEditNote}
                          onDelete={note => setNoteToDelete(note)}
                          isClientPortal={isClientPortal}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-sm text-gray-500">
                        No {tab.label.toLowerCase()} yet
                      </p>
                      <Button
                        onClick={handleCreateNote}
                        variant="outline"
                        size="sm"
                        className="mt-4 border-gray-300 text-gray-900 hover:bg-gray-100"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Note
                      </Button>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
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
