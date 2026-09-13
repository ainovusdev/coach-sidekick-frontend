'use client'

import authService from '@/services/auth-service'
import { useSyncExternalStore } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { SandboxService } from '@/services/sandbox-service'
import type { InsightSelection } from '@/types/sandbox-analytics'

function subscribeIdentity(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener('focus', onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener('focus', onChange)
  }
}
function identityHeaders() {
  return JSON.stringify(
    ['view_as_coach_id', 'view_as_client_id', 'active_client_id'].map(key =>
      sessionStorage.getItem(key),
    ),
  )
}

/** Refuse responses from a request whose effective headers changed in flight. */
export async function withSandboxViewer<T>(
  viewer: string | null,
  work: () => Promise<T>,
): Promise<T> {
  const current = () =>
    `${authService.getUserIdFromToken()}:${identityHeaders()}`
  if (!viewer || current() !== viewer) throw new Error('Sandbox viewer changed')
  const result = await work()
  if (current() !== viewer) throw new Error('Sandbox viewer changed')
  return result
}

/** Match ApiClient headers, including changes on the first client render.
 * The server snapshot is unresolved, so hydration never requests a real-user
 * result before sessionStorage impersonation has been read.
 */
export function useInsightViewer() {
  const { userId, loading } = useAuth()
  const headers = useSyncExternalStore(
    subscribeIdentity,
    identityHeaders,
    () => null,
  )
  return !loading && userId && headers !== null ? `${userId}:${headers}` : null
}

export function useSandboxReporting(
  id: string,
  viewer: string | null,
  selection: InsightSelection,
  options: { analytics?: boolean; learning?: boolean } = {},
) {
  const client = useQueryClient()
  const context = [
    'sandbox-reporting',
    viewer,
    id,
    selection.period,
    selection.group_id,
    selection.subject_member_id ?? null,
    selection.coach_user_id ?? null,
    selection.entity_kind ?? null,
  ] as const
  const analytics = useQuery({
    queryKey: [...context, 'analytics'],
    queryFn: () =>
      withSandboxViewer(viewer, () => SandboxService.analytics(id, selection)),
    enabled: !!viewer && options.analytics !== false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })
  const insights = useQuery({
    queryKey: [...context, 'insights'],
    queryFn: () =>
      withSandboxViewer(viewer, () => SandboxService.insights(id, selection)),
    enabled: !!viewer && options.learning !== false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: query =>
      ['queued', 'generating'].includes(query.state.data?.status ?? '')
        ? 2000
        : 30000,
  })
  const generation = useMutation({
    mutationKey: [...context, 'generate'],
    mutationFn: (request: {
      id: string
      selection: InsightSelection
      queryKey: readonly unknown[]
      viewer: string | null
    }) =>
      withSandboxViewer(request.viewer, () =>
        SandboxService.generateInsights(request.id, request.selection),
      ),
    onSuccess: (result, request) => {
      // Navigation may have removed the originating viewer/selection. Its
      // durable run will be fetched if revisited; do not resurrect that cache.
      const query = client.getQueryCache().find({ queryKey: request.queryKey })
      if (
        query &&
        query.getObserversCount() > 0 &&
        result.sandbox_id === request.id &&
        result.dates.period === request.selection.period &&
        result.selected_group_id === request.selection.group_id &&
        (result.selected_subject_member_id ?? null) ===
          (request.selection.subject_member_id ?? null) &&
        (result.selected_coach_user_id ?? null) ===
          (request.selection.coach_user_id ?? null) &&
        (result.selected_entity_kind ?? null) ===
          (request.selection.entity_kind ?? null)
      ) {
        client.setQueryData(request.queryKey, result)
      }
    },
  })
  // An error may mean removed access: cached data must not remain visible.
  return {
    analytics: viewer && !analytics.isError ? analytics.data : undefined,
    insights:
      viewer && !insights.isError && !analytics.isError
        ? insights.data
        : undefined,
    loading: !viewer || analytics.isPending || insights.isPending,
    error: analytics.isError || insights.isError,
    retry: () => {
      void analytics.refetch()
      void insights.refetch()
    },
    generate: () =>
      generation.mutate({
        id,
        viewer,
        selection: { ...selection },
        queryKey: [...context, 'insights'],
      }),
    generating: generation.isPending,
    generationError: generation.isError,
  }
}
export type SandboxReporting = ReturnType<typeof useSandboxReporting>
