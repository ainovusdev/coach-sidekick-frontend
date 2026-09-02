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
  useRemoveMember,
} from '@/hooks/mutations/use-sandbox-mutations'
import type { SandboxMember } from '@/types/sandbox'

export function RemoveMemberDialog({
  member,
  onOpenChange,
  sandboxId,
}: {
  member: SandboxMember | null
  onOpenChange: (open: boolean) => void
  sandboxId: string
}) {
  const remove = useRemoveMember(sandboxId)
  const [groupNames, setGroupNames] = useState<string[] | null>(null)
  const [blocked, setBlocked] = useState<string | null>(null)

  useEffect(() => {
    setGroupNames(null)
    setBlocked(null)
  }, [member])

  if (!member) return null
  const who = member.name || member.email

  const attempt = async (force: boolean) => {
    try {
      await remove.mutateAsync({ memberId: member.id, force })
      onOpenChange(false)
    } catch (error) {
      const detail = sandboxErrorDetail(error)
      if (detail?.code === 'member_in_groups') {
        setGroupNames(detail.group_names ?? [])
      } else if (detail?.code === 'last_account_executive') {
        setBlocked(detail.message)
      } else {
        onOpenChange(false)
      }
    }
  }

  return (
    <Dialog open={!!member} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove {who}?</DialogTitle>
          <DialogDescription>
            {groupNames
              ? `${who} is in ${groupNames.join(', ')}. Removing them from the sandbox takes them out of ${
                  groupNames.length === 1 ? 'that group' : 'those groups'
                } too. Client records their coaches already have are kept.`
              : member.side === 'theirs'
                ? `They lose access to this sandbox. Any live invitation is voided. Nothing else is deleted.`
                : `They lose their roles on this sandbox. Nothing else is deleted.`}
          </DialogDescription>
        </DialogHeader>
        {blocked && <p className="text-sm text-amber-token">{blocked}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {blocked ? 'Close' : 'Keep them'}
          </Button>
          {!blocked && (
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => attempt(!!groupNames)}
              data-testid={groupNames ? 'remove-anyway' : 'remove-confirm'}
            >
              {remove.isPending
                ? 'Removing…'
                : groupNames
                  ? 'Remove anyway'
                  : 'Remove'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
