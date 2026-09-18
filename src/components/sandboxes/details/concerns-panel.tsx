'use client'

import { withSandboxViewer } from '@/hooks/queries/use-sandbox-insights'
import { CommitmentCreatePanel } from '@/components/commitments/commitment-create-panel'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Flag, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SandboxDetailsService } from '@/services/sandbox-details-service'
import type {
  SandboxConcern,
  SandboxConcernCreate,
  SandboxConcernUpdate,
  SandboxEntityKind,
} from '@/types/sandbox-details'
import { fmtDay } from '@/lib/sandbox/format'
import { detailControl, detailSection } from './detail-chart'

export function ConcernsPanel({
  sandboxId,
  kind,
  entityId,
  viewer,
}: {
  sandboxId: string
  kind: SandboxEntityKind
  entityId: string
  viewer: string | null
}) {
  const queryClient = useQueryClient()
  const context = [
    'sandbox-concerns',
    viewer,
    sandboxId,
    kind,
    entityId,
  ] as const
  const query = useQuery({
    queryKey: context,
    queryFn: () =>
      withSandboxViewer(viewer, () =>
        SandboxDetailsService.concerns(sandboxId, kind, entityId),
      ),
    enabled: !!viewer,
    gcTime: 0,
    staleTime: 0,
  })
  const data = query.isError ? undefined : query.data
  const [editing, setEditing] = useState<SandboxConcern | 'new' | null>(null)
  const visibleEditing =
    editing === 'new'
      ? data?.can_create
        ? editing
        : null
      : (data?.items.find(item => item.id === editing?.id) ?? null)
  const [resolved, setResolved] = useState(false)
  const [followUpOpen, setFollowUpOpen] = useState(false)
  const mutation = useMutation({
    mutationFn: (request: {
      input: SandboxConcernCreate | SandboxConcernUpdate
      id?: string
      key: readonly unknown[]
      sandboxId: string
    }) =>
      withSandboxViewer(viewer, () =>
        request.id
          ? SandboxDetailsService.updateConcern(
              request.sandboxId,
              request.id,
              request.input as SandboxConcernUpdate,
            )
          : SandboxDetailsService.createConcern(
              request.sandboxId,
              request.input as SandboxConcernCreate,
            ),
      ),
    onError: () => {
      void query.refetch()
    },
    onSuccess: (_result, request) => {
      void queryClient.invalidateQueries({ queryKey: request.key })
      void queryClient.invalidateQueries({
        queryKey: ['sandbox-entity', viewer, sandboxId],
      })
      setEditing(null)
    },
  })
  const items =
    data?.items.filter(item => resolved || item.status === 'open') ?? []
  return (
    <section className={detailSection} data-testid="sandbox-concerns">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <Flag className="h-4 w-4 text-ink-3" />
            Internal concerns
          </h2>
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-ink-3">
            Visible to authorized internal leadership, the author and the owner.
          </p>
        </div>
        {data?.can_create && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              mutation.reset()
              setEditing('new')
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Raise a concern
          </Button>
        )}
      </div>
      {query.isError ? (
        <p role="alert" className="mt-4 text-sm text-ink-3">
          Concerns could not be loaded.{' '}
          <button className="underline" onClick={() => void query.refetch()}>
            Try again
          </button>
        </p>
      ) : query.isPending ? (
        <p className="mt-4 text-sm text-ink-3">Loading concerns…</p>
      ) : (
        <>
          <ul className="mt-3 divide-y divide-line">
            {items.map(item => (
              <li className="py-4" key={item.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-medium text-ink">{item.title}</h3>
                  <span
                    className={
                      item.priority === 'urgent' && item.status === 'open'
                        ? 'text-xs font-medium text-vermillion'
                        : 'text-xs text-ink-3'
                    }
                  >
                    {item.status === 'resolved'
                      ? 'Resolved'
                      : item.priority === 'urgent'
                        ? 'Urgent'
                        : 'Open'}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">
                  {item.explanation}
                </p>
                <p className="mt-2 text-xs text-ink-3">
                  Owner: {item.owner_name}. Raised{' '}
                  {fmtDay(item.created_at.slice(0, 10), true)} by{' '}
                  {item.author_name}.
                </p>
                {item.resolution_note && (
                  <p className="mt-2 text-sm text-ink-2">
                    Resolution: {item.resolution_note}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  {item.can_edit && (
                    <button
                      className="text-xs font-medium text-ds-accent hover:underline"
                      onClick={() => {
                        mutation.reset()
                        setEditing(item)
                      }}
                    >
                      Manage concern
                    </button>
                  )}
                  <button
                    className="text-xs font-medium text-ds-accent hover:underline"
                    onClick={() => setFollowUpOpen(true)}
                  >
                    Create follow-up
                  </button>
                  <details>
                    <summary className="cursor-pointer text-xs text-ink-3">
                      History
                    </summary>
                    <ul className="mt-2 space-y-1 text-xs text-ink-3">
                      {item.history.map((entry, i) => (
                        <li key={i}>
                          {fmtDay(entry.at.slice(0, 10), true)}:{' '}
                          {entry.action.replaceAll('_', ' ')}
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              </li>
            ))}
          </ul>
          {!items.length && (
            <p className="py-4 text-sm text-ink-3">
              No {resolved ? '' : 'open '}concerns visible to you.
            </p>
          )}
          {data?.items.some(item => item.status === 'resolved') && (
            <label className="mt-3 flex w-fit items-center gap-2 text-xs text-ink-3">
              <input
                type="checkbox"
                checked={resolved}
                onChange={e => setResolved(e.target.checked)}
              />
              Show resolved concerns
            </label>
          )}
        </>
      )}
      <CommitmentCreatePanel
        isOpen={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
        context={{ sandboxId }}
      />
      <Sheet
        open={!!visibleEditing}
        onOpenChange={open => {
          if (!open) setEditing(null)
        }}
      >
        <SheetContent className="w-full overflow-y-auto bg-paper sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {visibleEditing === 'new'
                ? 'Raise an internal concern'
                : 'Manage concern'}
            </SheetTitle>
            <SheetDescription>
              Describe the recorded facts and the follow-up needed.
            </SheetDescription>
          </SheetHeader>
          {visibleEditing && (
            <ConcernForm
              key={
                typeof visibleEditing === 'string'
                  ? visibleEditing
                  : `${visibleEditing.id}:${visibleEditing.revision}`
              }
              concern={visibleEditing === 'new' ? undefined : visibleEditing}
              owners={data?.available_owners ?? []}
              pending={mutation.isPending}
              error={mutation.isError}
              onSubmit={fields =>
                mutation.mutate({
                  sandboxId,
                  key: context,
                  id: visibleEditing === 'new' ? undefined : visibleEditing.id,
                  input:
                    visibleEditing === 'new'
                      ? { subject_kind: kind, subject_id: entityId, ...fields }
                      : { revision: visibleEditing.revision, ...fields },
                })
              }
            />
          )}
        </SheetContent>
      </Sheet>
    </section>
  )
}
function ConcernForm({
  concern,
  owners,
  pending,
  error,
  onSubmit,
}: {
  concern?: SandboxConcern
  owners: { user_id: string; name: string }[]
  pending: boolean
  error: boolean
  onSubmit: (fields: {
    title: string
    explanation: string
    priority: 'normal' | 'urgent'
    owner_id?: string
    status?: 'open' | 'resolved'
    resolution_note?: string
  }) => void
}) {
  const [status, setStatus] = useState(concern?.status ?? 'open')
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={e => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        onSubmit({
          title: String(form.get('title')).trim(),
          explanation: String(form.get('explanation')).trim(),
          priority: form.get('priority') as 'normal' | 'urgent',
          ...(form.get('owner') ? { owner_id: String(form.get('owner')) } : {}),
          ...(concern ? { status } : {}),
          ...(status === 'resolved'
            ? { resolution_note: String(form.get('resolution')).trim() }
            : {}),
        })
      }}
    >
      <label className="block text-sm text-ink-2">
        Title
        <input
          name="title"
          className={`${detailControl} mt-1`}
          required
          maxLength={255}
          defaultValue={concern?.title}
        />
      </label>
      <label className="block text-sm text-ink-2">
        What needs attention?
        <textarea
          name="explanation"
          className={`${detailControl} mt-1 min-h-28`}
          required
          maxLength={4000}
          defaultValue={concern?.explanation}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-ink-2">
          Priority
          <select
            aria-label="Priority"
            name="priority"
            className={`${detailControl} mt-1`}
            defaultValue={concern?.priority ?? 'normal'}
          >
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        <label className="block text-sm text-ink-2">
          Owner
          <select
            aria-label="Owner"
            name="owner"
            className={`${detailControl} mt-1`}
            defaultValue={concern?.owner_id ?? ''}
          >
            <option value="">Assign to me</option>
            {owners.map(owner => (
              <option key={owner.user_id} value={owner.user_id}>
                {owner.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {concern && (
        <label className="block text-sm text-ink-2">
          Status
          <select
            className={`${detailControl} mt-1`}
            aria-label="Status"
            value={status}
            onChange={e => setStatus(e.target.value as typeof status)}
          >
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
      )}
      {status === 'resolved' && (
        <label className="block text-sm text-ink-2">
          Resolution note
          <textarea
            name="resolution"
            className={`${detailControl} mt-1 min-h-24`}
            required
            maxLength={4000}
            defaultValue={concern?.resolution_note ?? ''}
          />
        </label>
      )}
      {error && (
        <p role="alert" className="text-sm text-vermillion">
          The concern could not be saved. It may have changed or your access may
          have changed. Close and reopen it before trying again.
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : concern ? 'Save concern' : 'Raise concern'}
      </Button>
    </form>
  )
}
