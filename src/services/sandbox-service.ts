/**
 * Sandbox Service — API client for Sandbox v2 (admin panel and the member
 * view) and the invitation flow the invited people use.
 */

import { ApiClient } from '@/lib/api-client'
import type {
  Outcome,
  OutcomeCreate,
  OutcomeDecision,
  OutcomeUpdate,
  SandboxOutcomes,
} from '@/types/sandbox-outcomes'
import type {
  EmailLookup,
  EmailPreview,
  InvitationAcceptResponse,
  InvitationSendRequest,
  InvitationValidation,
  MemberGroupsUpdate,
  PersonSearchResult,
  SandboxCreate,
  SandboxGroup,
  SandboxGroupCreate,
  SandboxGroupMember,
  SandboxGroupMemberCreate,
  SandboxGroupUpdate,
  SandboxInvitation,
  SandboxListFilters,
  SandboxListResponse,
  SandboxMember,
  SandboxMemberCreate,
  SandboxMemberUpdate,
  SandboxOverview,
  SandboxUpdate,
  TermPreview,
  TimelineEventCreate,
  TimelineEventUpdate,
  TimelineRegeneratePreview,
  WelcomeData,
} from '@/types/sandbox'
import type {
  ClientSandboxContext,
  SandboxDashboard,
  SandboxDelivery,
} from '@/types/sandbox-delivery'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const BASE = `${BACKEND_URL}/sandboxes`
const PUBLIC = `${BACKEND_URL}/sandbox-invitations`

