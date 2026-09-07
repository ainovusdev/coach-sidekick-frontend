'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { CommitmentCreatePanel } from '@/components/commitments/commitment-create-panel'
import { CommitmentDetailPanel } from '@/components/commitments/commitment-detail-panel'
import { useCommitmentStats } from '@/hooks/queries/use-commitments'
import { useClients } from '@/hooks/queries/use-clients'
import {
  useBulkConfirmCommitments,
  useBulkDiscardCommitments,
  useConfirmCommitment,
  useDiscardCommitment,
  useUpdateCommitment,
} from '@/hooks/mutations/use-commitment-mutations'
import { isCoachLike } from '@/types/people'
import { Commitment, CommitmentStatus } from '@/types/commitment'
import { Plus, Target } from 'lucide-react'
import { HubAudience, useCommitmentsView } from './use-commitments-view'
import { COMMITMENT_TABS, CommitmentTab } from './commitment-view'
import { CommitmentRowHandlers } from './commitment-row'
import { CommitmentsStats } from './commitments-stats'
import { CommitmentsToolbar } from './commitments-toolbar'
import { CommitmentsFlatList } from './commitments-flat-list'
import { CommitmentsGroupedList } from './commitments-grouped-list'
import { DraftReviewBar } from './draft-review-bar'
import { CommitmentsEmptyState } from './commitments-empty-state'
import { CommitmentsSkeleton } from './commitments-skeleton'

type ConfirmState =
  | { kind: 'delete'; id: string; title: string }
  | { kind: 'bulk-discard'; ids: string[] }
  | null

const AUDIENCE: Record<
  HubAudience,
  { description: string; tabs: CommitmentTab[] }
> = {
  coach: {
    description: 'Track and manage commitments across all your clients',
    tabs: COMMITMENT_TABS,
  },
  admin: {
    description:
      "What you've handed to coaches and colleagues, and what's on you.",
    // Drafts come from session transcripts — a coach's job to review
    tabs: COMMITMENT_TABS.filter(t => t !== 'drafts'),
  },
}

/**
 * The one commitments list, in many formats. The coach page and the admin
 * page both mount this; `audience` decides the data (a coach's clients plus
 * everything on them; an admin only what involves them), the default view
 * and which controls show. Must sit inside a Suspense boundary (URL state).
 */
