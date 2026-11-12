// AI analysis lists (insights, action items, suggestions) are meant to hold
// strings, but models sometimes return objects such as {insight, evidence, ...},
// {action, owner, ...} or {commitment, deadline, ...}. React throws when an
// object is rendered as a child, which blanks the whole page, so reduce every
// item to its display text before rendering.
const TEXT_KEYS = [
  'insight',
  'action',
  'commitment',
  'item',
  'text',
  'suggestion',
  'title',
  'content',
  'description',
] as const

export function aiText(item: unknown): string {
  if (typeof item === 'string') return item
  if (item && typeof item === 'object') {
    const obj = item as Record<string, unknown>
    for (const key of TEXT_KEYS) {
      const value = obj[key]
      if (typeof value === 'string' && value) return value
    }
    const firstString = Object.values(obj).find(
      value => typeof value === 'string' && value,
    )
    return typeof firstString === 'string' ? firstString : JSON.stringify(item)
  }
  return item == null ? '' : String(item)
}
