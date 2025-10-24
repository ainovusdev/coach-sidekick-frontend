'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Check, X } from 'lucide-react'
import { SessionService } from '@/services/session-service'
import { toast } from 'sonner'

interface SessionTitleEditorProps {
  sessionId: string
  initialTitle?: string | null
  defaultTitle: string
  onTitleUpdated?: (newTitle: string) => void
}

export function SessionTitleEditor({
  sessionId,
  initialTitle,
  defaultTitle,
  onTitleUpdated,
}: SessionTitleEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(initialTitle || '')
  const [isSaving, setIsSaving] = useState(false)

  const displayTitle = title || defaultTitle

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title cannot be empty')
      return
    }

    setIsSaving(true)
    try {
      await SessionService.updateSession(sessionId, { title: title.trim() })
      toast.success('Session title updated')
      setIsEditing(false)
      onTitleUpdated?.(title.trim())
    } catch (error) {
      console.error('Failed to update session title:', error)
      toast.error('Failed to update session title')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setTitle(initialTitle || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2 group">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {displayTitle}
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter session title"
        className="text-2xl font-bold h-auto py-1 px-2"
        autoFocus
        disabled={isSaving}
      />
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={isSaving}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
