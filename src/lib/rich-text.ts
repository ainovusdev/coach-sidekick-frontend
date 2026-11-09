/**
 * Notes and commitment descriptions are stored as either plain text (older
 * rows, AI-extracted commitments) or HTML from the rich editor. These helpers
 * tell them apart and move between the two. The backend applies the same
 * looks-like-HTML rule (app/utils/rich_text.py) and sanitizes every value it
 * matches, which is what makes rendering such values as HTML safe.
 */

// A real opening or closing tag: <p>, </li>, <a href=…>, <br/>. "a < b" is not.
const HTML_TAG_RE = /<\/?[a-zA-Z][a-zA-Z0-9-]*(\s[^<>]*)?\/?>/

export function looksLikeHtml(value: string | null | undefined): boolean {
  return !!value && HTML_TAG_RE.test(value)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * What to load into the editor. Plain text becomes one paragraph per line, so
 * its line breaks survive (Tiptap would otherwise collapse them).
 */
export function toEditorHtml(value: string | null | undefined): string {
  if (!value) return ''
  if (looksLikeHtml(value)) return value
  return value
    .split(/\r?\n/)
    .map(line => `<p>${escapeHtml(line)}</p>`)
    .join('')
}

/**
 * What to save from the editor: '' when there is no text (never `<p></p>`),
 * and without the empty paragraphs Tiptap keeps after a list.
 */
export function normalizeEditorHtml(html: string | null | undefined): string {
  if (!html) return ''
  if (!htmlToPlainText(html).trim()) return ''
  return html.replace(/(<p>(\s|<br\s*\/?>)*<\/p>)+$/i, '')
}

/** Plain text of a note or description, for previews, titles and search. */
export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return ''
  if (!looksLikeHtml(html)) return html
  // Block ends become spaces so "<p>a</p><p>b</p>" reads "a b", not "ab".
  const spaced = html.replace(
    /<\/(p|li|h[1-6]|blockquote|pre)>|<br\s*\/?>/gi,
    '$& ',
  )
  if (typeof document !== 'undefined') {
    const div = document.createElement('div')
    div.innerHTML = spaced
    return (div.textContent || '').replace(/\s+/g, ' ').trim()
  }
  return spaced
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}
