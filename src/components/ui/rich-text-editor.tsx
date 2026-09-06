'use client'

import {
  useEditor,
  EditorContent,
  Extension,
  type AnyExtension,
  type Editor,
} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useCallback, useMemo, useRef, useState } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  className?: string
  editorClassName?: string
  disabled?: boolean
  minHeight?: string
  onKeyDown?: (e: React.KeyboardEvent) => void
  /**
   * `document` (default) is the full editor with a toolbar. `comment` is the
   * compact composer: no toolbar, tighter padding, 56px tall until typed in.
   */
  variant?: 'document' | 'comment'
  /** Extra tiptap extensions appended after the built-in set (e.g. Mention). */
  extensions?: AnyExtension[]
  /** Cmd/Ctrl+Enter. */
  onSubmit?: () => void
  /**
   * Escape, when nothing inside the editor (a mention popup) took it first.
   * Return true to swallow the key so an enclosing panel stays open.
   */
  onEscape?: () => boolean | void
  autoFocus?: boolean
  /** Merged into the ProseMirror content element's attributes (test ids, aria). */
  editorAttributes?: Record<string, string>
  /** The live editor, once created — for clearContent() / getJSON() from outside. */
  onEditorReady?: (editor: Editor) => void
}

/**
 * Composer keys. Priority 50 so the Mention suggestion plugin (default 100)
 * sees Enter / Escape first while its popup is open.
 */
const ComposerKeys = Extension.create<{
  onSubmit: () => boolean
  onEscape: () => boolean
}>({
  name: 'composerKeys',
  // Above StarterKit (100): HardBreak also binds Mod-Enter and would insert a
  // line break first. Escape still reaches the mention popup because the
  // composer's onEscape returns false while the popup is open.
  priority: 1000,
  addOptions() {
    return { onSubmit: () => false, onEscape: () => false }
  },
  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.options.onSubmit(),
      Escape: () => this.options.onEscape(),
    }
  },
})

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  title: string
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-1.5 rounded-md transition-colors',
        'hover:bg-surface-3 focus:outline-none focus:ring-2 focus:ring-ds-accent focus:ring-offset-1 ',
        isActive && 'bg-surface-3 text-ds-accent ',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Start typing...',
  className,
  editorClassName,
  disabled = false,
  minHeight,
  onKeyDown,
  variant = 'document',
  extensions,
  onSubmit,
  onEscape,
  autoFocus = false,
  editorAttributes,
  onEditorReady,
}: RichTextEditorProps) {
  const isComment = variant === 'comment'
  const resolvedMinHeight = minHeight ?? (isComment ? '56px' : '120px')
  const [isMounted, setIsMounted] = useState(false)

  // Prevent SSR hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // The editor is created once; the key handlers read the latest callbacks
  // through refs so a re-render never has to rebuild it.
  const onSubmitRef = useRef(onSubmit)
  const onEscapeRef = useRef(onEscape)
  onSubmitRef.current = onSubmit
  onEscapeRef.current = onEscape
  const composerKeys = useMemo(
    () =>
      ComposerKeys.configure({
        onSubmit: () => {
          if (!onSubmitRef.current) return false
          onSubmitRef.current()
          return true
        },
        onEscape: () => onEscapeRef.current?.() === true,
      }),
    [],
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          'before:content-[attr(data-placeholder)] before:text-ink-4 before:float-left before:h-0 before:pointer-events-none',
      }),
      ...(onSubmit || onEscape ? [composerKeys] : []),
      ...(extensions ?? []),
    ],
    content,
    editable: !disabled,
    autofocus: autoFocus ? 'end' : false,
    // Prevent SSR rendering issues
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        ...editorAttributes,
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
          'min-h-[var(--editor-min-height)]',
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1',
          '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1',
          '[&_li]:my-0.5',
          '[&_p]:my-1',
          editorClassName,
        ),
        style: `--editor-min-height: ${resolvedMinHeight}`,
      },
    },
  })

  useEffect(() => {
    if (editor) onEditorReady?.(editor)
    // Only when the editor instance itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  // Update content when prop changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled)
    }
  }, [disabled, editor])

  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run()
  }, [editor])

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run()
  }, [editor])

  const toggleUnderline = useCallback(() => {
    editor?.chain().focus().toggleUnderline().run()
  }, [editor])

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run()
  }, [editor])

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run()
  }, [editor])

  // Show loading state during SSR and initial mount
  if (!isMounted || !editor) {
    return (
      <div
        className={cn(
          'border border-line rounded-lg bg-surface-1 overflow-hidden',
          className,
        )}
      >
        {/* Toolbar placeholder */}
        {!isComment && (
          <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-line bg-paper ">
            <div className="h-7 w-7 bg-surface-3 rounded-md animate-pulse" />
            <div className="h-7 w-7 bg-surface-3 rounded-md animate-pulse" />
            <div className="h-7 w-7 bg-surface-3 rounded-md animate-pulse" />
            <div className="w-px h-5 bg-line mx-1" />
            <div className="h-7 w-7 bg-surface-3 rounded-md animate-pulse" />
            <div className="h-7 w-7 bg-surface-3 rounded-md animate-pulse" />
          </div>
        )}
        {/* Content placeholder */}
        <div
          className={isComment ? 'px-3 py-1.5' : 'px-3 py-2'}
          style={{ minHeight: resolvedMinHeight }}
        >
          <div className="h-4 bg-surface-3 rounded w-3/4 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'border border-line rounded-lg overflow-hidden bg-surface-1 flex flex-col',
        'focus-within:ring-2 focus-within:ring-ds-accent focus-within:border-ds-accent',
        disabled && 'opacity-60 bg-paper ',
        className,
      )}
      onKeyDown={onKeyDown}
    >
      {/* Toolbar — the comment variant has none */}
      {!isComment && (
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-line bg-paper flex-shrink-0">
          <ToolbarButton
            onClick={toggleBold}
            isActive={editor.isActive('bold')}
            disabled={disabled}
            title="Bold (Cmd+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={toggleItalic}
            isActive={editor.isActive('italic')}
            disabled={disabled}
            title="Italic (Cmd+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={toggleUnderline}
            isActive={editor.isActive('underline')}
            disabled={disabled}
            title="Underline (Cmd+U)"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-5 bg-line mx-1" />

          <ToolbarButton
            onClick={toggleBulletList}
            isActive={editor.isActive('bulletList')}
            disabled={disabled}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={toggleOrderedList}
            isActive={editor.isActive('orderedList')}
            disabled={disabled}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
        </div>
      )}

      {/* Editor Content */}
      <div
        className={cn(
          'flex-1 overflow-y-auto text-ink ',
          isComment ? 'px-3 py-1.5' : 'px-3 py-2',
        )}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

// Export a function to get plain text from HTML (useful for previews)
export function htmlToPlainText(html: string): string {
  if (typeof document !== 'undefined') {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
  }
  // Server-side fallback: simple regex
  return html.replace(/<[^>]*>/g, '').trim()
}
