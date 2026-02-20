import { QueryClient } from '@tanstack/react-query'

/**
 * Global QueryClient configuration for TanStack Query
 *
 * Default strategy: Stale-while-revalidate
 * - Shows cached data immediately while fetching fresh data in background
 * - Provides instant navigation with eventual consistency
 */
export const queryClient = new QueryClient({
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

      // Retry failed requests once
      retry: 1,

      // Retry delay with exponential backoff
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Network mode - online only (don't use cache-only data)
      networkMode: 'online',
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,

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
    notes: (id: string) => [...queryKeys.sessions.detail(id), 'notes'] as const,
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

  // Task keys
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.tasks.lists(), { filters }] as const,
    detail: (id: string) => [...queryKeys.tasks.all, id] as const,
  },

  // Sprint keys
  sprints: {
    all: ['sprints'] as const,
    lists: () => [...queryKeys.sprints.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.sprints.lists(), { filters }] as const,
    detail: (id: string) => [...queryKeys.sprints.all, id] as const,
  },

  // Persona keys
  personas: {
    all: ['personas'] as const,
    list: () => [...queryKeys.personas.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.personas.all, id] as const,
    client: (clientId: string) =>
      [...queryKeys.personas.all, 'client', clientId] as const,
  },

  // Dashboard keys (composite data)
  dashboard: {
    client: (clientId: string) => ['dashboard', 'client', clientId] as const,
    coach: () => ['dashboard', 'coach'] as const,
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

  // Metrics keys
  metrics: {
    coach: (coachId?: string) => ['metrics', 'coach', coachId] as const,
    system: () => ['metrics', 'system'] as const,
  },

  // User/Auth keys
  user: {
    current: () => ['user', 'current'] as const,
    preferences: () => ['user', 'preferences'] as const,
  },

  // Resource keys (coach side)
  resources: {
    all: ['resources'] as const,
    lists: () => [...queryKeys.resources.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.resources.lists(), { filters }] as const,
    detail: (id: string) => [...queryKeys.resources.all, id] as const,
    categories: () => [...queryKeys.resources.all, 'categories'] as const,
  },

  // Client resource keys
  clientResources: {
    all: ['client-resources'] as const,
    lists: () => [...queryKeys.clientResources.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.clientResources.lists(), { filters }] as const,
    detail: (id: string) => [...queryKeys.clientResources.all, id] as const,
  },

  // Program keys
  programs: {
    all: ['programs'] as const,
    lists: () => [...queryKeys.programs.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.programs.lists(), { filters }] as const,
    details: () => [...queryKeys.programs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.programs.details(), id] as const,
    dashboard: (id: string) =>
      [...queryKeys.programs.detail(id), 'dashboard'] as const,
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

    // Audit log keys
    auditLog: {
      all: ['admin', 'audit-log'] as const,
      list: (params?: {
        limit?: number
        resource_type?: string
        user_id?: string
        action?: string
        start_date?: string
        end_date?: string
      }) => [...queryKeys.admin.auditLog.all, { params }] as const,
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
        program_id?: string
        tags?: string
      }) => [...queryKeys.admin.clients.lists(), { params }] as const,
      detail: (id: string) =>
        [...queryKeys.admin.clients.all, 'detail', id] as const,
      stats: () => [...queryKeys.admin.clients.all, 'stats'] as const,
    },
  },
} as const

/**
 * Helper to invalidate related queries after mutations
 * Example: After creating a session, invalidate both sessions list and client sessions
 */
export const invalidateQueries = {
  afterClientUpdate: async (queryClient: QueryClient, clientId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.clients.detail(clientId),
      }),
    ])
  },

  afterSessionUpdate: async (
    queryClient: QueryClient,
    sessionId: string,
    clientId?: string,
  ) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(sessionId),
      }),
      clientId &&
        queryClient.invalidateQueries({
          queryKey: queryKeys.clients.sessions(clientId),
        }),
    ])
  },

  afterCommitmentUpdate: async (queryClient: QueryClient) => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.commitments.all })
  },

  afterTaskUpdate: async (queryClient: QueryClient) => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
  },

  afterProgramUpdate: async (queryClient: QueryClient, programId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.all }),
      programId &&
        queryClient.invalidateQueries({
          queryKey: queryKeys.programs.detail(programId),
        }),
      programId &&
        queryClient.invalidateQueries({
          queryKey: queryKeys.programs.dashboard(programId),
        }),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.all }),
      clientId &&
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.clients.detail(clientId),
        }),
    ])
  },
}
