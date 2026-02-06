/**
 * Wins Service
 * API client for session wins endpoints
 */

import { ApiClient } from '@/lib/api-client'
import {
  SessionWin,
  SessionWinCreate,
  SessionWinUpdate,
  SessionWinListResponse,
  ClientWinsResponse,
  ProgramWinsResponse,
  WinsExtractionResponse,
} from '@/types/win'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export class WinsService {
  /**
   * Create a new session win
   */
  static async createWin(data: SessionWinCreate): Promise<SessionWin> {
    const response = await ApiClient.post(`${BACKEND_URL}/wins/`, data)
    return response
  }

  /**
   * Get all wins for a session
   */
  static async getSessionWins(
    sessionId: string,
  ): Promise<SessionWinListResponse> {
    const response = await ApiClient.get(
      `${BACKEND_URL}/wins/session/${sessionId}`,
    )

    console.log('WinsService.getSessionWins response:', response)

    // Handle case where backend returns array directly
    if (Array.isArray(response)) {
      return {
        wins: response,
        total: response.length,
      }
    }

    // Ensure wins array exists
    if (!response.wins) {
      return {
        wins: [],
        total: 0,
      }
    }

    return response
  }

  /**
   * Get a single win by ID
   */
  static async getWin(winId: string, sessionId: string): Promise<SessionWin> {
    const response = await ApiClient.get(
      `${BACKEND_URL}/wins/${winId}?session_id=${sessionId}`,
    )
    return response
  }

  /**
   * Update a win
   */
  static async updateWin(
    winId: string,
    sessionId: string,
    data: SessionWinUpdate,
  ): Promise<SessionWin> {
    const response = await ApiClient.patch(
      `${BACKEND_URL}/wins/${winId}?session_id=${sessionId}`,
      data,
    )
    return response
  }

  /**
   * Delete a win
   */
  static async deleteWin(winId: string, sessionId: string): Promise<void> {
    await ApiClient.delete(
      `${BACKEND_URL}/wins/${winId}?session_id=${sessionId}`,
    )
  }

  /**
   * Get all wins for a client (chronological)
   */
  static async getClientWins(clientId: string): Promise<ClientWinsResponse> {
    const response = await ApiClient.get(
      `${BACKEND_URL}/wins/client/${clientId}`,
    )
    return response
  }

  /**
   * Get all wins for a program (grouped by client)
   */
  static async getProgramWins(programId: string): Promise<ProgramWinsResponse> {
    const response = await ApiClient.get(
      `${BACKEND_URL}/wins/program/${programId}`,
    )
    return response
  }

  /**
   * Extract wins from session using AI
   */
  static async extractWins(sessionId: string): Promise<WinsExtractionResponse> {
    const response = await ApiClient.post(
      `${BACKEND_URL}/wins/extract/${sessionId}`,
      {},
      120000, // 2 minute timeout for AI extraction
    )
    return response
  }

  /**
   * Approve an AI-generated win
   */
  static async approveWin(
    winId: string,
    sessionId: string,
  ): Promise<SessionWin> {
    const response = await ApiClient.post(
      `${BACKEND_URL}/wins/${winId}/approve?session_id=${sessionId}`,
      {},
    )
    return response
  }
}
