'use client'

import { LearningPanel } from '@/components/sandboxes/insights/learning-panel'
import type { SandboxReporting } from '@/hooks/queries/use-sandbox-insights'

/**
 * What the coaching is producing, in themes rather than in people.
 *
 * The panel is the one the cockpit uses, so every state it can be in — never
 * generated, queued, generating, not enough evidence, stale, failed,
 * withdrawn — is already written. A finding needs at least three coachees
 * behind it and never carries a name, which is what makes it safe to show a
 * sponsor at all; the note below says so in the open.
 */
export function LearningHighlights({
  reporting,
  allowGenerate,
  onNavigate,
}: {
  reporting: SandboxReporting
  allowGenerate: boolean
  onNavigate: (anchor: string) => void
}) {
  return (
    <div id="learning" className="scroll-mt-28 space-y-2">
      <LearningPanel
        reporting={reporting}
        allowGenerate={allowGenerate}
        onNavigate={onNavigate}
      />
      <p className="max-w-prose px-1 text-xs text-ink-3">
        Themes are drawn from session notes across the programme. A theme
        appears only when at least three coachees share it, and no finding names
        anyone.
      </p>
    </div>
  )
}