export function CommitmentsHub({ audience }: { audience: HubAudience }) {
  const router = useRouter()
  const view = useCommitmentsView(audience)
  const isCoach = audience === 'coach'
  const copy = AUDIENCE[audience]

  const { data: serverStats } = useCommitmentStats(undefined, true, {
    enabled: isCoach,
  })
  const stats = isCoach ? serverStats : view.derivedStats

  const { data: clientsData } = useClients({ enabled: isCoach })
  const clients = (clientsData?.clients ?? []).filter(
    c => c.is_my_client !== false,
  )

  const confirmMutation = useConfirmCommitment()
  const discardMutation = useDiscardCommitment()
  const updateMutation = useUpdateCommitment()
  const bulkConfirm = useBulkConfirmCommitments()
  const bulkDiscard = useBulkDiscardCommitments()

  const [createPanelOpen, setCreatePanelOpen] = useState(false)
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<string>>(
    new Set(),
  )
  const [confirmState, setConfirmState] = useState<ConfirmState>(null)

  // --- Draft selection ---
  const deselectDraft = (id: string) => {
    setSelectedDraftIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const toggleDraftSelection = (id: string) => {
    setSelectedDraftIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allDraftsSelected =
    view.visibleDraftIds.length > 0 &&
    view.visibleDraftIds.every(id => selectedDraftIds.has(id))

  const toggleAllDrafts = () => {
    setSelectedDraftIds(
      allDraftsSelected ? new Set() : new Set(view.visibleDraftIds),
    )
  }

  // --- Mutation handlers ---
  const handleConfirm = async (id: string) => {
    await confirmMutation.mutateAsync(id)
    deselectDraft(id)
  }

  const handleReject = async (id: string) => {
    await discardMutation.mutateAsync(id)
    deselectDraft(id)
  }

  const handleDelete = (commitment: Commitment) => {
    setConfirmState({
      kind: 'delete',
      id: commitment.id,
      title: commitment.title,
    })
  }

  const handleStatusChange = async (id: string, status: CommitmentStatus) => {
    await updateMutation.mutateAsync({ commitmentId: id, data: { status } })
  }

  const handleDateChange = async (id: string, date: string | undefined) => {
    await updateMutation.mutateAsync({
      commitmentId: id,
      data: { target_date: date },
    })
  }

  const handleBulkConfirm = async () => {
    if (selectedDraftIds.size === 0) return
    await bulkConfirm.mutateAsync(Array.from(selectedDraftIds))
    setSelectedDraftIds(new Set())
  }

  const handleConfirmedAction = async () => {
    if (!confirmState) return
    if (confirmState.kind === 'delete') {
      await discardMutation.mutateAsync(confirmState.id)
      deselectDraft(confirmState.id)
      if (view.openId === confirmState.id) view.setOpenId(null)
    } else {
      await bulkDiscard.mutateAsync(confirmState.ids)
      setSelectedDraftIds(new Set())
    }
    setConfirmState(null)
  }

  const rowHandlers: CommitmentRowHandlers = {
    onEdit: c => view.setOpenId(c.id),
    onDelete: handleDelete,
    onConfirm: handleConfirm,
    onReject: handleReject,
    onStatusChange: handleStatusChange,
    onDateChange: handleDateChange,
    onSelect: toggleDraftSelection,
  }

  const isEmpty = view.filteredCommitments.length === 0
  const personFiltered = view.assigneeFilter !== null

  return (
    <div data-testid={`commitments-hub-${audience}`}>
      <PageHeader
        title="Commitments"
        description={copy.description}
        icon={Target}
        actions={
          <Button
            onClick={() => setCreatePanelOpen(true)}
            className="bg-ink hover:bg-ink-2 text-ink-on-dark "
            data-testid="hub-create"
          >
            <Plus className="h-4 w-4 mr-2" />
            New commitment
          </Button>
        }
      />

      {view.isLoading ? (
        <CommitmentsSkeleton />
      ) : (
        <>
          <CommitmentsStats
            stats={stats}
            fallbackActive={view.counts.active}
            fallbackCompleted={view.counts.completed}
            forYou={view.forYouCount}
            forYouActive={view.view === 'mine' && !personFiltered}
            onToggleForYou={view.toggleMineView}
            overdueFilterActive={view.dueFilter === 'overdue'}
            onToggleOverdue={view.toggleOverdueFilter}
          />

          <CommitmentsToolbar
            tabs={copy.tabs}
            tab={view.tab}
            onTabChange={view.setTab}
            counts={view.counts}
            searchInput={view.searchInput}
            onSearchChange={view.setSearchInput}
            view={view.view}
            onViewChange={view.setView}
            assigneePerson={view.assigneePerson}
            onAssigneeChange={view.setAssigneeFilter}
            onlyRoles={isCoach ? undefined : isCoachLike}
            sort={view.sort}
            onSortChange={view.setSort}
            groupBy={view.groupBy}
            onGroupByChange={view.setGroupBy}
            clientFilter={isCoach ? view.clientFilter : undefined}
            onClientChange={isCoach ? view.setClientFilter : undefined}
            clients={isCoach ? clients : undefined}
            typeFilter={view.typeFilter}
            onTypeChange={view.setTypeFilter}
            dueFilter={view.dueFilter}
            onClearDue={view.clearDueFilter}
            sandboxChip={
              view.sandboxFilter
                ? { name: view.sandboxName, onClear: view.clearSandboxFilter }
                : null
            }
          />

          {view.visibleDraftIds.length > 0 && (
            <DraftReviewBar
              visibleDraftIds={view.visibleDraftIds}
              selectedDraftIds={selectedDraftIds}
              onToggleAll={toggleAllDrafts}
              onBulkApprove={handleBulkConfirm}
              onBulkReject={() =>
                setConfirmState({
                  kind: 'bulk-discard',
                  ids: Array.from(selectedDraftIds),
                })
              }
              approving={bulkConfirm.isPending}
              rejecting={bulkDiscard.isPending}
            />
          )}

          {isEmpty ? (
            <CommitmentsEmptyState
              tab={view.tab}
              view={view.view}
              personName={
                personFiltered
                  ? view.assigneePerson?.name ||
                    view.assigneePerson?.email ||
                    'them'
                  : undefined
              }
              dueFilter={view.dueFilter}
              searchActive={view.searchInput.trim() !== ''}
              hasActiveFilters={view.hasActiveFilters}
              onClearFilters={view.clearAllFilters}
              onCreate={() => setCreatePanelOpen(true)}
            />
          ) : view.groupBy === 'none' ? (
            <CommitmentsFlatList
              sections={view.sections}
              rowHandlers={rowHandlers}
              selectedDraftIds={selectedDraftIds}
              hideSingleHeading={view.view !== 'all' || personFiltered}
            />
          ) : (
            <CommitmentsGroupedList
              key={view.groupBy}
              groups={view.groups}
              groupBy={view.groupBy}
              rowHandlers={rowHandlers}
              selectedDraftIds={selectedDraftIds}
            />
          )}
        </>
      )}

      {/* Create Panel — a client is optional now; the current client filter
          pre-fills it when one is chosen */}
      <CommitmentCreatePanel
        isOpen={createPanelOpen}
        onClose={() => setCreatePanelOpen(false)}
        clientId={
          isCoach && view.clientFilter !== 'all' ? view.clientFilter : undefined
        }
        onCreated={commitment => {
          setCreatePanelOpen(false)
          view.setOpenId(commitment.id)
        }}
      />

      {/* Detail Panel — `?open=<id>` so a chosen row survives a reload and
          can be deep-linked */}
      <CommitmentDetailPanel
        commitmentId={view.openId}
        onClose={() => view.setOpenId(null)}
        onNavigate={id => view.setOpenId(id)}
        onOpenInPage={
          view.openId
            ? () => router.push(`/commitments/${view.openId}`)
            : undefined
        }
      />

      {/* Destructive-action confirmation */}
      <ConfirmationDialog
        open={confirmState !== null}
        onOpenChange={open => {
          if (!open) setConfirmState(null)
        }}
        title={
          confirmState?.kind === 'bulk-discard'
            ? `Delete ${confirmState.ids.length} draft commitment${
                confirmState.ids.length !== 1 ? 's' : ''
              }?`
            : 'Delete commitment?'
        }
        description={
          confirmState?.kind === 'bulk-discard'
            ? 'The selected draft commitments will be permanently removed.'
            : confirmState?.kind === 'delete'
              ? `"${confirmState.title}" will be permanently removed.`
              : ''
        }
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleConfirmedAction}
      />
    </div>
  )
}
