/**
 * Session Notes Service
 * API client for all session notes and template endpoints
 */

import { ApiClient } from '@/lib/api-client'
import {
  SessionNote,
  SessionNoteCreate,
  SessionNoteUpdate,
  NoteType,
} from '@/types/session-note'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export class SessionNotesService {
  /**
   * Create a new session note
   */
  static async createNote(
    sessionId: string,
    data: SessionNoteCreate,
  ): Promise<SessionNote> {
    const response = await ApiClient.post(
      `${BACKEND_URL}/sessions/${sessionId}/notes`,
      data,
    )
    return response
  }

  /**
   * Get all notes for a session
   */
  static async getNotes(
    sessionId: string,
    noteType?: NoteType,
    clientId?: string,
  ): Promise<SessionNote[]> {
    const params = new URLSearchParams()
    if (noteType) params.append('note_type', noteType)
    if (clientId) params.append('client_id', clientId)

    const queryString = params.toString()
    const url = `${BACKEND_URL}/sessions/${sessionId}/notes${queryString ? `?${queryString}` : ''}`

    const response = await ApiClient.get(url)
    return response
  }

  /**
   * Update an existing note
   */
  static async updateNote(
    noteId: string,
    data: SessionNoteUpdate,
  ): Promise<SessionNote> {
    const response = await ApiClient.patch(
      `${BACKEND_URL}/notes/${noteId}`,
      data,
    )
    return response
  }

  /**
   * Delete a note
   */
  static async deleteNote(noteId: string): Promise<void> {
    await ApiClient.delete(`${BACKEND_URL}/notes/${noteId}`)
  }
}
