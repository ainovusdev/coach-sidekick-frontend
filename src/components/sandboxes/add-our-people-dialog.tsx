'use client'

import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { useSandboxPeopleSearch } from '@/hooks/queries/use-sandboxes'
import {
  sandboxErrorDetail,
  useAddMember,
} from '@/hooks/mutations/use-sandbox-mutations'
import { cn } from '@/lib/utils'
import {
  OUR_ROLES,
  type OurRole,
  type PersonSearchResult,
} from '@/types/sandbox'

export function AddOurPeopleDialog({
  open,
  onOpenChange,
  sandboxId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sandboxId: string
}) {
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<PersonSearchResult | null>(null)
  const [roles, setRoles] = useState<OurRole[]>([])
  const [inlineError, setInlineError] = useState<string | null>(null)
  const addMember = useAddMember(sandboxId)
  const search = useSandboxPeopleSearch(q, sandboxId, open && !selected)

  useEffect(() => {
    if (open) {
      setQ('')
      setSelected(null)
      setRoles([])
      setInlineError(null)
    }
  }, [open])

  const toggleRole = (role: OurRole, on: boolean) =>
    setRoles(prev => (on ? [...prev, role] : prev.filter(r => r !== role)))

  const submit = async () => {
    if (!selected || roles.length === 0) return
    setInlineError(null)
    try {
      await addMember.mutateAsync({ side: 'ours', roles, user_id: selected.id })
      onOpenChange(false)
    } catch (error) {
      const detail = sandboxErrorDetail(error)
      if (detail?.code === 'already_member') {
        setInlineError(
          `${selected.full_name || selected.email} is already on this sandbox. Change their roles from the team list instead.`,
        )
      } else if (detail) {
        setInlineError(detail.message)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add from our people</DialogTitle>
          <DialogDescription>
            Anyone with a coach or admin account. No email is sent.
          </DialogDescription>
        </DialogHeader>

        {!selected ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
              <Input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search by name or email"
                className="pl-9"
                autoFocus
                aria-label="Search our people"
                data-testid="our-people-search"
              />
            </div>
            <ul
              className="max-h-64 divide-y divide-line overflow-y-auto rounded-lg border border-line"
              data-testid="our-people-results"
            >
              {search.isLoading && (
                <li className="px-3 py-3 text-sm text-ink-3">Searching…</li>
              )}
              {!search.isLoading && (search.data ?? []).length === 0 && (
                <li className="px-3 py-3 text-sm text-ink-3">
                  {q.trim()
                    ? 'No one matches.'
                    : 'Type to search, or leave blank to see everyone.'}
                </li>
              )}
              {(search.data ?? []).map(p => (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={p.is_member}
                    onClick={() => setSelected(p)}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors',
                      p.is_member
                        ? 'cursor-default opacity-60'
                        : 'hover:bg-surface-2',
                    )}
                  >
                    <PersonAvatar name={p.full_name} email={p.email} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">
                        {p.full_name || p.email}
                      </span>
                      <span className="block truncate text-xs text-ink-3">
                        {p.email}
                        {p.roles.length ? ` · ${p.roles.join(', ')}` : ''}
                      </span>
                    </span>
                    {p.is_member && (
                      <span className="text-xs text-ink-3">On the team</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
              <PersonAvatar name={selected.full_name} email={selected.email} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink">
                  {selected.full_name || selected.email}
                </span>
                <span className="block truncate text-xs text-ink-3">
                  {selected.email}
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Choose someone else"
                onClick={() => setSelected(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-ink">
                Roles in this sandbox
              </legend>
              {OUR_ROLES.map(r => (
                <Label
                  key={r.value}
                  className="flex cursor-pointer items-center gap-2 font-normal"
                >
                  <Checkbox
                    checked={roles.includes(r.value)}
                    onCheckedChange={v => toggleRole(r.value, v === true)}
                    data-testid={`role-${r.value}`}
                  />
                  {r.label}
                </Label>
              ))}
              <p className="text-xs text-ink-3">
                Coaches join through groups, so there is no coach hat here.
              </p>
            </fieldset>
            {inlineError && (
              <p className="text-sm text-amber-token">{inlineError}</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-ink text-ink-on-dark hover:bg-ink/90"
            disabled={!selected || roles.length === 0 || addMember.isPending}
            onClick={submit}
            data-testid="add-our-person"
          >
            {addMember.isPending ? 'Adding…' : 'Add to team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
