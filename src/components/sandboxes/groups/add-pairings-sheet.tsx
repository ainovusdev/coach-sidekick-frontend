'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
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
import { detailControl } from '@/components/sandboxes/details/detail-chart'
import { defaultStart } from '@/components/sandboxes/group-drawer'
import { rosterOf } from '@/components/sandboxes/groups/roster-picker'
import {
  sandboxErrorDetail,
  useCreateGroups,
} from '@/hooks/mutations/use-sandbox-mutations'
import {
  DEFAULT_CADENCE,
  DEFAULT_SESSION_LENGTH,
  expectedSessions,
} from '@/lib/sandbox/cadence'
import { pluralise } from '@/lib/sandbox/format'
import { cn } from '@/lib/utils'
import type { Cadence, SandboxGroup, SandboxOverview } from '@/types/sandbox'

interface Row {
  key: number
  coach: string
  coachee: string
  /** Hours for this pairing only; blank = the shared contract. */
  hours: string
}

let nextKey = 1
const blankRow = (coach = ''): Row => ({
  key: nextKey++,
  coach,
  coachee: '',
  hours: '',
})

const pairKey = (coach: string, coachee: string) => `${coach}→${coachee}`

/**
 * Many 1:1 pairings in one go.
 *
 * One contract at the top, then a row per pairing — coach and coachee both
 * picked from the lists on People. Everything is created together or not at
 * all, so a half-made set never has to be tidied up.
 */
