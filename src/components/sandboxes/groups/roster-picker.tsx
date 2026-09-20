'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { PersonAvatar } from '@/components/ui/person-avatar'
import type { RosterKind, SandboxMember } from '@/types/sandbox'

/** Someone chosen from the sandbox's list of coaches or coachees. */
export interface RosterPick {
  member_id: string
  user_id: string
  name: string | null
  email: string
  /** Set when they are already a row of the group being edited. */
  group_member_id?: string
}

export function toPick(m: SandboxMember): RosterPick {
  return { member_id: m.id, user_id: m.user_id, name: m.name, email: m.email }
}

/** The people on one of the sandbox's two lists, by name. */
export function rosterOf(
  members: SandboxMember[],
  kind: RosterKind,
): SandboxMember[] {
  return members
    .filter(m => m.roster.includes(kind))
    .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email))
}

const NOUN: Record<RosterKind, string> = { coach: 'coach', coachee: 'coachee' }

/**
 * Pick people for a group from the list on People — never from the whole app
 * and never by typing an email. Bringing someone onto the sandbox is a People
 * decision; arranging the people already there is this one.
 */
export function RosterPicker({
  kind,
  roster,
  selected,
  onChange,
  single = false,
  note,
  onAddPeople,
}: {
  kind: RosterKind
  roster: SandboxMember[]
  selected: RosterPick[]
  onChange: (next: RosterPick[]) => void
  /** A pairing holds one coach and one coachee: picking replaces. */
  single?: boolean
  /** A line under a chosen person — "also in Group 2", say. */
  note?: (pick: RosterPick) => string | null
  /** Shown as "Not on the list?" for people who may add to People. */
  onAddPeople?: () => void
}) {
  const [q, setQ] = useState('')
  const [focused, setFocused] = useState(false)
  const noun = NOUN[kind]
  const needle = q.trim().toLowerCase()
  const results = roster.filter(
    m =>
      !selected.some(s => s.member_id === m.id) &&
      (!needle ||
        (m.name ?? '').toLowerCase().includes(needle) ||
        m.email.toLowerCase().includes(needle)),
  )
  const full = single && selected.length >= 1

  const add = (m: SandboxMember) => {
    onChange(single ? [toPick(m)] : [...selected, toPick(m)])
    setQ('')
  }

  return (
    <div className="space-y-2" data-testid={`${noun}-picker`}>
      {selected.length > 0 && (
        <ul
          className="divide-y divide-line rounded-lg border border-line"
          data-testid={`${noun}-list`}
        >
          {selected.map(p => {
            const line = note?.(p)
            return (
              <li
                key={p.member_id}
                className="flex items-center gap-3 px-3 py-2"
                data-testid={`${noun}-row`}
              >
                <PersonAvatar
                  name={p.name}
                  email={p.email}
                  dashed={!p.group_member_id}
                  size="sm"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink">
                    {p.name || p.email}
                  </span>
                  <span className="block truncate text-xs text-ink-3">
                    {p.name ? p.email : ''}
                    {line && `${p.name ? ' · ' : ''}${line}`}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${p.name || p.email}`}
                  className="flex h-7 w-7 flex-none items-center justify-center rounded-md text-ink-3 hover:bg-surface-2 hover:text-ink"
                  onClick={() =>
                    onChange(selected.filter(s => s.member_id !== p.member_id))
                  }
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {!full && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder={
              selected.length ? `Add another ${noun}` : `Pick a ${noun}`
            }
            className="pl-9"
            aria-label={`Pick a ${noun}`}
            data-testid={`${noun}-search`}
          />
          {(focused || q) && (
            <ul
              className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-line bg-paper shadow-md"
              data-testid={`${noun}-results`}
            >
              {results.length === 0 && (
                <li className="px-3 py-2 text-sm text-ink-3">
                  {roster.length === 0
                    ? `No ${noun === 'coach' ? 'coaches' : 'coachees'} on People yet.`
                    : needle
                      ? `No ${noun} on the list matches.`
                      : `Everyone on the list is already here.`}
                </li>
              )}
              {results.map(m => (
                <li key={m.id}>
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => add(m)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface-2"
                    data-testid={`${noun}-option`}
                  >
                    <PersonAvatar name={m.name} email={m.email} size="xs" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">
                        {m.name || m.email}
                      </span>
                      <span className="block truncate text-xs text-ink-3">
                        {m.email}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {onAddPeople && (
        <p className="text-xs text-ink-3">
          Not on the list?{' '}
          <button
            type="button"
            className="text-ds-accent hover:underline"
            onClick={onAddPeople}
            data-testid={`${noun}-add-on-people`}
          >
            Add them on People
          </button>
        </p>
      )}
    </div>
  )
}
