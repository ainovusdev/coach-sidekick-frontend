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
import {
  Pencil,
  Trash2,
  Check,
  X,
  FileText,
  Loader2,
  Lightbulb,
  BookOpen,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Video,
  Link2,
  ClipboardList,
  Dumbbell,
  FileEdit,
  Newspaper,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/date-utils'
import { toast } from 'sonner'
import {
  LiveMeetingService,
  ClientNote,
  LiveMeetingResource,
} from '@/services/live-meeting-service'
import { CATEGORY_COLORS } from '@/types/resource'
import type { ResourceCategory } from '@/types/resource'

const CATEGORY_ICONS: Record<string, typeof FileText> = {
  general: FileText,
  document: FileText,
  worksheet: ClipboardList,
  exercise: Dumbbell,
  article: Newspaper,
  template: FileEdit,
  video: Video,
  link: Link2,
}

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
  const [resources, setResources] = useState<LiveMeetingResource[]>([])
  const [resourcesOpen, setResourcesOpen] = useState(true)

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

  // Fetch resources with polling
  useEffect(() => {
    if (!guestToken) return

    const fetchResources = async () => {
      try {
        const data = await LiveMeetingService.getResources(
          meetingToken,
          guestToken,
        )
        setResources(data)
      } catch {
        // Silent — resources are supplementary
      }
    }

    fetchResources()
    const interval = setInterval(fetchResources, 30000)
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
    <Card className="border-line h-full flex flex-col shadow-sm ">
      <CardHeader className="border-b border-line py-4 flex-shrink-0 bg-surface-1 ">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 bg-ds-accent-bg rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-ds-accent " />
            </div>
            <div>
              <span className="text-ink ">Session Notes</span>
              {notes.length > 0 && (
                <span className="text-xs font-normal text-ink-3 ml-2">
                  ({notes.length})
                </span>
              )}
            </div>
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Editor */}
        <div className="flex-shrink-0 p-4 border-b border-line  ">
          {/* Tips section */}
          <div className="mb-3 flex items-start gap-2 p-2.5 bg-ds-accent-bg rounded-lg border border-ds-accent ">
            <Lightbulb className="h-4 w-4 text-ds-accent flex-shrink-0 mt-0.5" />
            <p className="text-xs text-ds-accent ">
              Capture key insights, questions, or action items from this
              session. Use formatting for better organization.
            </p>
          </div>

          <RichTextEditor
            content={newNote}
            onChange={setNewNote}
            placeholder="What insights are you taking away from this session?"
            disabled={!guestToken}
            minHeight="150px"
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                handleSaveNote()
              }
            }}
          />

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-ink-4 ">
              {hasContent(newNote) ? 'Press Cmd+Enter to save' : ''}
            </span>
            <Button
              onClick={handleSaveNote}
              disabled={!hasContent(newNote) || isSaving || !guestToken}
              size="sm"
              className="bg-ds-accent hover:bg-ds-accent text-ink-on-dark"
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

        {/* Notes List */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-6 w-6 mx-auto animate-spin text-ink-4 mb-2" />
              <p className="text-sm text-ink-3 ">Loading your notes...</p>
            </div>
          </div>
        ) : notes.length > 0 ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="px-4 py-2 bg-paper flex items-center justify-between flex-shrink-0">
              <span className="text-xs font-medium text-ink-3 ">
                Your Notes
              </span>
              <Badge variant="secondary" className="text-xs ">
                {notes.length}
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notes.map(note => (
                <div
                  key={note.id}
                  className="px-4 py-3 border-b border-line last:border-b-0 hover:bg-paper/50 "
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
                          className="h-7 text-xs bg-ink hover:bg-ink-2 text-ink-on-dark "
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
                          className="text-sm text-ink-2 line-clamp-3 flex-1 prose prose-sm dark:prose-invert max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:my-0.5"
                          dangerouslySetInnerHTML={{ __html: note.content }}
                        />
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => startEditing(note)}
                            className="p-1 text-ink-4 hover:text-ink-3 hover:bg-surface-3 rounded"
                            title="Edit note"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 text-ink-4 hover:text-vermillion hover:bg-vermillion-bg rounded"
                            title="Delete note"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <span className="text-xs text-ink-4 mt-1.5 block">
                        {formatRelativeTime(note.created_at)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-surface-3 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-ink-4 " />
              </div>
              <h3 className="font-medium text-ink-2 mb-1">No notes yet</h3>
              <p className="text-sm text-ink-3 max-w-[200px] mx-auto">
                Use the editor above to capture your thoughts and insights
              </p>
            </div>
          </div>
        )}
        {/* Collapsible Resources Section */}
        {resources.length > 0 && (
          <div className="flex-shrink-0 border-t border-line ">
            <button
              onClick={() => setResourcesOpen(!resourcesOpen)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-paper transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-ds-accent " />
                <span className="text-sm font-medium text-ink-2 ">
                  Shared Resources
                </span>
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 ">
                  {resources.length}
                </Badge>
              </div>
              {resourcesOpen ? (
                <ChevronUp className="h-4 w-4 text-ink-4" />
              ) : (
                <ChevronDown className="h-4 w-4 text-ink-4" />
              )}
            </button>

            {resourcesOpen && (
              <div className="px-4 pb-4 space-y-2">
                {resources.map(resource => {
                  const Icon = CATEGORY_ICONS[resource.category] || FileText
                  const colors =
                    CATEGORY_COLORS[resource.category as ResourceCategory] ||
                    CATEGORY_COLORS.general

                  return (
                    <div
                      key={resource.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-line hover:border-line transition-colors"
                    >
                      <div className={`p-1.5 rounded-lg ${colors.bg} shrink-0`}>
                        <Icon className={`h-3.5 w-3.5 ${colors.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">
                          {resource.title}
                        </p>
                        {resource.description && (
                          <p className="text-xs text-ink-3 truncate">
                            {resource.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {resource.file_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-ink-4 hover:text-ds-accent"
                            onClick={() =>
                              window.open(resource.file_url!, '_blank')
                            }
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {resource.content_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-ink-4 hover:text-ds-accent"
                            onClick={() =>
                              window.open(
                                resource.content_url!,
                                '_blank',
                                'noopener,noreferrer',
                              )
                            }
                            title="Open link"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
