'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRemoveMembers } from '@/hooks/mutations/use-sandbox-mutations'
import { pluralise } from '@/lib/sandbox/format'
import type { SandboxMember, SandboxOverview } from '@/types/sandbox'

/** "Lead coach · coaches Group 1, Group 2" — everything that goes with them. */
function whatGoes(m: SandboxMember): string {
  const parts: string[] = []
  if (m.role_labels.length) {
    parts.push(
      m.role_labels.filter(l => l !== 'Coach' && l !== 'Coachee').join(', '),
    )
  }
  const byKind: Record<string, string[]> = {}
  for (const g of m.memberships) {
    ;(byKind[g.kind] ??= []).push(g.group_name)
  }
  if (byKind.coach) parts.push(`coaches ${byKind.coach.join(', ')}`)
  if (byKind.coachee) parts.push(`coachee in ${byKind.coachee.join(', ')}`)
  if (byKind.supervisor)
    parts.push(`supervises ${byKind.supervisor.join(', ')}`)
  if (m.side === 'theirs' && m.invitation_status === 'sent')
    parts.push('a live invitation')
  return parts.filter(Boolean).join(' · ') || 'nothing else'
}

export function BulkRemoveDialog({
  open,
  onOpenChange,
  overview,
  members,
  onRemoved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  overview: SandboxOverview
  members: SandboxMember[]
  onRemoved: () => void
}) {
  const remove = useRemoveMembers(overview.sandbox.id)
  const selectedIds = new Set(members.map(m => m.id))
  const remainingAEs = overview.members.filter(
    m => !selectedIds.has(m.id) && m.roles.includes('account_executive'),
  )
  const takesLastAE =
    remainingAEs.length === 0 &&
    members.some(m => m.roles.includes('account_executive'))

  const confirm = async () => {
    await remove.mutateAsync(members.map(m => m.id))
    onRemoved()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md"
        data-testid="bulk-remove-dialog"
      >
        <DialogHeader>
          <DialogTitle>
            Remove {pluralise(members.length, 'person', 'people')} from the
            sandbox?
          </DialogTitle>
          <DialogDescription>
            Their roles and group memberships go in one step. Client records
            their coaches already have are kept, and any live invitation is
            voided.
          </DialogDescription>
        </DialogHeader>
        <ul className="max-h-72 divide-y divide-line overflow-y-auto rounded-lg border border-line">
          {members.map(m => (
            <li key={m.id} className="px-3 py-2" data-testid="bulk-remove-row">
              <p className="text-sm font-medium text-ink">
                {m.name || m.email}
              </p>
              <p className="text-xs text-ink-3">Goes: {whatGoes(m)}</p>
            </li>
          ))}
        </ul>
        {takesLastAE && (
          <p
            className="text-sm text-amber-token"
            data-testid="bulk-remove-blocked"
          >
            A sandbox always has an account executive. Give the role to someone
            else first.
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep them
          </Button>
          <Button
            variant="destructive"
            disabled={takesLastAE || remove.isPending || members.length === 0}
            onClick={confirm}
            data-testid="bulk-remove-confirm"
          >
            {remove.isPending
              ? 'Removing…'
              : `Remove ${members.length === 1 ? '' : members.length}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
