'use client'

import { useEffect, useState } from 'react'
import {
  GitMerge,
  ArrowRight,
  AlertTriangle,
  X,
  Loader2,
  Search,
} from 'lucide-react'
import { User } from '@/services/admin-service'
import { useAdminUsers } from '@/hooks/queries/use-admin-users'
import {
  usePreviewMerge,
  useExecuteMerge,
} from '@/hooks/mutations/use-merge-profiles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

function UserPicker({
  label,
  hint,
  selected,
  onSelect,
  excludeId,
}: {
  label: string
  hint: string
  selected: User | null
  onSelect: (u: User | null) => void
  excludeId?: string
}) {
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 400)
    return () => clearTimeout(t)
  }, [q])

  const { data: results = [], isFetching } = useAdminUsers(
    { search: debounced, limit: 8 },
    { enabled: debounced.length >= 2 },
  )

  const filtered = results.filter(u => u.id !== excludeId)

  if (selected) {
    return (
      <div>
        <label className="text-sm font-medium">{label}</label>
        <div className="mt-2 flex items-center justify-between rounded-md border p-3">
          <div className="min-w-0">
            <div className="truncate font-medium">
              {selected.full_name || selected.email}
            </div>
            <div className="truncate text-sm text-muted-foreground">
              {selected.email}
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {selected.roles.map(r => (
                <Badge key={r} variant="secondary" className="text-xs">
                  {r}
                </Badge>
              ))}
              <Badge variant="outline" className="text-xs">
                {selected.client_count} profile
                {selected.client_count === 1 ? '' : 's'}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSelect(null)
              setQ('')
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <p className="mb-2 text-xs text-muted-foreground">{hint}</p>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by name or email…"
          className="pl-8"
        />
      </div>
      {debounced.length >= 2 && (
        <div className="mt-2 max-h-64 overflow-auto rounded-md border">
          {isFetching && (
            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          )}
          {!isFetching && filtered.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground">
              No matching accounts.
            </div>
          )}
          {filtered.map(u => (
            <button
              key={u.id}
              onClick={() => onSelect(u)}
              className="flex w-full items-center justify-between border-b px-3 py-2 text-left last:border-0 hover:bg-muted"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {u.full_name || u.email}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {u.email}
                </div>
              </div>
              <div className="ml-2 flex shrink-0 items-center gap-1">
                {!u.is_active && (
                  <Badge variant="outline" className="text-xs">
                    inactive
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  {u.client_count}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function MergeProfilesPage() {
  const [source, setSource] = useState<User | null>(null)
  const [target, setTarget] = useState<User | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const previewMut = usePreviewMerge()
  const executeMut = useExecuteMerge()
  const preview = previewMut.data ?? null

  // Clear a stale preview whenever the selection changes.
  useEffect(() => {
    previewMut.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source?.id, target?.id])

  const canPreview = !!source && !!target && source.id !== target.id
  const nonzeroCounts = preview
    ? Object.entries(preview.moved_counts).filter(([, n]) => n > 0)
    : []

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <GitMerge className="h-6 w-6" /> Merge Profiles
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Combine a duplicate person&apos;s account into their primary one. The
          duplicate&apos;s coaching profiles move to the primary login, the
          duplicate account is deactivated, and its owner is emailed to switch.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <UserPicker
            label="Duplicate account (will be retired)"
            hint="The extra login to absorb and deactivate."
            selected={source}
            onSelect={setSource}
            excludeId={target?.id}
          />
          <div className="flex justify-center text-muted-foreground">
            <ArrowRight className="h-5 w-5" />
          </div>
          <UserPicker
            label="Primary account (will be kept)"
            hint="The login this person should keep using."
            selected={target}
            onSelect={setTarget}
            excludeId={source?.id}
          />

          <Button
            className="w-full"
            disabled={!canPreview || previewMut.isPending}
            onClick={() =>
              source &&
              target &&
              previewMut.mutate({
                sourceUserId: source.id,
                targetUserId: target.id,
              })
            }
          >
            {previewMut.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Preview merge
          </Button>
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What will happen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{preview.source.email}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{preview.target.email}</span>
            </div>

            <div>
              <div className="mb-1 font-medium">
                {preview.profiles_to_move.length} profile
                {preview.profiles_to_move.length === 1 ? '' : 's'} will move
              </div>
              <ul className="space-y-1">
                {preview.profiles_to_move.map(p => (
                  <li key={p.client_id} className="text-muted-foreground">
                    • {p.name}
                    {p.coach_name ? ` — coached by ${p.coach_name}` : ''}
                    {p.email ? ` (${p.email})` : ''}
                  </li>
                ))}
                {preview.profiles_to_move.length === 0 && (
                  <li className="text-muted-foreground">
                    No client profiles on the duplicate account.
                  </li>
                )}
              </ul>
            </div>

            {nonzeroCounts.length > 0 && (
              <div className="text-muted-foreground">
                Also moving:{' '}
                {nonzeroCounts
                  .map(([k, n]) => `${n} ${k.split('.')[0]}`)
                  .join(', ')}
              </div>
            )}

            {preview.warnings.length > 0 && (
              <div className="rounded-md bg-amber-token-bg p-3 text-amber-token">
                {preview.warnings.map((w, i) => (
                  <div key={i} className="flex gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {w}
                  </div>
                ))}
              </div>
            )}

            {preview.blocking_errors.length > 0 && (
              <div className="rounded-md bg-vermillion-bg p-3 text-vermillion">
                {preview.blocking_errors.map((e, i) => (
                  <div key={i} className="flex gap-2">
                    <X className="h-4 w-4 shrink-0" />
                    {e}
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="destructive"
              className="w-full"
              disabled={!preview.can_merge || executeMut.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              {executeMut.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Merge profiles
            </Button>
          </CardContent>
        </Card>
      )}

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Merge these accounts?"
        description={
          preview
            ? `Retire ${preview.source.email} and move ${preview.profiles_to_move.length} profile(s) onto ${preview.target.email}. The retired account will be deactivated and its owner emailed to use the primary login. This cannot be automatically undone.`
            : ''
        }
        confirmText="Merge"
        variant="destructive"
        onConfirm={() => {
          if (!source || !target) return
          executeMut.mutate(
            { sourceUserId: source.id, targetUserId: target.id },
            {
              onSuccess: () => {
                setSource(null)
                setTarget(null)
                previewMut.reset()
              },
            },
          )
          setConfirmOpen(false)
        }}
      />
    </div>
  )
}
