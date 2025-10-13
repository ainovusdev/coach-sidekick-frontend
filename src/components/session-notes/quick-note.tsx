'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2, StickyNote } from 'lucide-react'
import { SessionNotesService } from '@/services/session-notes-service'
import { toast } from 'sonner' // UPDATED: Use Sonner

interface QuickNoteProps {
  sessionId: string
  noteType?: 'coach_private' | 'shared'
}

export function QuickNote({
  sessionId,
  noteType = 'coach_private',
}: QuickNoteProps) {
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!content.trim() || saving) return

    setSaving(true)
    try {
      await SessionNotesService.createNote(sessionId, {
        note_type: noteType,
        title: `Quick note - ${new Date().toLocaleTimeString()}`,
        content: content.trim(),
      })

      toast.success('Note Saved', {
        description: 'Your quick note has been saved',
      })

      setContent('') // Clear after save
    } catch (error) {
      toast.error('Failed to Save Note', {
        description:
          error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-gray-600" />
            <h4 className="text-sm font-semibold text-gray-900">
              Quick Notes (Live Session)
            </h4>
            {noteType === 'shared' && (
              <Badge variant="secondary" className="text-xs">
                Shared with client
              </Badge>
            )}
          </div>
        </div>

        <Textarea
          placeholder="Capture important moments during the session..."
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => {
            // Save on Cmd/Ctrl + Enter
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault()
              handleSave()
            }
          }}
          className="min-h-[100px] resize-none border-gray-200 focus:border-gray-400 text-sm mb-3"
          disabled={saving}
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            💡 Press{' '}
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
              ⌘+Enter
            </kbd>{' '}
            to save quickly
          </p>
          <Button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            size="sm"
            className="bg-gray-900 hover:bg-gray-800"
          >
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-3 w-3 mr-2" />
                Save Note
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
