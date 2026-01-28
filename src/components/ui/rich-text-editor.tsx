'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useCallback, useState } from 'react'
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
}

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
        'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
        isActive && 'bg-gray-200 text-blue-600',
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
  minHeight = '120px',
  onKeyDown,
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false)

  // Prevent SSR hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

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
          'before:content-[attr(data-placeholder)] before:text-gray-400 before:float-left before:h-0 before:pointer-events-none',
      }),
    ],
    content,
    editable: !disabled,
    // Prevent SSR rendering issues
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none',
          'min-h-[var(--editor-min-height)]',
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1',
          '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1',
          '[&_li]:my-0.5',
          '[&_p]:my-1',
          editorClassName,
        ),
        style: `--editor-min-height: ${minHeight}`,
      },
    },
  })

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
          'border border-gray-200 rounded-lg bg-white overflow-hidden',
          className,
        )}
      >
        {/* Toolbar placeholder */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
          <div className="h-7 w-7 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-7 w-7 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-7 w-7 bg-gray-200 rounded-md animate-pulse" />
          <div className="w-px h-5 bg-gray-300 mx-1" />
          <div className="h-7 w-7 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-7 w-7 bg-gray-200 rounded-md animate-pulse" />
        </div>
        {/* Content placeholder */}
        <div className="px-3 py-2" style={{ minHeight }}>
          <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'border border-gray-200 rounded-lg overflow-hidden bg-white flex flex-col',
        'focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500',
        disabled && 'opacity-60 bg-gray-50',
        className,
      )}
      onKeyDown={onKeyDown}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
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

        <div className="w-px h-5 bg-gray-300 mx-1" />

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

      {/* Editor Content */}
      <div className="px-3 py-2 flex-1 overflow-y-auto">
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
