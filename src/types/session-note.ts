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
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  shared: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  client_reflection: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  client_private: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
  },
  pre_session: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  post_session: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
}
