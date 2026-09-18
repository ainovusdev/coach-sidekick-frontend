'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  useDeleteOutcome,
  useProposeOutcome,
} from '@/hooks/mutations/use-outcome-mutations'
import { listNames } from '@/lib/sandbox/format'
import { cn } from '@/lib/utils'
import type { CoacheeOutcomes, Outcome } from '@/types/sandbox-outcomes'
import { DecisionDialog, type Decision } from './decision-dialog'
import { OutcomeDialog } from './outcome-dialog'
import { OutcomeRow } from './outcome-row'
import { ReopenDialog } from './reopen-dialog'

/**
 * One coachee's outcomes with everything the viewer may do to them. The
 * same list serves the cockpit panel, the coach's client-profile card and the
 * coachee's portal card — the rights come from the server per coachee.
 */
export function OutcomeList({
  sandboxId,
  coachee,
  canReopen = false,
  maxPerCoachee = 2,
  className,
  openCommentsFor,
  highlightCommentId,
}: {
  sandboxId: string
  coachee: CoacheeOutcomes
  canReopen?: boolean
  maxPerCoachee?: number
  className?: string
  /** Deep link: the outcome whose thread opens on mount. */
  openCommentsFor?: string | null
  highlightCommentId?: string | null
}) {
  const propose = useProposeOutcome(sandboxId)
  const remove = useDeleteOutcome(sandboxId)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Outcome | null>(null)
  const [deciding, setDeciding] = useState<{
    outcome: Outcome
    decision: Decision
  } | null>(null)
  const [reopening, setReopening] = useState<Outcome | null>(null)
  const [deleting, setDeleting] = useState<Outcome | null>(null)

  const name = coachee.name || coachee.email
  const busy = propose.isPending || remove.isPending
  const room = coachee.outcomes.length < maxPerCoachee
  const approverLine =
    coachee.approver_names.length > 0
      ? `Approver: ${listNames(coachee.approver_names, 2)}`
      : 'No approver yet — attach a supervisor to the group, or add a primary client.'

  return (
    <div
      className={cn('min-w-0', className)}
      data-testid="outcome-list"
      data-member={coachee.member_id}
    >
      {coachee.outcomes.length > 0 ? (
        <ul className="divide-y divide-line">
          {coachee.outcomes.map(o => (
            <OutcomeRow
              key={o.id}
              outcome={o}
              canPropose={coachee.can_propose}
              canApprove={coachee.can_approve}
              canReopen={canReopen}
              busy={busy}
              commentsOpen={openCommentsFor === o.id}
              highlightCommentId={
                openCommentsFor === o.id ? highlightCommentId : null
              }
              actions={{
                onEdit: setEditing,
                onPropose: o => propose.mutate(o.id),
                onDecide: (o, decision) =>
                  setDeciding({ outcome: o, decision }),
                onReopen: setReopening,
                onDelete: setDeleting,
              }}
            />
          ))}
        </ul>
      ) : (
        <p className="py-3 text-sm text-ink-3" data-testid="outcome-empty">
          {coachee.can_propose
            ? `No outcome yet. Draft one or two with ${name} — measurable, specific, thrilling.`
            : 'No outcome proposed yet.'}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <p className="text-xs text-ink-3" data-testid="outcome-approver">
          {approverLine}
        </p>
        {coachee.can_propose && room && (
          <Button
            size="sm"
            variant={coachee.outcomes.length === 0 ? 'default' : 'outline'}
            onClick={() => setCreating(true)}
            data-testid="outcome-add"
          >
            <Plus className="h-3.5 w-3.5" /> Add outcome
          </Button>
        )}
      </div>

      {coachee.can_propose && (
        <OutcomeDialog
          open={creating || !!editing}
          onOpenChange={open => {
            if (!open) {
              setCreating(false)
              setEditing(null)
            }
          }}
          sandboxId={sandboxId}
          memberId={coachee.member_id}
          coacheeName={name}
          approverNames={coachee.approver_names}
          outcome={editing}
        />
      )}
      {coachee.can_approve && (
        <DecisionDialog
          outcome={deciding?.outcome ?? null}
          decision={deciding?.decision ?? 'seal'}
          onOpenChange={open => !open && setDeciding(null)}
          sandboxId={sandboxId}
          coacheeName={name}
        />
      )}
      {canReopen && (
        <ReopenDialog
          outcome={reopening}
          onOpenChange={open => !open && setReopening(null)}
          sandboxId={sandboxId}
        />
      )}
      <AlertDialog
        open={!!deleting}
        onOpenChange={open => !open && setDeleting(null)}
      >
        <AlertDialogContent data-testid="outcome-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this outcome?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.title}” is taken off {name}’s list. Nothing else
              changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) remove.mutate(deleting.id)
                setDeleting(null)
              }}
              data-testid="outcome-delete-confirm"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
