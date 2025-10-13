/**
 * Session Notes Service
 * API client for all session notes and template endpoints
 */

import { ApiClient } from '@/lib/api-client'
import {
  SessionNote,
  SessionNoteCreate,
  SessionNoteUpdate,
  NoteTemplate,
  NoteTemplateCreate,
  NoteTemplateUpdate,
  GenerateSummaryRequest,
  GenerateSummaryResponse,
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
  ): Promise<SessionNote[]> {
    const params = new URLSearchParams()
    if (noteType) params.append('note_type', noteType)

    const queryString = params.toString()
    const url = `${BACKEND_URL}/sessions/${sessionId}/notes${queryString ? `?${queryString}` : ''}`

    const response = await ApiClient.get(url)
    return response
  }

  /**
   * Get a single note by ID
   */
  static async getNote(noteId: string): Promise<SessionNote> {
    const response = await ApiClient.get(`${BACKEND_URL}/notes/${noteId}`)
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

  /**
   * Generate AI-powered summary from session transcript
   */
  static async generateSummary(
    sessionId: string,
    params?: GenerateSummaryRequest,
  ): Promise<GenerateSummaryResponse> {
    const requestData = params || {
      summary_style: 'comprehensive',
      include_quotes: true,
    }

    const response = await ApiClient.post(
      `${BACKEND_URL}/sessions/${sessionId}/notes/generate-summary`,
      requestData,
      120000, // 2 minute timeout for AI generation
    )
    return response
  }

  /**
   * Get available note templates
   */
  static async getTemplates(
    templateType?: NoteType,
    includePublic: boolean = true,
  ): Promise<NoteTemplate[]> {
    const params = new URLSearchParams()
    if (templateType) params.append('template_type', templateType)
    params.append('include_public', String(includePublic))

    const queryString = params.toString()
    const url = `${BACKEND_URL}/note-templates${queryString ? `?${queryString}` : ''}`

    const response = await ApiClient.get(url)
    return response
  }

  /**
   * Create a new note template
   */
  static async createTemplate(data: NoteTemplateCreate): Promise<NoteTemplate> {
    const response = await ApiClient.post(`${BACKEND_URL}/note-templates`, data)
    return response
  }

  /**
   * Update a note template
   */
  static async updateTemplate(
    templateId: string,
    data: NoteTemplateUpdate,
  ): Promise<NoteTemplate> {
    const response = await ApiClient.patch(
      `${BACKEND_URL}/note-templates/${templateId}`,
      data,
    )
    return response
  }

  /**
   * Delete a note template
   */
  static async deleteTemplate(templateId: string): Promise<void> {
    await ApiClient.delete(`${BACKEND_URL}/note-templates/${templateId}`)
  }
}
