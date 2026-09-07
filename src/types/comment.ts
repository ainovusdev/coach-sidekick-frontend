/**
 * Generic comments. One thread per target — a commitment, the three records
 * on a client's goals tree (goal = vision, target = meta performance outcome,
 * sprint), a sandbox outcome, or the thread under a sandbox's vision (its
 * target id is the sandbox). Replies nest one level (`parent_id`), never
 * deeper.
 */

export type CommentTargetType =
  | 'commitment'
  | 'goal'
  | 'target'
  | 'sprint'
  | 'outcome'
  | 'sandbox_vision'

export interface CommentPerson {
  id: string
  name: string | null
  email: string
}

export interface Comment {
  id: string
  target_type: CommentTargetType
  target_id: string
  parent_id: string | null
  /** Sanitised HTML. Mentions are `<span data-type="mention" data-id data-label>@Name</span>`. */
  body: string
  author: CommentPerson
  mentions: CommentPerson[]
  attachments: unknown[]
  created_at: string
  updated_at: string
  edited_at: string | null
  /** Soft delete: the row stays (so replies keep their parent) with an empty body. */
  deleted_at: string | null
  can_edit: boolean
  can_delete: boolean
  replies?: Comment[]
}

export interface CommentListResponse {
  target_type: CommentTargetType
  target_id: string
  can_comment: boolean
  comments: Comment[]
}

export interface CommentCreate {
  target_type: CommentTargetType
  target_id: string
  body: string
  /** User ids of the people mentioned in `body`. */
  mentions: string[]
  parent_id?: string
}

export interface CommentUpdate {
  body: string
  mentions: string[]
}

/** Display name with the same fallback the backend uses (email when unnamed). */
export function commentPersonName(person: CommentPerson | null | undefined) {
  if (!person) return 'Someone'
  return person.name || person.email || 'Someone'
}
