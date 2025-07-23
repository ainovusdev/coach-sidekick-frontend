export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      coaching_sessions: {
        Row: {
          id: string
          user_id: string
          bot_id: string
          meeting_url: string
          status: string
          client_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bot_id: string
          meeting_url: string
          status?: string
          client_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bot_id?: string
          meeting_url?: string
          status?: string
          client_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          coach_id: string
          name: string
          email?: string
          phone?: string
          company?: string
          position?: string
          notes?: string
          tags: Json
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          name: string
          email?: string
          phone?: string
          company?: string
          position?: string
          notes?: string
          tags?: Json
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          name?: string
          email?: string
          phone?: string
          company?: string
          position?: string
          notes?: string
          tags?: Json
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      client_session_stats: {
        Row: {
          client_id: string
          total_sessions: number
          total_duration_minutes: number
          last_session_date?: string
          average_engagement_score?: number
          average_overall_score?: number
          improvement_trends: Json
          coaching_focus_areas: Json
          updated_at: string
        }
        Insert: {
          client_id: string
          total_sessions?: number
          total_duration_minutes?: number
          last_session_date?: string
          average_engagement_score?: number
          average_overall_score?: number
          improvement_trends?: Json
          coaching_focus_areas?: Json
          updated_at?: string
        }
        Update: {
          client_id?: string
          total_sessions?: number
          total_duration_minutes?: number
          last_session_date?: string
          average_engagement_score?: number
          average_overall_score?: number
          improvement_trends?: Json
          coaching_focus_areas?: Json
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
