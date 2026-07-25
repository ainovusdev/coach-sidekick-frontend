/**
 * TypeScript interfaces for Session Notes System
 * Matches backend schemas from session_note.py
 */

export type NoteType =
  | 'coach_private'
  | 'shared'
  | 'client_reflection'
  | 'client_private'
  | 'pre_session'
  | 'post_session'

// File attachment stored on a note (same shape as commitment attachments)
export interface NoteAttachment {
  id: string
  filename: string
  file_key: string
  file_url: string
  file_size: number
  content_type: string
  uploaded_by_id?: string | null
  uploaded_at: string
}

// Base session note interface
export interface SessionNoteBase {
  title?: string | null // Optional for client notes
  content: string
  note_type: NoteType
}

// Create session note request
export interface SessionNoteCreate extends SessionNoteBase {
  template_id?: string
  note_metadata?: Record<string, any>
  client_id?: string
}

// Update session note request
export interface SessionNoteUpdate {
  title?: string
  content?: string
  note_type?: NoteType
  note_metadata?: Record<string, any>
}

// Session note response from backend
export interface SessionNote extends SessionNoteBase {
  id: string
  session_id: string
  created_by_id?: string | null // Nullable for guest-created notes
  guest_author_id?: string | null // For notes created via live meeting
  template_id?: string
  is_visible_to_client: boolean
  note_metadata: Record<string, any>
  attachments?: NoteAttachment[]
  created_at: string
  updated_at: string
}
