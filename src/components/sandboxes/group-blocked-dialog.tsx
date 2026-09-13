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
 * A group with recorded delivery is retained, including former participants.
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
            {block?.groupName ?? 'This group'} can’t be removed
          </AlertDialogTitle>
          <AlertDialogDescription>
            {block &&
              `It has ${pluralise(block.sessions, 'session')} on record${
                block.coacheeNames.length
                  ? ` with ${listNames(block.coacheeNames, 3)}`
                  : ''
              }. The group keeps its delivery history, including sessions for people who have moved to another group or left the sandbox.`}
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
