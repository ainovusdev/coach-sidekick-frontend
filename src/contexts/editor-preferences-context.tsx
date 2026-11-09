'use client'

import { createContext, useCallback, useContext, useMemo } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useUiPreferences } from '@/hooks/queries/use-ui-preferences'
import { useUpdateUiPreferences } from '@/hooks/mutations/use-ui-preferences-mutations'
import {
  DEFAULT_UI_PREFERENCES,
  type EditorEnterKey,
  type NoteDefaultType,
} from '@/types/preferences'

interface EditorPreferences {
  /** What Enter does in note / description editors. */
  enterKey: EditorEnterKey
  /** The type a new live-session note starts as. */
  notesDefaultType: NoteDefaultType
  /** True once the stored settings have arrived (or failed → defaults). */
  loaded: boolean
  /** False for guests and signed-out visitors: they get the defaults. */
  canEdit: boolean
  setEnterKey: (value: EditorEnterKey) => void
  setNotesDefaultType: (value: NoteDefaultType) => void
}

const noop = () => {}

const EditorPreferencesContext = createContext<EditorPreferences>({
  enterKey: DEFAULT_UI_PREFERENCES.editor_enter_key,
  notesDefaultType: DEFAULT_UI_PREFERENCES.notes_default_type,
  loaded: true,
  canEdit: false,
  setEnterKey: noop,
  setNotesDefaultType: noop,
})

/**
 * One account-level setting read by every RichTextEditor, so the 13 note and
 * description boxes don't each thread it through props. Mounted inside
 * AuthProvider + QueryProvider in the root layout.
 */
export function EditorPreferencesProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, userId } = useAuth()
  const signedInId = isAuthenticated ? userId : null
  const query = useUiPreferences(signedInId)
  const update = useUpdateUiPreferences(signedInId)
  const { mutate } = update

  const prefs = { ...DEFAULT_UI_PREFERENCES, ...query.data }

  const setEnterKey = useCallback(
    (value: EditorEnterKey) => mutate({ editor_enter_key: value }),
    [mutate],
  )
  const setNotesDefaultType = useCallback(
    (value: NoteDefaultType) => mutate({ notes_default_type: value }),
    [mutate],
  )

  const value = useMemo<EditorPreferences>(
    () => ({
      enterKey: prefs.editor_enter_key,
      notesDefaultType: prefs.notes_default_type,
      loaded: !signedInId || !query.isPending,
      canEdit: !!signedInId,
      setEnterKey,
      setNotesDefaultType,
    }),
    [
      prefs.editor_enter_key,
      prefs.notes_default_type,
      signedInId,
      query.isPending,
      setEnterKey,
      setNotesDefaultType,
    ],
  )

  return (
    <EditorPreferencesContext.Provider value={value}>
      {children}
    </EditorPreferencesContext.Provider>
  )
}

export function useEditorPreferences() {
  return useContext(EditorPreferencesContext)
}

/** The key that saves, for hints like "Save (Shift+Enter)". */
export function saveKeyLabel(enterKey: EditorEnterKey) {
  return enterKey === 'save' ? 'Enter' : 'Shift+Enter'
}
