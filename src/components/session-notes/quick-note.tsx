'use client'

import React, { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Check, Loader2, Lock, Users, Zap } from 'lucide-react'
import { useCreateNote } from '@/hooks/mutations/use-note-mutations'

interface QuickNoteProps {
  sessionId: string
  noteType?: 'coach_private' | 'shared'
  onNoteCreated?: () => void
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
  const createNote = useCreateNote(sessionId)

  const handleSave = async () => {
    if (!content.trim() || createNote.isPending) return

    await createNote.mutateAsync({
      note_type: selectedType,
      title: `Quick note - ${new Date().toLocaleTimeString()}`,
      content: content.trim(),
    })

    setContent('')
    onNoteCreated?.()
  }

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
          disabled={createNote.isPending}
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
            disabled={!content.trim() || createNote.isPending}
            size="sm"
            className="bg-gray-900 hover:bg-gray-800"
          >
            {createNote.isPending ? (
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
    </div>
  )
}
