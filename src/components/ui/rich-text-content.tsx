import { cn } from '@/lib/utils'
import { looksLikeHtml } from '@/lib/rich-text'

interface RichTextContentProps {
  /** A note or commitment description: rich-editor HTML or plain text. */
  value: string | null | undefined
  className?: string
  /** Clamp to this many lines (previews). */
  clamp?: 1 | 2 | 3
}

const CLAMP = { 1: 'line-clamp-1', 2: 'line-clamp-2', 3: 'line-clamp-3' }

// Same list / paragraph spacing as the editor, so a saved note looks the way
// it did while typing.
const RICH =
  'max-w-none break-words [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_li]:my-0.5 [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-3 [&_a]:underline'

/**
 * Shows a note or description. HTML is rendered as HTML (the backend
 * sanitizes every HTML value on write); plain text keeps its line breaks.
 */
export function RichTextContent({
  value,
  className,
  clamp,
}: RichTextContentProps) {
  if (!value) return null
  const clampClass = clamp ? CLAMP[clamp] : undefined
  if (looksLikeHtml(value)) {
    return (
      <div
        className={cn(RICH, clampClass, className)}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    )
  }
  return (
    <div
      className={cn('whitespace-pre-wrap break-words', clampClass, className)}
    >
      {value}
    </div>
  )
}
