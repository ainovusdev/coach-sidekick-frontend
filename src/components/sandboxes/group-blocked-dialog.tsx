'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { listNames, pluralise } from '@/lib/sandbox/format'

export interface GroupBlock {
  groupName: string
  sessions: number
  coacheeNames: string[]
}

/**
 * "Removing a group with sessions in it is blocked; empty it first." Shown
 * instead of the remove confirmation when the group has sessions on record.
 */
export function GroupBlockedDialog({
  block,
  onOpenChange,
}: {
  block: GroupBlock | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <AlertDialog open={!!block} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="group-blocked">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {block?.groupName ?? 'This group'} can’t be removed yet
          </AlertDialogTitle>
          <AlertDialogDescription>
            {block &&
              `It has ${pluralise(block.sessions, 'session')} on record${
                block.coacheeNames.length
                  ? ` with ${listNames(block.coacheeNames, 3)}`
                  : ''
              }. Sessions are never deleted, so move or remove its coachees first. Their history stays with their coaches.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            Got it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
