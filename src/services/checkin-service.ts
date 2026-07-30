/**
 * Public weekly commitment check-in API (token-based, no auth).
 * Raw fetch on purpose — these endpoints are public and must not carry
 * auth/impersonation headers from ApiClient (same pattern as
 * questionnaire-service's public section).
 */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface CheckinCommitment {
  id: string
  title: string
  description?: string | null
  target_date?: string | null
  priority: string
  status: string
  /**
   * Intentionally unused. The page derives overdue from the BROWSER's calendar
   * day (see `utils/checkin-view.ts`) — this one is computed against the
   * server's date and is a day stale for clients far from UTC. Kept on the type
   * because the API returns it.
   */
  overdue: boolean
  completed: boolean
}

export interface CheckinPage {
  client_first_name: string
  coach_name?: string | null
  /** Also derived client-side; see the note on `CheckinCommitment.overdue`. */
  open_count: number
  overdue_count: number
  due_this_week_count: number
  commitments: CheckinCommitment[]
}

export interface CheckinToggleResult {
  commitment_id: string
  status: string
  completed: boolean
}

export interface CheckinRescheduleResult {
  commitment_id: string
  target_date: string | null
  overdue: boolean
  status: string
  completed: boolean
}

export type CheckinErrorKind =
  | 'expired'
  | 'not-found'
  | 'conflict'
  | 'server'
  | 'network'

/** Carries enough detail for the page to tell an expired link from a broken one. */
export class CheckinApiError extends Error {
  readonly status: number | null
  readonly kind: CheckinErrorKind

  constructor(kind: CheckinErrorKind, status: number | null, message: string) {
    super(message)
    this.name = 'CheckinApiError'
    this.kind = kind
    this.status = status
  }
}

/**
 * Classify a failed response.
 *
 * Note the asymmetry, it is load-bearing: on the initial GET a 404 means the
 * token really is dead, but on a MUTATION a 404/405 must map to `not-found`,
 * never `expired`. Otherwise, if the reschedule endpoint has not been deployed
 * yet (or a commitment was deleted elsewhere), a single failed edit would tear
 * the whole page down with a false "your link expired" screen. A mutation 404
 * is a row-level failure and nothing more.
 */
function classify(res: Response, isMutation: boolean): CheckinApiError {
  if (res.status === 409) {
    return new CheckinApiError(
      'conflict',
      409,
      'Commitment was already updated',
    )
  }
  if (res.status === 404 || res.status === 405 || res.status === 410) {
    return isMutation
      ? new CheckinApiError('not-found', res.status, 'Commitment not found')
      : new CheckinApiError(
          'expired',
          res.status,
          'Check-in link is invalid or has expired',
        )
  }
  return new CheckinApiError(
    'server',
    res.status,
    'Something went wrong on our end',
  )
}

function asNetworkError(err: unknown): CheckinApiError {
  if (err instanceof CheckinApiError) return err
  return new CheckinApiError('network', null, "Couldn't reach the server")
}

export class CheckinService {
  static async getCheckin(token: string): Promise<CheckinPage> {
    let res: Response
    try {
      res = await fetch(`${BACKEND_URL}/commitments/public/checkin/${token}`)
    } catch (err) {
      throw asNetworkError(err)
    }
    if (!res.ok) throw classify(res, false)
    return res.json()
  }

  static async toggleCommitment(
    token: string,
    commitmentId: string,
    completed: boolean,
  ): Promise<CheckinToggleResult> {
    let res: Response
    try {
      res = await fetch(
        `${BACKEND_URL}/commitments/public/checkin/${token}/toggle`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commitment_id: commitmentId, completed }),
        },
      )
    } catch (err) {
      throw asNetworkError(err)
    }
    if (!res.ok) throw classify(res, true)
    return res.json()
  }

  /**
   * Set or clear a commitment's due date.
   * `targetDate` is `yyyy-MM-dd`, or null to clear. The key is always sent —
   * the backend schema requires it precisely so that "clear" cannot be confused
   * with a malformed request.
   */
  static async rescheduleCommitment(
    token: string,
    commitmentId: string,
    targetDate: string | null,
  ): Promise<CheckinRescheduleResult> {
    let res: Response
    try {
      res = await fetch(
        `${BACKEND_URL}/commitments/public/checkin/${token}/reschedule`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            commitment_id: commitmentId,
            target_date: targetDate,
          }),
        },
      )
    } catch (err) {
      throw asNetworkError(err)
    }
    if (!res.ok) throw classify(res, true)
    return res.json()
  }
}
