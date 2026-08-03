'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageLayout from '@/components/layout/page-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
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
import { Commitment, CommitmentStatus } from '@/types/commitment'
import { Plus, Target } from 'lucide-react'
import { useCommitmentsView } from './hooks/use-commitments-view'
import { CommitmentRowHandlers } from './components/commitment-row'
import { CommitmentsStats } from './components/commitments-stats'
import { CommitmentsToolbar } from './components/commitments-toolbar'
import { CommitmentsFlatList } from './components/commitments-flat-list'
import { CommitmentsGroupedList } from './components/commitments-grouped-list'
import { DraftReviewBar } from './components/draft-review-bar'
import { CommitmentsEmptyState } from './components/commitments-empty-state'
import { CommitmentsSkeleton } from './components/commitments-skeleton'

type ConfirmState =
  | { kind: 'delete'; id: string; title: string }
  | { kind: 'bulk-discard'; ids: string[] }
  | null

function CommitmentsPageContent() {
  const router = useRouter()
  const view = useCommitmentsView()
  const { data: stats } = useCommitmentStats(undefined, true)
  const { data: clientsData } = useClients()
  const clients = (clientsData?.clients ?? []).filter(
    c => c.is_my_client !== false,
  )

  const confirmMutation = useConfirmCommitment()
  const discardMutation = useDiscardCommitment()
  const updateMutation = useUpdateCommitment()
  const bulkConfirm = useBulkConfirmCommitments()
  const bulkDiscard = useBulkDiscardCommitments()

  const [createPanelOpen, setCreatePanelOpen] = useState(false)
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<
    string | null
  >(null)
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
    } else {
      await bulkDiscard.mutateAsync(confirmState.ids)
      setSelectedDraftIds(new Set())
    }
    setConfirmState(null)
  }

  const rowHandlers: CommitmentRowHandlers = {
    onEdit: c => setSelectedCommitmentId(c.id),
    onDelete: handleDelete,
    onConfirm: handleConfirm,
    onReject: handleReject,
    onStatusChange: handleStatusChange,
    onDateChange: handleDateChange,
    onSelect: toggleDraftSelection,
  }

  const isEmpty = view.filteredCommitments.length === 0

  return (
    <>
      <PageHeader
        title="Commitments"
        description="Track and manage commitments across all your clients"
        icon={Target}
        actions={
          <Button
            onClick={() => setCreatePanelOpen(true)}
            className="bg-ink hover:bg-ink-2 text-ink-on-dark "
          >
            <Plus className="h-4 w-4 mr-2" />
            New Commitment
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
            overdueFilterActive={view.dueFilter === 'overdue'}
            onToggleOverdue={view.toggleOverdueFilter}
          />

          <CommitmentsToolbar
            tab={view.tab}
            onTabChange={view.setTab}
            counts={view.counts}
            searchInput={view.searchInput}
            onSearchChange={view.setSearchInput}
            sort={view.sort}
            onSortChange={view.setSort}
            groupBy={view.groupBy}
            onGroupByChange={view.setGroupBy}
            clientFilter={view.clientFilter}
            onClientChange={view.setClientFilter}
            clients={clients}
            typeFilter={view.typeFilter}
            onTypeChange={view.setTypeFilter}
            dueFilter={view.dueFilter}
            onClearDue={view.clearDueFilter}
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

      {/* Create Panel */}
      {clients.length > 0 && (
        <CommitmentCreatePanel
          isOpen={createPanelOpen}
          onClose={() => setCreatePanelOpen(false)}
          clientId={
            view.clientFilter !== 'all' ? view.clientFilter : clients[0].id
          }
          onCreated={commitment => {
            setCreatePanelOpen(false)
            setSelectedCommitmentId(commitment.id)
          }}
        />
      )}

      {/* Detail Panel */}
      <CommitmentDetailPanel
        commitmentId={selectedCommitmentId}
        onClose={() => setSelectedCommitmentId(null)}
        onOpenInPage={
          selectedCommitmentId
            ? () => router.push(`/commitments/${selectedCommitmentId}`)
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
    </>
  )
}

export default function CommitmentsPage() {
  return (
    <ProtectedRoute loadingMessage="Loading commitments...">
      <PageLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Suspense fallback={<CommitmentsSkeleton />}>
            <CommitmentsPageContent />
          </Suspense>
        </div>
      </PageLayout>
    </ProtectedRoute>
  )
}
