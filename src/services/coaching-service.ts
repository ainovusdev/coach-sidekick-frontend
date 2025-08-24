import { ApiClient } from '@/lib/api-client'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface CoachingAnalysis {
  bot_id: string
  session_id: string
  analysis_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  completed_at?: string
  results?: {
    overall_score: number
    golive_alignment: {
      growth: number
      ownership: number
      love: number
      integrity: number
      vision: number
      energy: number
    }
    criteria_scores: {
      active_listening: number
      powerful_questions: number
      creating_awareness: number
      designing_actions: number
      planning_goal_setting: number
      managing_progress: number
      emotional_intelligence: number
      communication_skills: number
      trust_safety: number
      empowerment: number
      flexibility: number
      goal_achievement: number
    }
    suggestions: string[]
    summary: string
    strengths: string[]
    improvement_areas: string[]
  }
  error?: string
}

export interface TriggerAnalysisRequest {
  bot_id: string
  session_id?: string
  include_history?: boolean
}

export interface CoachingSuggestion {
  id: string
  bot_id: string
  session_id: string
  suggestion_type: 'real_time' | 'historical' | 'pattern'
  content: string
  created_at: string
  metadata?: {
    source?: string
    confidence?: number
    related_topic?: string
  }
}

export class CoachingService {
  static async triggerAnalysis(
    data: TriggerAnalysisRequest,
  ): Promise<CoachingAnalysis> {
    // First get session ID from bot ID
    const session = await ApiClient.get(
      `${BACKEND_URL}/sessions/by-bot/${data.bot_id}`,
    )

    if (!session || !session.id) {
      throw new Error('Session not found for bot')
    }

    // Trigger analysis for the session
    const response = await ApiClient.post(
      `${BACKEND_URL}/analysis/${session.id}/analyze`,
      {
        include_history: data.include_history,
      },
    )

    return {
      bot_id: data.bot_id,
      session_id: session.id,
      analysis_id: response.analysis_id || session.id,
      status: response.status || 'pending',
      created_at: response.created_at || new Date().toISOString(),
    }
  }

  static async getAnalysis(sessionId: string): Promise<CoachingAnalysis> {
    const response = await ApiClient.get(
      `${BACKEND_URL}/analysis/${sessionId}/latest`,
    )
    return response
  }

  static async getAnalysisByBot(botId: string): Promise<CoachingAnalysis> {
    // First get session ID from bot ID
    const session = await ApiClient.get(
      `${BACKEND_URL}/sessions/by-bot/${botId}`,
    )

    if (!session || !session.id) {
      throw new Error('Session not found for bot')
    }

    const response = await ApiClient.get(
      `${BACKEND_URL}/analysis/${session.id}/latest`,
    )
    return response
  }

  static async getSuggestions(botId: string): Promise<{
    suggestions: CoachingSuggestion[]
    last_updated: string
  }> {
    try {
      // First get session ID from bot ID
      const session = await ApiClient.get(
        `${BACKEND_URL}/sessions/by-bot/${botId}`,
      )

      if (!session || !session.id) {
        return {
          suggestions: [],
          last_updated: new Date().toISOString(),
        }
      }

      // Get latest analysis which contains suggestions
      const analysis = await ApiClient.get(
        `${BACKEND_URL}/analysis/${session.id}/latest`,
      )

      // Transform analysis suggestions to expected format
      const suggestions: CoachingSuggestion[] = []

      if (
        analysis &&
        analysis.suggestions &&
        Array.isArray(analysis.suggestions)
      ) {
        analysis.suggestions.forEach((suggestion: string, index: number) => {
          suggestions.push({
            id: `suggestion_${session.id}_${index}`,
            bot_id: botId,
            session_id: session.id,
            suggestion_type: 'real_time',
            content: suggestion,
            created_at: analysis.created_at || new Date().toISOString(),
            metadata: {
              source: 'openai',
              confidence: 0.85,
            },
          })
        })
      }

      return {
        suggestions,
        last_updated: analysis.created_at || new Date().toISOString(),
      }
    } catch (error) {
      console.error('Failed to get suggestions:', error)
      return {
        suggestions: [],
        last_updated: new Date().toISOString(),
      }
    }
  }

  static async getSessionAnalyses(sessionId: string): Promise<{
    analyses: CoachingAnalysis[]
    total: number
  }> {
    // The backend doesn't have a list endpoint yet, so we'll just get the latest
    try {
      const analysis = await ApiClient.get(
        `${BACKEND_URL}/analysis/${sessionId}/latest`,
      )

      return {
        analyses: [analysis],
        total: 1,
      }
    } catch {
      return {
        analyses: [],
        total: 0,
      }
    }
  }
}
