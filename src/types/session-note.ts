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

export type SummaryStyle = 'brief' | 'comprehensive' | 'bullet_points'

// Base note template interface
export interface NoteTemplateBase {
  name: string
  description?: string
  template_type: NoteType
  template_content: string
  is_public: boolean
  is_default: boolean
}

// Create note template request
export interface NoteTemplateCreate extends NoteTemplateBase {
  template_metadata?: Record<string, any>
}

// Update note template request
export interface NoteTemplateUpdate {
  name?: string
  description?: string
  template_content?: string
  is_public?: boolean
  is_default?: boolean
  template_metadata?: Record<string, any>
}

// Note template response from backend
export interface NoteTemplate extends NoteTemplateBase {
  id: string
  created_by_id: string
  template_metadata: Record<string, any>
  created_at: string
  updated_at: string
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
  created_at: string
  updated_at: string
}

// Generate summary request
export interface GenerateSummaryRequest {
  focus_areas?: string[]
  summary_style?: SummaryStyle
  include_quotes?: boolean
}

// Generate summary response
export interface GenerateSummaryResponse {
  summary: string
  session_id: string
  generated_at: string
}

// Note type labels for UI
export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  coach_private: 'Coach Private',
  shared: 'Shared Notes',
  client_reflection: 'Client Reflections',
  client_private: 'Client Note',
  pre_session: 'Pre-Session',
  post_session: 'Post-Session',
}

// Note type colors for badges
export const NOTE_TYPE_COLORS: Record<
  NoteType,
  { bg: string; text: string; border: string }
> = {
  coach_private: {
    bg: 'bg-paper',
    text: 'text-ink-2',
    border: 'border-line',
  },
  shared: {
    bg: 'bg-ds-accent-bg',
    text: 'text-ds-accent',
    border: 'border-ds-accent',
  },
  client_reflection: {
    bg: 'bg-forest-bg',
    text: 'text-forest',
    border: 'border-forest',
  },
  client_private: {
    bg: 'bg-forest-bg',
    text: 'text-forest',
    border: 'border-forest',
  },
  pre_session: {
    bg: 'bg-amber-token-bg',
    text: 'text-amber-token',
    border: 'border-amber-token',
  },
  post_session: {
    bg: 'bg-indigo-bg',
    text: 'text-indigo',
    border: 'border-indigo',
  },
}
