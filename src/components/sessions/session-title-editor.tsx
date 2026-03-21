'use client'

import { useState, useEffect } from 'react'
import { useRef } from 'react'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
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
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync local state when initialTitle prop changes (e.g., after modal edit or cache refetch)
  useEffect(() => {
    if (!isEditing) {
      setTitle(initialTitle || '')
    }
  }, [initialTitle, isEditing])

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

  return (
    <div className="flex items-center gap-1.5 group min-w-0">
      {isEditing ? (
        <>
          <input
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              // Small delay to allow button clicks to register
              setTimeout(() => {
                if (isEditing && !isSaving) handleCancel()
              }, 150)
            }}
            placeholder="Enter session title"
            className="text-lg font-semibold text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-gray-900 dark:focus:border-white outline-none w-full min-w-0"
            autoFocus
            disabled={isSaving}
          />
          <div className="flex items-center shrink-0">
            {isSaving ? (
              <div className="p-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={handleSave}
                  className="p-1 rounded text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={handleCancel}
                  className="p-1 rounded text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <h1
            className="text-lg font-semibold text-gray-900 dark:text-white truncate cursor-pointer"
            onClick={() => setIsEditing(true)}
            title={displayTitle}
          >
            {displayTitle}
          </h1>
          <button
            onClick={() => setIsEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1 rounded text-app-secondary hover:text-app-primary"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  )
}
