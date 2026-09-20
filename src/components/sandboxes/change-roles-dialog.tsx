'use client'

import { useEffect, useState } from 'react'
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
import { useUpdateMember } from '@/hooks/mutations/use-sandbox-mutations'
import { OUR_ROLES, THEIR_ROLES, type SandboxMember } from '@/types/sandbox'

export function ChangeRolesDialog({
  member,
  onOpenChange,
  sandboxId,
}: {
  member: SandboxMember | null
  onOpenChange: (open: boolean) => void
  sandboxId: string
}) {
  const update = useUpdateMember(sandboxId)
  const [roles, setRoles] = useState<string[]>([])
  const [name, setName] = useState('')

  useEffect(() => {
    if (member) {
      setRoles(member.roles)
      setName(member.name || '')
    }
  }, [member])

  if (!member) return null

  const options = member.side === 'ours' ? OUR_ROLES : THEIR_ROLES
  // Being on a list holds someone on the sandbox as well as a group does, so
  // either lets them go without a hat.
  const inGroups = member.group_ids.length > 0 || member.roster.length > 0
  const groupHats = Array.from(
    new Set([
      ...member.roster,
      ...member.group_kinds.map(k =>
        k === 'coach' ? 'coach' : k === 'coachee' ? 'coachee' : 'supervisor',
      ),
    ]),
  )
  const canEditName = member.side === 'theirs' && member.is_pending_user
  const canSave = (roles.length > 0 || inGroups) && !update.isPending

  const save = async () => {
    await update.mutateAsync({
      memberId: member.id,
      data: {
        roles,
        ...(canEditName && name.trim() !== (member.name || '')
          ? { name: name.trim() }
          : {}),
      },
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={!!member} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{member.name || member.email}</DialogTitle>
          <DialogDescription>{member.email}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {canEditName && (
            <div className="space-y-2">
              <Label htmlFor="member-name">Name</Label>
              <Input
                id="member-name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <p className="text-xs text-ink-3">Editable until they sign up.</p>
            </div>
          )}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-ink">
              Roles in this sandbox
            </legend>
            {options.map(r => (
              <Label
                key={r.value}
                className="flex cursor-pointer items-center gap-2 font-normal"
              >
                <Checkbox
                  checked={roles.includes(r.value)}
                  onCheckedChange={v =>
                    setRoles(prev =>
                      v === true
                        ? [...prev, r.value]
                        : prev.filter(x => x !== r.value),
                    )
                  }
                  data-testid={`role-${r.value}`}
                />
                {r.label}
              </Label>
            ))}
          </fieldset>
          {inGroups && (
            <p className="text-xs text-ink-3">
              Also {groupHats.join(' and ')}
              {member.group_names.length
                ? ` in ${member.group_names.join(', ')}`
                : ''}{' '}
              — that comes from the lists and groups, not from here.
            </p>
          )}
          {roles.length === 0 && !inGroups && (
            <p className="text-xs text-amber-token">
              Pick at least one role, or remove them from the sandbox.
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
            data-testid="save-roles"
          >
            {update.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
