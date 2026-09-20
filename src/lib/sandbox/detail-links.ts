import type { SandboxMember } from '@/types/sandbox'
import type { SandboxEntityKind } from '@/types/sandbox-details'

const SEGMENTS: Record<SandboxEntityKind, string> = {
  client: 'clients',
  coach: 'coaches',
  group: 'groups',
}

export function sandboxEntityHref(
  sandboxId: string,
  kind: SandboxEntityKind,
  id: string,
) {
  return `/sandboxes/${sandboxId}/${SEGMENTS[kind]}/${id}`
}
/**
 * Someone who coaches one group and is coached in another has two pages. `as`
 * says which list the link sits in; without it, being coached wins, as before.
 */
export function sandboxMemberHref(
  member: SandboxMember,
  as?: 'coach' | 'coachee',
): string | null {
  const coachee = member.group_kinds.includes('coachee')
  const coach = member.group_kinds.includes('coach')
  if (coach && (as === 'coach' || !coachee))
    return sandboxEntityHref(member.sandbox_id, 'coach', member.user_id)
  if (coachee) return sandboxEntityHref(member.sandbox_id, 'client', member.id)
  return null
}
