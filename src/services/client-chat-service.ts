/**
 * Client Portal Chat Service
 * API client for client-side AI chat functionality
 */

import { ApiClient } from '@/lib/api-client'
import type {
  ChatMessage,
  ChatResponse,
  ChatStats,
} from '@/services/chat-service'

export type { ChatMessage, ChatResponse, ChatStats }

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export class ClientChatService {
  static async askQuestion(
    question: string,
    conversationHistory?: ChatMessage[],
  ): Promise<ChatResponse> {
    return ApiClient.post(`${BACKEND_URL}/client-portal/chat`, {
      question,
      conversation_history: conversationHistory,
    })
  }

  static async getKnowledgeStats(): Promise<ChatStats> {
    return ApiClient.get(`${BACKEND_URL}/client-portal/chat/stats`)
  }
}
