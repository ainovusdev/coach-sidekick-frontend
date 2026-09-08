'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RegenerateDialog } from '@/components/sandboxes/regenerate-dialog'
import {
  SandboxDetailsFields,
  saveLabel,
  useSandboxDetails,
} from '@/components/sandboxes/sandbox-details-form'
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
import type { SandboxOverview } from '@/types/sandbox'

/**
 * What you change about the sandbox itself.
 *
 * The other tabs are the work; this is the contract behind it. Nothing here is
 * new — the same form the pencil in the header opens, and the same regeneration
 * the timeline offers, in the one place you would go looking for them.
 */
export function SettingsPanel({ overview }: { overview: SandboxOverview }) {
  const { can } = useSandboxView()
  const form = useSandboxDetails(overview, true)
  const [regenerating, setRegenerating] = useState(false)

  return (
    <div className="space-y-6" data-testid="settings-panel">
      <section
        id="settings"
        className="scroll-mt-20 rounded-xl border border-line bg-paper"
      >
        <header className="border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Sandbox details</h2>
          <p className="text-xs text-ink-3">
            The name people see, and the term everything else is dated from.
          </p>
        </header>
        <div className="space-y-4 px-5 py-4">
          <SandboxDetailsFields form={form} idPrefix="settings" />
          <div className="flex justify-end border-t border-line pt-4">
            <Button
              className="bg-ink text-ink-on-dark hover:bg-ink/90"
              disabled={
                !form.canSave ||
                !form.dirty ||
                (form.termChanged && form.preview.isLoading)
              }
              onClick={() => form.save()}
              data-testid="settings-save"
            >
              {saveLabel(form)}
            </Button>
          </div>
        </div>
      </section>

      {can.editTimeline && (
        <section className="rounded-xl border border-line bg-paper">
          <header className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">Timeline</h2>
            <p className="text-xs text-ink-3">
              Regenerate the events for the term as it stands — the way back
              after hand adjustments.
            </p>
          </header>
          <div className="px-5 py-4">
            <Button
              variant="outline"
              onClick={() => setRegenerating(true)}
              data-testid="settings-regenerate"
            >
              Regenerate the timeline
            </Button>
          </div>
          <RegenerateDialog
            open={regenerating}
            onOpenChange={setRegenerating}
            overview={overview}
          />
        </section>
      )}
    </div>
  )
}
