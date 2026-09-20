'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  sandboxErrorDetail,
  useSetMemberRoster,
} from '@/hooks/mutations/use-sandbox-mutations'
import type { RosterKind, SandboxMember } from '@/types/sandbox'

/**
 * Take someone off the coaches (or coachees) list without taking them off the
 * sandbox. Their pairings and groups of that kind go with it; anything else
 * that holds them here — a hat, the other list — is untouched.
 */
export function RemoveFromListDialog({
  target,
  onOpenChange,
  sandboxId,
}: {
  target: { member: SandboxMember; kind: RosterKind } | null
  onOpenChange: (open: boolean) => void
  sandboxId: string
}) {
  const setRoster = useSetMemberRoster(sandboxId)
  const [warning, setWarning] = useState<string | null>(null)

  useEffect(() => setWarning(null), [target])

  if (!target) return null
  const { member, kind } = target
  const who = member.name || member.email
  const list = kind === 'coach' ? 'coaches' : 'coachees'
  const rest = member.roster.filter(k => k !== kind)
  const staysOn = member.roles.length > 0 || rest.length > 0
  const held = member.memberships.filter(m => m.kind === kind)
  const heldNames = Array.from(new Set(held.map(m => m.group_name)))

  const attempt = async (force: boolean) => {
    try {
      await setRoster.mutateAsync({
        memberId: member.id,
        data: { roster: rest, force },
      })
      onOpenChange(false)
    } catch (error) {
      const detail = sandboxErrorDetail(error)
      if (detail?.code === 'has_sessions') setWarning(detail.message)
      else onOpenChange(false)
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="remove-from-list">
        <DialogHeader>
          <DialogTitle>
            Remove {who} from {list}?
          </DialogTitle>
          <DialogDescription>
            {heldNames.length > 0
              ? `They come out of ${heldNames.join(', ')} too. `
              : ''}
            {staysOn
              ? `They stay on the sandbox${
                  member.role_labels.length
                    ? ` as ${member.role_labels.join(', ').toLowerCase()}`
                    : ''
                }.`
              : 'Nothing else holds them here, so they leave the sandbox.'}{' '}
            Sessions and client records are kept.
          </DialogDescription>
        </DialogHeader>
        {warning && (
          <p className="text-sm text-amber-token" data-testid="list-warning">
            {warning}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep them
          </Button>
          <Button
            variant="destructive"
            disabled={setRoster.isPending}
            onClick={() => attempt(!!warning)}
            data-testid={warning ? 'remove-list-anyway' : 'remove-list-confirm'}
          >
            {setRoster.isPending
              ? 'Removing…'
              : warning
                ? 'Remove anyway'
                : `Remove from ${list}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
