// People search (GET /api/v1/people/search): whom the caller may assign to
// or mention, in a context. One shape for every picker.

export type PersonRelation =
  | 'you'
  | 'client'
  | 'coach'
  | 'co_coach'
  | 'admin'
  | 'member'
  | 'staff'

export interface Person {
  id: string
  full_name: string | null
  email: string
  roles: string[]
  relation?: PersonRelation | null
  has_account?: boolean
  // Sandbox member lookup compatibility
  is_member?: boolean
  member_roles?: string[]
}

export interface PeopleSearchResponse {
  people: Person[]
  q: string
  context: string | null
}

/** Where the picker is: on a client, on a sandbox, or nowhere in particular. */
export interface PeopleContext {
  clientId?: string | null
  sandboxId?: string | null
}

export function peopleContextParam(
  ctx?: PeopleContext | null,
): string | undefined {
  if (!ctx) return undefined
  if (ctx.clientId) return `client:${ctx.clientId}`
  if (ctx.sandboxId) return `sandbox:${ctx.sandboxId}`
  return undefined
}

export function personName(p: Pick<Person, 'full_name' | 'email'>): string {
  return p.full_name || p.email
}

const COACH_LIKE = new Set(['coach', 'trainee', 'admin', 'super_admin'])

export function isCoachLike(roles: string[] | undefined | null): boolean {
  return (roles ?? []).some(r => COACH_LIKE.has(r))
}

export const RELATION_LABEL: Record<PersonRelation, string> = {
  you: 'You',
  client: 'Client',
  coach: 'Coach',
  co_coach: 'Co-coach',
  admin: 'Admin',
  member: 'Member',
  staff: '',
}
