// The one tone vocabulary for chips, dots and text across the product.
// Sandbox delivery, commitment status and priority all map onto these five.
export type Tone = 'default' | 'good' | 'warning' | 'danger' | 'muted'

export const TONE_CLASS: Record<Tone, string> = {
  default: 'bg-surface-3 text-ink-2',
  good: 'bg-forest-bg text-forest',
  warning: 'bg-amber-token-bg text-amber-token',
  danger: 'bg-vermillion-bg text-vermillion',
  muted: 'bg-surface-3 text-ink-3',
}

export const TONE_DOT: Record<Tone, string> = {
  default: 'bg-ink-3',
  good: 'bg-forest',
  warning: 'bg-amber-token',
  danger: 'bg-vermillion',
  muted: 'bg-ink-4',
}

export const TONE_TEXT: Record<Tone, string> = {
  default: 'text-ink',
  good: 'text-forest',
  warning: 'text-amber-token',
  danger: 'text-vermillion',
  muted: 'text-ink-3',
}
