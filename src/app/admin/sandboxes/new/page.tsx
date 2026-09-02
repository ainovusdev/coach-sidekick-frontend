'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { ChevronLeft, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DueDateField } from '@/components/ui/due-date-field'
import { useSandboxes, useTermPreview } from '@/hooks/queries/use-sandboxes'
import { useCreateSandbox } from '@/hooks/mutations/use-sandbox-mutations'
import { parseDateOnly, previewSentence, termEnd } from '@/lib/sandbox/term'
import { fmtDay } from '@/lib/sandbox/format'
import { toDateOnly } from '@/lib/sandbox/term'
import { cn } from '@/lib/utils'
import { TERM_MONTHS, type TermMonths } from '@/types/sandbox'

interface FormValues {
  organisation: string
  name: string
  term_start: string
  term_months: TermMonths
  vision: string
  links: { label: string; url: string }[]
}

const SUGGESTED_LINKS = [
  'Proposal',
  'HubSpot',
  'Slack channel',
  'Airtable dashboard',
  'PCO package',
]

export default function NewSandboxPage() {
  const router = useRouter()
  const createSandbox = useCreateSandbox()
  const { data: existing } = useSandboxes({ include_ended: true })
  const [nameTouched, setNameTouched] = useState(false)
  const submittedRef = useRef(false)

  const form = useForm<FormValues>({
    defaultValues: {
      organisation: '',
      name: '',
      term_start: '',
      term_months: 6,
      vision: '',
      links: [],
    },
    mode: 'onTouched',
  })
  const { register, control, handleSubmit, watch, setValue, formState } = form
  const { errors, isDirty } = formState
  const links = useFieldArray({ control, name: 'links' })

  const organisation = watch('organisation')
  const name = watch('name')
  const termStart = watch('term_start')
  const termMonths = watch('term_months')

  // Name follows the organisation until the user edits it.
  useEffect(() => {
    if (!nameTouched) setValue('name', organisation)
  }, [organisation, nameTouched, setValue])

  const startDate = parseDateOnly(termStart)
  const endDate = startDate ? termEnd(startDate, termMonths) : null
  const serverPreview = useTermPreview(termStart || null, termMonths)
  const preview =
    serverPreview.data?.sentence ??
    (startDate ? previewSentence(startDate, termMonths) : null)

  const knownOrganisations = useMemo(
    () =>
      Array.from(
        new Set((existing?.sandboxes ?? []).map(s => s.organisation)),
      ).sort(),
    [existing],
  )
  const duplicateName = useMemo(() => {
    const n = name.trim().toLowerCase()
    if (!n) return null
    return (
      (existing?.sandboxes ?? []).find(
        s => s.name.trim().toLowerCase() === n,
      ) ?? null
    )
  }, [existing, name])

  // Leave guard while the form is dirty.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty && !submittedRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const onSubmit = handleSubmit(async values => {
    const cleanLinks = values.links
      .map(l => ({ label: l.label.trim(), url: l.url.trim() }))
      .filter(l => l.label || l.url)
    const created = await createSandbox.mutateAsync({
      organisation: values.organisation.trim(),
      name: values.name.trim(),
      term_start: values.term_start,
      term_months: values.term_months,
      vision: values.vision.trim() || null,
      links: cleanLinks,
    })
    submittedRef.current = true
    router.push(`/admin/sandboxes/${created.sandbox.id}`)
  })

  const addSuggestedLink = (label: string) => {
    const idx = links.fields.findIndex(f => f.label === label)
    if (idx >= 0) {
      document.getElementById(`link-url-${idx}`)?.focus()
      return
    }
    links.append({ label, url: '' })
    // focus the URL field of the row we just added
    setTimeout(
      () => document.getElementById(`link-url-${links.fields.length}`)?.focus(),
      0,
    )
  }

  return (
    <div className="max-w-2xl" data-testid="new-sandbox-page">
      <Link
        href="/admin/sandboxes"
        className="inline-flex items-center gap-1 text-sm text-ink-3 hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" />
        Sandboxes
      </Link>
      <h1 className="mt-2 text-3xl font-semibold text-ink">New sandbox</h1>
      <p className="mt-1 text-ink-3">
        One client, one contract. Set the term now; people and groups come next.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-8" noValidate>
        {/* Client */}
        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="organisation">Organisation</Label>
              <Input
                id="organisation"
                list="sandbox-organisations"
                placeholder="e.g. PTG"
                autoComplete="off"
                aria-invalid={!!errors.organisation}
                {...register('organisation', {
                  required: 'Which organisation is this for?',
                  validate: v =>
                    v.trim().length > 0 || 'Which organisation is this for?',
                })}
              />
              <datalist id="sandbox-organisations">
                {knownOrganisations.map(o => (
                  <option key={o} value={o} />
                ))}
              </datalist>
              <FieldError message={errors.organisation?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Sandbox name</Label>
              <Input
                id="name"
                placeholder="Defaults to the organisation"
                autoComplete="off"
                aria-invalid={!!errors.name}
                {...register('name', {
                  required: 'Give the sandbox a name',
                  validate: v =>
                    v.trim().length > 0 || 'Give the sandbox a name',
                  onChange: () => setNameTouched(true),
                })}
              />
              <FieldError message={errors.name?.message} />
              {duplicateName && !errors.name && (
                <p className="text-xs text-amber-token">
                  There is already a sandbox called “{duplicateName.name}” (
                  {duplicateName.organisation}). You can still create this one.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Term */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-3">
              Term
            </h2>
            <p className="mt-1 text-sm text-ink-3">
              The timeline is generated from the start date and the length.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="term_start"
              rules={{ required: 'Pick a start date' }}
              render={({ field }) => (
                <div className="space-y-2">
                  <DueDateField
                    id="term_start"
                    label="Start date"
                    value={field.value || null}
                    onChange={v => field.onChange(v ?? '')}
                  />
                  <FieldError message={errors.term_start?.message} />
                </div>
              )}
            />
            <div className="space-y-2">
              <Label>Length</Label>
              <Controller
                control={control}
                name="term_months"
                render={({ field }) => (
                  <div
                    role="radiogroup"
                    aria-label="Term length"
                    className="inline-flex w-full rounded-lg border border-line bg-surface-2 p-1"
                  >
                    {TERM_MONTHS.map(m => (
                      <button
                        key={m}
                        type="button"
                        role="radio"
                        aria-checked={field.value === m}
                        data-testid={`term-${m}`}
                        onClick={() => field.onChange(m)}
                        className={cn(
                          'flex-1 rounded-md px-2 py-1.5 text-sm transition-colors',
                          field.value === m
                            ? 'bg-paper text-ink shadow-sm font-medium'
                            : 'text-ink-3 hover:text-ink',
                        )}
                      >
                        {m} mo
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>
          </div>
          <div
            className="rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm"
            data-testid="term-preview"
          >
            {startDate && endDate ? (
              <>
                <p className="text-ink">
                  <span className="font-medium">
                    {fmtDay(toDateOnly(startDate), true)}
                  </span>
                  {' to '}
                  <span className="font-medium">
                    {fmtDay(toDateOnly(endDate), true)}
                  </span>
                  <span className="text-ink-3"> · {termMonths} months</span>
                </p>
                <p className="mt-1 text-ink-3">{preview}</p>
              </>
            ) : (
              <p className="text-ink-3">
                Pick a start date to see the end date and the timeline.
              </p>
            )}
          </div>
        </section>

        {/* Vision */}
        <section className="space-y-2">
          <div>
            <Label htmlFor="vision">Vision</Label>
            <p className="mt-1 text-sm text-ink-3">
              What the client wants to be true by the end of the term. Optional
              now; you can write it on the overview.
            </p>
          </div>
          <Textarea
            id="vision"
            rows={4}
            placeholder="By the end of the term…"
            {...register('vision')}
          />
        </section>

        {/* Links */}
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-3">
              Links
            </h2>
            <p className="mt-1 text-sm text-ink-3">
              Where the contract lives elsewhere. Optional.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_LINKS.map(label => {
              const present = links.fields.some(f => f.label === label)
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => addSuggestedLink(label)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    present
                      ? 'border-line bg-surface-3 text-ink-3'
                      : 'border-dashed border-ink-4 text-ink-2 hover:border-ink hover:text-ink',
                  )}
                >
                  {present ? '✓ ' : '+ '}
                  {label}
                </button>
              )
            })}
          </div>
          {links.fields.length > 0 && (
            <div className="space-y-2">
              {links.fields.map((f, i) => (
                <div key={f.id} className="flex items-start gap-2">
                  <Input
                    aria-label="Link label"
                    placeholder="Label"
                    className="w-40 shrink-0"
                    {...register(`links.${i}.label` as const, {
                      validate: (v, all) =>
                        !all.links[i]?.url?.trim() ||
                        v.trim().length > 0 ||
                        'Add a label',
                    })}
                  />
                  <div className="flex-1">
                    <Input
                      id={`link-url-${i}`}
                      aria-label="Link URL"
                      placeholder="https://…"
                      inputMode="url"
                      {...register(`links.${i}.url` as const, {
                        validate: (v, all) =>
                          !all.links[i]?.label?.trim() ||
                          v.trim().length > 0 ||
                          'Add the URL',
                      })}
                    />
                    <FieldError
                      message={
                        errors.links?.[i]?.label?.message ||
                        errors.links?.[i]?.url?.message
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove link"
                    onClick={() => links.remove(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-ink-2"
            onClick={() => links.append({ label: '', url: '' })}
          >
            <Plus className="h-4 w-4" />
            Add another
          </Button>
        </section>

        <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-ink-3 sm:flex-1">
            No one is emailed yet. Invitations are sent later from the overview.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/sandboxes')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-ink text-ink-on-dark hover:bg-ink/90"
              disabled={createSandbox.isPending}
              data-testid="create-sandbox"
            >
              {createSandbox.isPending ? 'Creating…' : 'Create sandbox'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-vermillion">{message}</p>
}
