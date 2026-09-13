import type { SandboxMember } from '@/types/sandbox'
import type { SandboxEntityKind } from '@/types/sandbox-details'

export function sandboxEntityHref(
  sandboxId: string,
  kind: SandboxEntityKind,
  id: string,
) {
  return `/sandbox/${sandboxId}/${kind === 'group' ? 'groups' : kind}/${id}`
}
export function sandboxMemberHref(member: SandboxMember): string | null {
  if (member.group_kinds.includes('coachee'))
    return sandboxEntityHref(member.sandbox_id, 'client', member.id)
  if (member.group_kinds.includes('coach'))
    return sandboxEntityHref(member.sandbox_id, 'coach', member.user_id)
  return null
}
