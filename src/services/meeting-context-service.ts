import { ApiClient } from '@/lib/api-client'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://coach-sidekick-backend-production.up.railway.app/api/v1'

export interface ClientProfile {
  client_id: string
  personality_traits?: string[]
  communication_style?: string
  learning_style?: string
  primary_goals?: string[]
  short_term_goals?: string[]
  long_term_goals?: string[]
  main_challenges?: string[]
  obstacles?: string[]
  values?: string[]
  strengths?: string[]
  growth_areas?: string[]
  recurring_themes?: string[]
  breakthrough_moments?: string[]
  achievements?: string[]
  sessions_analyzed?: number
  last_updated?: string
}

export interface SimilarSession {
  session_date: string
  session_id?: string
  duration_minutes?: number
  summary?: string
  content_preview: string
  topics: string[]
  sentiment?: string
  certainty: number
  key_topics?: string[]
  action_items?: string[]
  relevance_reason?: string
}

export interface SessionSummary {
  session_date: string
  summary: string
  key_points: string[]
  relevance_reason: string
}

export interface PatternHistory {
  date: string
  patterns: string[]
  dominant_pattern?: string
  intensity?: Record<string, number>
  context?: string
}

export interface RecurringTheme {
  theme: string
  count: number
  last_seen: string
}

export interface ConversationSegment {
  speaker: 'coach' | 'client' | 'assistant'
  text: string
  timestamp?: string
  relevance?: number
}

export interface AnalysisConversation {
  id: string
  segments: ConversationSegment[]
  summary?: string
  relevance_score?: number
  analysis_reason?: string
  key_moments?: string[]
  timestamp?: string
}

export interface MeetingContext {
  client_profile?: ClientProfile
  similar_sessions?: SimilarSession[]
  session_summaries?: SessionSummary[]
  pattern_history?: PatternHistory[]
  recurring_themes?: RecurringTheme[]
  patterns?: string[]
  analysis_conversations?: AnalysisConversation[]
  insights?: {
    client_journey?: string
    key_patterns?: string[]
    suggested_focus?: string[]
    breakthrough_potential?: string
  }
}

export class MeetingContextService {
  /**
   * Get full context for a meeting session — single backend call.
   * Replaces the previous multi-call approach.
   */
  static async getMeetingContext(
    botId: string,
  ): Promise<MeetingContext | null> {
    try {
      const context = await ApiClient.get(
        `${BACKEND_URL}/meeting-context/by-bot/${botId}`,
      )

      if (!context) {
        return null
      }

      return {
        client_profile: context.client_profile || undefined,
        similar_sessions: context.similar_sessions || [],
        session_summaries: context.session_summaries || [],
        pattern_history: context.pattern_history || [],
        recurring_themes: context.recurring_themes || [],
        patterns: context.patterns || [],
        analysis_conversations: context.analysis_conversations || [],
        insights: context.insights || {},
      }
    } catch (error) {
      console.error('Failed to fetch meeting context:', error)
      return null
    }
  }

  /**
   * @deprecated Use getMeetingContext(botId) instead — clientId is resolved server-side.
   */
  static async getMeetingContextWithClientId(
    botId: string,
    _clientId: string,
  ): Promise<MeetingContext | null> {
    return this.getMeetingContext(botId)
  }
}