export function AddPairingsSheet({
  open,
  onOpenChange,
  overview,
  template = null,
  onAddPeople,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  overview: SandboxOverview
  /** Duplicate: same coach and contract, coachee left to choose. */
  template?: SandboxGroup | null
  onAddPeople?: () => void
}) {
  const { sandbox, members, groups, today } = overview
  const createGroups = useCreateGroups(sandbox.id)

  const coaches = useMemo(() => rosterOf(members, 'coach'), [members])
  const coachees = useMemo(() => rosterOf(members, 'coachee'), [members])

  const [rows, setRows] = useState<Row[]>([blankRow()])
  const [hours, setHours] = useState('')
  const [sessionLength, setSessionLength] = useState(DEFAULT_SESSION_LENGTH)
  const [cadence, setCadence] = useState<Cadence | null>(DEFAULT_CADENCE)
  const [startsOn, setStartsOn] = useState(sandbox.term_start)
  const [allowSecond, setAllowSecond] = useState(false)
  const [cadenceKey, setCadenceKey] = useState(0)
  const [problem, setProblem] = useState<string | null>(null)
  // "One coach, many coachees": who, and which of the coachees are ticked.
  const [fanCoach, setFanCoach] = useState('')

  useEffect(() => {
    if (!open) return
    setRows([blankRow(template?.coaches[0]?.member_id ?? '')])
    setHours(
      template?.hours_per_coachee != null
        ? String(template.hours_per_coachee)
        : '',
    )
    setSessionLength(template?.session_length_minutes ?? DEFAULT_SESSION_LENGTH)
    setCadence(template ? template.cadence : DEFAULT_CADENCE)
    // Enrollment is backdated to the start date, so once the term is running a
    // new pairing starts today unless someone says otherwise.
    setStartsOn(defaultStart(sandbox.term_start, today))
    setAllowSecond(false)
    setProblem(null)
    setFanCoach('')
    setCadenceKey(k => k + 1)
  }, [open, template, sandbox.term_start, today])

  /** Coach→coachee pairings that already exist and are still open. */
  const existing = useMemo(
    () =>
      new Set(
        groups
          .filter(g => g.kind === 'pair')
          .flatMap(g =>
            g.coaches.flatMap(c =>
              g.coachees.map(e => pairKey(c.member_id, e.member_id)),
            ),
          ),
      ),
    [groups],
  )

  const filled = rows.filter(r => r.coach && r.coachee)
  const partial = rows.some(
    r => (r.coach || r.coachee) && !(r.coach && r.coachee),
  )
  const seen = new Map<string, number>()
  for (const r of filled) {
    const k = pairKey(r.coach, r.coachee)
    seen.set(k, (seen.get(k) ?? 0) + 1)
  }
  const stateOf = (r: Row): 'twice' | 'exists' | 'self' | null => {
    if (!r.coach || !r.coachee) return null
    if (r.coach === r.coachee) return 'self'
    const k = pairKey(r.coach, r.coachee)
    if ((seen.get(k) ?? 0) > 1) return 'twice'
    return existing.has(k) ? 'exists' : null
  }
  const states = rows.map(stateOf)
  const blocked = states.some(s => s === 'twice' || s === 'self')
  const seconds = states.filter(s => s === 'exists').length

  const hoursNumber = hours.trim() === '' ? null : Number(hours)
  const hoursValid =
    hoursNumber != null && !Number.isNaN(hoursNumber) && hoursNumber > 0
  const rowHoursValid = rows.every(
    r => r.hours.trim() === '' || Number(r.hours) > 0,
  )
  const expected = expectedSessions(hours, sessionLength)

  const ready =
    filled.length > 0 &&
    !partial &&
    !blocked &&
    hoursValid &&
    rowHoursValid &&
    !!cadence &&
    (seconds === 0 || allowSecond)

  const patch = (key: number, next: Partial<Row>) =>
    setRows(prev => prev.map(r => (r.key === key ? { ...r, ...next } : r)))

  const fanOut = () => {
    if (!fanCoach) return
    const taken = new Set(
      rows.filter(r => r.coach === fanCoach).map(r => r.coachee),
    )
    const fresh = coachees
      .filter(
        c =>
          c.id !== fanCoach &&
          !taken.has(c.id) &&
          !existing.has(pairKey(fanCoach, c.id)),
      )
      .map(c => ({ ...blankRow(fanCoach), coachee: c.id }))
    if (fresh.length === 0) return
    setRows(prev => [...prev.filter(r => r.coach || r.coachee), ...fresh])
  }

  const submit = async () => {
    setProblem(null)
    try {
      await createGroups.mutateAsync({
        allow_duplicates: allowSecond,
        groups: filled.map(r => ({
          kind: 'pair',
          coach_member_ids: [r.coach],
          coachee_member_ids: [r.coachee],
          hours_per_coachee: r.hours.trim() ? Number(r.hours) : hoursNumber,
          session_length_minutes: sessionLength,
          cadence,
          starts_on: startsOn === sandbox.term_start ? null : startsOn,
        })),
      })
      onOpenChange(false)
    } catch (error) {
      // The hook toasts; keep the reason on the sheet too, beside the rows.
      setProblem(sandboxErrorDetail(error)?.message ?? null)
    }
  }

  const nameOf = (id: string) => {
    const m = members.find(x => x.id === id)
    return m ? m.name || m.email : ''
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
        data-testid="add-pairings-sheet"
      >
        <SheetHeader className="border-b border-line px-6 py-4 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
            {sandbox.name}
          </p>
          <SheetTitle className="text-lg">Add 1:1 pairings</SheetTitle>
          <SheetDescription className="text-sm text-ink-3">
            One coach with one coachee. Set the contract once, then list who
            works with whom.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-5">
          {/* Shared contract */}
          <section className="space-y-3">
            <Label className="text-sm font-medium text-ink">
              Contract for every pairing
            </Label>
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink">
              <Input
                type="number"
                inputMode="decimal"
                min={0.5}
                step={0.5}
                value={hours}
                onChange={e => setHours(e.target.value)}
                placeholder="0"
                className="h-8 w-20 text-right font-mono"
                aria-label="Hours per coachee"
                data-testid="pairings-hours"
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
                className="h-8 w-16 text-right font-mono"
                aria-label="Session length in minutes"
              />
              <span>min</span>
              <span className="text-ink-3">→</span>
              <span className="font-mono" data-testid="pairings-expected">
                {expected == null
                  ? '— sessions'
                  : pluralise(expected, 'session')}
              </span>
            </div>
            <CadenceControl
              key={cadenceKey}
              value={cadence}
              onChange={setCadence}
              termMonths={sandbox.term_months}
              expectedSessions={expected}
            />
            <div className="max-w-xs space-y-1">
              <DueDateField
                id="pairings-starts"
                label="Starts"
                value={startsOn}
                onChange={v => setStartsOn(v ?? sandbox.term_start)}
              />
              <p className="text-xs text-ink-3">
                {startsOn === sandbox.term_start
                  ? 'The term start.'
                  : 'Sessions before this date don’t count toward these pairings.'}
              </p>
            </div>
          </section>

          {/* One coach, many coachees */}
          <section className="space-y-2 rounded-lg border border-dashed border-ink-4 px-4 py-3">
            <Label htmlFor="fan-coach" className="text-sm font-medium text-ink">
              One coach, every coachee
            </Label>
            <div className="flex flex-wrap items-center gap-2">
              <select
                id="fan-coach"
                className={cn(detailControl, 'min-w-0 flex-1')}
                value={fanCoach}
                onChange={e => setFanCoach(e.target.value)}
                data-testid="fan-coach"
              >
                <option value="">Pick a coach…</option>
                {coaches.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.email}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!fanCoach}
                onClick={fanOut}
                data-testid="fan-out"
              >
                Add a row per coachee
              </Button>
            </div>
            <p className="text-xs text-ink-3">
              Adds a row for each coachee they aren’t paired with yet. Take out
              the ones you don’t want.
            </p>
          </section>

          {/* Rows */}
          <section className="space-y-2">
            <Label className="text-sm font-medium text-ink">Pairings</Label>
            <ul className="space-y-2" data-testid="pairing-rows">
              {rows.map((r, i) => {
                const state = states[i]
                return (
                  <li
                    key={r.key}
                    className="rounded-lg border border-line p-2"
                    data-testid="pairing-row"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        className={cn(detailControl, 'min-w-0 flex-1 basis-40')}
                        aria-label={`Coach, row ${i + 1}`}
                        value={r.coach}
                        onChange={e => patch(r.key, { coach: e.target.value })}
                        data-testid="pairing-coach"
                      >
                        <option value="">Coach…</option>
                        {coaches.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name || c.email}
                          </option>
                        ))}
                      </select>
                      <span className="text-ink-3" aria-hidden>
                        →
                      </span>
                      <select
                        className={cn(detailControl, 'min-w-0 flex-1 basis-40')}
                        aria-label={`Coachee, row ${i + 1}`}
                        value={r.coachee}
                        onChange={e =>
                          patch(r.key, { coachee: e.target.value })
                        }
                        data-testid="pairing-coachee"
                      >
                        <option value="">Coachee…</option>
                        {coachees.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name || c.email}
                            {r.coach && existing.has(pairKey(r.coach, c.id))
                              ? ' (already paired)'
                              : ''}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0.5}
                        step={0.5}
                        value={r.hours}
                        onChange={e => patch(r.key, { hours: e.target.value })}
                        placeholder={hours || 'h'}
                        className="h-8 w-16 flex-none text-right font-mono"
                        aria-label={`Hours for row ${i + 1}, if different`}
                        data-testid="pairing-hours"
                      />
                      <button
                        type="button"
                        aria-label={`Remove row ${i + 1}`}
                        className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-ink-3 hover:bg-surface-2 hover:text-ink disabled:opacity-40"
                        disabled={rows.length === 1}
                        onClick={() =>
                          setRows(prev => prev.filter(x => x.key !== r.key))
                        }
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {state && (
                      <p
                        className="mt-1.5 px-1 text-xs text-amber-token"
                        data-testid="pairing-row-note"
                      >
                        {state === 'self'
                          ? 'Nobody coaches themselves.'
                          : state === 'twice'
                            ? 'This pairing is listed twice.'
                            : `${nameOf(r.coach)} already coaches ${nameOf(r.coachee)} here.`}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setRows(prev => [
                    ...prev,
                    blankRow(prev[prev.length - 1]?.coach ?? ''),
                  ])
                }
                data-testid="add-pairing-row"
              >
                <Plus className="h-4 w-4" />
                Add a row
              </Button>
              {onAddPeople && (
                <p className="text-xs text-ink-3">
                  Someone missing?{' '}
                  <button
                    type="button"
                    className="text-ds-accent hover:underline"
                    onClick={onAddPeople}
                  >
                    Add them on People
                  </button>
                </p>
              )}
            </div>
            <p className="text-xs text-ink-3">
              The small box is hours for that pairing, if they differ from the
              contract above.
            </p>
            {seconds > 0 && (
              <Label className="flex cursor-pointer items-start gap-2 rounded-md bg-amber-token-bg px-3 py-2 text-xs font-normal text-amber-token">
                <Checkbox
                  checked={allowSecond}
                  onCheckedChange={v => setAllowSecond(v === true)}
                  data-testid="allow-second-pairing"
                />
                <span>
                  {seconds === 1
                    ? 'One of these already exists.'
                    : `${seconds} of these already exist.`}{' '}
                  Create a second pairing anyway — a new contract alongside the
                  first.
                </span>
              </Label>
            )}
          </section>
        </div>

        <footer className="border-t border-line bg-surface-2 px-6 py-4">
          {problem && (
            <p
              className="mb-3 rounded-md bg-amber-token-bg px-3 py-2 text-xs text-amber-token"
              data-testid="pairings-problem"
            >
              {problem} Nothing was created.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-ink-3 sm:flex-1">
              {pluralise(filled.length, 'pairing')} · coaches hear once, on
              their first pairing
              {!hoursValid && (
                <span className="text-amber-token"> · missing hours</span>
              )}
              {partial && (
                <span className="text-amber-token">
                  {' '}
                  · a row is half filled
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-ink text-ink-on-dark hover:bg-ink/90"
                disabled={!ready || createGroups.isPending}
                onClick={submit}
                data-testid="submit-pairings"
              >
                {createGroups.isPending
                  ? 'Creating…'
                  : filled.length > 1
                    ? `Create ${filled.length} pairings`
                    : 'Create pairing'}
              </Button>
            </div>
          </div>
        </footer>
      </SheetContent>
    </Sheet>
  )
}
