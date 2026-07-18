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
    triggers: string[]
    breakthrough_moments: string[]
  }
  metadata: {
    sessions_analyzed: number
    confidence_score: number
    last_updated: string | null
  }
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

  // Persona
  async getPersona(): Promise<ClientPersona | { message: string }> {
    const response = await axiosInstance.get('/client/persona')
    return response.data
  }

  // Progress
  async getProgress(): Promise<any> {
    const response = await axiosInstance.get('/client-portal/insights/progress')
    return response.data
  }

  // Goals
  async getGoals(): Promise<any[]> {
    const response = await axiosInstance.get('/client-portal/goals')
    return response.data
  }

  // Commitments (client portal)
  async getClientCommitments(status?: string): Promise<any[]> {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    const response = await axiosInstance.get(
      `/client-portal/commitments?${params}`,
    )
    return response.data
  }
}

// Export singleton instance
export const clientDashboardAPI = new ClientDashboardAPI()
