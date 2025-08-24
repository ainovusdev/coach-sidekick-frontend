import { ApiClient } from '@/lib/api-client'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api/v1'

export interface Demographics {
  age_range?: string | null
  occupation?: string | null
  location?: string | null
  family_situation?: string | null
}

export interface Goals {
  primary_goals: string[]
  short_term_goals: string[]
  long_term_goals: string[]
}

export interface Challenges {
  main_challenges: string[]
  obstacles: string[]
  fears: string[]
}

export interface Personality {
  communication_style?: string | null
  learning_style?: string | null
  personality_traits: string[]
  values: string[]
}

export interface Patterns {
  strengths: string[]
  growth_areas: string[]
  recurring_themes: string[]
  triggers: string[]
}

export interface Progress {
  achievements: string[]
  breakthrough_moments: string[]
}

export interface PersonaMetadata {
  sessions_analyzed: number
  confidence_score: number
  last_updated?: string | null
  created_at?: string | null
}

export interface ClientPersona {
  id: string
  client_id: string
  demographics: Demographics
  goals: Goals
  challenges: Challenges
  personality: Personality
  patterns: Patterns
  progress: Progress
  metadata: PersonaMetadata
}

export interface PersonaUpdateHistory {
  id: string
  session_id?: string | null
  field_name: string
  old_value: any
  new_value: any
  confidence: number
  created_at: string
}

export interface PersonaUpdateRequest {
  age_range?: string | null
  occupation?: string | null
  location?: string | null
  family_situation?: string | null
  communication_style?: string | null
  learning_style?: string | null
}

export class PersonaService {
  static async getClientPersona(clientId: string): Promise<ClientPersona | null> {
    try {
      const response = await ApiClient.get(`${BACKEND_URL}/clients/${clientId}/persona`)
      return response
    } catch (error) {
      console.error('Failed to fetch client persona:', error)
      return null
    }
  }

  static async updateClientPersona(
    clientId: string,
    updates: PersonaUpdateRequest
  ): Promise<ClientPersona> {
    const response = await ApiClient.put(
      `${BACKEND_URL}/clients/${clientId}/persona`,
      updates
    )
    return response
  }

  static async getPersonaHistory(
    clientId: string,
    limit: number = 50
  ): Promise<PersonaUpdateHistory[]> {
    try {
      const response = await ApiClient.get(
        `${BACKEND_URL}/clients/${clientId}/persona/history?limit=${limit}`
      )
      return response
    } catch (error) {
      console.error('Failed to fetch persona history:', error)
      return []
    }
  }
}