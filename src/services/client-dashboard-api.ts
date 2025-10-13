/**
 * Client Dashboard API Service
 */

import axiosInstance from '@/lib/axios-config'

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
  // Dashboard
  async getDashboard(): Promise<DashboardSummary> {
    const response = await axiosInstance.get('/client/dashboard')
    return response.data
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

    const response = await axiosInstance.get(`/client/sessions?${params}`)
    return response.data
  }

  async getSessionDetails(sessionId: string) {
    const response = await axiosInstance.get(`/client/sessions/${sessionId}`)
    return response.data
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

    const response = await axiosInstance.get(`/tasks?${params}`)
    return response.data
  }

  async getTask(taskId: string): Promise<Task> {
    const response = await axiosInstance.get(`/tasks/${taskId}`)
    return response.data
  }

  async updateTaskStatus(
    taskId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled',
  ): Promise<Task> {
    const response = await axiosInstance.patch(`/tasks/${taskId}/status`, {
      status,
    })
    return response.data
  }

  async addTaskComment(
    taskId: string,
    content: string,
    mentions: string[] = [],
  ): Promise<TaskComment> {
    const response = await axiosInstance.post(`/tasks/${taskId}/comments`, {
      content,
      mentions,
      attachments: [],
    })
    return response.data
  }

  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    const response = await axiosInstance.get(`/tasks/${taskId}/comments`)
    return response.data
  }

  // Persona
  async getPersona(): Promise<ClientPersona | { message: string }> {
    const response = await axiosInstance.get('/client/persona')
    return response.data
  }

  // Timeline
  async getTimeline(
    startDate?: string,
    endDate?: string,
  ): Promise<TimelineItem[]> {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)

    const response = await axiosInstance.get(`/client/timeline?${params}`)
    return response.data
  }

  // Notifications
  async getNotifications(limit = 10): Promise<Notification[]> {
    const response = await axiosInstance.get(`/notifications?limit=${limit}`)
    return response.data
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await axiosInstance.patch(`/notifications/${notificationId}/read`)
  }

  async markAllNotificationsRead(): Promise<void> {
    await axiosInstance.post('/notifications/mark-all-read')
  }
}

// Export singleton instance
export const clientDashboardAPI = new ClientDashboardAPI()
