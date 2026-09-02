'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DueDateField } from '@/components/ui/due-date-field'
import { useUpdateSandbox } from '@/hooks/mutations/use-sandbox-mutations'
import {
  fmtDay,
  listNames,
  STATUS_CLASS,
  STATUS_LABEL,
} from '@/lib/sandbox/format'
import {
  monthOfTerm,
  parseDateOnly,
  previewSentence,
  startsInText,
  termEnd,
  termProgress,
  toDateOnly,
} from '@/lib/sandbox/term'
import { cn } from '@/lib/utils'
import {
  TERM_MONTHS,
  type SandboxOverview,
  type TermMonths,
} from '@/types/sandbox'

export function IdentityCard({ overview }: { overview: SandboxOverview }) {
  const { sandbox, members, today } = overview
  const [editing, setEditing] = useState(false)

  const start = parseDateOnly(sandbox.term_start)!
  const end = parseDateOnly(sandbox.term_end)!
  const now = parseDateOnly(today)!
  const progress =
    sandbox.status === 'active'
      ? termProgress(start, end, now)
      : sandbox.status === 'ended'
        ? 1
        : 0

  const caption =
    sandbox.status === 'upcoming'
      ? startsInText(start, now)
      : sandbox.status === 'active'
        ? `Month ${monthOfTerm(start, now)} of ${sandbox.term_months} · today ${fmtDay(today)}`
        : `Ended ${fmtDay(sandbox.term_end, true)}`

  const owners = members
    .filter(m => m.roles.includes('sandbox_owner'))
    .map(m => m.name || m.email)
  const aes = members
    .filter(m => m.roles.includes('account_executive'))
    .map(m => m.name || m.email)

  return (
    <div
      className="rounded-xl border border-line bg-paper p-5"
      data-testid="identity-card"
    >
      <nav className="text-xs text-ink-3">
        <Link href="/admin/sandboxes" className="hover:text-ink">
          Sandboxes
        </Link>
        <span className="mx-1">/</span>
        <span className="text-ink-2">{sandbox.name}</span>
      </nav>
      <div className="mt-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold leading-tight text-ink break-words">
            {sandbox.name}
          </h1>
          <p className="text-sm text-ink-3">{sandbox.organisation}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-ink-3"
          aria-label="Edit sandbox details"
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            STATUS_CLASS[sandbox.status],
          )}
          data-testid="status-pill"
        >
          {STATUS_LABEL[sandbox.status]}
        </span>
        <span className="text-xs text-ink-3">{caption}</span>
      </div>

      <div className="mt-4">
        <div className="relative h-1.5 rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-ink transition-[width]"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
          {sandbox.status === 'active' && (
            <span
              className="absolute -top-[3px] h-3 w-0.5 rounded bg-vermillion"
              style={{ left: `calc(${(progress * 100).toFixed(1)}% - 1px)` }}
              aria-hidden
            />
          )}
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[11px] text-ink-3">
          <span>{fmtDay(sandbox.term_start)}</span>
          <span>{sandbox.term_months} months</span>
          <span>{fmtDay(sandbox.term_end)}</span>
        </div>
      </div>

      <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-3">Owner</dt>
          <dd className="text-right text-ink-2">
            {owners.length ? (
              listNames(owners, 2)
            ) : (
              <span className="text-ink-4">Not set</span>
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-3">Account executive</dt>
          <dd className="text-right text-ink-2">{listNames(aes, 2) || '—'}</dd>
        </div>
      </dl>

      <EditSandboxDialog
        open={editing}
        onOpenChange={setEditing}
        overview={overview}
      />
    </div>
  )
}

function EditSandboxDialog({
  open,
  onOpenChange,
  overview,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  overview: SandboxOverview
}) {
  const { sandbox } = overview
  const update = useUpdateSandbox(sandbox.id)
  const [name, setName] = useState(sandbox.name)
  const [organisation, setOrganisation] = useState(sandbox.organisation)
  const [termStart, setTermStart] = useState<string>(sandbox.term_start)
  const [termMonths, setTermMonths] = useState<TermMonths>(sandbox.term_months)

  useEffect(() => {
    if (open) {
      setName(sandbox.name)
      setOrganisation(sandbox.organisation)
      setTermStart(sandbox.term_start)
      setTermMonths(sandbox.term_months)
    }
  }, [open, sandbox])

  const termChanged =
    termStart !== sandbox.term_start || termMonths !== sandbox.term_months
  const start = parseDateOnly(termStart)
  const end = start ? termEnd(start, termMonths) : null
  const canSave =
    name.trim() && organisation.trim() && !!start && !update.isPending

  const save = async () => {
    await update.mutateAsync({
      name: name.trim(),
      organisation: organisation.trim(),
      term_start: termStart,
      term_months: termMonths,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sandbox details</DialogTitle>
          <DialogDescription>
            Name, organisation and the term.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-organisation">Organisation</Label>
              <Input
                id="edit-organisation"
                value={organisation}
                onChange={e => setOrganisation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <DueDateField
              id="edit-term-start"
              label="Start date"
              value={termStart}
              onChange={v => setTermStart(v ?? '')}
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
                    aria-checked={termMonths === m}
                    onClick={() => setTermMonths(m)}
                    className={cn(
                      'flex-1 rounded-md px-1 py-1 text-xs transition-colors',
                      termMonths === m
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
              {fmtDay(toDateOnly(start), true)} to{' '}
              {fmtDay(toDateOnly(end), true)}.{' '}
              {previewSentence(start, termMonths)}
            </p>
          )}
          {termChanged && (
            <p className="rounded-md bg-amber-token-bg px-3 py-2 text-xs text-amber-token">
              Changing the term regenerates the timeline. Group start dates that
              used the old term start move with it.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-ink text-ink-on-dark hover:bg-ink/90"
            disabled={!canSave}
            onClick={save}
          >
            {update.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
