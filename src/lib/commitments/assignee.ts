// Who a commitment is for, read the same way everywhere.
//
// The API's `assignee` object is the truth (a user, or the client themself —
// with or without a login). Older cached rows only carry `assigned_to_id`
// and `client_name`, so every reader goes through `assigneeOf` and never
// touches the flat fields directly.
import type { Assignee, AssigneeKind, Commitment } from '@/types/commitment'

/** The fields a reader needs — a full `Commitment`, a panel row, or a kanban `any`. */
export type AssigneeSource = Partial<
  Pick<
    Commitment,
    | 'assignee'
    | 'assignee_kind'
    | 'assigned_to_id'
    | 'assigned_to_name'
    | 'client_id'
    | 'client_name'
  >
>

export function assigneeOf(c: AssigneeSource): Assignee | null {
  if (c.assignee !== undefined) return c.assignee
  if (c.assigned_to_id) {
    return {
      user_id: c.assigned_to_id,
      client_id: null,
      name: c.assigned_to_name ?? null,
      email: null,
      has_account: true,
      roles: [],
    }
  }
  if (c.client_id) {
    return {
      user_id: null,
      client_id: c.client_id,
      name: c.client_name ?? null,
      email: null,
      has_account: null,
      roles: [],
    }
  }
  return null
}

export function assigneeKindOf(c: AssigneeSource): AssigneeKind {
  if (c.assignee_kind) return c.assignee_kind
  if (c.assigned_to_id) return 'user'
  if (c.client_id) return 'client'
  return 'none'
}

/** Assigned to this user, by id (never by role). */
export function isAssignedTo(
  c: AssigneeSource,
  userId: string | null | undefined,
): boolean {
  if (!userId) return false
  const a = assigneeOf(c)
  return !!a?.user_id && a.user_id === userId
}

/** The client's own item (no person, or the client's own login). */
export function isClientsOwn(c: AssigneeSource): boolean {
  return assigneeKindOf(c) === 'client'
}

export function firstName(name: string | null | undefined): string {
  return (name ?? '').trim().split(/\s+/)[0] || ''
}

/** "You", the person's name, or "Unassigned". */
export function assigneeLabel(
  c: AssigneeSource,
  viewerId: string | null | undefined,
  opts: { short?: boolean } = {},
): string {
  const a = assigneeOf(c)
  if (!a) return 'Unassigned'
  if (viewerId && a.user_id === viewerId) return 'You'
  const name = a.name || a.email || 'Someone'
  return opts.short ? firstName(name) || name : name
}

/** Helper copy under an assignee picker, by who was chosen. */
export function assigneeHint(
  picked: {
    user_id: string | null
    name: string | null
    has_account?: boolean | null
  } | null,
  viewerId: string | null | undefined,
  isClient: boolean,
): string {
  if (!picked) return 'Only on your list.'
  const first = firstName(picked.name) || picked.name || 'They'
  if (picked.user_id && picked.user_id === viewerId) return 'Only on your list.'
  if (isClient) {
    return picked.has_account === false
      ? `${first} hasn't joined yet — you'll track this for them.`
      : `${first} will see this in their portal.`
  }
  return `${first} will be notified.`
}

/** Optimistic `assignee` for a row after picking someone (or the client, `user_id` null). */
export function assigneeFromPick(
  picked: {
    user_id: string | null
    client_id?: string | null
    name: string | null
    email: string | null
    has_account?: boolean | null
    roles?: string[]
  } | null,
  clientId: string | null | undefined,
): Assignee | null {
  if (picked) {
    return {
      user_id: picked.user_id,
      client_id: picked.user_id ? null : (picked.client_id ?? clientId ?? null),
      name: picked.name,
      email: picked.email,
      has_account: picked.has_account ?? (picked.user_id ? true : null),
      roles: picked.roles ?? [],
    }
  }
  return null
}
