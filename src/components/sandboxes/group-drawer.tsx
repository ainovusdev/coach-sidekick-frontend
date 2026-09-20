'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DueDateField } from '@/components/ui/due-date-field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { CadenceControl } from '@/components/sandboxes/cadence-control'
import {
  RosterPicker,
  rosterOf,
  type RosterPick,
} from '@/components/sandboxes/groups/roster-picker'
import {
  sandboxErrorDetail,
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
  GroupType,
  SandboxErrorDetail,
  SandboxGroup,
  SandboxGroupMember,
  SandboxOverview,
} from '@/types/sandbox'

function picksOf(rows: SandboxGroupMember[], keepRow: boolean): RosterPick[] {
  return rows.map(r => ({
    member_id: r.member_id,
    user_id: r.user_id,
    name: r.name,
    email: r.email,
    ...(keepRow ? { group_member_id: r.id } : {}),
  }))
}

/** Term start until the term has begun, today after that. */
export function defaultStart(termStart: string, today: string): string {
  return today > termStart ? today : termStart
}

export function GroupDrawer({
  open,
  onOpenChange,
  overview,
  group,
  template = null,
  kind: newKind = 'group',
  onAddPeople,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  overview: SandboxOverview
  /** null = build a new group; otherwise finish / edit this one. */
  group: SandboxGroup | null
  /** A new group started as a copy: same coaches, supervisors and contract. */
  template?: SandboxGroup | null
  /** What a new one is. An existing group keeps the kind it was saved with. */
  kind?: GroupType
  /** Go to People — offered to those who may add to the lists. */
  onAddPeople?: () => void
}) {
  const { sandbox, members, groups } = overview
  const sandboxId = sandbox.id
  const createGroup = useCreateGroup(sandboxId)
  const updateGroup = useUpdateGroup(sandboxId)
  const addGroupMember = useAddGroupMember(sandboxId)
  const removeGroupMember = useRemoveGroupMember(sandboxId)

  const kind: GroupType = group?.kind ?? newKind
  const isPair = kind === 'pair'
  const noun = isPair ? 'pairing' : 'group'

  const [coaches, setCoaches] = useState<RosterPick[]>([])
  const [coachees, setCoachees] = useState<RosterPick[]>([])
  const [supervisorIds, setSupervisorIds] = useState<string[]>([])
  const [hours, setHours] = useState('')
  const [sessionLength, setSessionLength] = useState(DEFAULT_SESSION_LENGTH)
  const [cadence, setCadence] = useState<Cadence | null>(DEFAULT_CADENCE)
  const [startsOn, setStartsOn] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  // Someone being taken out has had sessions here (409 has_sessions): say so,
  // then save again with force. Nothing is deleted either way.
  const [leaving, setLeaving] = useState<SandboxErrorDetail | null>(null)
  const [cadenceKey, setCadenceKey] = useState(0)

  // Reset the draft every time the drawer opens.
  useEffect(() => {
    if (!open) return
    setLeaving(null)
    // A copy carries the coaches, the supervisors and the contract; who is
    // coached is the one thing that differs, so that is left to fill in.
    const from = group ?? template
    setCoaches(picksOf(from?.coaches ?? [], !!group))
    setCoachees(picksOf(group?.coachees ?? [], true))
    setSupervisorIds((from?.supervisors ?? []).map(s => s.member_id))
    setHours(
      from?.hours_per_coachee != null ? String(from.hours_per_coachee) : '',
    )
    setSessionLength(from?.session_length_minutes ?? DEFAULT_SESSION_LENGTH)
    setCadence(from ? from.cadence : DEFAULT_CADENCE)
    // Enrollment is backdated to the start, so a copy made mid-term starts
    // today rather than claiming sessions held before it existed.
    setStartsOn(
      group
        ? group.starts_on_is_default
          ? null
          : group.starts_on
        : template
          ? defaultStart(sandbox.term_start, overview.today)
          : null,
    )
    setName(group?.name ?? '')
    setSaving(false)
    setCadenceKey(k => k + 1)
  }, [open, group, template, sandbox.term_start, overview.today])

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
  const coachRoster = useMemo(() => rosterOf(members, 'coach'), [members])
  const coacheeRoster = useMemo(() => rosterOf(members, 'coachee'), [members])
  const alsoIn = (pick: RosterPick) => {
    const others = groups.filter(
      g =>
        g.id !== group?.id &&
        g.coachees.some(c => c.member_id === pick.member_id),
    )
    return others.length
      ? `also in ${others.map(g => g.display_name).join(', ')}. Allowed.`
      : null
  }

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
    : template
      ? `Copy of ${template.display_name}`
      : isPair
        ? 'Add a pairing'
        : 'Build a group'

  const buildPayload = () => ({
    name: name.trim() || null,
    hours_per_coachee: hoursValid ? hoursNumber : null,
    session_length_minutes: sessionLength,
    cadence,
    starts_on: startsOn,
  })

  const submit = async (force = false) => {
    setSaving(true)
    try {
      if (!group) {
        await createGroup.mutateAsync({
          ...buildPayload(),
          kind,
          coach_member_ids: coaches.map(c => c.member_id),
          coachee_member_ids: coachees.map(c => c.member_id),
          supervisor_member_ids: supervisorIds,
        })
      } else {
        // Members first, so the settings save (and its toast) is the last thing that happens.
        const removedCoaches = group.coaches.filter(
          c => !coaches.some(d => d.member_id === c.member_id),
        )
        const addedCoaches = coaches.filter(
          d => !group.coaches.some(c => c.member_id === d.member_id),
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
            force,
          })
        for (const c of removedCoachees)
          await removeGroupMember.mutateAsync({
            groupId: group.id,
            groupMemberId: c.id,
            force,
          })
        for (const s of removedSupervisors)
          await removeGroupMember.mutateAsync({
            groupId: group.id,
            groupMemberId: s.id,
          })
        for (const c of addedCoaches)
          await addGroupMember.mutateAsync({
            groupId: group.id,
            data: { kind: 'coach', member_id: c.member_id },
          })
        for (const c of addedCoachees)
          await addGroupMember.mutateAsync({
            groupId: group.id,
            data: { kind: 'coachee', member_id: c.member_id },
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
    } catch (error) {
      const detail = sandboxErrorDetail(error)
      if (detail?.code === 'has_sessions') setLeaving(detail)
      // anything else was toasted by the mutation hook
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
            Coaches, coachees, hours and cadence for this {noun}.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-5">
          {/* Coaches */}
          <section className="space-y-2">
            <Label className="text-sm font-medium text-ink">
              {isPair ? 'Coach' : 'Coaches'}
            </Label>
            <RosterPicker
              kind="coach"
              roster={coachRoster}
              selected={coaches}
              onChange={setCoaches}
              single={isPair}
              onAddPeople={onAddPeople}
            />
          </section>

          {/* Coachees */}
          <section className="space-y-2">
            <div>
              <Label className="text-sm font-medium text-ink">
                {isPair ? 'Coachee' : 'Coachees'}
              </Label>
              <p className="text-xs text-ink-3">
                {isPair
                  ? 'They become a client of this coach when the pairing is saved.'
                  : 'They become clients of every coach here when the group is saved.'}
              </p>
            </div>
            <RosterPicker
              kind="coachee"
              roster={coacheeRoster}
              selected={coachees}
              onChange={setCoachees}
              single={isPair}
              note={alsoIn}
              onAddPeople={onAddPeople}
            />
          </section>

          {/* Supervisors */}
          <section className="space-y-2">
            <Label className="text-sm font-medium text-ink">Supervisors</Label>
            {teamSupervisors.length === 0 ? (
              <p className="text-xs text-ink-3">
                No supervisors on the team yet. Add them on People with the
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
          {leaving && (
            <p
              className="mt-3 rounded-md bg-amber-token-bg px-3 py-2 text-xs text-amber-token"
              data-testid="leaving-with-sessions"
            >
              {leaving.message} Save anyway to go ahead.
            </p>
          )}
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
                  onClick={() => submit()}
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
                onClick={() => submit(!!leaving)}
                data-testid={leaving ? 'submit-group-anyway' : 'submit-group'}
              >
                {saving
                  ? 'Saving…'
                  : leaving
                    ? 'Save anyway'
                    : !group
                      ? `Create ${noun}`
                      : complete
                        ? `Save ${noun}`
                        : 'Save as incomplete'}
              </Button>
            </div>
          </div>
        </footer>
      </SheetContent>
    </Sheet>
  )
}
