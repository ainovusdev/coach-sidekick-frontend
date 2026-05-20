export const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-ink text-ink-on-dark border-line '
    case 'in_progress':
      return 'bg-ink-2 text-ink-on-dark border-line'
    case 'error':
      return 'bg-surface-3 text-ink border-line-strong'
    case 'pending_upload':
      return 'bg-surface-1 text-ink border-line-strong'
    default:
      return 'bg-surface-3 text-ink-2 border-line'
  }
}

export const getScoreColor = (score: number) => {
  if (score >= 8) return 'text-ink font-bold'
  if (score >= 6) return 'text-ink-2 font-medium'
  return 'text-ink-3'
}

export const getScoreGradient = (score: number) => {
  if (score >= 8) return ''
  if (score >= 6) return ''
  return ''
}
