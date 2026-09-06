/**
 * `@mention` node for the comment composer.
 *
 * The suggestion popup is NOT rendered by tiptap: the plugin only reports its
 * state (query, caret rect, insert command, keys) to whoever owns `handlers`,
 * and the composer renders <MentionList> inside the normal React tree — so the
 * people query, theme tokens and test ids all work the usual way.
 *
 * Markup emitted (default renderHTML): `<span data-type="mention"
 * data-id="<user id>" data-label="<name>">@<name></span>` — the contract the
 * backend sanitiser keeps and the notification fan-out reads.
 */

import type { RefObject } from 'react'
import Mention from '@tiptap/extension-mention'
import type {
  SuggestionKeyDownProps,
  SuggestionProps,
} from '@tiptap/suggestion'

export interface MentionItem {
  id: string
  label: string
}

export interface MentionSuggestionState {
  query: string
  clientRect: (() => DOMRect | null) | null
  command: (item: MentionItem) => void
}

export interface MentionSuggestionHandlers {
  onOpen: (state: MentionSuggestionState) => void
  onUpdate: (state: MentionSuggestionState) => void
  onClose: () => void
  /** Return true when the key was consumed (the plugin then preventDefaults it). */
  onKeyDown: (event: KeyboardEvent) => boolean
}

/** Chip look inside the editor. Rendered comments restyle by data-type. */
export const MENTION_CHIP_CLASS =
  'rounded-md bg-surface-3 px-1 py-0.5 font-medium text-ink-2 whitespace-nowrap'

function toState(props: SuggestionProps<MentionItem, MentionItem>) {
  return {
    query: props.query,
    clientRect: props.clientRect ?? null,
    command: (item: MentionItem) => props.command(item),
  }
}

export function createMentionExtension(
  handlers: RefObject<MentionSuggestionHandlers | null>,
) {
  return Mention.configure({
    HTMLAttributes: { class: MENTION_CHIP_CLASS },
    deleteTriggerWithBackspace: true,
    suggestion: {
      char: '@',
      allowSpaces: false,
      // People come from usePeopleSearch in the composer (debounced, cached).
      items: () => [],
      render: () => ({
        onStart: props => handlers.current?.onOpen(toState(props)),
        onUpdate: props => handlers.current?.onUpdate(toState(props)),
        onExit: () => handlers.current?.onClose(),
        onKeyDown: ({ event }: SuggestionKeyDownProps) =>
          handlers.current?.onKeyDown(event) ?? false,
      }),
    },
  })
}

/** Every mention in an editor document (getJSON()), deduped by user id. */
export function collectMentions(doc: unknown): MentionItem[] {
  const seen = new Map<string, MentionItem>()
  const walk = (node: any) => {
    if (!node || typeof node !== 'object') return
    if (node.type === 'mention' && node.attrs?.id) {
      const id = String(node.attrs.id)
      if (!seen.has(id)) {
        seen.set(id, { id, label: String(node.attrs.label ?? '') })
      }
    }
    if (Array.isArray(node.content)) node.content.forEach(walk)
  }
  walk(doc)
  return [...seen.values()]
}
