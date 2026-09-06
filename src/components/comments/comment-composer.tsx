'use client'

/**
 * The comment box: compact rich text + `@` mentions. Cmd/Ctrl+Enter posts,
 * Escape cancels an edit/reply (or is swallowed while a draft is present so
 * the enclosing panel does not close on a half-written comment).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { usePeopleSearch } from '@/hooks/queries/use-people'
import { cn } from '@/lib/utils'
import type { PeopleContext, Person } from '@/types/people'
import type { CommentPerson } from '@/types/comment'
import {
  collectMentions,
  createMentionExtension,
  type MentionSuggestionHandlers,
  type MentionSuggestionState,
} from './mention/mention-extension'
import { MentionList, type MentionListHandle } from './mention/mention-list'

export interface CommentSubmission {
  body: string
  /** User ids mentioned in `body`. */
  mentions: string[]
  /** The same people, for the optimistic row. */
  mentionPeople: CommentPerson[]
}

interface CommentComposerProps {
  /** Whom `@` may reach — the commitment's client / sandbox. */
  context: PeopleContext
  placeholder?: string
  /** Edit mode: the existing HTML. */
  initialContent?: string
  submitLabel?: string
  onSubmit: (submission: CommentSubmission) => void
  /** Edit / reply mode: Escape and the Cancel button call this. */
  onCancel?: () => void
  autoFocus?: boolean
  isPending?: boolean
  className?: string
}

export function CommentComposer({
  context,
  placeholder = 'Add a comment… @ to mention',
  initialContent,
  submitLabel = 'Post',
  onSubmit,
  onCancel,
  autoFocus,
  isPending,
  className,
}: CommentComposerProps) {
  const editorRef = useRef<Editor | null>(null)
  const [isEmpty, setIsEmpty] = useState(!initialContent)
  const [isMac, setIsMac] = useState(false)
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || ''))
  }, [])

  // --- @mention popup -----------------------------------------------------
  const [mention, setMention] = useState<MentionSuggestionState | null>(null)
  const mentionRef = useRef<MentionSuggestionState | null>(null)
  mentionRef.current = mention
  const listRef = useRef<MentionListHandle | null>(null)
  const people = usePeopleSearch(mention?.query ?? '', context, !!mention)
  // The search is debounced, so for a moment the list still holds the previous
  // query's people; narrow it by what has been typed so Enter never picks
  // someone the user can't see matching.
  const items = useMemo(() => {
    const q = (mention?.query ?? '').trim().toLowerCase()
    const all = people.data ?? []
    if (!q) return all
    return all.filter(p =>
      `${p.full_name ?? ''} ${p.email ?? ''}`.toLowerCase().includes(q),
    )
  }, [people.data, mention?.query])

  const handlersRef = useRef<MentionSuggestionHandlers | null>(null)
  handlersRef.current = {
    onOpen: setMention,
    onUpdate: setMention,
    onClose: () => setMention(null),
    onKeyDown: event => listRef.current?.onKeyDown(event) ?? false,
  }
  const extensions = useMemo(() => [createMentionExtension(handlersRef)], [])

  const pick = useCallback(
    (person: Person) => {
      mention?.command({
        id: person.id,
        label: person.full_name || person.email,
      })
    },
    [mention],
  )

  // --- submit / cancel ----------------------------------------------------
  const submit = useCallback(() => {
    const editor = editorRef.current
    if (!editor || editor.isEmpty || isPending || mentionRef.current) return
    const found = collectMentions(editor.getJSON())
    onSubmit({
      body: editor.getHTML(),
      mentions: found.map(m => m.id),
      mentionPeople: found.map(m => ({ id: m.id, name: m.label, email: '' })),
    })
    if (!onCancel) {
      // Fresh composer: the optimistic row is already in the list.
      editor.commands.clearContent(true)
      setIsEmpty(true)
      editor.commands.focus()
    }
  }, [isPending, onCancel, onSubmit])

  const escape = useCallback(() => {
    // Popup open: let the suggestion plugin close it (it runs after us).
    if (mentionRef.current) return false
    if (onCancel) {
      onCancel()
      return true
    }
    // Protect a draft: swallow Escape so the panel does not close over it.
    return !(editorRef.current?.isEmpty ?? true)
  }, [onCancel])

  return (
    <div data-testid="comment-composer" className={cn('space-y-2', className)}>
      <RichTextEditor
        variant="comment"
        content={initialContent ?? ''}
        placeholder={placeholder}
        extensions={extensions}
        autoFocus={autoFocus}
        onSubmit={submit}
        onEscape={escape}
        onEditorReady={editor => {
          editorRef.current = editor
          setIsEmpty(editor.isEmpty)
        }}
        onChange={() => setIsEmpty(editorRef.current?.isEmpty ?? true)}
        editorAttributes={{ 'data-testid': 'comment-editor' }}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-ink-4">
          {isMac ? '⌘' : 'Ctrl'}+Enter to {submitLabel.toLowerCase()} · @ to
          mention
        </span>
        <div className="flex items-center gap-1.5">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            className="h-7 text-xs px-3"
            data-testid="comment-submit"
            onClick={submit}
            disabled={isEmpty || !!isPending}
          >
            {submitLabel}
          </Button>
        </div>
      </div>

      {mention && (
        <MentionList
          ref={listRef}
          items={items}
          query={mention.query}
          isLoading={people.isFetching}
          clientRect={mention.clientRect}
          onSelect={pick}
        />
      )}
    </div>
  )
}
