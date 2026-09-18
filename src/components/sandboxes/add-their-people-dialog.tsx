'use client'

import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

interface Row {
  key: number
  email: string
  name: string
  role: TheirRole
  error?: string | null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AddTheirPeopleDialog({
  open,
  onOpenChange,
  sandboxId,
  organisation,
  onEditExisting,
  defaultRole = 'primary_client',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sandboxId: string
  organisation: string
  onEditExisting?: (memberId: string) => void
  defaultRole?: TheirRole
}) {
  const [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState(false)
  const addMember = useAddMember(sandboxId)

  useEffect(() => {
    if (open) {
      setRows([{ key: 1, email: '', name: '', role: defaultRole }])
      setBusy(false)
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
        await addMember.mutateAsync({
          side: 'theirs',
          roles: [row.role],
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add their people</DialogTitle>
          <DialogDescription>
            People at {organisation}. They are not emailed until you send
            invitations.
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 text-ink-2"
            onClick={() =>
              setRows(prev => [
                ...prev,
                {
                  key: (prev[prev.length - 1]?.key ?? 0) + 1,
                  email: '',
                  name: '',
                  role: 'supervisor',
                },
              ])
            }
          >
            <Plus className="h-4 w-4" />
            Add another
          </Button>
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
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
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
          <Label htmlFor={`their-name-${index}`} className="text-xs text-ink-3">
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
        <div className="space-y-1">
          <Label className="text-xs text-ink-3">Role</Label>
          <div className="flex items-center gap-1">
            <Select
              value={row.role}
              onValueChange={v => onChange({ role: v as TheirRole })}
            >
              <SelectTrigger className="w-full sm:w-44" aria-label="Role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THEIR_ROLES.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        </div>
      </div>
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
