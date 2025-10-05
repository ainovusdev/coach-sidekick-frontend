/**
 * Client Dashboard API Service
 */

// Types
export interface DashboardStats {
  total_sessions: number
  completed_tasks: number
  pending_tasks: number
  active_goals: number
  current_streak_days: number
  next_session: string | null
  unread_notifications: number
}

export interface DashboardSummary {
  client_info: {
    id: string
    name: string
    email: string
    coach_id: string
    member_since: string | null
  }
  stats: DashboardStats
  recent_sessions: SessionSummary[]
  upcoming_tasks: Task[]
  active_goals: ClientGoal[]
  recent_notifications: Notification[]
}

export interface SessionSummary {
  id: string
  session_date: string
  duration_minutes: number
  summary: string | null
  key_topics: string[]
  action_items: any[]
  sentiment_score: number | null
  engagement_level: string | null
  tasks_assigned: number
  materials_shared: number
}

export interface Task {
  id: string
  client_id: string
  session_id: string | null
  assigned_by: string
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date: string | null
  completed_at: string | null
  completed_by: string | null
  tags: string[]
  created_at: string
  updated_at: string
  comment_count?: number
  assignor_name?: string
  client_name?: string
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  content: string
  is_edited: boolean
  edited_at: string | null
  attachments: any[]
  mentions: string[]
  created_at: string
  user_name?: string
  user_role?: string
}

export interface ClientGoal {
  id: string
  title: string
  description?: string
  category: string
  target_date: string | null
  status: 'active' | 'paused' | 'achieved' | 'abandoned'
  progress: number
  milestones: any[]
}

export interface ClientPersona {
  basic_info: {
    age_range: string | null
    occupation: string | null
    location: string | null
    family_situation: string | null
  }
  goals: {
    primary: string[]
    short_term: string[]
    long_term: string[]
  }
  challenges: {
    main_challenges: string[]
    obstacles: string[]
    fears: string[]
  }
  personality: {
    communication_style: string | null
    learning_style: string | null
    traits: string[]
    values: string[]
  }
  development: {
    strengths: string[]
    growth_areas: string[]
    recurring_themes: string[]
    achievements: string[]
  }
  metadata: {
    sessions_analyzed: number
    confidence_score: number
    last_updated: string | null
  }
}

export interface TimelineItem {
  type: 'session' | 'task_completed' | 'goal_achieved'
  date: string
  title: string
  description: string
  data: any
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  data: any
}

class ClientDashboardAPI {
  constructor() {
    // ApiClient is not used since we're using clientFetch directly
  }

  private getClientToken(): string | null {
    return localStorage.getItem('client_auth_token')
  }

  private async clientFetch<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const token = this.getClientToken()
    if (!token) {
      throw new Error('No client authentication token')
    }

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
    const response = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || `Request failed: ${response.statusText}`)
    }

    return response.json()
  }

  // Dashboard
  async getDashboard(): Promise<DashboardSummary> {
    return this.clientFetch<DashboardSummary>('/client/dashboard')
  }

  // Sessions
  async getSessions(
    skip = 0,
    limit = 20,
    status?: string,
  ): Promise<SessionSummary[]> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    })
    if (status) params.append('status', status)

    return this.clientFetch<SessionSummary[]>(`/client/sessions?${params}`)
  }

  async getSessionDetails(sessionId: string) {
    return this.clientFetch(`/client/sessions/${sessionId}`)
  }

  // Tasks
  async getTasks(filters?: {
    status?: string
    priority?: string
    skip?: number
    limit?: number
  }): Promise<Task[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.priority) params.append('priority', filters.priority)
    if (filters?.skip !== undefined)
      params.append('skip', filters.skip.toString())
    if (filters?.limit !== undefined)
      params.append('limit', filters.limit.toString())

    return this.clientFetch<Task[]>(`/tasks?${params}`)
  }

  async getTask(taskId: string): Promise<Task> {
    return this.clientFetch<Task>(`/tasks/${taskId}`)
  }

  async updateTaskStatus(
    taskId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled',
  ): Promise<Task> {
    return this.clientFetch<Task>(`/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  async addTaskComment(
    taskId: string,
    content: string,
    mentions: string[] = [],
  ): Promise<TaskComment> {
    return this.clientFetch<TaskComment>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        mentions,
        attachments: [],
      }),
    })
  }

  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    return this.clientFetch<TaskComment[]>(`/tasks/${taskId}/comments`)
  }

  // Persona
  async getPersona(): Promise<ClientPersona | { message: string }> {
    return this.clientFetch<ClientPersona | { message: string }>(
      '/client/persona',
    )
  }

  // Timeline
  async getTimeline(
    startDate?: string,
    endDate?: string,
  ): Promise<TimelineItem[]> {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)

    return this.clientFetch<TimelineItem[]>(`/client/timeline?${params}`)
  }

  // Notifications
  async getNotifications(limit = 10): Promise<Notification[]> {
    return this.clientFetch<Notification[]>(`/notifications?limit=${limit}`)
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    return this.clientFetch<void>(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    })
  }

  async markAllNotificationsRead(): Promise<void> {
    return this.clientFetch<void>('/notifications/mark-all-read', {
      method: 'POST',
    })
  }
}

// Export singleton instance
export const clientDashboardAPI = new ClientDashboardAPI()
