'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { StickyNote, FileText, Loader2, Plus } from 'lucide-react'
import { SessionNotesService } from '@/services/session-notes-service'
import { SessionNote } from '@/types/session-note'
import { formatRelativeTime } from '@/lib/date-utils'
import { toast } from 'sonner'

interface SessionNotesCompactProps {
  sessionId: string
  isViewer?: boolean
}

export function SessionNotesCompact({
  sessionId,
  isViewer = false,
}: SessionNotesCompactProps) {
  const [notes, setNotes] = useState<SessionNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [isCreating, setIsCreating] = useState(false)

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

  const handleCreateNote = async () => {
    if (!newContent.trim()) return
    setIsCreating(true)
    try {
      await SessionNotesService.createNote(sessionId, {
        title: newTitle.trim() || null,
        content: newContent.trim(),
        note_type: 'coach_private',
      })
      toast.success('Note added')
      setShowCreateDialog(false)
      setNewTitle('')
      setNewContent('')
      fetchNotes()
    } catch (error) {
      console.error('Failed to create note:', error)
      toast.error('Failed to create note')
    } finally {
      setIsCreating(false)
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
          <div className="flex items-center gap-2">
            {!isViewer && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                size="sm"
                className="bg-app-primary hover:bg-app-primary/90 text-white text-xs"
              >
                <Plus className="h-3 w-3 mr-1.5" />
                Add
              </Button>
            )}
          </div>
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

      {/* Create Note Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={open => {
          if (!open) {
            setShowCreateDialog(false)
            setNewTitle('')
            setNewContent('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-app-primary mb-1.5 block">
                Title
              </label>
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Note title (optional)"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-app-primary mb-1.5 block">
                Content *
              </label>
              <Textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="Write your note..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                setNewTitle('')
                setNewContent('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateNote}
              disabled={!newContent.trim() || isCreating}
              className="bg-app-primary hover:bg-app-primary/90"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Note'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
