import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

function getAuthHeaders() {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function clientFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: getAuthHeaders() })
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.status}`)
  }
  return res.json()
}

// ---- Types ----

export interface ClientSession {
  id: string
  session_date: string
  duration_minutes: number
  summary?: string
  key_topics: string[]
  action_items: string[]
  sentiment_score?: number
  engagement_level?: string
  tasks_assigned: number
  materials_shared: number
  is_group_session?: boolean
  status?: string
}

export interface ClientSessionDetailData {
  session: {
    id: string
    started_at: string | null
    ended_at: string | null
    duration_minutes: number
    status: string
    summary: string | null
    key_topics: string[]
    action_items: any[]
    is_group_session?: boolean
    coach: {
      id: string
      name: string
      email: string
    } | null
  }
  transcript: Array<{
    speaker: string
    text: string
    timestamp: string
  }>
  tasks: Array<{
    id: string
    title: string
    description: string
    status: string
    priority: string
    due_date: string | null
  }>
  materials: Array<{
    id: string
    title: string
    description: string
    material_type: string
    file_url: string
  }>
  insights: {
    sentiment: {
      overall: string
      score: number
      emotions: string[]
      engagement: string
    }
    topics: string[]
    keywords: string[]
    insights: string[]
    action_items: string[]
    suggestions: Array<{
      text?: string
      suggestion?: string
      target?: string
      type?: string
    }>
    recommendations: any
    wins: Array<{
      id: string
      title: string
      description?: string
    }>
    progress_indicators: any
  } | null
}

export interface ClientDashboardStats {
  total_sessions: number
  this_month: number
  streak_days: number
  average_duration: number
}

// ---- Hooks ----

export function useClientSessions(
  page: number = 1,
  limit: number = 10,
  options?: Omit<UseQueryOptions<ClientSession[]>, 'queryKey' | 'queryFn'>,
) {
  const skip = (page - 1) * limit
  return useQuery({
    queryKey: queryKeys.clientPortal.sessionList(page),
    queryFn: () =>
      clientFetch<ClientSession[]>(
        `/client/sessions?skip=${skip}&limit=${limit}`,
      ),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

export function useClientSessionDetail(
  sessionId: string | undefined,
  options?: Omit<
    UseQueryOptions<ClientSessionDetailData>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  return useQuery({
    queryKey: queryKeys.clientPortal.sessionDetail(sessionId!),
    queryFn: () =>
      clientFetch<ClientSessionDetailData>(`/client/sessions/${sessionId}`),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

export function useClientDashboardStats(
  options?: Omit<UseQueryOptions<ClientDashboardStats>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.clientPortal.dashboardStats(),
    queryFn: async () => {
      const data = await clientFetch<any>('/client/dashboard')
      return {
        total_sessions: data.stats?.total_sessions ?? 0,
        this_month: data.stats?.this_month ?? 0,
        streak_days: data.stats?.streak_days ?? 0,
        average_duration: data.stats?.average_duration ?? 0,
      } as ClientDashboardStats
    },
    staleTime: 10 * 60 * 1000,
    ...options,
  })
}
