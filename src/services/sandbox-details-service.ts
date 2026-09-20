import { ApiClient } from '@/lib/api-client'
import type { InsightSelection } from '@/types/sandbox-analytics'
import type {
  SandboxActivityPage,
  SandboxConcern,
  SandboxConcernCreate,
  SandboxConcernList,
  SandboxConcernUpdate,
  SandboxEntityDetail,
  SandboxEntityKind,
  SandboxFeedback,
  SandboxSessionDetail,
} from '@/types/sandbox-details'

const base = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/sandboxes`
export function detailQuery(selection: InsightSelection) {
  const query = new URLSearchParams({ period: selection.period })
  for (const key of [
    'group_id',
    'subject_member_id',
    'coach_user_id',
    'entity_kind',
  ] as const) {
    if (selection[key]) query.set(key, selection[key])
  }
  return query
}
export const SandboxDetailsService = {
  detail(
    sandboxId: string,
    kind: SandboxEntityKind,
    id: string,
    selection: InsightSelection,
  ): Promise<SandboxEntityDetail> {
    const path =
      kind === 'client'
        ? `clients/${id}`
        : kind === 'coach'
          ? `coaches/${id}`
          : `groups/${id}/detail`
    return ApiClient.get(
      `${base}/${sandboxId}/${path}?${detailQuery(selection)}`,
    )
  },
  activity(
    sandboxId: string,
    selection: InsightSelection,
    cursor?: string | null,
  ): Promise<SandboxActivityPage> {
    const query = detailQuery(selection)
    if (cursor) query.set('cursor', cursor)
    return ApiClient.get(`${base}/${sandboxId}/activity?${query}`)
  },
  feedback(
    sandboxId: string,
    selection: InsightSelection,
  ): Promise<SandboxFeedback> {
    const query = detailQuery(selection)
    query.delete('entity_kind')
    return ApiClient.get(`${base}/${sandboxId}/feedback?${query}`)
  },
  session(
    sandboxId: string,
    id: string,
    selection: InsightSelection,
  ): Promise<SandboxSessionDetail> {
    return ApiClient.get(
      `${base}/${sandboxId}/sessions/${id}?${detailQuery(selection)}`,
    )
  },
  concerns(
    sandboxId: string,
    kind: SandboxEntityKind,
    id: string,
  ): Promise<SandboxConcernList> {
    return ApiClient.get(
      `${base}/${sandboxId}/concerns?${new URLSearchParams({ subject_kind: kind, subject_id: id })}`,
    )
  },
  createConcern(
    sandboxId: string,
    input: SandboxConcernCreate,
  ): Promise<SandboxConcern> {
    return ApiClient.post(`${base}/${sandboxId}/concerns`, input)
  },
  updateConcern(
    sandboxId: string,
    id: string,
    input: SandboxConcernUpdate,
  ): Promise<SandboxConcern> {
    return ApiClient.patch(`${base}/${sandboxId}/concerns/${id}`, input)
  },
}
