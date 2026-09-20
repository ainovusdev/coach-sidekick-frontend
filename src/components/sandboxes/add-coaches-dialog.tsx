'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { useSandboxCoachSearch } from '@/hooks/queries/use-sandboxes'
import {
  sandboxErrorDetail,
  useAddMember,
  useSetMemberRoster,
} from '@/hooks/mutations/use-sandbox-mutations'
import { pluralise } from '@/lib/sandbox/format'
import { cn } from '@/lib/utils'
import type { PersonSearchResult } from '@/types/sandbox'

/**
 * Put coaches on the sandbox's list — as many as you like in one go.
 *
 * Being on the list is what lets the Groups tab pick them; it sends no email
 * (that goes with their first pairing) and gives them no hat. Someone already
 * here as account executive or lead coach can be ticked too: they keep the hat
 * and gain the list.
 */
export function AddCoachesDialog({
  open,
  onOpenChange,
  sandboxId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sandboxId: string
}) {
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<Map<string, PersonSearchResult>>(
    new Map(),
  )
  const [saving, setSaving] = useState(false)
  const [problems, setProblems] = useState<string[]>([])
  const addMember = useAddMember(sandboxId)
  const setRoster = useSetMemberRoster(sandboxId)
  const search = useSandboxCoachSearch(q, sandboxId, open)
  const people = search.data ?? []

  useEffect(() => {
    if (!open) return
    setQ('')
    setPicked(new Map())
    setProblems([])
    setSaving(false)
  }, [open])

  const listed = (p: PersonSearchResult) =>
    (p.member_roster ?? []).includes('coach')
  const addable = people.filter(p => !listed(p))
  const allTicked = addable.length > 0 && addable.every(p => picked.has(p.id))

  const toggle = (p: PersonSearchResult, on: boolean) =>
    setPicked(prev => {
      const next = new Map(prev)
      if (on) next.set(p.id, p)
      else next.delete(p.id)
      return next
    })

  const toggleAll = (on: boolean) =>
    setPicked(prev => {
      const next = new Map(prev)
      for (const p of addable) {
        if (on) next.set(p.id, p)
        else next.delete(p.id)
      }
      return next
    })

  const submit = async () => {
    setSaving(true)
    const failed: string[] = []
    const left = new Map(picked)
    for (const p of picked.values()) {
      try {
        if (p.member_id) {
          await setRoster.mutateAsync({
            memberId: p.member_id,
            data: { roster: [...(p.member_roster ?? []), 'coach'] },
          })
        } else {
          await addMember.mutateAsync({
            side: 'ours',
            roles: [],
            roster: ['coach'],
            user_id: p.id,
          })
        }
        left.delete(p.id)
      } catch (error) {
        failed.push(
          `${p.full_name || p.email}: ${sandboxErrorDetail(error)?.message ?? 'could not be added'}`,
        )
      }
    }
    setSaving(false)
    setPicked(left)
    setProblems(failed)
    if (failed.length === 0) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="add-coaches-dialog">
        <DialogHeader>
          <DialogTitle>Add coaches</DialogTitle>
          <DialogDescription>
            Tick everyone who coaches on this sandbox. No email is sent until
            they get their first pairing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <Input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Filter by name or email"
              className="pl-9"
              aria-label="Filter coaches"
              data-testid="coaches-search"
            />
          </div>
          {addable.length > 1 && (
            <label className="flex cursor-pointer items-center gap-2 px-3 text-xs text-ink-3">
              <Checkbox
                checked={allTicked}
                onCheckedChange={v => toggleAll(v === true)}
                data-testid="coaches-select-all"
              />
              Select all {addable.length} shown
            </label>
          )}
          <ul
            className="max-h-72 divide-y divide-line overflow-y-auto rounded-lg border border-line"
            data-testid="coaches-results"
          >
            {search.isLoading && (
              <li className="px-3 py-3 text-sm text-ink-3">Loading…</li>
            )}
            {!search.isLoading && people.length === 0 && (
              <li className="px-3 py-3 text-sm text-ink-3">
                {q.trim() ? 'No coach matches.' : 'No coach accounts yet.'}
              </li>
            )}
            {people.map(p => {
              const already = listed(p)
              return (
                <li key={p.id}>
                  <label
                    className={cn(
                      'flex items-center gap-3 px-3 py-2',
                      already
                        ? 'opacity-60'
                        : 'cursor-pointer hover:bg-surface-2',
                    )}
                    data-testid="coach-candidate"
                    data-email={p.email}
                  >
                    <Checkbox
                      checked={already || picked.has(p.id)}
                      disabled={already}
                      onCheckedChange={v => toggle(p, v === true)}
                      aria-label={`Add ${p.full_name || p.email}`}
                    />
                    <PersonAvatar
                      name={p.full_name}
                      email={p.email}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">
                        {p.full_name || p.email}
                      </span>
                      <span className="block truncate text-xs text-ink-3">
                        {p.email}
                      </span>
                    </span>
                    {(already || p.is_member) && (
                      <span className="flex-none text-xs text-ink-3">
                        {already ? 'On the list' : 'On the team'}
                      </span>
                    )}
                  </label>
                </li>
              )
            })}
          </ul>
          {problems.length > 0 && (
            <ul
              className="space-y-1 text-sm text-amber-token"
              data-testid="coaches-problems"
            >
              {problems.map(p => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-ink text-ink-on-dark hover:bg-ink/90"
            disabled={picked.size === 0 || saving}
            onClick={submit}
            data-testid="add-coaches-submit"
          >
            {saving
              ? 'Adding…'
              : picked.size === 0
                ? 'Add coaches'
                : `Add ${pluralise(picked.size, 'coach', 'coaches')}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
