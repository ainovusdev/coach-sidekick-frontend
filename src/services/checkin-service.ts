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
  overdue: boolean
  completed: boolean
}

export interface CheckinPage {
  client_first_name: string
  coach_name?: string | null
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

export class CheckinService {
  static async getCheckin(token: string): Promise<CheckinPage> {
    const res = await fetch(
      `${BACKEND_URL}/commitments/public/checkin/${token}`,
    )
    if (!res.ok) {
      throw new Error('Check-in link not found or expired')
    }
    return res.json()
  }

  static async toggleCommitment(
    token: string,
    commitmentId: string,
    completed: boolean,
  ): Promise<CheckinToggleResult> {
    const res = await fetch(
      `${BACKEND_URL}/commitments/public/checkin/${token}/toggle`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitment_id: commitmentId, completed }),
      },
    )
    if (!res.ok) {
      throw new Error('Failed to update commitment')
    }
    return res.json()
  }
}
