import { useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'

import {
  fetchAgentInsight,
  type AgentApiScope,
  type AgentInsightResult,
} from '@/services/agent-service'

export function agentInsightKey(scope: AgentApiScope, prompt: string | null) {
  return ['agent-insight', scope, prompt] as const
}

interface UseAgentInsightOptions {
  /** Gate generation (e.g. until the data the prompt references has loaded). */
  enabled?: boolean
}

/**
 * Fetch a one-shot passive insight for a UI-composed prompt.
 *
 * The server already caches by prompt hash, so we set `staleTime: Infinity` — the
 * card won't re-bill on remount or window focus. The Regenerate button forces one
 * fresh server run (cache bypass) by flipping a ref that the next `refetch()` reads,
 * which lets us reuse react-query's own loading/error state instead of hand-rolling it.
 */
export function useAgentInsight(
  prompt: string | null,
  scope: AgentApiScope,
  { enabled = true }: UseAgentInsightOptions = {},
) {
  const regenerateRef = useRef(false)

  const query = useQuery<AgentInsightResult, Error>({
    queryKey: agentInsightKey(scope, prompt),
    queryFn: async () => {
      const regenerate = regenerateRef.current
      regenerateRef.current = false
      return fetchAgentInsight({ prompt: prompt as string, scope, regenerate })
    },
    enabled: !!prompt && enabled,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  })

  const regenerate = useCallback(() => {
    regenerateRef.current = true
    return query.refetch()
  }, [query])

  return { ...query, regenerate }
}
