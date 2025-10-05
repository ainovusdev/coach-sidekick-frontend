import { ApiClient } from '@/lib/api-client'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface SessionSentiment {
  overall: string
  score: number
  progression?: string
  emotions: string[]
  engagement: string
  energy_level: string
}

export interface SessionEffectiveness {
  score: number
  explanation: string
}

export interface SessionPatterns {
  thinking_patterns?: string[]
  language_patterns?: string[]
  obstacles?: string[]
  strengths?: string[]
}

export interface SessionRecommendations {
  next_session_focus?: string[]
  follow_up_questions?: string[]
  suggested_resources?: string[]
}

export interface SessionMetadata {
  word_count?: number
  speaker_balance?: string
  session_phase?: string
  coaching_style?: string
}

export interface SessionInsights {
  session_id: string
  timestamp: string
  summary: string
  topics: string[]
  keywords: string[]
  sentiment: SessionSentiment
  insights: string[]
  action_items: string[]
  effectiveness: SessionEffectiveness
  patterns: SessionPatterns
  recommendations: SessionRecommendations
  metadata: SessionMetadata
  processing_time_ms: number
}

export interface CoachingScores {
  active_listening: number
  powerful_questions: number
  direct_communication: number
  creating_awareness: number
  designing_actions: number
  planning_goal_setting: number
  managing_progress: number
  trust_intimacy: number
  coaching_presence: number
  self_management: number
  establishing_agreement: number
  accountability: number
  overall?: number
}

export interface GOLIVEScores {
  growth: number
  ownership: number
  love: number
  integrity: number
  vision: number
  energy: number
}

export interface CoachingAnalysis {
  session_id: string
  timestamp: string
  coaching_scores: CoachingScores
  go_live_scores: GOLIVEScores
  sentiment: {
    overall: string
    score: number
    emotions: string[]
    engagement: string
  }
  suggestions: string[]
  personal_ai_suggestions?: string[]
  analysis_version: string
  processing_time_ms: number
}

export interface FullAnalysisResponse {
  session_id: string
  timestamp: string
  insights: SessionInsights | null
  coaching: {
    coaching_scores: CoachingScores
    go_live_scores: GOLIVEScores
    sentiment: {
      overall: string
      score: number
      emotions: string[]
      engagement: string
    }
    suggestions: string[]
    analysis_version: string
    processing_time_ms: number
  } | null
  total_processing_time_ms?: number
}

export class AnalysisService {
  // ===== NEW UNIFIED ENDPOINTS =====

  /**
   * Trigger complete analysis (insights + coaching metrics) in one call
   */
  static async triggerAnalysis(
    sessionId: string,
    force: boolean = false,
  ): Promise<FullAnalysisResponse> {
    const response = await ApiClient.post(
      `${BACKEND_URL}/analysis/${sessionId}/analyze${
        force ? '?force=true' : ''
      }`,
      {},
      120000, // 2 minute timeout for analysis
    )
    return response
  }

  /**
   * Get the latest analysis (both insights and coaching) in one call
   */
  static async getAnalysis(
    sessionId: string,
  ): Promise<FullAnalysisResponse | null> {
    try {
      const response = await ApiClient.get(
        `${BACKEND_URL}/analysis/${sessionId}/analysis`,
      )
      return response
    } catch {
      return null
    }
  }

  // ===== OLD ENDPOINTS (DEPRECATED - use triggerAnalysis/getAnalysis instead) =====

  /** @deprecated Use triggerAnalysis() instead */
  static async triggerInsightsAnalysis(
    sessionId: string,
  ): Promise<SessionInsights> {
    const response = await ApiClient.post(
      `${BACKEND_URL}/analysis/${sessionId}/analyze-insights`,
      {},
    )
    return response
  }

  /** @deprecated Use getAnalysis() instead */
  static async getLatestAnalysis(
    sessionId: string,
  ): Promise<SessionInsights | null> {
    try {
      const response = await ApiClient.get(
        `${BACKEND_URL}/analysis/${sessionId}/latest-insights`,
      )
      return response
    } catch {
      // No analysis exists yet
      return null
    }
  }

  /** @deprecated Use triggerAnalysis() instead */
  static async triggerCoachingAnalysis(
    sessionId: string,
    force: boolean = false,
  ): Promise<CoachingAnalysis> {
    const response = await ApiClient.post(
      `${BACKEND_URL}/analysis/${sessionId}/analyze${
        force ? '?force=true' : ''
      }`,
      {},
    )
    return response
  }

  /** @deprecated Use getAnalysis() instead */
  static async getLatestCoachingAnalysis(
    sessionId: string,
  ): Promise<CoachingAnalysis | null> {
    try {
      const response = await ApiClient.get(
        `${BACKEND_URL}/analysis/${sessionId}/latest`,
      )
      return response
    } catch {
      // No analysis exists yet
      return null
    }
  }

  static async getRealTimeSuggestion(
    sessionId: string,
    limit: number = 5,
  ): Promise<{
    suggestion: string
    based_on_messages: number
  }> {
    const response = await ApiClient.post(
      `${BACKEND_URL}/analysis/${sessionId}/real-time-suggestion?limit=${limit}`,
      {},
    )
    return response
  }
}
