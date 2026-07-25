/**
 * Session Notes Service
 * API client for all session notes and template endpoints
 */

import { ApiClient } from '@/lib/api-client'
import authService from '@/services/auth-service'
import {
  NoteAttachment,
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

  /**
   * Upload a file attachment to a note
   * Raw fetch/XHR instead of ApiClient — multipart needs the browser to set
   * the Content-Type boundary. XHR is used when progress tracking is wanted.
   */
  static async uploadAttachment(
    noteId: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<NoteAttachment> {
    const token = authService.getToken()
    const formData = new FormData()
    formData.append('file', file)

    if (onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${BACKEND_URL}/notes/${noteId}/attachments`)
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

        xhr.upload.onprogress = e => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            try {
              const error = JSON.parse(xhr.responseText)
              reject(new Error(error.detail || 'Failed to upload attachment'))
            } catch {
              reject(new Error('Upload failed'))
            }
          }
        }

        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.send(formData)
      })
    }

    const response = await fetch(`${BACKEND_URL}/notes/${noteId}/attachments`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: 'Upload failed' }))
      throw new Error(error.detail || 'Failed to upload attachment')
    }

    return response.json()
  }

  /**
   * Delete a file attachment from a note
   */
  static async deleteAttachment(
    noteId: string,
    attachmentId: string,
  ): Promise<void> {
    await ApiClient.delete(
      `${BACKEND_URL}/notes/${noteId}/attachments/${attachmentId}`,
    )
  }
}
