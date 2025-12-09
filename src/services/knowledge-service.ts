// Knowledge Hub service for document management and chat

import axios from 'axios'
import type {
  KnowledgeDocument,
  KnowledgeDocumentDetail,
  KnowledgeDocumentListResponse,
  KnowledgeDocumentUpdate,
  ProcessingStatusResponse,
  CategoriesResponse,
  KnowledgeChatRequest,
  KnowledgeChatResponse,
  ChatSessionDetail,
  ChatSessionListResponse,
  KnowledgeStats,
  KnowledgeSearchRequest,
  KnowledgeSearchResponse,
  KnowledgeCategory,
  ChatMessage,
} from '@/types/knowledge'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

class KnowledgeService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('No authentication token found')
    }
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  private getMultipartHeaders() {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('No authentication token found')
    }
    return {
      Authorization: `Bearer ${token}`,
      // Don't set Content-Type for multipart - axios will set it automatically
    }
  }

  // ============ DOCUMENT MANAGEMENT ============

  async uploadDocument(
    file: File,
    title: string,
    category: KnowledgeCategory,
    description?: string,
    tags?: string[],
  ): Promise<KnowledgeDocument> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    formData.append('category', category)
    if (description) {
      formData.append('description', description)
    }
    if (tags && tags.length > 0) {
      formData.append('tags', tags.join(','))
    }

    const response = await axios.post<KnowledgeDocument>(
      `${API_URL}/knowledge/documents`,
      formData,
      { headers: this.getMultipartHeaders() },
    )
    return response.data
  }

  async listDocuments(params?: {
    page?: number
    limit?: number
    category?: KnowledgeCategory
    status?: string
    search?: string
  }): Promise<KnowledgeDocumentListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.category) queryParams.append('category', params.category)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.search) queryParams.append('search', params.search)

    const response = await axios.get<KnowledgeDocumentListResponse>(
      `${API_URL}/knowledge/documents?${queryParams.toString()}`,
      { headers: this.getAuthHeaders() },
    )
    return response.data
  }

  async getDocument(documentId: string): Promise<KnowledgeDocumentDetail> {
    const response = await axios.get<KnowledgeDocumentDetail>(
      `${API_URL}/knowledge/documents/${documentId}`,
      { headers: this.getAuthHeaders() },
    )
    return response.data
  }

  async updateDocument(
    documentId: string,
    data: KnowledgeDocumentUpdate,
  ): Promise<KnowledgeDocument> {
    const response = await axios.patch<KnowledgeDocument>(
      `${API_URL}/knowledge/documents/${documentId}`,
      data,
      { headers: this.getAuthHeaders() },
    )
    return response.data
  }

  async deleteDocument(documentId: string): Promise<void> {
    await axios.delete(`${API_URL}/knowledge/documents/${documentId}`, {
      headers: this.getAuthHeaders(),
    })
  }

  async getDocumentStatus(
    documentId: string,
  ): Promise<ProcessingStatusResponse> {
    const response = await axios.get<ProcessingStatusResponse>(
      `${API_URL}/knowledge/documents/${documentId}/status`,
      { headers: this.getAuthHeaders() },
    )
    return response.data
  }

  // ============ CATEGORIES ============

  async getCategories(): Promise<CategoriesResponse> {
    const response = await axios.get<CategoriesResponse>(
      `${API_URL}/knowledge/categories`,
      { headers: this.getAuthHeaders() },
    )
    return response.data
  }

  // ============ CHAT ============

  async sendChatMessage(
    question: string,
    options?: {
      sessionId?: string
      categories?: KnowledgeCategory[]
      conversationHistory?: ChatMessage[]
      provider?: 'openai' | 'gemini' | 'claude'
    },
  ): Promise<KnowledgeChatResponse> {
    const request: KnowledgeChatRequest = {
      question,
      session_id: options?.sessionId,
      categories: options?.categories,
      conversation_history: options?.conversationHistory,
      provider: options?.provider || 'openai',
    }

    const response = await axios.post<KnowledgeChatResponse>(
      `${API_URL}/knowledge/chat`,
      request,
      { headers: this.getAuthHeaders() },
    )
    return response.data
  }

  async listChatSessions(limit?: number): Promise<ChatSessionListResponse> {
    const params = limit ? `?limit=${limit}` : ''
    const response = await axios.get<ChatSessionListResponse>(
      `${API_URL}/knowledge/chat/sessions${params}`,
      { headers: this.getAuthHeaders() },
    )
    return response.data
  }

  async getChatSession(sessionId: string): Promise<ChatSessionDetail> {
    const response = await axios.get<ChatSessionDetail>(
      `${API_URL}/knowledge/chat/sessions/${sessionId}`,
      { headers: this.getAuthHeaders() },
    )
    return response.data
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    await axios.delete(`${API_URL}/knowledge/chat/sessions/${sessionId}`, {
      headers: this.getAuthHeaders(),
    })
  }

  // ============ STATS ============

  async getStats(): Promise<KnowledgeStats> {
    const response = await axios.get<KnowledgeStats>(
      `${API_URL}/knowledge/stats`,
      { headers: this.getAuthHeaders() },
    )
    return response.data
  }

  // ============ SEARCH ============

  async search(
    query: string,
    categories?: KnowledgeCategory[],
    limit?: number,
  ): Promise<KnowledgeSearchResponse> {
    const request: KnowledgeSearchRequest = {
      query,
      categories,
      limit,
    }

    const response = await axios.post<KnowledgeSearchResponse>(
      `${API_URL}/knowledge/search`,
      request,
      { headers: this.getAuthHeaders() },
    )
    return response.data
  }

  // ============ POLLING HELPERS ============

  /**
   * Poll document status until processing completes or fails
   */
  async pollDocumentStatus(
    documentId: string,
    onProgress?: (status: ProcessingStatusResponse) => void,
    intervalMs = 2000,
    maxAttempts = 150, // 5 minutes max
  ): Promise<ProcessingStatusResponse> {
    let attempts = 0

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getDocumentStatus(documentId)
          onProgress?.(status)

          if (status.processing_status === 'completed') {
            resolve(status)
            return
          }

          if (status.processing_status === 'failed') {
            reject(new Error(status.processing_error || 'Processing failed'))
            return
          }

          attempts++
          if (attempts >= maxAttempts) {
            reject(new Error('Polling timeout exceeded'))
            return
          }

          setTimeout(poll, intervalMs)
        } catch (error) {
          reject(error)
        }
      }

      poll()
    })
  }
}

export const knowledgeService = new KnowledgeService()
