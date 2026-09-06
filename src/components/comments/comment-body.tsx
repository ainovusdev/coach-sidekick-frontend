'use client'

/**
 * Renders a comment's sanitised HTML. Mention spans arrive as
 * `<span data-type="mention" data-id data-label>` with no class (the
 * sanitiser strips styling), so chips are applied here — and the viewer's own
 * mention gets the warning tone so it stands out.
 */

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { TONE_CLASS } from '@/lib/tone'

const CHIP = 'inline rounded-md px-1 py-0.5 text-[13px] font-medium'

function decorateMentions(html: string, viewerId?: string | null): string {
  if (typeof document === 'undefined') return html
  const tpl = document.createElement('template')
  tpl.innerHTML = html
  tpl.content.querySelectorAll('span[data-type="mention"]').forEach(el => {
    const mine = !!viewerId && el.getAttribute('data-id') === viewerId
    el.setAttribute(
      'class',
      cn(CHIP, mine ? TONE_CLASS.warning : TONE_CLASS.default),
    )
  })
  return tpl.innerHTML
}

export function CommentBody({
  html,
  viewerId,
  className,
}: {
  html: string
  viewerId?: string | null
  className?: string
}) {
  const decorated = useMemo(
    () => decorateMentions(html, viewerId),
    [html, viewerId],
  )
  return (
    <div
      className={cn(
        // No typography plugin in this app: style the small allow-list by hand.
        'max-w-none text-sm leading-relaxed text-ink-2 break-words',
        '[&_p]:my-0.5 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0',
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
        '[&_a]:text-indigo [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-80',
        '[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-ink-3',
        '[&_code]:rounded [&_code]:bg-surface-3 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px]',
        '[&_pre]:my-1 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-surface-3 [&_pre]:p-2 [&_pre]:font-mono [&_pre]:text-[12px]',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: decorated }}
    />
  )
}
