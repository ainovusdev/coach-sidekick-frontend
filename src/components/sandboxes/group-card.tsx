'use client'

import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AvatarStack } from '@/components/ui/person-avatar'
import { fmtContract, fmtDay, firstName, pluralise } from '@/lib/sandbox/format'
import { cn } from '@/lib/utils'
import type { SandboxGroup, SandboxGroupMember } from '@/types/sandbox'

const MISSING_LABEL: Record<SandboxGroup['missing'][number], string> = {
  coach: 'Needs a coach',
  coachee: 'Needs at least one coachee',
  hours_per_coachee: 'Needs hours per coachee',
  cadence: 'Needs a cadence',
}

function uninvitedIds(people: SandboxGroupMember[]): Set<string> {
  return new Set(
    people
      .filter(
        p =>
          p.invitation_status === 'not_sent' ||
          p.invitation_status === 'has_account' ||
          p.invitation_status === 'expired',
      )
      .map(p => p.id),
  )
}

export function GroupCard({
  group,
  onEdit,
  onDelete,
}: {
  group: SandboxGroup
  onEdit: (group: SandboxGroup) => void
  onDelete: (group: SandboxGroup) => void
}) {
  const incomplete = !group.is_complete
  const kind = incomplete
    ? `Incomplete · saved ${fmtDay(group.updated_at.slice(0, 10))}`
    : group.is_one_to_one
      ? 'One to one'
      : `Group · ${pluralise(group.coaches.length, 'coach', 'coaches')}, ${pluralise(group.coachees.length, 'coachee')}`
  const disagrees = group.agreement?.agrees === false
  const supervisorNames = group.supervisors.map(s => firstName(s.name, s.email))

  return (
    <article
      className={cn(
        'flex flex-col rounded-xl border bg-paper p-4',
        incomplete ? 'border-amber-token/50' : 'border-line',
      )}
      data-testid="group-card"
      data-complete={group.is_complete}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'text-[10px] font-semibold uppercase tracking-wider',
            incomplete ? 'text-amber-token' : 'text-ink-3',
          )}
        >
          {kind}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2 -mt-1.5 h-7 w-7 text-ink-3"
              aria-label={`Actions for ${group.display_name}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onEdit(group)}>
              {incomplete ? 'Finish this group' : 'Edit group'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-vermillion focus:text-vermillion"
              onClick={() => onDelete(group)}
            >
              Remove group
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {group.coaches.length > 0 && <AvatarStack people={group.coaches} />}
        {group.coaches.length > 0 && group.coachees.length > 0 && (
          <span className="h-5 w-px bg-line" aria-hidden />
        )}
        {group.coachees.length > 0 && (
          <AvatarStack
            people={group.coachees}
            dashedIds={uninvitedIds(group.coachees)}
          />
        )}
        {group.coaches.length === 0 && group.coachees.length === 0 && (
          <span className="text-xs text-ink-4">No one in this group yet</span>
        )}
      </div>

      <h3 className="mt-3 text-base font-semibold leading-tight text-ink">
        {group.display_name}
      </h3>

      <p className="mt-1.5 font-mono text-xs text-ink-2">
        {fmtContract(group)}
      </p>
      {group.cadence_text && (
        <p className="text-xs text-ink-3">
          {group.cadence_text}
          {disagrees && (
            <span className="text-amber-token"> · doesn’t agree</span>
          )}
        </p>
      )}

      {incomplete ? (
        <div className="mt-3 space-y-1 border-t border-amber-token/30 pt-3">
          {group.missing.map(m => (
            <p key={m} className="text-xs text-amber-token">
              {MISSING_LABEL[m]}
            </p>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full border-amber-token/40 text-ink"
            onClick={() => onEdit(group)}
            data-testid="finish-group"
          >
            Finish this group
          </Button>
        </div>
      ) : (
        <p className="mt-3 border-t border-line pt-3 text-xs text-ink-3">
          Starts {fmtDay(group.starts_on)}
          {supervisorNames.length > 0 &&
            ` · supervisor ${supervisorNames.join(', ')}`}
        </p>
      )}
    </article>
  )
}
