'use client'

/**
 * The `@` people popup. Portalled to <body> with `position: fixed` from the
 * caret rect — the detail panel is a transformed, scrolling ancestor, so a
 * fixed box inside it would be offset and clipped.
 *
 * Keyboard comes in through the imperative handle (the ProseMirror plugin
 * owns the keydown); ArrowUp/Down move, Enter picks, Escape is left to the
 * plugin, which ends the suggestion and preventDefaults the key so the panel
 * underneath stays open.
 */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { RELATION_LABEL, type Person } from '@/types/people'

export interface MentionListHandle {
  onKeyDown: (event: KeyboardEvent) => boolean
}

interface MentionListProps {
  items: Person[]
  query: string
  isLoading: boolean
  clientRect: (() => DOMRect | null) | null
  onSelect: (person: Person) => void
}

const WIDTH = 272
const MAX_HEIGHT = 240

export const MentionList = forwardRef<MentionListHandle, MentionListProps>(
  function MentionList({ items, query, isLoading, clientRect, onSelect }, ref) {
    const [index, setIndex] = useState(0)
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

    // Fresh results → start from the top.
    useEffect(() => {
      setIndex(0)
    }, [items])

    // Anchor under the caret; flip above when the viewport runs out.
    // Re-measured on scroll/resize because the panel content scrolls.
    useLayoutEffect(() => {
      const measure = () => {
        const rect = clientRect?.()
        if (!rect) return
        const gap = 6
        const spaceBelow = window.innerHeight - rect.bottom
        const top =
          spaceBelow < MAX_HEIGHT + gap && rect.top > MAX_HEIGHT + gap
            ? rect.top - gap - MAX_HEIGHT
            : rect.bottom + gap
        const left = Math.max(
          8,
          Math.min(rect.left, window.innerWidth - WIDTH - 8),
        )
        setPos({ top, left })
      }
      measure()
      window.addEventListener('scroll', measure, true)
      window.addEventListener('resize', measure)
      return () => {
        window.removeEventListener('scroll', measure, true)
        window.removeEventListener('resize', measure)
      }
    }, [clientRect, items.length])

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: event => {
          if (event.key === 'ArrowDown') {
            if (items.length) setIndex(i => (i + 1) % items.length)
            return true
          }
          if (event.key === 'ArrowUp') {
            if (items.length) {
              setIndex(i => (i - 1 + items.length) % items.length)
            }
            return true
          }
          if (event.key === 'Enter' || event.key === 'Tab') {
            // Cmd/Ctrl+Enter is "post" — let the composer keymap have it.
            if (event.metaKey || event.ctrlKey) return false
            const person = items[index]
            if (person) onSelect(person)
            return true
          }
          // Escape: the suggestion plugin exits (and preventDefaults) itself.
          return false
        },
      }),
      [items, index, onSelect],
    )

    if (typeof document === 'undefined' || !pos) return null

    return createPortal(
      <div
        data-testid="mention-list"
        role="listbox"
        style={{
          top: pos.top,
          left: pos.left,
          width: WIDTH,
          maxHeight: MAX_HEIGHT,
        }}
        className="fixed z-[80] overflow-y-auto rounded-lg border border-line bg-surface-1 p-1 shadow-lg animate-in fade-in-0 zoom-in-95 duration-100"
      >
        {items.length === 0 ? (
          <p className="px-2 py-1.5 text-xs text-ink-3">
            {isLoading
              ? 'Searching…'
              : query
                ? `No one matches “${query}”`
                : 'Type a name'}
          </p>
        ) : (
          items.map((person, i) => (
            <button
              key={person.id}
              type="button"
              role="option"
              aria-selected={i === index}
              data-testid="mention-option"
              data-person={person.id}
              // Keep the editor focused while picking with the mouse.
              onMouseDown={e => e.preventDefault()}
              onMouseEnter={() => setIndex(i)}
              onClick={() => onSelect(person)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                i === index ? 'bg-surface-2 text-ink' : 'text-ink-2',
              )}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[11px] font-medium text-ink-3">
                {initials(person.full_name || person.email)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {person.full_name || person.email}
                </span>
                <span className="block truncate text-[11px] text-ink-3">
                  {person.relation
                    ? RELATION_LABEL[person.relation]
                    : person.email}
                </span>
              </span>
            </button>
          ))
        )}
      </div>,
      document.body,
    )
  },
)

function initials(name: string) {
  const parts = name
    .trim()
    .split(/[\s@._-]+/)
    .filter(Boolean)
  const first = parts[0]?.[0] ?? '?'
  const second = parts.length > 1 ? parts[1][0] : ''
  return (first + second).toUpperCase()
}
