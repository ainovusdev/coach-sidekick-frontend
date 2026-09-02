'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
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
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
import { useSetMemberGroups } from '@/hooks/mutations/use-sandbox-mutations'
import { firstName, pluralise } from '@/lib/sandbox/format'
import type {
  GroupMemberKind,
  SandboxGroup,
  SandboxMember,
  SandboxOverview,
} from '@/types/sandbox'

const key = (groupId: string, kind: GroupMemberKind) => `${groupId}:${kind}`

function groupSummary(g: SandboxGroup): string {
  const coaches = g.coaches.map(c => firstName(c.name, c.email)).join(', ')
  const coachees = pluralise(g.coachees.length, 'coachee')
  return coaches ? `${coaches} · ${coachees}` : coachees
}

/**
 * People page → Change groups. Sets exactly which groups a person is in
 * and as what: our side coaches groups; their side is coached in them
 * and, with the supervisor hat, supervises them. Same action as editing
 * the group itself.
 */
export function ChangeGroupsDialog({
  member,
  onOpenChange,
  overview,
}: {
  member: SandboxMember | null
  onOpenChange: (open: boolean) => void
  overview: SandboxOverview
}) {
  const { sandbox, groups } = overview
  const setGroups = useSetMemberGroups(sandbox.id)
  const view = useSandboxView()
  const [picked, setPicked] = useState<Set<string>>(new Set())

  const initial = useMemo(
    () => new Set(member?.memberships.map(m => key(m.group_id, m.kind)) ?? []),
    [member],
  )
  useEffect(() => {
    if (member) setPicked(new Set(initial))
  }, [member, initial])

  if (!member) return null
  const who = member.name || member.email
  const first = firstName(member.name, member.email)
  const isOurs = member.side === 'ours'
  const canSupervise = member.roles.includes('supervisor')
  const kinds: GroupMemberKind[] = isOurs
    ? ['coach']
    : canSupervise
      ? ['coachee', 'supervisor']
      : ['coachee']

  const changed =
    picked.size !== initial.size || [...picked].some(k => !initial.has(k))
  const leavesSandbox = member.roles.length === 0 && picked.size === 0

  const toggle = (groupId: string, kind: GroupMemberKind, on: boolean) =>
    setPicked(prev => {
      const next = new Set(prev)
      if (on) next.add(key(groupId, kind))
      else next.delete(key(groupId, kind))
      return next
    })

  const save = async () => {
    const memberships = [...picked].map(k => {
      const [group_id, kind] = k.split(':') as [string, GroupMemberKind]
      return { group_id, kind }
    })
    await setGroups.mutateAsync({ memberId: member.id, data: { memberships } })
    onOpenChange(false)
  }

  return (
    <Dialog open={!!member} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md"
        data-testid="groups-dialog"
      >
        <DialogHeader>
          <DialogTitle>Groups for {who}</DialogTitle>
          <DialogDescription>
            {isOurs
              ? `Which groups ${first} coaches. Every coachee in a group they join becomes their client.`
              : canSupervise
                ? `Which groups ${first} is coached in, and which they supervise. Supervisors see their groups and nothing else.`
                : `Which groups ${first} is coached in. They become a client of every coach in each group.`}
          </DialogDescription>
        </DialogHeader>

        {groups.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-ink-3">
            No groups yet.{' '}
            <Link
              href={view.href.groups(sandbox.id)}
              className="text-ink underline-offset-2 hover:underline"
            >
              Build one on the overview
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {groups.map(g => (
              <li
                key={g.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2.5"
                data-testid="group-option"
                data-group={g.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {g.display_name}
                  </p>
                  <p className="truncate text-xs text-ink-3">
                    {groupSummary(g)}
                    {!g.is_complete && ' · incomplete'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {kinds.map(kind => {
                    const id = `${g.id}-${kind}`
                    return (
                      <label
                        key={kind}
                        htmlFor={id}
                        className="flex cursor-pointer items-center gap-2 text-sm text-ink-2"
                      >
                        <Checkbox
                          id={id}
                          checked={picked.has(key(g.id, kind))}
                          onCheckedChange={v => toggle(g.id, kind, v === true)}
                          data-testid={`group-${kind}`}
                        />
                        {kind === 'coach'
                          ? 'Coaches'
                          : kind === 'coachee'
                            ? 'Coachee'
                            : 'Supervises'}
                      </label>
                    )
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}

        {leavesSandbox && changed && (
          <p
            className="rounded-md bg-amber-token-bg px-3 py-2 text-xs text-amber-token"
            data-testid="leaves-sandbox"
          >
            {first} has no role on this sandbox, so with no group left they come
            off it. Client records their coaches already have are kept.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-ink text-ink-on-dark hover:bg-ink/90"
            disabled={!changed || setGroups.isPending}
            onClick={save}
            data-testid="save-groups"
          >
            {setGroups.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
