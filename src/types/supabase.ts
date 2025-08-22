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
          coaching_preference: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          coaching_preference?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          coaching_preference?: string | null
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
      session_insights: {
        Row: {
          id: string
          session_id: string
          bot_id: string
          user_id: string
          client_id?: string
          transcript_duration_minutes?: number
          total_word_count?: number
          speaker_word_counts: Json
          overall_score?: number
          conversation_phase?: 'opening' | 'exploration' | 'insight' | 'commitment' | 'closing'
          coach_energy_level?: number
          client_engagement_level?: number
          criteria_scores: Json
          go_live_alignment: Json
          key_insights: string[]
          patterns_detected: string[]
          breakthrough_moments: string[]
          resistance_patterns: string[]
          client_commitments: string[]
          suggested_followups: string[]
          homework_assignments: string[]
          most_effective_interventions: string[]
          missed_opportunities: string[]
          coaching_strengths: string[]
          areas_for_improvement: string[]
          executive_summary?: string
          session_theme?: string
          key_topics_discussed: string[]
          emotional_journey?: string
          progress_since_last_session?: string
          recurring_themes: string[]
          evolution_of_challenges?: string
          recommended_resources: string[]
          suggested_tools: string[]
          next_session_focus?: string
          generated_at: string
          generation_model: string
          analysis_version: string
          raw_analysis_data?: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          bot_id: string
          user_id: string
          client_id?: string
          transcript_duration_minutes?: number
          total_word_count?: number
          speaker_word_counts?: Json
          overall_score?: number
          conversation_phase?: 'opening' | 'exploration' | 'insight' | 'commitment' | 'closing'
          coach_energy_level?: number
          client_engagement_level?: number
          criteria_scores?: Json
          go_live_alignment?: Json
          key_insights?: string[]
          patterns_detected?: string[]
          breakthrough_moments?: string[]
          resistance_patterns?: string[]
          client_commitments?: string[]
          suggested_followups?: string[]
          homework_assignments?: string[]
          most_effective_interventions?: string[]
          missed_opportunities?: string[]
          coaching_strengths?: string[]
          areas_for_improvement?: string[]
          executive_summary?: string
          session_theme?: string
          key_topics_discussed?: string[]
          emotional_journey?: string
          progress_since_last_session?: string
          recurring_themes?: string[]
          evolution_of_challenges?: string
          recommended_resources?: string[]
          suggested_tools?: string[]
          next_session_focus?: string
          generated_at?: string
          generation_model?: string
          analysis_version?: string
          raw_analysis_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          bot_id?: string
          user_id?: string
          client_id?: string
          transcript_duration_minutes?: number
          total_word_count?: number
          speaker_word_counts?: Json
          overall_score?: number
          conversation_phase?: 'opening' | 'exploration' | 'insight' | 'commitment' | 'closing'
          coach_energy_level?: number
          client_engagement_level?: number
          criteria_scores?: Json
          go_live_alignment?: Json
          key_insights?: string[]
          patterns_detected?: string[]
          breakthrough_moments?: string[]
          resistance_patterns?: string[]
          client_commitments?: string[]
          suggested_followups?: string[]
          homework_assignments?: string[]
          most_effective_interventions?: string[]
          missed_opportunities?: string[]
          coaching_strengths?: string[]
          areas_for_improvement?: string[]
          executive_summary?: string
          session_theme?: string
          key_topics_discussed?: string[]
          emotional_journey?: string
          progress_since_last_session?: string
          recurring_themes?: string[]
          evolution_of_challenges?: string
          recommended_resources?: string[]
          suggested_tools?: string[]
          next_session_focus?: string
          generated_at?: string
          generation_model?: string
          analysis_version?: string
          raw_analysis_data?: Json
          created_at?: string
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
