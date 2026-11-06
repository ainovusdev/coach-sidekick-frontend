/** Per-person UI settings (backend `UiPreferences`, GET/PATCH /users/ui-preferences). */

/**
 * `newline`: Enter adds a line, Shift+Enter saves (the default).
 * `save`: Enter saves, Shift+Enter adds a line.
 * Cmd/Ctrl+Enter saves in both.
 */
export type EditorEnterKey = 'newline' | 'save'
export type NoteDefaultType = 'coach_private' | 'shared'

export interface UiPreferences {
  editor_enter_key: EditorEnterKey
  notes_default_type: NoteDefaultType
}

export const DEFAULT_UI_PREFERENCES: UiPreferences = {
  editor_enter_key: 'newline',
  notes_default_type: 'coach_private',
}
