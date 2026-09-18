'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search, UserRound, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { useViewerId } from '@/hooks/use-viewer-id'
import { usePeopleSearch } from '@/hooks/queries/use-people'
import { firstName } from '@/lib/commitments/assignee'
import {
  RELATION_LABEL,
  personName,
  type PeopleContext,
  type Person,
} from '@/types/people'

/** What a picker hands back: a user, or "the client themself" (`user_id` null). */
export interface PickedPerson {
  user_id: string | null
  client_id?: string | null
  name: string | null
  email: string | null
  has_account?: boolean | null
  roles?: string[]
}

export interface PersonPickerProps {
  value: PickedPerson | null
  onChange: (next: PickedPerson | null) => void
  /** Where we are: decides whom the API offers. */
  context?: PeopleContext | null
  /**
   * The client themself, offered as a fixed choice at the top ("the client,
   * no login" is a choice, never a pseudo person). Pass when the picker sits
   * on a client's commitment.
   */
  clientOption?: {
    client_id: string
    name: string | null
    email?: string | null
    user_id?: string | null
  } | null
  placeholder?: string
  allowClear?: boolean
  size?: 'sm' | 'md'
  disabled?: boolean
  contentClassName?: string
  /** Only offer coach-like people (admin filters). */
  onlyRoles?: (roles: string[]) => boolean
  className?: string
  'data-testid'?: string
}

const SUGGESTED_ORDER = [
  'you',
  'client',
  'coach',
  'co_coach',
  'admin',
  'member',
]

