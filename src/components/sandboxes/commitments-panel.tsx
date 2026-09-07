'use client'

/**
 * The sandbox's commitments, in the cockpit — the same rows and panels as
 * the hub, scoped to this sandbox. What each viewer sees is decided by the
 * API (hat scope for shared rows, participation for private ones), so the
 * list is simply whatever comes back for `sandbox_id`.
 *
 * Deep links: `?commitment=<id>[&comment=<id>]#commitments` opens the
 * detail panel (the panel itself rings the comment). Closing it clears
 * the params again so a reload doesn't reopen it.
 */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CommitmentRow,
  type CommitmentRowHandlers,
} from '@/components/commitments/hub/commitment-row'
import { CommitmentCreatePanel } from '@/components/commitments/commitment-create-panel'
import { CommitmentDetailPanel } from '@/components/commitments/commitment-detail-panel'
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
import {
  useConfirmCommitment,
  useDiscardCommitment,
  useUpdateCommitment,
} from '@/hooks/mutations/use-commitment-mutations'
import { useCommitments } from '@/hooks/queries/use-commitments'
import { useViewerId } from '@/hooks/use-viewer-id'
import { isAssignedTo } from '@/lib/commitments/assignee'
import { cn } from '@/lib/utils'
import type { Commitment, CommitmentStatus } from '@/types/commitment'
import type { SandboxOverview } from '@/types/sandbox'

type Filter = 'all' | 'mine' | 'done'

const FILTER_LABEL: Record<Filter, string> = {
  all: 'Open',
  mine: 'Mine',
  done: 'Done',
}

function isOpen(c: Commitment): boolean {
  return c.status !== 'completed' && c.status !== 'abandoned'
}

/** Drop the deep-link params without touching the rest of the URL. */
function clearDeepLink() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('commitment') && !url.searchParams.has('comment'))
    return
  url.searchParams.delete('commitment')
  url.searchParams.delete('comment')
  window.history.replaceState(null, '', url.pathname + url.search + url.hash)
}

export function CommitmentsPanel({ overview }: { overview: SandboxOverview }) {
  const view = useSandboxView()
  const router = useRouter()
  const viewerId = useViewerId()
  const sandboxId = overview.sandbox.id

  const filters = useMemo(
    () => ({ sandbox_id: sandboxId, include_drafts: true }),
    [sandboxId],
  )
  const { data, isLoading, isError } = useCommitments(filters)
  const rows = useMemo(() => data?.commitments ?? [], [data])

  const [filter, setFilter] = useState<Filter>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [toDelete, setToDelete] = useState<Commitment | null>(null)

  const updateMutation = useUpdateCommitment()
  const confirmMutation = useConfirmCommitment()
  const discardMutation = useDiscardCommitment()

  // Deep link in, and scroll the section into view when the hash names it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('commitment')
    if (id) setOpenId(id)
    if (window.location.hash === '#commitments') {
      document.getElementById('commitments')?.scrollIntoView({ block: 'start' })
    }
  }, [])

  const close = useCallback(() => {
    setOpenId(null)
    clearDeepLink()
  }, [])

  const counts = useMemo(
    () => ({
      all: rows.filter(isOpen).length,
      mine: rows.filter(c => isOpen(c) && isAssignedTo(c, viewerId)).length,
      done: rows.filter(c => c.status === 'completed').length,
    }),
    [rows, viewerId],
  )
  const visible = useMemo(() => {
    if (filter === 'done') return rows.filter(c => c.status === 'completed')
    if (filter === 'mine')
      return rows.filter(c => isOpen(c) && isAssignedTo(c, viewerId))
    return rows.filter(isOpen)
  }, [rows, filter, viewerId])

  // Shared on a sandbox means our side of it — their side never reads the
  // team's list — so new rows start shared even with their side in the room.
  const hubHref =
    view.audience === 'admin'
      ? `/admin/commitments?sandbox=${sandboxId}`
      : view.audience === 'ours'
        ? `/commitments?sandbox=${sandboxId}`
        : null

  const handlers: CommitmentRowHandlers = {
    onEdit: c => setOpenId(c.id),
    onDelete: c => setToDelete(c),
    onConfirm: id => confirmMutation.mutateAsync(id).then(() => undefined),
    onReject: id => discardMutation.mutateAsync(id).then(() => undefined),
    onStatusChange: (id: string, status: CommitmentStatus) =>
      updateMutation
        .mutateAsync({ commitmentId: id, data: { status } })
        .then(() => undefined),
    onDateChange: (id: string, date: string | undefined) =>
      updateMutation
        .mutateAsync({ commitmentId: id, data: { target_date: date } })
        .then(() => undefined),
  }

  return (
    <section
      id="commitments"
      className="scroll-mt-20 rounded-xl border border-line bg-paper"
      data-testid="commitments-panel"
    >
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold text-ink">
          Commitments{' '}
          {rows.length > 0 && (
            <span
              className="ml-1 text-sm font-normal text-ink-3"
              data-testid="sandbox-commitments-summary"
            >
              {counts.all} open
              {counts.mine > 0 && ` · ${counts.mine} for you`}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {hubHref && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-ink-3"
              data-testid="sandbox-commitments-open-hub"
            >
              <Link href={hubHref}>
                Open in Commitments
                <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setCreating(true)}
            data-testid="sandbox-commitments-new"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            New commitment
          </Button>
        </div>
      </header>

      <div className="space-y-3 px-5 py-4">
        {rows.length > 0 && (
          <div className="flex flex-wrap gap-1.5" role="tablist">
            {(Object.keys(FILTER_LABEL) as Filter[]).map(key => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                onClick={() => setFilter(key)}
                data-testid={`sandbox-commitments-filter-${key}`}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                  filter === key
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line text-ink-3 hover:border-ink-4 hover:text-ink',
                )}
              >
                {FILTER_LABEL[key]}
                <span className="ml-1 tabular-nums opacity-70">
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <>
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
          </>
        ) : isError ? (
          <p className="text-sm text-ink-3">Commitments couldn’t be loaded.</p>
        ) : visible.length === 0 ? (
          <p
            className="text-sm text-ink-3"
            data-testid="sandbox-commitments-empty"
          >
            {rows.length === 0
              ? 'Nothing on this sandbox yet. Hand someone a commitment and it shows up here.'
              : filter === 'mine'
                ? 'Nothing assigned to you here.'
                : filter === 'done'
                  ? 'Nothing finished yet.'
                  : 'Everything here is done.'}
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-line">
            {visible.map(c => (
              <CommitmentRow
                key={c.id}
                commitment={c}
                showAssignee
                {...handlers}
              />
            ))}
          </div>
        )}
      </div>

      <CommitmentCreatePanel
        isOpen={creating}
        onClose={() => setCreating(false)}
        context={{ sandboxId, sandboxName: overview.sandbox.name }}
      />
      <CommitmentDetailPanel
        commitmentId={openId}
        onClose={close}
        onNavigate={setOpenId}
        onOpenInPage={
          view.audience === 'ours' && openId
            ? () => router.push(`/commitments/${openId}`)
            : undefined
        }
      />
      <ConfirmationDialog
        open={!!toDelete}
        onOpenChange={o => !o && setToDelete(null)}
        title="Delete this commitment?"
        description={
          toDelete ? `“${toDelete.title}” is removed for everyone on it.` : ''
        }
        confirmText="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!toDelete) return
          await discardMutation.mutateAsync(toDelete.id)
          if (openId === toDelete.id) close()
          setToDelete(null)
        }}
      />
    </section>
  )
}
