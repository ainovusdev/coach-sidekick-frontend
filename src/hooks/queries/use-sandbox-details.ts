'use client'

import { withSandboxViewer } from './use-sandbox-insights'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { SandboxDetailsService } from '@/services/sandbox-details-service'
import type { InsightSelection } from '@/types/sandbox-analytics'
import type { SandboxEntityKind } from '@/types/sandbox-details'

export function useSandboxEntity(
  sandboxId: string,
  kind: SandboxEntityKind,
  id: string,
  viewer: string | null,
  selection: InsightSelection,
) {
  return useQuery({
    queryKey: ['sandbox-entity', viewer, sandboxId, kind, id, selection],
    queryFn: () =>
      withSandboxViewer(viewer, async () => {
        const result = await SandboxDetailsService.detail(
          sandboxId,
          kind,
          id,
          selection,
        )
        if (
          result.sandbox_id !== sandboxId ||
          result.entity.id !== id ||
          result.entity.kind !== kind ||
          result.selection.period !== selection.period ||
          [
            'group_id',
            'subject_member_id',
            'coach_user_id',
            'entity_kind',
          ].some(
            key =>
              (result.selection[key as keyof InsightSelection] ?? null) !==
              (selection[key as keyof InsightSelection] ?? null),
          )
        )
          throw new Error('Sandbox selection changed')
        return result
      }),
    enabled: !!viewer && !!sandboxId && !!id,
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}
export function useSandboxEntityActivity(
  sandboxId: string,
  viewer: string | null,
  selection: InsightSelection,
  enabled: boolean,
) {
  return useInfiniteQuery({
    queryKey: ['sandbox-entity-activity', viewer, sandboxId, selection],
    queryFn: ({ pageParam }) =>
      withSandboxViewer(viewer, () =>
        SandboxDetailsService.activity(sandboxId, selection, pageParam),
      ),
    initialPageParam: null as string | null,
    getNextPageParam: page => page.next_cursor ?? undefined,
    enabled: !!viewer && enabled,
    gcTime: 0,
    staleTime: 0,
  })
}
