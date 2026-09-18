import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { captureException } from '@/lib/posthog-capture'

/**
 * Only report *unexpected* failures to PostHog error tracking:
 * - Skip errors already captured at the source (ApiClient tags `__phCaptured`
 *   on 5xx/network) to avoid double-counting.
 * - Skip routine 4xx (auth/permission/not-found/validation) — these are
 *   expected user/flow errors, not bugs, and would just be noise. Mirrors the
 *   `captureUnexpectedAuthError` filter in `auth-context.tsx`.
 */
function reportUnexpectedQueryError(
  error: unknown,
  properties: Record<string, unknown>,
) {
  const e = error as {
    __phCaptured?: boolean
    status?: number
    response?: { status?: number }
  }
  if (e?.__phCaptured) return
  const status = e?.status ?? e?.response?.status
  if (status && status >= 400 && status < 500) return
  captureException(error, properties)
}

/**
 * Global QueryClient configuration for TanStack Query
 *
 * Default strategy: Stale-while-revalidate
 * - Shows cached data immediately while fetching fresh data in background
 * - Provides instant navigation with eventual consistency
 */
/** 4xx responses are the server's final answer; only retry anything else, once. */
function retryOnceUnlessClientError(
  failureCount: number,
  error: unknown,
): boolean {
  const status = (error as { status?: number } | null)?.status
  if (typeof status === 'number' && status >= 400 && status < 500) return false
  return failureCount < 1
}

