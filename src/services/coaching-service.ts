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
      maximum_value: number
      intuitive_fence: number
      integrity: number
      inquiry_vs_insight: number
      listening: number
      reinvention: number
      energy: number
      disruption: number
    }
    suggestions: string[]
    summary: string
    strengths: string[]
    improvement_areas: string[]
  }
  error?: string
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