export function PersonPicker({
  value,
  onChange,
  context,
  clientOption,
  placeholder = 'Assign to…',
  allowClear = false,
  size = 'md',
  disabled = false,
  contentClassName,
  onlyRoles,
  className,
  'data-testid': testId = 'person-picker',
}: PersonPickerProps) {
  const userId = useViewerId()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const search = usePeopleSearch(q, context, open)

  // Options: the client choice (when given) + people from the API.
  const options = useMemo<PickedPerson[]>(() => {
    const people = (search.data ?? []).filter(
      p => !onlyRoles || onlyRoles(p.roles),
    )
    const needle = q.trim().toLowerCase()
    const out: PickedPerson[] = []
    if (clientOption) {
      const matches =
        !needle ||
        (clientOption.name ?? '').toLowerCase().includes(needle) ||
        (clientOption.email ?? '').toLowerCase().includes(needle)
      if (matches) {
        out.push({
          user_id: null,
          client_id: clientOption.client_id,
          name: clientOption.name,
          email: clientOption.email ?? null,
          has_account: !!clientOption.user_id,
          roles: [],
        })
      }
    }
    for (const p of people) {
      // The client's login shows once — as "the client", not as a second row
      // (matched by id when the row carries it, else by the API's relation).
      if (
        clientOption &&
        ((clientOption.user_id && p.id === clientOption.user_id) ||
          p.relation === 'client')
      )
        continue
      out.push(toPicked(p))
    }
    return out
  }, [search.data, q, clientOption, onlyRoles])

  const suggested = useMemo(
    () => (q.trim() ? [] : options.filter(o => isSuggested(o, userId))),
    [options, q, userId],
  )
  const rest = useMemo(
    () => (q.trim() ? options : options.filter(o => !isSuggested(o, userId))),
    [options, q, userId],
  )
  const flat = [...suggested, ...rest]

  useEffect(() => setActive(0), [q, open])
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0)
    else setQ('')
  }, [open])

  const pick = (p: PickedPerson | null) => {
    onChange(p)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(a => Math.min(a + 1, Math.max(flat.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(a => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (flat[active]) pick(flat[active])
    } else if (e.key === 'Escape') {
      // Only the picker closes — the panel around it listens for Escape too.
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
    }
  }

  const isYou = !!value?.user_id && value.user_id === userId
  const label = value
    ? isYou
      ? 'You'
      : value.name || value.email || 'Someone'
    : allowClear
      ? 'Unassigned'
      : placeholder

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          data-testid={testId}
          aria-label={value ? `Assigned to ${label}` : placeholder}
          className={cn(
            'inline-flex max-w-full items-center gap-2 rounded-lg border border-line bg-paper text-left text-ink hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 disabled:cursor-not-allowed disabled:opacity-60',
            size === 'sm' ? 'h-8 px-2 text-xs' : 'h-10 px-3 text-sm',
            className,
          )}
        >
          {value ? (
            <PersonAvatar
              name={value.name}
              email={value.email}
              dashed={value.has_account === false}
              size="xs"
            />
          ) : (
            <UserRound
              className={cn(
                'shrink-0 text-ink-3',
                size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
              )}
            />
          )}
          <span
            className={cn('min-w-0 flex-1 truncate', !value && 'text-ink-3')}
          >
            {label}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ink-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn('w-80 p-0', contentClassName)}
        onKeyDown={onKeyDown}
        onEscapeKeyDown={e => {
          e.preventDefault()
          setOpen(false)
        }}
        data-testid={`${testId}-content`}
      >
        <div className="relative border-b border-line p-2">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <Input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by name or email"
            aria-label="Search people"
            className="h-9 pl-9"
            data-testid={`${testId}-search`}
          />
        </div>
        <ul
          role="listbox"
          className="max-h-64 overflow-y-auto py-1"
          aria-label="People"
        >
          {search.isLoading && flat.length === 0 && (
            <li className="px-3 py-2 text-sm text-ink-3">Searching…</li>
          )}
          {!search.isLoading && flat.length === 0 && (
            <li className="px-3 py-2 text-sm text-ink-3">
              {q ? 'Nobody matches.' : 'Nobody to pick yet.'}
            </li>
          )}
          {suggested.length > 0 && (
            <li className="px-3 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-3">
              Suggested
            </li>
          )}
          {suggested.map((p, i) => (
            <Row
              key={keyOf(p)}
              p={p}
              active={active === i}
              selected={sameAs(p, value)}
              me={userId}
              onPick={pick}
            />
          ))}
          {suggested.length > 0 && rest.length > 0 && (
            <li className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-ink-3">
              People
            </li>
          )}
          {rest.map((p, i) => (
            <Row
              key={keyOf(p)}
              p={p}
              active={active === suggested.length + i}
              selected={sameAs(p, value)}
              me={userId}
              onPick={pick}
            />
          ))}
        </ul>
        {allowClear && value && (
          <div className="border-t border-line p-1">
            <button
              type="button"
              onClick={() => pick(null)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-ink-3 hover:bg-surface-2 hover:text-ink"
              data-testid={`${testId}-clear`}
            >
              <X className="h-3.5 w-3.5" /> Unassigned
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

function Row({
  p,
  active,
  selected,
  me,
  onPick,
}: {
  p: PickedPerson
  active: boolean
  selected: boolean
  me: string | null
  onPick: (p: PickedPerson) => void
}) {
  const isYou = !!p.user_id && p.user_id === me
  const name = isYou ? 'You' : p.name || p.email || 'Someone'
  const sub = isYou
    ? (p.name ?? p.email)
    : p.has_account === false
      ? 'No account yet'
      : p.email
  const relation = (p as PickedPerson & { relation?: string }).relation
  const tag =
    !isYou && relation && relation !== 'staff' && relation !== 'you'
      ? RELATION_LABEL[relation as keyof typeof RELATION_LABEL]
      : null
  return (
    <li role="option" aria-selected={selected}>
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={() => onPick(p)}
        className={cn(
          'flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface-2',
          active && 'bg-surface-2',
        )}
        data-testid="person-option"
        data-person={p.user_id ?? p.client_id ?? ''}
      >
        <PersonAvatar
          name={p.name}
          email={p.email}
          dashed={p.has_account === false}
          size="xs"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm text-ink">{name}</span>
            {tag && (
              <span className="shrink-0 rounded-full bg-surface-3 px-1.5 py-px text-[10px] text-ink-3">
                {tag}
              </span>
            )}
          </span>
          {sub && (
            <span className="block truncate text-xs text-ink-3">{sub}</span>
          )}
        </span>
        {selected && <Check className="h-4 w-4 shrink-0 text-ink-2" />}
      </button>
    </li>
  )
}

function toPicked(p: Person): PickedPerson & { relation?: string } {
  return {
    user_id: p.id,
    client_id: null,
    name: p.full_name,
    email: p.email,
    has_account: p.has_account ?? true,
    roles: p.roles,
    relation: p.relation ?? undefined,
  }
}

function isSuggested(p: PickedPerson, me: string | null): boolean {
  if (p.user_id && p.user_id === me) return true
  if (!p.user_id && p.client_id) return true
  const relation = (p as PickedPerson & { relation?: string }).relation
  return (
    !!relation &&
    SUGGESTED_ORDER.includes(relation) &&
    relation !== 'member' &&
    relation !== 'admin'
  )
}

function keyOf(p: PickedPerson): string {
  return p.user_id ?? `client:${p.client_id}`
}

function sameAs(p: PickedPerson, v: PickedPerson | null): boolean {
  if (!v) return false
  if (p.user_id || v.user_id) return p.user_id === v.user_id
  return !!p.client_id && p.client_id === v.client_id
}

export { firstName, personName }
