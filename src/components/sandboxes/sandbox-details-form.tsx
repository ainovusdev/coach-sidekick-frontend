'use client'

import { useEffect, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DueDateField } from '@/components/ui/due-date-field'
import { RegeneratePreviewList } from '@/components/sandboxes/regenerate-dialog'
import { useUpdateSandbox } from '@/hooks/mutations/use-sandbox-mutations'
import { useRegeneratePreview } from '@/hooks/queries/use-sandboxes'
import { fmtDay, pluralise } from '@/lib/sandbox/format'
import {
  parseDateOnly,
  previewSentence,
  termEnd,
  toDateOnly,
} from '@/lib/sandbox/term'
import { cn } from '@/lib/utils'
import {
  TERM_MONTHS,
  type SandboxOverview,
  type TermMonths,
} from '@/types/sandbox'

/**
 * Name, organisation and the term — the sandbox's own details.
 *
 * Written once and worn twice: the pencil in the header opens it as a dialog,
 * the Settings tab shows the same fields inline. `active` is what the form is
 * mounted for — it reseeds from the sandbox when it becomes true, and gates the
 * regeneration preview so a closed dialog fetches nothing.
 */
export function useSandboxDetails(overview: SandboxOverview, active: boolean) {
  const { sandbox } = overview
  const update = useUpdateSandbox(sandbox.id)
  const [name, setName] = useState(sandbox.name)
  const [organisation, setOrganisation] = useState(sandbox.organisation)
  const [termStart, setTermStart] = useState<string>(sandbox.term_start)
  const [termMonths, setTermMonths] = useState<TermMonths>(sandbox.term_months)
  const [overwrite, setOverwrite] = useState(false)

  useEffect(() => {
    if (!active) return
    setName(sandbox.name)
    setOrganisation(sandbox.organisation)
    setTermStart(sandbox.term_start)
    setTermMonths(sandbox.term_months)
    setOverwrite(false)
  }, [active, sandbox])

  const termChanged =
    termStart !== sandbox.term_start || termMonths !== sandbox.term_months
  const start = parseDateOnly(termStart)
  const end = start ? termEnd(start, termMonths) : null

  // What the term change would do to the timeline, event by event.
  const preview = useRegeneratePreview(
    sandbox.id,
    termStart,
    termMonths,
    overwrite,
    active && termChanged && !!start,
  )
  const handCount = preview.data?.hand_adjusted_count ?? 0

  const dirty =
    termChanged ||
    name.trim() !== sandbox.name ||
    organisation.trim() !== sandbox.organisation
  const canSave =
    !!name.trim() && !!organisation.trim() && !!start && !update.isPending

  const save = () =>
    update.mutateAsync({
      name: name.trim(),
      organisation: organisation.trim(),
      term_start: termStart,
      term_months: termMonths,
      ...(termChanged ? { overwrite_hand_adjusted: overwrite } : {}),
    })

  return {
    name,
    setName,
    organisation,
    setOrganisation,
    termStart,
    setTermStart,
    termMonths,
    setTermMonths,
    overwrite,
    setOverwrite,
    termChanged,
    start,
    end,
    handCount,
    preview,
    dirty,
    canSave,
    saving: update.isPending,
    save,
  }
}

export type SandboxDetails = ReturnType<typeof useSandboxDetails>

export function SandboxDetailsFields({
  form,
  idPrefix = 'edit',
}: {
  form: SandboxDetails
  idPrefix?: string
}) {
  const { start, end, termChanged, handCount } = form
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-organisation`}>Organisation</Label>
          <Input
            id={`${idPrefix}-organisation`}
            value={form.organisation}
            onChange={e => form.setOrganisation(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-name`}>Name</Label>
          <Input
            id={`${idPrefix}-name`}
            value={form.name}
            onChange={e => form.setName(e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <DueDateField
          id={`${idPrefix}-term-start`}
          label="Start date"
          value={form.termStart}
          onChange={v => form.setTermStart(v ?? '')}
          required
        />
        <div className="space-y-2">
          <Label>Length</Label>
          <div
            role="radiogroup"
            className="inline-flex w-full rounded-lg border border-line bg-surface-2 p-1"
          >
            {TERM_MONTHS.map(m => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={form.termMonths === m}
                onClick={() => form.setTermMonths(m)}
                className={cn(
                  'flex-1 rounded-md px-1 py-1 text-xs transition-colors',
                  form.termMonths === m
                    ? 'bg-paper text-ink shadow-sm font-medium'
                    : 'text-ink-3 hover:text-ink',
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
      {start && end && (
        <p className="text-sm text-ink-3">
          {fmtDay(toDateOnly(start), true)} to {fmtDay(toDateOnly(end), true)}.{' '}
          {previewSentence(start, form.termMonths)}
        </p>
      )}
      {termChanged && start && (
        <div className="space-y-3 border-t border-line pt-4">
          <div>
            <p className="text-sm font-medium text-ink">
              What happens to the timeline
            </p>
            <p className="text-xs text-ink-3">
              Group start dates that used the old term start move with it.
            </p>
          </div>
          <RegeneratePreviewList
            preview={form.preview.data}
            isLoading={form.preview.isLoading}
          />
          {handCount > 0 && (
            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <Checkbox
                checked={form.overwrite}
                onCheckedChange={v => form.setOverwrite(v === true)}
                className="mt-0.5"
                data-testid="regen-overwrite"
              />
              <span className="text-ink-2">
                Reset the {pluralise(handCount, 'hand adjustment')} too
                <span className="block text-xs text-ink-3">
                  Otherwise moved windows, removed events and events added by
                  hand stay as they are.
                </span>
              </span>
            </label>
          )}
        </div>
      )}
    </div>
  )
}

export function saveLabel(form: SandboxDetails): string {
  if (form.saving) return 'Saving…'
  return form.termChanged ? 'Save and regenerate' : 'Save'
}