export class SandboxService {
  // -------------------------------------------------------------- sandboxes
  static list(filters: SandboxListFilters = {}): Promise<SandboxListResponse> {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.q) params.set('q', filters.q)
    if (filters.include_ended) params.set('include_ended', 'true')
    const qs = params.toString()
    return ApiClient.get(`${BASE}/${qs ? `?${qs}` : ''}`)
  }

  static create(data: SandboxCreate): Promise<SandboxOverview> {
    return ApiClient.post(`${BASE}/`, data)
  }

  /** Sandboxes the signed-in person is a member of (any role, any side). */
  static mine(): Promise<SandboxListResponse> {
    return ApiClient.get(`${BASE}/mine`)
  }

  static overview(id: string): Promise<SandboxOverview> {
    return ApiClient.get(`${BASE}/${id}/overview`)
  }

  static update(id: string, data: SandboxUpdate): Promise<SandboxOverview> {
    return ApiClient.patch(`${BASE}/${id}`, data)
  }

  static termPreview(start: string, months: number): Promise<TermPreview> {
    return ApiClient.get(`${BASE}/term-preview?start=${start}&months=${months}`)
  }

  // -------------------------------------------------------------- timeline
  /** What regenerating for a term would do, event by event. No writes. */
  static regeneratePreview(
    id: string,
    params: {
      term_start?: string
      term_months?: number
      overwrite_hand_adjusted?: boolean
    } = {},
  ): Promise<TimelineRegeneratePreview> {
    const qs = new URLSearchParams()
    if (params.term_start) qs.set('term_start', params.term_start)
    if (params.term_months) qs.set('term_months', String(params.term_months))
    if (params.overwrite_hand_adjusted)
      qs.set('overwrite_hand_adjusted', 'true')
    const s = qs.toString()
    return ApiClient.get(
      `${BASE}/${id}/timeline/regenerate-preview${s ? `?${s}` : ''}`,
    )
  }

  static regenerateTimeline(
    id: string,
    overwrite_hand_adjusted: boolean,
  ): Promise<SandboxOverview> {
    return ApiClient.post(`${BASE}/${id}/timeline/regenerate`, {
      overwrite_hand_adjusted,
    })
  }

  static addEvent(
    id: string,
    data: TimelineEventCreate,
  ): Promise<SandboxOverview> {
    return ApiClient.post(`${BASE}/${id}/timeline`, data)
  }

  static moveEvent(
    id: string,
    eventId: string,
    data: TimelineEventUpdate,
  ): Promise<SandboxOverview> {
    return ApiClient.patch(`${BASE}/${id}/timeline/${eventId}`, data)
  }

  static removeEvent(
    id: string,
    eventId: string,
    reason: string,
  ): Promise<SandboxOverview> {
    return ApiClient.post(`${BASE}/${id}/timeline/${eventId}/remove`, {
      reason,
    })
  }

  static restoreEvent(id: string, eventId: string): Promise<SandboxOverview> {
    return ApiClient.post(`${BASE}/${id}/timeline/${eventId}/restore`, {})
  }

  // ---------------------------------------------------------------- people
  static searchPeople(
    q: string,
    sandboxId?: string,
    limit = 10,
  ): Promise<PersonSearchResult[]> {
    const params = new URLSearchParams({ q, limit: String(limit) })
    if (sandboxId) params.set('sandbox_id', sandboxId)
    return ApiClient.get(`${BASE}/people/search?${params.toString()}`)
  }

  static lookupEmail(id: string, email: string): Promise<EmailLookup> {
    return ApiClient.get(
      `${BASE}/${id}/lookup-email?email=${encodeURIComponent(email)}`,
    )
  }

  static addMember(
    id: string,
    data: SandboxMemberCreate,
  ): Promise<SandboxMember> {
    return ApiClient.post(`${BASE}/${id}/members`, data)
  }

  static updateMember(
    id: string,
    memberId: string,
    data: SandboxMemberUpdate,
  ): Promise<SandboxMember> {
    return ApiClient.patch(`${BASE}/${id}/members/${memberId}`, data)
  }

  /** Set exactly which groups a person is in, and as what (People page). */
  static setMemberGroups(
    id: string,
    memberId: string,
    data: MemberGroupsUpdate,
  ): Promise<SandboxOverview> {
    return ApiClient.put(`${BASE}/${id}/members/${memberId}/groups`, data)
  }

  /** Bulk removal: roles and group memberships go together. */
  static removeMembers(
    id: string,
    memberIds: string[],
  ): Promise<SandboxOverview> {
    return ApiClient.post(`${BASE}/${id}/members/remove`, {
      member_ids: memberIds,
    })
  }

  static removeMember(
    id: string,
    memberId: string,
    force = false,
  ): Promise<void> {
    return ApiClient.delete(
      `${BASE}/${id}/members/${memberId}${force ? '?force=true' : ''}`,
    )
  }

  // ---------------------------------------------------------------- groups
  static createGroup(
    id: string,
    data: SandboxGroupCreate,
  ): Promise<SandboxGroup> {
    return ApiClient.post(`${BASE}/${id}/groups`, data)
  }

  static updateGroup(
    id: string,
    groupId: string,
    data: SandboxGroupUpdate,
  ): Promise<SandboxGroup> {
    return ApiClient.patch(`${BASE}/${id}/groups/${groupId}`, data)
  }

  static deleteGroup(id: string, groupId: string): Promise<void> {
    return ApiClient.delete(`${BASE}/${id}/groups/${groupId}`)
  }

  static addGroupMember(
    id: string,
    groupId: string,
    data: SandboxGroupMemberCreate,
  ): Promise<SandboxGroupMember> {
    return ApiClient.post(`${BASE}/${id}/groups/${groupId}/members`, data)
  }

  static removeGroupMember(
    id: string,
    groupId: string,
    groupMemberId: string,
    force = false,
  ): Promise<void> {
    return ApiClient.delete(
      `${BASE}/${id}/groups/${groupId}/members/${groupMemberId}${force ? '?force=true' : ''}`,
    )
  }

  // ----------------------------------------------------------- invitations
  static sendInvitations(
    id: string,
    data: InvitationSendRequest,
  ): Promise<SandboxInvitation[]> {
    return ApiClient.post(`${BASE}/${id}/invitations`, data)
  }

  static resendInvitation(
    id: string,
    invitationId: string,
  ): Promise<SandboxInvitation> {
    return ApiClient.post(
      `${BASE}/${id}/invitations/${invitationId}/resend`,
      {},
    )
  }

  static revokeInvitation(
    id: string,
    invitationId: string,
  ): Promise<SandboxInvitation> {
    return ApiClient.post(
      `${BASE}/${id}/invitations/${invitationId}/revoke`,
      {},
    )
  }

  static previewInvitation(
    id: string,
    memberId: string,
  ): Promise<EmailPreview> {
    return ApiClient.get(
      `${BASE}/${id}/invitations/preview?member_id=${memberId}`,
    )
  }

  /** The "you were added" email our own people get (preview / resend). */
  static previewAddedEmail(
    id: string,
    memberId: string,
  ): Promise<EmailPreview> {
    return ApiClient.get(
      `${BASE}/${id}/members/${memberId}/added-email/preview`,
    )
  }

  static resendAddedEmail(
    id: string,
    memberId: string,
  ): Promise<SandboxMember> {
    return ApiClient.post(`${BASE}/${id}/members/${memberId}/added-email`, {})
  }

  // ------------------------------------------------------ invited people
  static welcome(id: string): Promise<WelcomeData> {
    return ApiClient.get(`${BASE}/${id}/welcome`)
  }

  // ---------------------------------------------------- delivery + dashboards
  /** One dashboard for every persona (portfolio / coach / client side / coachee). */
  static dashboard(includeEnded = false): Promise<SandboxDashboard> {
    return ApiClient.get(
      `${BASE}/dashboard${includeEnded ? '?include_ended=true' : ''}`,
    )
  }

  /** Delivered vs expected per coachee, for the groups the caller may see. */
  static delivery(id: string): Promise<SandboxDelivery> {
    return ApiClient.get(`${BASE}/${id}/delivery`)
  }

  /** The sandbox group(s) a client row belongs to — the client-profile card. */
  static clientContext(clientId: string): Promise<ClientSandboxContext[]> {
    return ApiClient.get(`${BACKEND_URL}/clients/${clientId}/sandbox`)
  }

  /** The coachee's own sandbox card, keyed on the active profile (X-Active-Client). */
  static coacheeSandbox(): Promise<ClientSandboxContext[]> {
    return ApiClient.get(`${BACKEND_URL}/client-portal/sandbox`)
  }

  // ---- gold sealing -----------------------------------------------------

  /** Outcomes per coachee the caller may see, with what they may do. */
  static outcomes(id: string): Promise<SandboxOutcomes> {
    return ApiClient.get(`${BASE}/${id}/outcomes`)
  }

  static createOutcome(id: string, data: OutcomeCreate): Promise<Outcome> {
    return ApiClient.post(`${BASE}/${id}/outcomes`, data)
  }

  static updateOutcome(
    id: string,
    outcomeId: string,
    data: OutcomeUpdate,
  ): Promise<Outcome> {
    return ApiClient.patch(`${BASE}/${id}/outcomes/${outcomeId}`, data)
  }

  static proposeOutcome(id: string, outcomeId: string): Promise<Outcome> {
    return ApiClient.post(`${BASE}/${id}/outcomes/${outcomeId}/propose`, {})
  }

  static decideOutcome(
    id: string,
    outcomeId: string,
    data: OutcomeDecision,
  ): Promise<Outcome> {
    return ApiClient.post(`${BASE}/${id}/outcomes/${outcomeId}/decide`, data)
  }

  static reopenOutcome(
    id: string,
    outcomeId: string,
    reason: string,
  ): Promise<Outcome> {
    return ApiClient.post(`${BASE}/${id}/outcomes/${outcomeId}/reopen`, {
      reason,
    })
  }

  static deleteOutcome(id: string, outcomeId: string): Promise<void> {
    return ApiClient.delete(`${BASE}/${id}/outcomes/${outcomeId}`)
  }

  /** Public — no auth header needed; plain fetch keeps it independent of login state. */
  static async validateInvitation(
    token: string,
  ): Promise<InvitationValidation> {
    const resp = await fetch(`${PUBLIC}/validate/${encodeURIComponent(token)}`)
    if (!resp.ok)
      throw new Error(`Could not check this invitation (${resp.status})`)
    return resp.json()
  }

  static async acceptSignup(payload: {
    token: string
    password?: string
    full_name?: string
  }): Promise<InvitationAcceptResponse> {
    const resp = await fetch(`${PUBLIC}/accept-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await resp.json().catch(() => ({}))
    if (!resp.ok) {
      const detail = body?.detail
      const message =
        typeof detail === 'string'
          ? detail
          : detail?.message || 'This invitation could not be accepted'
      const err: Error & { code?: string } = new Error(message)
      if (detail && typeof detail === 'object') err.code = detail.code
      throw err
    }
    return body
  }

  static acceptAuthenticated(token: string): Promise<InvitationAcceptResponse> {
    return ApiClient.post(`${PUBLIC}/accept`, { token })
  }
}
