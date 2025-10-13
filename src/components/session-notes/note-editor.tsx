'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NoteTemplateSelector } from './note-template-selector'
import {
  SessionNoteCreate,
  SessionNoteUpdate,
  SessionNote,
  NoteType,
  NOTE_TYPE_LABELS,
} from '@/types/session-note'
import { X, Save, Loader2 } from 'lucide-react'

interface NoteEditorProps {
  sessionId: string
  existingNote?: SessionNote
  defaultNoteType?: NoteType
  onSave: (data: SessionNoteCreate | SessionNoteUpdate) => Promise<void>
  onCancel: () => void
  saving?: boolean
  isClientPortal?: boolean
}

export function NoteEditor({
  sessionId: _sessionId,
  existingNote,
  defaultNoteType = 'shared',
  onSave,
  onCancel,
  saving = false,
  isClientPortal = false,
}: NoteEditorProps) {
  const [title, setTitle] = useState(existingNote?.title || '')
  const [content, setContent] = useState(existingNote?.content || '')
  const [noteType, setNoteType] = useState<NoteType>(
    existingNote?.note_type || defaultNoteType,
  )
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    string | undefined
  >(existingNote?.template_id)

  // Get available note types based on portal type
  const getAvailableNoteTypes = (): NoteType[] => {
    if (isClientPortal) {
      return ['client_reflection']
    }
    return ['coach_private', 'shared', 'pre_session', 'post_session']
  }

  const availableNoteTypes = getAvailableNoteTypes()

  // Apply template content
  const handleTemplateSelect = (templateContent: string) => {
    setContent(templateContent)
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return

    const noteData = {
      title: title.trim(),
      content: content.trim(),
      note_type: noteType,
      template_id: selectedTemplateId,
    }

    await onSave(noteData)
  }

  const isValid = title.trim() && content.trim()

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {existingNote ? 'Edit Note' : 'New Note'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={saving}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Note Type Selector - Only show for coaches */}
        {!isClientPortal && availableNoteTypes.length > 1 && (
          <div className="space-y-2">
            <Label htmlFor="note-type" className="text-sm font-medium">
              Note Type
            </Label>
            <Select
              value={noteType}
              onValueChange={value => setNoteType(value as NoteType)}
              disabled={saving || !!existingNote}
            >
              <SelectTrigger id="note-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableNoteTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {NOTE_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {noteType === 'coach_private' && (
              <p className="text-xs text-gray-500">
                Only visible to coaches - not shared with client
              </p>
            )}
            {noteType === 'shared' && (
              <p className="text-xs text-gray-500">
                Visible to both coach and client
              </p>
            )}
          </div>
        )}

        {/* Template Selector - Only for new notes */}
        {!existingNote && !isClientPortal && (
          <NoteTemplateSelector
            noteType={noteType}
            onSelect={(template, id) => {
              handleTemplateSelect(template)
              setSelectedTemplateId(id)
            }}
          />
        )}

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="note-title" className="text-sm font-medium">
            Title
          </Label>
          <Input
            id="note-title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter note title..."
            disabled={saving}
            className="border-gray-300"
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="note-content" className="text-sm font-medium">
            Content
          </Label>
          <Textarea
            id="note-content"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your note here... (Markdown supported)"
            rows={12}
            disabled={saving}
            className="border-gray-300 font-mono text-sm"
          />
          <p className="text-xs text-gray-500">Supports markdown formatting</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid || saving}
            className="bg-gray-900 hover:bg-gray-800"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {existingNote ? 'Update Note' : 'Save Note'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
