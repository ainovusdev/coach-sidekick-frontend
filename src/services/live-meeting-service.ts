/**
 * Live Meeting Service
 * API client for client live meeting access (no authentication required)
 * Uses token in URL and optional X-Guest-Token header
 */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// ============ Types ============

export interface LiveSessionInfo {
  session_id: string
  client_id: string
  client_name: string | null
  coach_name: string | null
  started_at: string | null
  status: string
  is_ended: boolean
  duration_seconds: number | null
}

export interface SessionStatus {
  status: string
  is_ended: boolean
  duration_seconds: number | null
  ended_at: string | null
}

export interface GuestIdentifier {
  id: string
  guest_token: string
  display_name: string | null
  created_at: string
}

export interface ClientNote {
  id: string
  session_id: string
  content: string
  title: string | null
  note_type: string
  created_at: string
  updated_at: string
}

export interface ClientCommitment {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  priority: string
  target_date: string | null
  progress_percentage: number
  session_id: string | null
  created_at: string
  updated_at: string
  extracted_from_transcript: boolean
  extraction_confidence: number | null
  transcript_context: string | null
}

export interface PastCommitmentGroup {
  session_date: string | null
  session_id: string | null
  commitments: ClientCommitment[]
}

export interface LiveMeetingTarget {
  id: string
  title: string
  description: string | null
  status: string
  goal_titles: string[]
}

export interface LiveMeetingTokenInfo {
  token: string
  share_url: string
  client_name: string | null
}

