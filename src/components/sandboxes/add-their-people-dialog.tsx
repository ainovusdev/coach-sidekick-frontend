'use client'

import { useEffect, useState } from 'react'
import { ClipboardList, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { useEmailLookup } from '@/hooks/queries/use-sandboxes'
import {
  sandboxErrorDetail,
  useAddMember,
} from '@/hooks/mutations/use-sandbox-mutations'
import {
  THEIR_ROLES,
  type SandboxMember,
  type TheirRole,
} from '@/types/sandbox'

/** A hat, or simply someone who is coached. */
type RowRole = TheirRole | 'coachee'

interface Row {
  key: number
  email: string
  name: string
  role: RowRole
  /** Holds a hat and is coached as well. */
  alsoCoachee: boolean
  error?: string | null
}

const ROW_ROLES: { value: RowRole; label: string }[] = [
  { value: 'coachee', label: 'Coachee' },
  ...THEIR_ROLES,
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ANY_EMAIL_RE = /[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+/

/**
 * A pasted list, one person per line: `Name, email`, `Name <email>`, `email`
 * — whatever a spreadsheet column or an email's To line gives you.
 */
export function parsePeople(text: string): { email: string; name: string }[] {
  const seen = new Set<string>()
  const out: { email: string; name: string }[] = []
  for (const line of text.split(/\r?\n|;/)) {
    const email = line.match(ANY_EMAIL_RE)?.[0]?.toLowerCase()
    if (!email || seen.has(email)) continue
    seen.add(email)
    const name = line
      .replace(ANY_EMAIL_RE, '')
      .replace(/[<>,"\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    out.push({ email, name })
  }
  return out
}

export function AddTheirPeopleDialog({
  open,
  onOpenChange,
  sandboxId,
  organisation,
  onEditExisting,
  defaultRole = 'coachee',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sandboxId: string
  organisation: string
  onEditExisting?: (memberId: string) => void
  defaultRole?: RowRole
}) {
  const [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState(false)
  const [pasting, setPasting] = useState(false)
  const [pasted, setPasted] = useState('')
  const addMember = useAddMember(sandboxId)

  useEffect(() => {
    if (open) {
      setRows([
        { key: 1, email: '', name: '', role: defaultRole, alsoCoachee: false },
      ])
      setBusy(false)
      setPasting(false)
      setPasted('')
    }
  }, [open, defaultRole])

  const update = (key: number, patch: Partial<Row>) =>
    setRows(prev =>
      prev.map(r => (r.key === key ? { ...r, ...patch, error: null } : r)),
    )

  const filled = rows.filter(r => r.email.trim())
  const allValid =
    filled.length > 0 && filled.every(r => EMAIL_RE.test(r.email.trim()))

  const submit = async () => {
    if (!allValid) return
    setBusy(true)
    let failures = 0
    for (const row of filled) {
      try {
        const coached = row.role === 'coachee' || row.alsoCoachee
        await addMember.mutateAsync({
          side: 'theirs',
          roles: row.role === 'coachee' ? [] : [row.role],
          ...(coached ? { roster: ['coachee' as const] } : {}),
          email: row.email.trim().toLowerCase(),
          name: row.name.trim() || null,
        })
        setRows(prev => prev.filter(r => r.key !== row.key))
      } catch (error) {
        failures += 1
        const detail = sandboxErrorDetail(error)
        update(row.key, {
          error:
            detail?.code === 'already_member'
              ? 'Already on this sandbox — edit the existing person instead.'
              : detail?.message || 'Could not add this person.',
        })
        if (detail?.code === 'already_member' && detail.member_id) {
          setRows(prev =>
            prev.map(r =>
              r.key === row.key ? { ...r, error: r.error, name: r.name } : r,
            ),
          )
        }
      }
    }
    setBusy(false)
    if (failures === 0) onOpenChange(false)
  }

  const found = parsePeople(pasted)
  const usePasted = () => {
    setRows(prev => {
      const have = new Set(prev.map(r => r.email.trim().toLowerCase()))
      let key = (prev[prev.length - 1]?.key ?? 0) + 1
      const fresh = found
        .filter(p => !have.has(p.email))
        .map(p => ({
          key: key++,
          email: p.email,
          name: p.name,
          role: 'coachee' as RowRole,
          alsoCoachee: false,
        }))
      return [...prev.filter(r => r.email.trim()), ...fresh]
    })
    setPasted('')
    setPasting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add their people</DialogTitle>
          <DialogDescription>
            People at {organisation} — and anyone of ours who is being coached
            here, by their email. Nobody is emailed until you send invitations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {rows.map((row, i) => (
            <TheirPersonRow
              key={row.key}
              row={row}
              index={i}
              sandboxId={sandboxId}
              canRemove={rows.length > 1}
              onChange={patch => update(row.key, patch)}
              onRemove={() =>
                setRows(prev => prev.filter(r => r.key !== row.key))
              }
              onEditExisting={onEditExisting}
            />
          ))}
          <div className="-ml-2 flex flex-wrap items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-ink-2"
              onClick={() =>
                setRows(prev => [
                  ...prev,
                  {
                    key: (prev[prev.length - 1]?.key ?? 0) + 1,
                    email: '',
                    name: '',
                    role: prev[prev.length - 1]?.role ?? 'coachee',
                    alsoCoachee: false,
                  },
                ])
              }
            >
              <Plus className="h-4 w-4" />
              Add another
            </Button>
            {!pasting && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-ink-2"
                onClick={() => setPasting(true)}
                data-testid="paste-people-open"
              >
                <ClipboardList className="h-4 w-4" />
                Paste a list of coachees
              </Button>
            )}
          </div>
          {pasting ? (
            <div className="space-y-2 rounded-lg border border-dashed border-ink-4 p-3">
              <Label htmlFor="paste-people" className="text-xs text-ink-3">
                One person per line — “Name, email” or just the email
              </Label>
              <Textarea
                id="paste-people"
                value={pasted}
                onChange={e => setPasted(e.target.value)}
                rows={5}
                placeholder={
                  'Nadia Farouk, nadia@company.com\ntariq@company.com'
                }
                data-testid="paste-people"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={found.length === 0}
                  onClick={usePasted}
                  data-testid="paste-people-use"
                >
                  {found.length === 0
                    ? 'Add as coachees'
                    : `Add ${found.length} as coachees`}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setPasting(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-ink text-ink-on-dark hover:bg-ink/90"
            disabled={!allValid || busy}
            onClick={submit}
            data-testid="add-their-people"
          >
            {busy
              ? 'Adding…'
              : filled.length > 1
                ? `Add ${filled.length} people`
                : 'Add to team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TheirPersonRow({
  row,
  index,
  sandboxId,
  canRemove,
  onChange,
  onRemove,
  onEditExisting,
}: {
  row: Row
  index: number
  sandboxId: string
  canRemove: boolean
  onChange: (patch: Partial<Row>) => void
  onRemove: () => void
  onEditExisting?: (memberId: string) => void
}) {
  const lookup = useEmailLookup(sandboxId, row.email)
  const info = lookup.data
  const nameLocked = !!info?.exists && !!info.name

  useEffect(() => {
    if (info?.exists && info.name && !row.name) onChange({ name: info.name })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info?.exists, info?.name])

  return (
    <div
      className="rounded-lg border border-line p-3"
      data-testid="their-person-row"
    >
      <div className="flex items-end gap-2">
        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[3fr_2fr]">
          <div className="space-y-1">
            <Label
              htmlFor={`their-email-${index}`}
              className="text-xs text-ink-3"
            >
              Email
            </Label>
            <Input
              id={`their-email-${index}`}
              type="email"
              value={row.email}
              onChange={e => onChange({ email: e.target.value })}
              placeholder="name@company.com"
              autoFocus={index === 0}
              aria-invalid={!!row.error}
            />
          </div>
          <div className="space-y-1">
            <Label
              htmlFor={`their-name-${index}`}
              className="text-xs text-ink-3"
            >
              Name
            </Label>
            <Input
              id={`their-name-${index}`}
              value={row.name}
              onChange={e => onChange({ name: e.target.value })}
              placeholder="Full name"
              readOnly={nameLocked}
              className={nameLocked ? 'bg-surface-2 text-ink-2' : undefined}
            />
          </div>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            aria-label="Remove row"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="mt-3 space-y-1.5">
        <Label id={`their-role-${index}`} className="text-xs text-ink-3">
          Role
        </Label>
        <RadioGroup
          value={row.role}
          onValueChange={v => onChange({ role: v as RowRole })}
          aria-labelledby={`their-role-${index}`}
          className="flex flex-wrap gap-x-4 gap-y-2"
        >
          {ROW_ROLES.map(r => (
            <Label
              key={r.value}
              className="flex cursor-pointer items-center gap-2 text-sm font-normal text-ink"
            >
              <RadioGroupItem
                value={r.value}
                data-testid={`their-role-${r.value}`}
              />
              {r.label}
            </Label>
          ))}
        </RadioGroup>
      </div>
      {row.role !== 'coachee' && (
        <Label className="mt-2 flex cursor-pointer items-center gap-2 text-xs font-normal text-ink-2">
          <Checkbox
            checked={row.alsoCoachee}
            onCheckedChange={v => onChange({ alsoCoachee: v === true })}
            data-testid="also-coachee"
          />
          Is coached here too
        </Label>
      )}
      {row.error ? (
        <p className="mt-2 text-xs text-amber-token">
          {row.error}
          {onEditExisting && info?.already_member && info.member_id && (
            <button
              type="button"
              className="ml-1 underline"
              onClick={() => onEditExisting(info.member_id!)}
            >
              Edit the existing person
            </button>
          )}
        </p>
      ) : info?.already_member ? (
        <p className="mt-2 text-xs text-amber-token">
          Already on this sandbox
          {info.member_roles.length
            ? ` as ${info.member_roles.join(', ')}`
            : ''}
          .{' '}
          {onEditExisting && info.member_id && (
            <button
              type="button"
              className="underline"
              onClick={() => onEditExisting(info.member_id!)}
            >
              Edit the existing person
            </button>
          )}
        </p>
      ) : info?.exists ? (
        <p className="mt-2 text-xs text-forest">
          {info.kind === 'active_user'
            ? 'Already in Coach Sidekick — their account will be connected when they accept.'
            : 'Already known to Coach Sidekick, will be linked.'}
        </p>
      ) : null}
    </div>
  )
}

export type { SandboxMember }
