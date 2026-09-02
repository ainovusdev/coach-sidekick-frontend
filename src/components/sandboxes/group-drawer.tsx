'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DueDateField } from '@/components/ui/due-date-field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PersonAvatar } from '@/components/ui/person-avatar'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { CadenceControl } from '@/components/sandboxes/cadence-control'
import {
  useEmailLookup,
  useSandboxPeopleSearch,
} from '@/hooks/queries/use-sandboxes'
import {
  useAddGroupMember,
  useCreateGroup,
  useRemoveGroupMember,
  useUpdateGroup,
} from '@/hooks/mutations/use-sandbox-mutations'
import {
  DEFAULT_CADENCE,
  DEFAULT_SESSION_LENGTH,
  expectedSessions,
} from '@/lib/sandbox/cadence'
import { firstName, pluralise } from '@/lib/sandbox/format'
import { cn } from '@/lib/utils'
import type {
  Cadence,
  GroupMissingField,
  PersonSearchResult,
  SandboxGroup,
  SandboxMember,
  SandboxOverview,
} from '@/types/sandbox'

interface CoachDraft {
  user_id: string
  name: string | null
  email: string
  group_member_id?: string
}

interface CoacheeDraft {
  key: string
  user_id?: string
  email: string
  name: string | null
  group_member_id?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isCoachLike(roles: string[]): boolean {
  return roles.some(r => /coach|trainee/i.test(r))
}

export function GroupDrawer({
  open,
  onOpenChange,
  overview,
  group,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  overview: SandboxOverview
  /** null = build a new group; otherwise finish / edit this one. */
  group: SandboxGroup | null
}) {
  const { sandbox, members, groups } = overview
  const sandboxId = sandbox.id
  const createGroup = useCreateGroup(sandboxId)
  const updateGroup = useUpdateGroup(sandboxId)
  const addGroupMember = useAddGroupMember(sandboxId)
  const removeGroupMember = useRemoveGroupMember(sandboxId)

  const [coaches, setCoaches] = useState<CoachDraft[]>([])
  const [coachees, setCoachees] = useState<CoacheeDraft[]>([])
  const [supervisorIds, setSupervisorIds] = useState<string[]>([])
  const [hours, setHours] = useState('')
  const [sessionLength, setSessionLength] = useState(DEFAULT_SESSION_LENGTH)
  const [cadence, setCadence] = useState<Cadence | null>(DEFAULT_CADENCE)
  const [startsOn, setStartsOn] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [cadenceKey, setCadenceKey] = useState(0)

  // Reset the draft every time the drawer opens.
  useEffect(() => {
    if (!open) return
    setCoaches(
      (group?.coaches ?? []).map(c => ({
        user_id: c.user_id,
        name: c.name,
        email: c.email,
        group_member_id: c.id,
      })),
    )
    setCoachees(
      (group?.coachees ?? []).map(c => ({
        key: c.id,
        user_id: c.user_id,
        email: c.email,
        name: c.name,
        group_member_id: c.id,
      })),
    )
    setSupervisorIds((group?.supervisors ?? []).map(s => s.member_id))
    setHours(
      group?.hours_per_coachee != null ? String(group.hours_per_coachee) : '',
    )
    setSessionLength(group?.session_length_minutes ?? DEFAULT_SESSION_LENGTH)
    setCadence(group ? group.cadence : DEFAULT_CADENCE)
    setStartsOn(group && !group.starts_on_is_default ? group.starts_on : null)
    setName(group?.name ?? '')
    setSaving(false)
    setCadenceKey(k => k + 1)
  }, [open, group])

  const expected = expectedSessions(hours, sessionLength)
  const hoursNumber = hours.trim() === '' ? null : Number(hours)
  const hoursValid =
    hoursNumber != null && !Number.isNaN(hoursNumber) && hoursNumber > 0

  const missing: GroupMissingField[] = []
  if (coaches.length === 0) missing.push('coach')
  if (coachees.length === 0) missing.push('coachee')
  if (!hoursValid) missing.push('hours_per_coachee')
  if (!cadence) missing.push('cadence')
  const complete = missing.length === 0
  const anything =
    coaches.length > 0 ||
    coachees.length > 0 ||
    hours.trim() !== '' ||
    name.trim() !== ''

  const teamSupervisors = members.filter(m => m.roles.includes('supervisor'))
  const theirSideCandidates = members.filter(
    m =>
      m.side === 'theirs' &&
      !coachees.some(c => c.user_id === m.user_id || c.email === m.email),
  )

  const defaultName = useMemo(() => {
    if (coaches.length === 1 && coachees.length === 1) {
      return `${firstName(coaches[0].name, coaches[0].email)} → ${firstName(coachees[0].name, coachees[0].email)}`
    }
    if (group && !group.name) return group.display_name
    return `Group ${groups.length + 1}`
  }, [coaches, coachees, group, groups.length])

  const heading = group
    ? group.is_complete
      ? `Edit ${group.display_name}`
      : `Finish ${group.display_name}`
    : 'Build a group'

  const buildPayload = () => ({
    name: name.trim() || null,
    hours_per_coachee: hoursValid ? hoursNumber : null,
    session_length_minutes: sessionLength,
    cadence,
    starts_on: startsOn,
  })

  const submit = async () => {
    setSaving(true)
    try {
      if (!group) {
        await createGroup.mutateAsync({
          ...buildPayload(),
          coach_user_ids: coaches.map(c => c.user_id),
          coachees: coachees.map(c =>
            c.user_id
              ? { user_id: c.user_id }
              : { email: c.email, name: c.name },
          ),
          supervisor_member_ids: supervisorIds,
        })
      } else {
        // Members first, so the settings save (and its toast) is the last thing that happens.
        const removedCoaches = group.coaches.filter(
          c => !coaches.some(d => d.user_id === c.user_id),
        )
        const addedCoaches = coaches.filter(
          d => !group.coaches.some(c => c.user_id === d.user_id),
        )
        const removedCoachees = group.coachees.filter(
          c => !coachees.some(d => d.group_member_id === c.id),
        )
        const addedCoachees = coachees.filter(d => !d.group_member_id)
        const removedSupervisors = group.supervisors.filter(
          s => !supervisorIds.includes(s.member_id),
        )
        const addedSupervisors = supervisorIds.filter(
          id => !group.supervisors.some(s => s.member_id === id),
        )

        for (const c of removedCoaches)
          await removeGroupMember.mutateAsync({
            groupId: group.id,
            groupMemberId: c.id,
          })
        for (const c of removedCoachees)
          await removeGroupMember.mutateAsync({
            groupId: group.id,
            groupMemberId: c.id,
          })
        for (const s of removedSupervisors)
          await removeGroupMember.mutateAsync({
            groupId: group.id,
            groupMemberId: s.id,
          })
        for (const c of addedCoaches)
          await addGroupMember.mutateAsync({
            groupId: group.id,
            data: { kind: 'coach', user_id: c.user_id },
          })
        for (const c of addedCoachees)
          await addGroupMember.mutateAsync({
            groupId: group.id,
            data: c.user_id
              ? { kind: 'coachee', user_id: c.user_id }
              : { kind: 'coachee', email: c.email, name: c.name },
          })
        for (const id of addedSupervisors)
          await addGroupMember.mutateAsync({
            groupId: group.id,
            data: { kind: 'supervisor', member_id: id },
          })
        await updateGroup.mutateAsync({
          groupId: group.id,
          data: buildPayload(),
        })
      }
      onOpenChange(false)
    } catch {
      // the mutation hooks already toasted
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
        data-testid="group-drawer"
      >
        <SheetHeader className="border-b border-line px-6 py-4 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
            {sandbox.name}
          </p>
          <SheetTitle className="text-lg">{heading}</SheetTitle>
          <SheetDescription className="sr-only">
            Coaches, coachees, hours and cadence for this group.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-5">
          {/* Coaches */}
          <section className="space-y-2">
            <Label className="text-sm font-medium text-ink">Coaches</Label>
            <CoachPicker
              sandboxId={sandboxId}
              selected={coaches}
              onChange={setCoaches}
            />
          </section>

          {/* Coachees */}
          <section className="space-y-2">
            <div>
              <Label className="text-sm font-medium text-ink">Coachees</Label>
              <p className="text-xs text-ink-3">
                By email, or pick if known. They become clients of every coach
                here when the group is saved.
              </p>
            </div>
            <CoacheeEntry
              sandboxId={sandboxId}
              coachees={coachees}
              onChange={setCoachees}
              candidates={theirSideCandidates}
              groups={groups}
              currentGroupId={group?.id}
            />
          </section>

          {/* Supervisors */}
          <section className="space-y-2">
            <Label className="text-sm font-medium text-ink">Supervisors</Label>
            {teamSupervisors.length === 0 ? (
              <p className="text-xs text-ink-3">
                No supervisors on the team yet. Add them under Team with the
                Supervisor role.
              </p>
            ) : (
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {teamSupervisors.map(s => (
                  <Label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-2 text-sm font-normal"
                  >
                    <Checkbox
                      checked={supervisorIds.includes(s.id)}
                      onCheckedChange={v =>
                        setSupervisorIds(prev =>
                          v === true
                            ? [...prev, s.id]
                            : prev.filter(x => x !== s.id),
                        )
                      }
                    />
                    {s.name || s.email}
                  </Label>
                ))}
              </div>
            )}
          </section>

          {/* Cadence */}
          <section className="space-y-2">
            <div>
              <Label className="text-sm font-medium text-ink">Cadence</Label>
              <p className="text-xs text-ink-3">
                How often sessions happen. Checked against the hours below.
              </p>
            </div>
            <CadenceControl
              key={cadenceKey}
              value={cadence}
              onChange={setCadence}
              termMonths={sandbox.term_months}
              expectedSessions={expected}
            />
          </section>

          {/* Starts + name */}
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <DueDateField
                id="group-starts"
                label="Starts"
                value={startsOn ?? sandbox.term_start}
                onChange={setStartsOn}
              />
              {startsOn && startsOn !== sandbox.term_start ? (
                <button
                  type="button"
                  className="text-xs text-ds-accent hover:underline"
                  onClick={() => setStartsOn(null)}
                >
                  Use the term start
                </button>
              ) : (
                <p className="text-xs text-ink-3">
                  Defaults to the term start.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-name">Name</Label>
              <Input
                id="group-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={defaultName}
              />
              <p className="text-xs text-ink-3">
                Optional. Shown as “{name.trim() || defaultName}”.
              </p>
            </div>
          </section>
        </div>

        {/* Pinned contract maths */}
        <footer
          className="border-t border-line bg-surface-2 px-6 py-4"
          data-testid="contract-maths"
        >
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink">
            <Input
              type="number"
              inputMode="decimal"
              min={0.5}
              step={0.5}
              value={hours}
              onChange={e => setHours(e.target.value)}
              placeholder="0"
              className="h-8 w-20 bg-paper text-right font-mono"
              aria-label="Hours per coachee"
              data-testid="hours-input"
            />
            <span>h at</span>
            <Input
              type="number"
              inputMode="numeric"
              min={15}
              step={5}
              value={sessionLength}
              onChange={e =>
                setSessionLength(Math.max(0, Number(e.target.value) || 0))
              }
              className="h-8 w-16 bg-paper text-right font-mono"
              aria-label="Session length in minutes"
              data-testid="session-length-input"
            />
            <span>min</span>
            <span className="text-ink-3">→</span>
            <span
              className={cn(
                'font-mono',
                expected == null ? 'text-ink-3' : 'font-medium',
              )}
              data-testid="expected-sessions"
            >
              {expected == null ? '— sessions' : pluralise(expected, 'session')}
            </span>
            <span className="ml-auto text-xs text-ink-3">per coachee</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-xs text-ink-3 sm:flex-1">
              {pluralise(coachees.length, 'coachee')} ·{' '}
              {group ? 'changes apply when you save' : 'no email sent'}
              {!complete && (
                <span className="text-amber-token">
                  {' '}
                  · missing{' '}
                  {missing
                    .map(
                      m =>
                        ({
                          coach: 'a coach',
                          coachee: 'a coachee',
                          hours_per_coachee: 'hours',
                          cadence: 'a cadence',
                        })[m],
                    )
                    .join(', ')}
                </span>
              )}
            </p>
            <div className="flex gap-2">
              {!group && !complete ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!anything || saving}
                  onClick={submit}
                  data-testid="save-incomplete"
                >
                  {saving ? 'Saving…' : 'Save as incomplete'}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                className="bg-ink text-ink-on-dark hover:bg-ink/90"
                disabled={
                  saving || (!group && !complete) || (!!group && !anything)
                }
                onClick={submit}
                data-testid="submit-group"
              >
                {saving
                  ? 'Saving…'
                  : !group
                    ? 'Create group'
                    : complete
                      ? 'Save group'
                      : 'Save as incomplete'}
              </Button>
            </div>
          </div>
        </footer>
      </SheetContent>
    </Sheet>
  )
}

// ----------------------------------------------------------------- coaches

function CoachPicker({
  sandboxId,
  selected,
  onChange,
}: {
  sandboxId: string
  selected: CoachDraft[]
  onChange: (next: CoachDraft[]) => void
}) {
  const [q, setQ] = useState('')
  const [focused, setFocused] = useState(false)
  const search = useSandboxPeopleSearch(q, sandboxId, focused || q.length > 0)
  const all = search.data ?? []
  const coachLike = all.filter(p => isCoachLike(p.roles))
  const results = (coachLike.length ? coachLike : all).filter(
    p => !selected.some(s => s.user_id === p.id),
  )

  const add = (p: PersonSearchResult) => {
    onChange([
      ...selected,
      { user_id: p.id, name: p.full_name, email: p.email },
    ])
    setQ('')
  }

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="selected-coaches">
          {selected.map(c => (
            <span
              key={c.user_id}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper py-0.5 pl-0.5 pr-2 text-sm"
            >
              <PersonAvatar name={c.name} email={c.email} size="xs" />
              {c.name || c.email}
              <button
                type="button"
                aria-label={`Remove ${c.name || c.email}`}
                className="text-ink-3 hover:text-ink"
                onClick={() =>
                  onChange(selected.filter(s => s.user_id !== c.user_id))
                }
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={
            selected.length
              ? 'Add another coach'
              : 'Search coaches by name or email'
          }
          className="pl-9"
          aria-label="Search coaches"
          data-testid="coach-search"
        />
        {(q || (focused && selected.length === 0)) && (
          <ul
            className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-line bg-paper shadow-md"
            data-testid="coach-results"
          >
            {search.isLoading && (
              <li className="px-3 py-2 text-sm text-ink-3">Searching…</li>
            )}
            {!search.isLoading && results.length === 0 && (
              <li className="px-3 py-2 text-sm text-ink-3">
                {q ? 'No coach matches.' : 'Type to search coaches.'}
              </li>
            )}
            {results.map(p => (
              <li key={p.id}>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => add(p)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface-2"
                >
                  <PersonAvatar name={p.full_name} email={p.email} size="xs" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">
                      {p.full_name || p.email}
                    </span>
                    <span className="block truncate text-xs text-ink-3">
                      {p.email}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- coachees

function CoacheeEntry({
  sandboxId,
  coachees,
  onChange,
  candidates,
  groups,
  currentGroupId,
}: {
  sandboxId: string
  coachees: CoacheeDraft[]
  onChange: (next: CoacheeDraft[]) => void
  candidates: SandboxMember[]
  groups: SandboxGroup[]
  currentGroupId?: string
}) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const lookup = useEmailLookup(sandboxId, email)
  const info = lookup.data
  const valid = EMAIL_RE.test(email.trim())
  const duplicate = coachees.some(
    c => c.email.toLowerCase() === email.trim().toLowerCase(),
  )

  useEffect(() => {
    if (info?.exists && info.name && !name) setName(info.name)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info?.exists, info?.name])

  const add = () => {
    if (!valid || duplicate) return
    onChange([
      ...coachees,
      {
        key: `new-${Date.now()}`,
        email: email.trim().toLowerCase(),
        name: name.trim() || info?.name || null,
      },
    ])
    setEmail('')
    setName('')
  }

  const pick = (m: SandboxMember) => {
    onChange([
      ...coachees,
      {
        key: `member-${m.id}`,
        user_id: m.user_id,
        email: m.email,
        name: m.name,
      },
    ])
  }

  const pickable = candidates

  return (
    <div className="space-y-3">
      {coachees.length > 0 && (
        <ul
          className="divide-y divide-line rounded-lg border border-line"
          data-testid="coachee-list"
        >
          {coachees.map(c => (
            <CoacheeRow
              key={c.key}
              coachee={c}
              sandboxId={sandboxId}
              groups={groups}
              currentGroupId={currentGroupId}
              onRemove={() => onChange(coachees.filter(x => x.key !== c.key))}
            />
          ))}
        </ul>
      )}
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={e => {
          e.preventDefault()
          add()
        }}
      >
        <div className="flex-1">
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="coachee@company.com"
            aria-label="Coachee email"
            data-testid="coachee-email"
          />
        </div>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Name"
          aria-label="Coachee name"
          className="sm:w-40"
          data-testid="coachee-name"
        />
        <Button
          type="submit"
          variant="outline"
          disabled={!valid || duplicate}
          data-testid="coachee-add"
        >
          Add
        </Button>
      </form>
      {valid && info && (
        <p
          className={cn(
            'text-xs',
            duplicate
              ? 'text-amber-token'
              : info.exists
                ? 'text-forest'
                : 'text-ink-3',
          )}
        >
          {duplicate
            ? 'Already in this group.'
            : info.already_member && info.member_group_names.length
              ? `Also in ${info.member_group_names.join(', ')} of this sandbox. Allowed.`
              : info.exists
                ? info.kind === 'active_user'
                  ? 'Already in Coach Sidekick — will be linked when they accept.'
                  : 'Already known to Coach Sidekick, will be linked.'
                : 'New to Coach Sidekick. No email is sent until you invite them.'}
        </p>
      )}
      {pickable.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-3">
          <span>Or pick from the team:</span>
          {pickable.slice(0, 8).map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => pick(m)}
              className="rounded-full border border-dashed border-ink-4 px-2 py-0.5 text-ink-2 hover:border-ink hover:text-ink"
            >
              + {m.name || m.email}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CoacheeRow({
  coachee,
  sandboxId,
  groups,
  currentGroupId,
  onRemove,
}: {
  coachee: CoacheeDraft
  sandboxId: string
  groups: SandboxGroup[]
  currentGroupId?: string
  onRemove: () => void
}) {
  const otherGroups = groups.filter(
    g =>
      g.id !== currentGroupId &&
      g.coachees.some(
        c => c.email.toLowerCase() === coachee.email.toLowerCase(),
      ),
  )
  const lookup = useEmailLookup(sandboxId, coachee.user_id ? '' : coachee.email)
  const known = coachee.user_id ? true : !!lookup.data?.exists

  return (
    <li className="flex items-center gap-3 px-3 py-2" data-testid="coachee-row">
      <PersonAvatar
        name={coachee.name}
        email={coachee.email}
        dashed={!coachee.group_member_id}
        size="sm"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-ink">
          {coachee.name || coachee.email}
        </span>
        <span className="block truncate text-xs text-ink-3">
          {coachee.name
            ? coachee.email
            : known
              ? 'Already in Coach Sidekick'
              : 'New'}
          {known &&
            coachee.name &&
            ' · already in Coach Sidekick, will be linked'}
          {otherGroups.length > 0 &&
            ` · also in ${otherGroups.map(g => g.display_name).join(', ')}. Allowed.`}
        </span>
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-ink-3"
        aria-label={`Remove ${coachee.name || coachee.email}`}
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </li>
  )
}