export const queryClient = new QueryClient({
  // Report every query/mutation failure to PostHog error tracking. Doing it at
  // the cache level instruments all ~25 hook files at once; individual hooks
  // still keep their own onError toasts.
  queryCache: new QueryCache({
    onError: (error, query) => {
      reportUnexpectedQueryError(error, {
        source: 'react-query',
        queryKey: query.queryKey,
      })
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      reportUnexpectedQueryError(error, {
        source: 'react-query-mutation',
        mutationKey: mutation.options.mutationKey,
      })
    },
  }),
  defaultOptions: {
    queries: {
      // Stale time: Data is considered fresh for 5 minutes
      // During this time, no refetch will occur automatically
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Garbage collection time: Keep unused data in cache for 10 minutes
      // Renamed from cacheTime in v5
      gcTime: 10 * 60 * 1000, // 10 minutes

      // Refetch on window focus to keep data fresh
      refetchOnWindowFocus: true,

      // Refetch when network connection is restored
      refetchOnReconnect: true,

      // Retry failed requests once — but never a 4xx, which fails the same
      // way again (and a 409 is a decision the UI has to present right away)
      retry: retryOnceUnlessClientError,

      // Retry delay with exponential backoff
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Network mode - online only (don't use cache-only data)
      networkMode: 'online',
    },
    mutations: {
      // Retry failed mutations once, never on a 4xx (see above). A retry also
      // waits while the tab is hidden, which held a 409 back for as long as
      // the tab stayed in the background.
      retry: retryOnceUnlessClientError,

      // Network mode for mutations
      networkMode: 'online',
    },
  },
})

/**
 * Cache key factories for consistent cache keys across the app
 * Using factory pattern prevents typos and makes refactoring easier
 */
export const queryKeys = {
  // Client keys
  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.clients.lists(), { filters }] as const,
    simple: () => [...queryKeys.clients.all, 'simple'] as const, // Lightweight list for dropdowns
    details: () => [...queryKeys.clients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
    sessions: (id: string) =>
      [...queryKeys.clients.detail(id), 'sessions'] as const,
    stats: (id: string) => [...queryKeys.clients.detail(id), 'stats'] as const,
  },

  // Session keys
  sessions: {
    all: ['sessions'] as const,
    lists: () => [...queryKeys.sessions.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.sessions.lists(), { filters }] as const,
    details: () => [...queryKeys.sessions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sessions.details(), id] as const,
    analysis: (id: string) =>
      [...queryKeys.sessions.detail(id), 'analysis'] as const,
    transcript: (id: string) =>
      [...queryKeys.sessions.detail(id), 'transcript'] as const,
    review: (id: string) =>
      [...queryKeys.sessions.detail(id), 'review'] as const,
    notes: (id: string, clientId?: string) =>
      [
        ...queryKeys.sessions.detail(id),
        'notes',
        ...(clientId ? [clientId] : []),
      ] as const,
  },

  // Bot/Meeting keys
  bots: {
    all: ['bots'] as const,
    detail: (botId: string) => [...queryKeys.bots.all, botId] as const,
    transcript: (botId: string) =>
      [...queryKeys.bots.detail(botId), 'transcript'] as const,
    status: (botId: string) =>
      [...queryKeys.bots.detail(botId), 'status'] as const,
  },

  // Commitment keys
  commitments: {
    all: ['commitments'] as const,
    lists: () => [...queryKeys.commitments.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.commitments.lists(), { filters }] as const,
    detail: (id: string) => [...queryKeys.commitments.all, id] as const,
  },

  // Generic comment threads (commitments today; more targets later)
  comments: {
    all: ['comments'] as const,
    list: (targetType: string, targetId: string) =>
      [...queryKeys.comments.all, targetType, targetId] as const,
  },

  // Sprint keys
  sprints: {
    all: ['sprints'] as const,
    lists: () => [...queryKeys.sprints.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.sprints.lists(), { filters }] as const,
    detail: (id: string) => [...queryKeys.sprints.all, id] as const,
  },

  // Video comment keys
  videoComments: {
    all: ['video-comments'] as const,
    list: (sessionId: string) =>
      [...queryKeys.videoComments.all, sessionId] as const,
  },

  // Session share keys
  sessionShares: {
    all: ['session-shares'] as const,
    list: (sessionId: string) =>
      [...queryKeys.sessionShares.all, sessionId] as const,
  },

  // Coach evaluation keys
  coachEvaluations: {
    all: ['coach-evaluations'] as const,
    list: (sessionId: string) =>
      [...queryKeys.coachEvaluations.all, sessionId] as const,
  },

  // Coach typeahead search
  coachSearch: {
    all: ['coach-search'] as const,
    query: (q: string) => [...queryKeys.coachSearch.all, q] as const,
  },

  // Persona keys
  personas: {
    all: ['personas'] as const,
    list: () => [...queryKeys.personas.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.personas.all, id] as const,
    client: (clientId: string) =>
      [...queryKeys.personas.all, 'client', clientId] as const,
  },

  // Target keys
  targets: {
    all: ['targets'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.targets.all, 'list', { filters }] as const,
    detail: (id: string) => [...queryKeys.targets.all, id] as const,
  },

  // Goal keys
  goals: {
    all: ['goals'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.goals.all, 'list', { filters }] as const,
    detail: (id: string) => [...queryKeys.goals.all, id] as const,
  },

  // Calendar integration keys
  calendar: {
    all: ['calendar'] as const,
    status: () => [...queryKeys.calendar.all, 'status'] as const,
  },

  // Group session keys
  groupSessions: {
    all: ['group-sessions'] as const,
    lists: () => [...queryKeys.groupSessions.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.groupSessions.lists(), { filters }] as const,
    details: () => [...queryKeys.groupSessions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.groupSessions.details(), id] as const,
    participants: (id: string) =>
      [...queryKeys.groupSessions.detail(id), 'participants'] as const,
  },

  // People search (assign / mention pickers)
  people: {
    all: ['people'] as const,
    search: (q: string, context?: string | null) =>
      [...queryKeys.people.all, 'search', q, context ?? null] as const,
  },

  // Sandbox v2 (client contracts, admin panel)
  sandboxes: {
    all: ['sandboxes'] as const,
    lists: () => [...queryKeys.sandboxes.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.sandboxes.lists(), { filters }] as const,
    details: () => [...queryKeys.sandboxes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sandboxes.details(), id] as const,
    overview: (id: string) =>
      [...queryKeys.sandboxes.detail(id), 'overview'] as const,
    peopleSearch: (q: string, sandboxId?: string) =>
      [
        ...queryKeys.sandboxes.all,
        'people-search',
        q,
        sandboxId ?? null,
      ] as const,
    lookup: (id: string, email: string) =>
      [...queryKeys.sandboxes.detail(id), 'lookup', email] as const,
    termPreview: (start: string, months: number) =>
      [...queryKeys.sandboxes.all, 'term-preview', start, months] as const,
    regeneratePreview: (
      id: string,
      start: string,
      months: number,
      overwrite: boolean,
    ) =>
      [
        ...queryKeys.sandboxes.detail(id),
        'regenerate-preview',
        start,
        months,
        overwrite,
      ] as const,
    emailPreview: (id: string, memberId: string) =>
      [...queryKeys.sandboxes.detail(id), 'email-preview', memberId] as const,
    addedEmailPreview: (id: string, memberId: string) =>
      [...queryKeys.sandboxes.detail(id), 'added-email', memberId] as const,
    mine: () => [...queryKeys.sandboxes.all, 'mine'] as const,
    welcome: (id: string) =>
      [...queryKeys.sandboxes.detail(id), 'welcome'] as const,
    dashboard: (includeEnded: boolean) =>
      [...queryKeys.sandboxes.all, 'dashboard', includeEnded] as const,
    delivery: (id: string) =>
      [...queryKeys.sandboxes.detail(id), 'delivery'] as const,
    attention: (id: string) =>
      [...queryKeys.sandboxes.detail(id), 'attention'] as const,
    clientContext: (clientId: string) =>
      [...queryKeys.sandboxes.all, 'client-context', clientId] as const,
    coachee: (activeClientId: string | null) =>
      [...queryKeys.sandboxes.all, 'coachee', activeClientId] as const,
    outcomes: (id: string) =>
      [...queryKeys.sandboxes.detail(id), 'outcomes'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (unreadOnly: boolean) =>
      [...queryKeys.notifications.all, 'list', unreadOnly] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
    settings: () => [...queryKeys.notifications.all, 'settings'] as const,
  },

  // Client portal keys
  clientPortal: {
    all: ['client-portal'] as const,
    sessions: () => [...queryKeys.clientPortal.all, 'sessions'] as const,
    sessionList: (page?: number) =>
      [...queryKeys.clientPortal.sessions(), 'list', { page }] as const,
    sessionDetail: (id: string) =>
      [...queryKeys.clientPortal.sessions(), 'detail', id] as const,
    dashboardStats: () =>
      [...queryKeys.clientPortal.all, 'dashboard-stats'] as const,
  },

  // Admin keys
  admin: {
    // User management keys
    users: {
      all: ['admin', 'users'] as const,
      lists: () => [...queryKeys.admin.users.all, 'list'] as const,
      list: (params?: {
        skip?: number
        limit?: number
        search?: string
        role_filter?: string
        include_deleted?: boolean
      }) => [...queryKeys.admin.users.lists(), { params }] as const,
      detail: (id: string) =>
        [...queryKeys.admin.users.all, 'detail', id] as const,
    },

    // Role management keys
    roles: {
      all: ['admin', 'roles'] as const,
      available: () => [...queryKeys.admin.roles.all, 'available'] as const,
      user: (userId: string) =>
        [...queryKeys.admin.roles.all, 'user', userId] as const,
    },

    // Access matrix keys
    access: {
      all: ['admin', 'access'] as const,
      matrix: (params?: { skip?: number; limit?: number }) =>
        [...queryKeys.admin.access.all, 'matrix', { params }] as const,
      user: (userId: string) =>
        [...queryKeys.admin.access.all, 'user', userId] as const,
      client: (clientId: string) =>
        [...queryKeys.admin.access.all, 'client', clientId] as const,
    },

    // Coach access keys
    coachAccess: {
      all: ['admin', 'coach-access'] as const,
      list: () => [...queryKeys.admin.coachAccess.all, 'list'] as const,
      byRole: (role: string) =>
        [...queryKeys.admin.coachAccess.all, 'role', role] as const,
    },

    // Dashboard keys (composite data)
    dashboard: {
      stats: () => ['admin', 'dashboard', 'stats'] as const,
    },

    // Admin client management keys
    clients: {
      all: ['admin', 'clients'] as const,
      lists: () => [...queryKeys.admin.clients.all, 'list'] as const,
      list: (params?: {
        skip?: number
        limit?: number
        search?: string
        coach_id?: string
        tags?: string
      }) => [...queryKeys.admin.clients.lists(), { params }] as const,
      detail: (id: string) =>
        [...queryKeys.admin.clients.all, 'detail', id] as const,
      stats: () => [...queryKeys.admin.clients.all, 'stats'] as const,
    },

    // Sidekick Agent threads
    agentThreads: {
      all: ['admin', 'agent-threads'] as const,
      list: () => [...queryKeys.admin.agentThreads.all, 'list'] as const,
      detail: (id: string) =>
        [...queryKeys.admin.agentThreads.all, 'detail', id] as const,
    },

    // Cross-owner agent-chats oversight (grouped by coach/client/admin)
    agentChats: {
      all: ['admin', 'agent-chats'] as const,
      groups: (groupBy: string) =>
        [...queryKeys.admin.agentChats.all, 'groups', groupBy] as const,
      thread: (id: string) =>
        [...queryKeys.admin.agentChats.all, 'thread', id] as const,
    },
  },
} as const

/**
 * Helper to invalidate related queries after mutations
 * Example: After creating a session, invalidate both sessions list and client sessions
 */
export const invalidateQueries = {
  /** An outcome moved: the panel, both cards, the dashboards and the bell. */
  afterOutcomeChange: async (queryClient: QueryClient, sandboxId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['sandbox-entity'] }),
      queryClient.invalidateQueries({ queryKey: ['sandbox-reporting'] }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.sandboxes.outcomes(sandboxId),
      }),
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sandboxes.all, 'client-context'],
      }),
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sandboxes.all, 'coachee'],
      }),
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sandboxes.all, 'dashboard'],
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
    ])
  },
  afterSandboxUpdate: async (queryClient: QueryClient, sandboxId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.sandboxes.lists() }),
      sandboxId
        ? queryClient.invalidateQueries({
            queryKey: queryKeys.sandboxes.detail(sandboxId),
          })
        : queryClient.invalidateQueries({ queryKey: queryKeys.sandboxes.all }),
      // coachees become clients of the group's coaches
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all }),
    ])
  },

  afterGroupSessionUpdate: async (
    queryClient: QueryClient,
    sessionId?: string,
  ) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.groupSessions.all,
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all }),
      sessionId &&
        queryClient.invalidateQueries({
          queryKey: queryKeys.groupSessions.detail(sessionId),
        }),
    ])
  },

  /**
   * A commitment changed shape (related, created alongside another, ticked
   * from a related list): every list and detail under the prefix, the
   * sandbox overview when it sits on one (timeline cards carry counts), and
   * the bell for whoever was assigned.
   */
  afterCommitmentChange: async (
    queryClient: QueryClient,
    opts: { sandboxId?: string | null } = {},
  ) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all }),
      opts.sandboxId &&
        queryClient.invalidateQueries({
          queryKey: queryKeys.sandboxes.detail(opts.sandboxId),
        }),
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
    ])
  },

  /**
   * A comment was posted / edited / deleted on `targetId`. The commitment
   * detail embeds the thread, and a mention or reply lands in the bell.
   */
  afterCommentChange: async (
    queryClient: QueryClient,
    targetType: string,
    targetId: string,
  ) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.list(targetType, targetId),
      }),
      targetType === 'commitment' &&
        queryClient.invalidateQueries({
          queryKey: queryKeys.commitments.detail(targetId),
        }),
      // Outcome rows carry a comment count, on the cockpit and both cards.
      targetType === 'outcome' &&
        queryClient.invalidateQueries({ queryKey: queryKeys.sandboxes.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
    ])
  },
}

/**
 * Invalidation helpers for admin mutations
 */
export const invalidateAdminQueries = {
  afterUserUpdate: async (queryClient: QueryClient, userId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.dashboard.stats(),
      }),
      userId &&
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.users.detail(userId),
        }),
    ])
  },

  afterRoleUpdate: async (queryClient: QueryClient) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles.all }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.dashboard.stats(),
      }),
    ])
  },

  afterAccessUpdate: async (queryClient: QueryClient) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.access.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.dashboard.stats(),
      }),
    ])
  },

  afterCoachAccessUpdate: async (queryClient: QueryClient) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.coachAccess.all,
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.access.all }),
    ])
  },

  afterAdminClientUpdate: async (
    queryClient: QueryClient,
    clientId?: string,
  ) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients.all }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.dashboard.stats(),
      }),
      clientId &&
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.clients.detail(clientId),
        }),
    ])
  },
}
