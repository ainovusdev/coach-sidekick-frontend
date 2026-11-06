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
import Link from 'next/link'
import {
  Bold,
  Italic,
  Keyboard,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { EnterKeySetting } from '@/components/ui/enter-key-setting'
import { useAuth } from '@/contexts/auth-context'
import { useEditorPreferences } from '@/contexts/editor-preferences-context'
import { isCoachRole } from '@/lib/roles'
import { toEditorHtml } from '@/lib/rich-text'
import { cn } from '@/lib/utils'
import type { EditorEnterKey } from '@/types/preferences'

export { htmlToPlainText } from '@/lib/rich-text'

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
  /**
   * Save from the keyboard. Which key saves follows the person's Enter-key
   * setting: Shift+Enter by default, Enter if they chose "Enter saves".
   * Cmd/Ctrl+Enter always saves. Passing it also shows the toolbar's
   * keyboard button, where the setting can be changed.
   */
  onSave?: () => void
  /** Extra settings in the keyboard popover (e.g. "New notes start as"). */
  settingsExtra?: React.ReactNode
  /** Cmd/Ctrl+Enter, for editors without onSave (the comment composer). */
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
 * Every key that saves, cancels or splits, in one place. Always installed;
 * the handlers read the latest callbacks and the Enter-key setting through
 * refs, so changing the setting applies to an open editor at once (extensions
 * are fixed when the editor is created).
 *
 * Priority 1000, above StarterKit (100): HardBreak binds Shift-Enter and
 * Mod-Enter and ListItem binds Enter, and we must see them first. Each handler
 * returns false when it does not apply, so the key falls through to them.
 * The comment composer's mention popup still gets Enter, because Enter is
 * only taken when onSave is set, and comment composers never set it.
 */
const SaveKeys = Extension.create<{
  getMode: () => EditorEnterKey
  canSave: () => boolean
  save: () => boolean
  submit: () => boolean
  escape: () => boolean
}>({
  name: 'saveKeys',
  priority: 1000,
  addOptions() {
    return {
      getMode: () => 'newline',
      canSave: () => false,
      save: () => false,
      submit: () => false,
      escape: () => false,
    }
  },
  addKeyboardShortcuts() {
    // A new paragraph or list item, as plain Enter makes in the default mode.
    const newBlock = () =>
      this.editor.commands.first(({ commands }) => [
        () => commands.splitListItem('listItem'),
        () => commands.newlineInCode(),
        () => commands.createParagraphNear(),
        () => commands.liftEmptyBlock(),
        () => commands.splitBlock(),
      ])
    return {
      Enter: () => {
        if (!this.options.canSave() || this.options.getMode() !== 'save') {
          return false
        }
        // IME: Enter confirms the composed text.
        if (this.editor.view.composing) return false
        // Lists keep Enter: next bullet, or out of the list on an empty one.
        if (this.editor.isActive('listItem')) return false
        if (this.editor.isActive('codeBlock')) return false
        return this.options.save()
      },
      'Shift-Enter': () => {
        // No save handler: HardBreak's line break, as before.
        if (!this.options.canSave()) return false
        // Enter saves, so Shift+Enter is "the other key": the new paragraph
        // or list item that Enter makes by default (not a <br>).
        if (this.options.getMode() === 'save') return newBlock()
        return this.options.save()
      },
      'Mod-Enter': () => this.options.save() || this.options.submit(),
      Escape: () => this.options.escape(),
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
  onSave,
  settingsExtra,
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
  const { enterKey, canEdit } = useEditorPreferences()
  const { roles } = useAuth()
  const onSaveRef = useRef(onSave)
  const onSubmitRef = useRef(onSubmit)
  const onEscapeRef = useRef(onEscape)
  const enterKeyRef = useRef(enterKey)
  onSaveRef.current = onSave
  onSubmitRef.current = onSubmit
  onEscapeRef.current = onEscape
  enterKeyRef.current = enterKey
  const saveKeys = useMemo(
    () =>
      SaveKeys.configure({
        getMode: () => enterKeyRef.current,
        canSave: () => !!onSaveRef.current,
        save: () => {
          if (!onSaveRef.current) return false
          onSaveRef.current()
          return true
        },
        submit: () => {
          if (!onSubmitRef.current) return false
          onSubmitRef.current()
          return true
        },
        escape: () => onEscapeRef.current?.() === true,
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
      saveKeys,
      ...(extensions ?? []),
    ],
    content: toEditorHtml(content),
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

  // Follow the content prop when it changes from outside (a reset after save,
  // a different note opened). Plain text is converted so its line breaks
  // survive, and no update is emitted: loading a value must not rewrite the
  // parent's state as if the person had typed.
  useEffect(() => {
    if (!editor) return
    const html = toEditorHtml(content)
    if (html !== editor.getHTML() && content !== editor.getHTML()) {
      editor.commands.setContent(html, { emitUpdate: false })
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

          {onSave && canEdit && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  title="Keyboard settings"
                  aria-label="Keyboard settings"
                  data-testid="editor-keyboard-settings"
                  className={cn(
                    'ml-auto flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-ink-3 transition-colors',
                    'hover:bg-surface-3 hover:text-ink focus:outline-none focus:ring-2 focus:ring-ds-accent focus:ring-offset-1',
                  )}
                >
                  <Keyboard className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {enterKey === 'save' ? 'Enter saves' : 'Shift+Enter saves'}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-3">
                <div className="space-y-3">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-3">
                      Enter key
                    </p>
                    <EnterKeySetting idPrefix="popover-enter-key" />
                    <p className="mt-2 text-xs text-ink-3">
                      Cmd/Ctrl+Enter always saves. Applies to every note and
                      description box.
                    </p>
                  </div>
                  {settingsExtra}
                  <Link
                    href={
                      isCoachRole(roles)
                        ? '/settings?tab=preferences'
                        : '/client-portal/profile'
                    }
                    className="block text-xs text-ds-accent hover:underline"
                  >
                    All settings
                  </Link>
                </div>
              </PopoverContent>
            </Popover>
          )}
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
