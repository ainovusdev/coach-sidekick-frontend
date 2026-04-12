'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  StickyNote,
  FileText,
  Loader2,
  Plus,
  Lock,
  Users,
  Copy,
  Check,
} from 'lucide-react'
import { SessionNotesService } from '@/services/session-notes-service'
import { SessionNote } from '@/types/session-note'
import { formatRelativeTime } from '@/lib/date-utils'
import { htmlToPlainText } from '@/components/ui/rich-text-editor'
import { toast } from 'sonner'

interface SessionNotesCompactProps {
  sessionId: string
  isViewer?: boolean
  clientId?: string | null
}

export function SessionNotesCompact({
  sessionId,
  isViewer = false,
  clientId,
}: SessionNotesCompactProps) {
  const [notes, setNotes] = useState<SessionNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)
  const [newContent, setNewContent] = useState('')
  const [newNoteType, setNewNoteType] = useState<'coach_private' | 'shared'>(
    'coach_private',
  )
  const [isCreating, setIsCreating] = useState(false)
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null)

  useEffect(() => {
    fetchNotes()
  }, [sessionId, clientId])

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const data = await SessionNotesService.getNotes(
        sessionId,
        undefined,
        clientId || undefined,
      )
      setNotes(data)
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
        title: `Note - ${new Date().toLocaleTimeString()}`,
        content: newContent.trim(),
        note_type: newNoteType,
        ...(clientId ? { client_id: clientId } : {}),
      })
      toast.success('Note added')
      setShowCreateDialog(false)
      setNewContent('')
      setNewNoteType('coach_private')
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
                className="bg-app-primary hover:bg-app-primary/90 text-app-background text-xs"
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
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {notes.map(note => (
              <div
                key={note.id}
                className="p-3 bg-app-surface rounded-lg border border-app-border hover:border-app-border transition-colors"
              >
                <div
                  className="flex items-start justify-between gap-2 mb-1 cursor-pointer"
                  onClick={() =>
                    setExpandedNoteId(
                      expandedNoteId === note.id ? null : note.id,
                    )
                  }
                >
                  <h4
                    className={`font-medium text-sm text-app-primary ${expandedNoteId === note.id ? '' : 'line-clamp-1'}`}
                  >
                    {note.title}
                  </h4>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        note.note_type === 'shared'
                          ? 'bg-gray-900 dark:bg-white'
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
                    className={`text-sm text-app-secondary ${expandedNoteId === note.id ? '' : 'line-clamp-2'} mb-2 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:my-0 select-text`}
                    dangerouslySetInnerHTML={{ __html: note.content }}
                  />
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-app-secondary">
                    {formatRelativeTime(note.created_at)}
                  </p>
                  <button
                    onClick={() => {
                      const text = note.content
                        ? htmlToPlainText(note.content)
                        : ''
                      navigator.clipboard.writeText(text)
                      setCopiedNoteId(note.id)
                      setTimeout(() => setCopiedNoteId(null), 2000)
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Copy note"
                  >
                    {copiedNoteId === note.id ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
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
            setNewContent('')
            setNewNoteType('coach_private')
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
                Visibility
              </label>
              <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700 rounded-md p-0.5 w-fit">
                <button
                  type="button"
                  onClick={() => setNewNoteType('coach_private')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    newNoteType === 'coach_private'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Lock className="h-3.5 w-3.5" />
                  Private
                </button>
                <button
                  type="button"
                  onClick={() => setNewNoteType('shared')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    newNoteType === 'shared'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  Shared
                </button>
              </div>
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
                setNewContent('')
                setNewNoteType('coach_private')
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
