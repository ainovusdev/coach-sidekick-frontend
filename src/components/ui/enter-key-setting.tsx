'use client'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useEditorPreferences } from '@/contexts/editor-preferences-context'
import type { EditorEnterKey, NoteDefaultType } from '@/types/preferences'

const ENTER_OPTIONS: { value: EditorEnterKey; label: string; hint: string }[] =
  [
    {
      value: 'newline',
      label: 'Enter adds a new line',
      hint: 'Shift+Enter saves',
    },
    {
      value: 'save',
      label: 'Enter saves',
      hint: 'Shift+Enter adds a new line',
    },
  ]

const NOTE_TYPE_OPTIONS: { value: NoteDefaultType; label: string }[] = [
  { value: 'coach_private', label: 'Private' },
  { value: 'shared', label: 'Shared with client' },
]

/** The account's Enter-key setting. Saves on change. */
export function EnterKeySetting({
  idPrefix = 'enter-key',
}: {
  idPrefix?: string
}) {
  const { enterKey, setEnterKey, canEdit } = useEditorPreferences()
  return (
    <RadioGroup
      value={enterKey}
      onValueChange={v => setEnterKey(v as EditorEnterKey)}
      disabled={!canEdit}
      className="gap-2"
      aria-label="Enter key"
    >
      {ENTER_OPTIONS.map(o => (
        <div key={o.value} className="flex items-start gap-2.5">
          <RadioGroupItem
            value={o.value}
            id={`${idPrefix}-${o.value}`}
            className="mt-0.5"
          />
          <Label
            htmlFor={`${idPrefix}-${o.value}`}
            className="flex flex-col items-start gap-0.5 font-normal cursor-pointer"
          >
            <span className="text-sm text-ink">{o.label}</span>
            <span className="text-xs text-ink-3">{o.hint}</span>
          </Label>
        </div>
      ))}
    </RadioGroup>
  )
}

/** The type a new live-session note starts as. Saves on change. */
export function NoteDefaultTypeSetting({
  idPrefix = 'note-type',
}: {
  idPrefix?: string
}) {
  const { notesDefaultType, setNotesDefaultType, canEdit } =
    useEditorPreferences()
  return (
    <RadioGroup
      value={notesDefaultType}
      onValueChange={v => setNotesDefaultType(v as NoteDefaultType)}
      disabled={!canEdit}
      className="gap-2"
      aria-label="New notes start as"
    >
      {NOTE_TYPE_OPTIONS.map(o => (
        <div key={o.value} className="flex items-center gap-2.5">
          <RadioGroupItem value={o.value} id={`${idPrefix}-${o.value}`} />
          <Label
            htmlFor={`${idPrefix}-${o.value}`}
            className="text-sm font-normal text-ink cursor-pointer"
          >
            {o.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  )
}
