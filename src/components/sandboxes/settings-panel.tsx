'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RegenerateDialog } from '@/components/sandboxes/regenerate-dialog'
import {
  SandboxDetailsFields,
  saveLabel,
  useSandboxDetails,
} from '@/components/sandboxes/sandbox-details-form'
import { Section } from '@/components/sandboxes/section'
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
import { VisionPanel } from '@/components/sandboxes/vision-panel'
import type { SandboxOverview } from '@/types/sandbox'

/**
 * What the sandbox is, as opposed to what is happening inside it: the contract,
 * the vision it serves, and the one destructive-ish button on the page.
 *
 * Everyone can stand here. The vision has no read gate — the backend mails lead
 * coaches a `?comment=…#vision` link and a lead coach cannot edit the sandbox —
 * so gating the tab would turn those notifications into dead links. Each
 * section below gates itself instead.
 */
export function SettingsPanel({ overview }: { overview: SandboxOverview }) {
  const { can } = useSandboxView()

  return (
    <div className="space-y-4" data-testid="settings-panel">
      {can.editSandbox && <DetailsSection overview={overview} />}
      <VisionPanel overview={overview} />
      {can.editTimeline && <TimelineSection overview={overview} />}
    </div>
  )
}

/**
 * Its own component so `useSandboxDetails` — which watches the term and fetches
 * a preview of what regenerating would do — never runs for someone who cannot
 * save anything.
 */
function DetailsSection({ overview }: { overview: SandboxOverview }) {
  const form = useSandboxDetails(overview, true)

  return (
    <Section
      id="settings"
      title="Sandbox details"
      testId="settings-details"
      note="The name people see, and the term everything else is dated from."
      bodyClassName="space-y-4"
      footer={
        <div className="flex justify-end">
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
      }
    >
      <SandboxDetailsFields form={form} idPrefix="settings" />
    </Section>
  )
}

function TimelineSection({ overview }: { overview: SandboxOverview }) {
  const [regenerating, setRegenerating] = useState(false)

  return (
    <Section id="regenerate" title="Timeline" testId="settings-timeline">
      <p className="mb-3 max-w-prose text-sm text-ink-3">
        Rebuild every generated event for the term as it stands. Events you
        added by hand are kept; generated ones are re-dated.
      </p>
      <Button
        variant="outline"
        onClick={() => setRegenerating(true)}
        data-testid="settings-regenerate"
      >
        Regenerate the timeline
      </Button>
      <RegenerateDialog
        open={regenerating}
        onOpenChange={setRegenerating}
        overview={overview}
      />
    </Section>
  )
}