// ============ Helper Functions ============

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`

    try {
      const errorData = await response.json()
      errorMessage = errorData.detail || errorData.message || errorMessage
    } catch {
      // Ignore JSON parsing errors
    }

    throw new Error(errorMessage)
  }

  return response.json()
}

function getGuestHeaders(guestToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (guestToken) {
    headers['X-Guest-Token'] = guestToken
  }

  return headers
}

// ============ Token Management (Authenticated - for coaches) ============

export class LiveMeetingService {
  /**
   * Get or create a live meeting token for a session (coach use)
   */
  static async getOrCreateToken(
    sessionId: string,
  ): Promise<LiveMeetingTokenInfo> {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await fetch(
      `${BACKEND_URL}/live-meeting/tokens/${sessionId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    )

    return handleResponse<LiveMeetingTokenInfo>(response)
  }

  /**
   * Revoke a live meeting token (coach use)
   */
  static async revokeToken(meetingToken: string): Promise<void> {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await fetch(
      `${BACKEND_URL}/live-meeting/tokens/${meetingToken}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Failed to revoke token')
    }
  }

  // ============ Guest Access (No auth required) ============

  /**
   * Validate token and get session info
   */
  static async joinMeeting(token: string): Promise<LiveSessionInfo> {
    const response = await fetch(`${BACKEND_URL}/live-meeting/join/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return handleResponse<LiveSessionInfo>(response)
  }

  /**
   * Create or retrieve guest identifier
   */
  static async getOrCreateGuest(
    token: string,
    existingGuestToken?: string,
    displayName?: string,
  ): Promise<GuestIdentifier> {
    const response = await fetch(`${BACKEND_URL}/live-meeting/${token}/guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        guest_token: existingGuestToken || null,
        display_name: displayName || null,
      }),
    })

    return handleResponse<GuestIdentifier>(response)
  }

  /**
   * Get session status (for polling)
   */
  static async getSessionStatus(token: string): Promise<SessionStatus> {
    const response = await fetch(
      `${BACKEND_URL}/live-meeting/${token}/status`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    return handleResponse<SessionStatus>(response)
  }

  // ============ Notes ============

  /**
   * Create a client note
   */
  static async createNote(
    token: string,
    guestToken: string,
    data: { content: string; title?: string },
  ): Promise<ClientNote> {
    const response = await fetch(`${BACKEND_URL}/live-meeting/${token}/notes`, {
      method: 'POST',
      headers: getGuestHeaders(guestToken),
      body: JSON.stringify(data),
    })

    return handleResponse<ClientNote>(response)
  }

  /**
   * Get all notes for this session
   */
  static async getNotes(
    token: string,
    guestToken: string,
  ): Promise<ClientNote[]> {
    const response = await fetch(`${BACKEND_URL}/live-meeting/${token}/notes`, {
      method: 'GET',
      headers: getGuestHeaders(guestToken),
    })

    return handleResponse<ClientNote[]>(response)
  }

  /**
   * Update a note
   */
  static async updateNote(
    token: string,
    guestToken: string,
    noteId: string,
    data: { content?: string; title?: string },
  ): Promise<ClientNote> {
    const response = await fetch(
      `${BACKEND_URL}/live-meeting/${token}/notes/${noteId}`,
      {
        method: 'PATCH',
        headers: getGuestHeaders(guestToken),
        body: JSON.stringify(data),
      },
    )

    return handleResponse<ClientNote>(response)
  }

  /**
   * Delete a note
   */
  static async deleteNote(
    token: string,
    guestToken: string,
    noteId: string,
  ): Promise<void> {
    const response = await fetch(
      `${BACKEND_URL}/live-meeting/${token}/notes/${noteId}`,
      {
        method: 'DELETE',
        headers: getGuestHeaders(guestToken),
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Failed to delete note')
    }
  }

  // ============ Targets/Outcomes ============

  /**
   * Get the client's active targets (outcomes) for linking to commitments
   */
  static async getTargets(
    token: string,
    guestToken: string,
  ): Promise<LiveMeetingTarget[]> {
    const response = await fetch(
      `${BACKEND_URL}/live-meeting/${token}/targets`,
      {
        method: 'GET',
        headers: getGuestHeaders(guestToken),
      },
    )

    return handleResponse<LiveMeetingTarget[]>(response)
  }

  // ============ Commitments ============

  /**
   * Create a commitment
   */
  static async createCommitment(
    token: string,
    guestToken: string,
    data: {
      title: string
      description?: string
      target_date?: string
      priority?: string
      type?: string
      target_ids?: string[]
    },
  ): Promise<ClientCommitment> {
    const response = await fetch(
      `${BACKEND_URL}/live-meeting/${token}/commitments`,
      {
        method: 'POST',
        headers: getGuestHeaders(guestToken),
        body: JSON.stringify(data),
      },
    )

    return handleResponse<ClientCommitment>(response)
  }

  /**
   * Get all commitments for this session
   */
  static async getCommitments(
    token: string,
    guestToken: string,
  ): Promise<ClientCommitment[]> {
    const response = await fetch(
      `${BACKEND_URL}/live-meeting/${token}/commitments`,
      {
        method: 'GET',
        headers: getGuestHeaders(guestToken),
      },
    )

    const result = await handleResponse<{ data: ClientCommitment[] }>(response)
    return result.data
  }

  /**
   * Update a commitment
   */
  static async updateCommitment(
    token: string,
    guestToken: string,
    commitmentId: string,
    data: {
      title?: string
      description?: string
      target_date?: string
      priority?: string
      progress_percentage?: number
      status?: string
      target_ids?: string[]
    },
  ): Promise<ClientCommitment> {
    const response = await fetch(
      `${BACKEND_URL}/live-meeting/${token}/commitments/${commitmentId}`,
      {
        method: 'PATCH',
        headers: getGuestHeaders(guestToken),
        body: JSON.stringify(data),
      },
    )

    return handleResponse<ClientCommitment>(response)
  }

  /**
   * Extract commitments from session transcript using AI
   */
  static async extractCommitments(
    token: string,
    guestToken: string,
  ): Promise<ClientCommitment[]> {
    const response = await fetch(
      `${BACKEND_URL}/live-meeting/${token}/extract-commitments`,
      {
        method: 'POST',
        headers: getGuestHeaders(guestToken),
        signal: AbortSignal.timeout(120000),
      },
    )

    return handleResponse<ClientCommitment[]>(response)
  }

  /**
   * Delete a commitment
   */
  static async deleteCommitment(
    token: string,
    guestToken: string,
    commitmentId: string,
  ): Promise<void> {
    const response = await fetch(
      `${BACKEND_URL}/live-meeting/${token}/commitments/${commitmentId}`,
      {
        method: 'DELETE',
        headers: getGuestHeaders(guestToken),
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Failed to delete commitment')
    }
  }

  /**
   * Get past commitments from previous sessions
   */
  static async getPastCommitments(
    token: string,
    guestToken: string,
  ): Promise<PastCommitmentGroup[]> {
    const response = await fetch(
      `${BACKEND_URL}/live-meeting/${token}/past-commitments`,
      {
        method: 'GET',
        headers: getGuestHeaders(guestToken),
      },
    )

    const result = await handleResponse<{ data: PastCommitmentGroup[] }>(
      response,
    )
    return result.data
  }
}

// ============ Local Storage Helpers ============

const GUEST_TOKEN_KEY_PREFIX = 'live_meeting_guest_'

export function getStoredGuestToken(meetingToken: string): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(`${GUEST_TOKEN_KEY_PREFIX}${meetingToken}`)
}

export function setStoredGuestToken(
  meetingToken: string,
  guestToken: string,
): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${GUEST_TOKEN_KEY_PREFIX}${meetingToken}`, guestToken)
}

export function clearStoredGuestToken(meetingToken: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`${GUEST_TOKEN_KEY_PREFIX}${meetingToken}`)
}
