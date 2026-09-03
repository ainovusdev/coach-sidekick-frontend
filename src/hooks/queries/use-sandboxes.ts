import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { SandboxService } from '@/services/sandbox-service'
import type { SandboxListFilters } from '@/types/sandbox'

export function useDebouncedValue<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export function useSandboxes(filters: SandboxListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.sandboxes.list(filters),
    queryFn: () => SandboxService.list(filters),
    staleTime: 60 * 1000,
  })
}

export function useSandboxOverview(id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.sandboxes.overview(id ?? ''),
    queryFn: () => SandboxService.overview(id as string),
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

export function useTermPreview(start: string | null, months: number | null) {
  return useQuery({
    queryKey: queryKeys.sandboxes.termPreview(start ?? '', months ?? 0),
    queryFn: () =>
      SandboxService.termPreview(start as string, months as number),
    enabled: !!start && !!months,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Before/after of regenerating the timeline for a term. `start`/`months`
 * default to the sandbox's current term on the server.
 */
export function useRegeneratePreview(
  sandboxId: string,
  start: string | null,
  months: number | null,
  overwrite: boolean,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.sandboxes.regeneratePreview(
      sandboxId,
      start ?? '',
      months ?? 0,
      overwrite,
    ),
    queryFn: () =>
      SandboxService.regeneratePreview(sandboxId, {
        term_start: start ?? undefined,
        term_months: months ?? undefined,
        overwrite_hand_adjusted: overwrite,
      }),
    enabled: enabled && !!sandboxId,
    staleTime: 0,
  })
}

export function useSandboxPeopleSearch(
  q: string,
  sandboxId?: string,
  enabled = true,
) {
  const debounced = useDebouncedValue(q.trim(), 200)
  return useQuery({
    queryKey: queryKeys.sandboxes.peopleSearch(debounced, sandboxId),
    queryFn: () => SandboxService.searchPeople(debounced, sandboxId),
    enabled,
    staleTime: 30 * 1000,
  })
}

export function useEmailLookup(sandboxId: string, email: string) {
  const debounced = useDebouncedValue(email.trim().toLowerCase(), 300)
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(debounced)
  return useQuery({
    queryKey: queryKeys.sandboxes.lookup(sandboxId, debounced),
    queryFn: () => SandboxService.lookupEmail(sandboxId, debounced),
    enabled: !!sandboxId && looksLikeEmail,
    staleTime: 30 * 1000,
  })
}

export function useInvitationPreview(
  sandboxId: string,
  memberId: string | null,
) {
  return useQuery({
    queryKey: queryKeys.sandboxes.emailPreview(sandboxId, memberId ?? ''),
    queryFn: () =>
      SandboxService.previewInvitation(sandboxId, memberId as string),
    enabled: !!sandboxId && !!memberId,
  })
}

export function useMySandboxes(enabled = true) {
  return useQuery({
    queryKey: queryKeys.sandboxes.mine(),
    queryFn: () => SandboxService.mine(),
    enabled,
    staleTime: 60 * 1000,
  })
}

export function useAddedEmailPreview(
  sandboxId: string,
  memberId: string | null,
) {
  return useQuery({
    queryKey: queryKeys.sandboxes.addedEmailPreview(sandboxId, memberId ?? ''),
    queryFn: () =>
      SandboxService.previewAddedEmail(sandboxId, memberId as string),
    enabled: !!sandboxId && !!memberId,
  })
}

export function useSandboxWelcome(sandboxId: string | null) {
  return useQuery({
    queryKey: queryKeys.sandboxes.welcome(sandboxId ?? ''),
    queryFn: () => SandboxService.welcome(sandboxId as string),
    enabled: !!sandboxId,
  })
}

/** Query-driven, no sockets: fresh for a minute, refetched on focus. */
export function useSandboxDashboard(includeEnded = false, enabled = true) {
  return useQuery({
    queryKey: queryKeys.sandboxes.dashboard(includeEnded),
    queryFn: () => SandboxService.dashboard(includeEnded),
    enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

export function useSandboxDelivery(id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.sandboxes.delivery(id ?? ''),
    queryFn: () => SandboxService.delivery(id as string),
    enabled: !!id,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

export function useClientSandboxContext(clientId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.sandboxes.clientContext(clientId ?? ''),
    queryFn: () => SandboxService.clientContext(clientId as string),
    enabled: !!clientId,
    staleTime: 60 * 1000,
  })
}

function activeClientId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return sessionStorage.getItem('active_client_id')
  } catch {
    return null
  }
}

/** The coachee's card, keyed by the active profile so switching profiles refetches. */
export function useCoacheeSandbox(enabled = true) {
  const active = activeClientId()
  return useQuery({
    queryKey: queryKeys.sandboxes.coachee(active),
    queryFn: () => SandboxService.coacheeSandbox(),
    enabled,
    staleTime: 60 * 1000,
  })
}
