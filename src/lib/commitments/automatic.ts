import type { Commitment } from '@/types/commitment'

/**
 * What the "Automatic" chip and the timeline know about a rule-created row.
 * The backend keeps it under `metadata.auto` (see
 * `commitment_auto_rules.py`); everything here is display-only.
 */

export const RULE_LABELS: Record<string, string> = {
  session_prep: 'session prep',
  review_ai_drafts: 'AI drafts to review',
  pre_session_questionnaire: 'pre-session questions',
  gold_sealing_decision: 'gold sealing decision',
}

export interface AutoInfo {
  rule: string
  label: string
  /** One sentence: "Created by Coach Sidekick before your session with …" */
  why: string
  resolved?: { action: string; at: string; reason: string }
}

export function autoInfo(c: Commitment | null | undefined): AutoInfo | null {
  if (!c || c.source !== 'rule') return null
  const auto = (c.metadata as { auto?: Record<string, unknown> } | undefined)
    ?.auto
  const rule = typeof auto?.rule === 'string' ? auto.rule : 'rule'
  const why =
    typeof auto?.why === 'string' && auto.why
      ? auto.why
      : 'Created automatically by Coach Sidekick.'
  const r = auto?.resolved as
    | { action?: string; at?: string; reason?: string }
    | undefined
  return {
    rule,
    label: RULE_LABELS[rule] ?? rule.replace(/_/g, ' '),
    why,
    resolved:
      r && typeof r.at === 'string'
        ? {
            action: r.action ?? '',
            at: r.at,
            reason: r.reason ?? '',
          }
        : undefined,
  }
}

/** ISO date (yyyy-mm-dd) for "snooze to tomorrow". */
export function tomorrowIso(from: Date = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
