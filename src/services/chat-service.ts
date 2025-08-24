// Chat service for client Q&A functionality

import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  question: string
  conversation_history?: ChatMessage[]
}

export interface ChatSource {
  session_id: string
  date: string
  topics: string[]
  relevance_score: number
  content: string
  chunk_type: string
  timestamp?: string
  speaker_ratio?: Record<string, number>
}

export interface ChatResponse {
  answer: string
  sources: ChatSource[]
  confidence: 'high' | 'medium' | 'low'
  topics?: string[]
  suggested_questions?: string[]
}

export interface ChatStats {
  total_chunks: number
  unique_sessions: number
  top_topics: Array<{ topic: string; count: number }>
  suggested_questions: string[]
}

class ChatService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('No authentication token found')
    }
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  async askQuestion(
    clientId: string, 
    question: string, 
    conversationHistory?: ChatMessage[]
  ): Promise<ChatResponse> {
    try {
      const response = await axios.post<ChatResponse>(
        `${API_URL}/chat/clients/${clientId}/chat`,
        {
          question,
          conversation_history: conversationHistory
        },
        { headers: this.getAuthHeaders() }
      )
      return response.data
    } catch (error) {
      console.error('Failed to get chat response:', error)
      throw error
    }
  }

  async getClientKnowledgeStats(clientId: string): Promise<ChatStats> {
    try {
      const response = await axios.get<ChatStats>(
        `${API_URL}/chat/clients/${clientId}/chat/stats`,
        { headers: this.getAuthHeaders() }
      )
      return response.data
    } catch (error) {
      console.error('Failed to get knowledge stats:', error)
      throw error
    }
  }

  async clearClientIndex(clientId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_URL}/chat/clients/${clientId}/chat/index`,
        { headers: this.getAuthHeaders() }
      )
    } catch (error) {
      console.error('Failed to clear client index:', error)
      throw error
    }
  }
}

export const chatService = new ChatService()