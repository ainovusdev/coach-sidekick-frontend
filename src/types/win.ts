/**
 * Session Wins Types
 * Types for tracking client achievements and breakthroughs from coaching sessions
 */

export interface SessionWin {
  id: string
  session_id: string
  client_id: string
  title: string
  description: string | null
  is_ai_generated: boolean
  is_approved: boolean
  created_at: string
  updated_at: string
  session_title?: string | null
  session_date?: string | null
}

export interface SessionWinCreate {
  session_id: string
  client_id: string
  title: string
  description?: string
  is_ai_generated?: boolean
}

export interface SessionWinUpdate {
  title?: string
  description?: string
  is_approved?: boolean
}

export interface SessionWinListResponse {
  wins: SessionWin[]
  total: number
}

export interface ClientWinsResponse {
  client_id: string
  client_name: string
  wins: SessionWin[]
  total_wins: number
}

export interface ProgramWinsResponse {
  program_id: string
  clients: ClientWinsResponse[]
  total_wins: number
}

export interface ExtractedWin {
  title: string
  description: string
  confidence: number
}

export interface WinsExtractionResponse {
  session_id: string
  extracted_wins: ExtractedWin[]
  created_wins: SessionWin[]
}
