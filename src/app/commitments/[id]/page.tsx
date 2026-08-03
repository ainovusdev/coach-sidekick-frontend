'use client'

/**
 * Full-page commitment detail at /commitments/[id].
 *
 * Companion to — not a replacement for — the slide-over panel: the panel stays
 * the fast path from lists and boards, this is the shareable, readable surface.
 * Both run the same `useCommitmentDetail` controller and the same section
 * components, so there is no second implementation to keep in sync.
 *
 * Layout follows the principle Linear's issue view uses: a measured content
 * column with properties beside it, rather than a 640px panel stretched wide.
 */

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, Link as LinkIcon, Target } from 'lucide-react'

import PageLayout from '@/components/layout/page-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useAuth } from '@/contexts/auth-context'

import {
  useCommitmentDetail,
  UUID_RE,
} from '@/components/commitments/detail/use-commitment-detail'
import { copyCommitmentLink } from '@/components/commitments/detail/commitment-links'
import { CommitmentContextHeader } from '@/components/commitments/detail/commitment-context-header'
import { CommitmentActivityTimeline } from '@/components/commitments/detail/commitment-activity-timeline'
import { CommitmentProgressControl } from '@/components/commitments/detail/commitment-progress-control'
import { CommitmentSiblings } from '@/components/commitments/detail/commitment-siblings'
import {
  PanelHeader,
  FieldsGrid,
  LinkedOutcomesSection,
  DescriptionSection,
  AttachmentsSection,
  MilestonesSection,
  ActivitySection,
  MetadataFooter,
} from '@/components/commitments/commitment-detail-panel'

function NotAvailable({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-12 w-12 rounded-full bg-surface-3 flex items-center justify-center mb-4">
        <Target className="h-6 w-6 text-ink-3" />
      </div>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-3 max-w-md">{description}</p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/commitments">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to commitments
        </Link>
      </Button>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10 space-y-8 lg:space-y-0">
      <div className="space-y-4">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}

function CommitmentPageContent({ commitmentId }: { commitmentId: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const {
    commitment,
    isLoading,
    error,
    capabilities,
    handleFieldUpdate,
    handleDelete,
  } = useCommitmentDetail({
    commitmentId,
    // The page has no surrounding list to refresh; the mutations already
    // invalidate the ['commitments'] prefix.
    onDeleted: () => router.replace('/commitments'),
  })

  if (isLoading) return <PageSkeleton />

  if (error || !commitment) {
    // The API returns a uniform 404 for both "gone" and "not yours", so it
    // deliberately can't be used to probe which one it is.
    return (
      <NotAvailable
        title="Commitment not available"
        description="It may have been deleted, or it belongs to a client you don't have access to."
      />
    )
  }

  return (
    <>
      {/* Breadcrumb + page actions */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <nav className="flex items-center gap-1.5 text-sm text-ink-3 min-w-0">
          <Link href="/commitments" className="hover:text-ink shrink-0">
            Commitments
          </Link>
          {commitment.client_name && commitment.client_id && (
            <>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <Link
                href={`/clients/${commitment.client_id}`}
                className="hover:text-ink truncate"
              >
                {commitment.client_name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-ink-2 truncate">{commitment.title}</span>
        </nav>

        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => copyCommitmentLink(commitment.id)}
        >
          <LinkIcon className="h-4 w-4 mr-2" />
          Copy link
        </Button>
      </div>

      {/* One tree, two layouts: below lg the properties rail stacks ABOVE the
          content (on a phone you want status and due date first); at lg the
          grid takes over and the order-* utilities are neutralised. */}
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10 lg:items-start">
        <main className="order-2 lg:order-1 min-w-0 space-y-8">
          <div className="space-y-2">
            <PanelHeader
              commitment={commitment}
              onClose={() => router.push('/commitments')}
              onFieldUpdate={handleFieldUpdate}
              onDelete={() => setConfirmDelete(true)}
            />
            <CommitmentContextHeader commitment={commitment} />
          </div>

          <DescriptionSection
            commitment={commitment}
            onFieldUpdate={handleFieldUpdate}
          />

          {capabilities.canMilestones && (
            <MilestonesSection
              commitment={commitment}
              commitmentId={commitment.id}
            />
          )}

          {capabilities.canAttach && (
            <AttachmentsSection
              commitment={commitment}
              commitmentId={commitment.id}
            />
          )}

          {capabilities.canActivity && (
            <section className="space-y-4">
              <ActivitySection
                commitment={commitment}
                commitmentId={commitment.id}
                hideHistory
              />
              <CommitmentActivityTimeline
                commitment={commitment}
                currentUserId={user?.id}
              />
            </section>
          )}
        </main>

        <aside className="order-1 lg:order-2 space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:border-l lg:border-line lg:pl-6">
          <FieldsGrid
            commitment={commitment}
            onFieldUpdate={handleFieldUpdate}
          />

          <CommitmentProgressControl
            commitment={commitment}
            commitmentId={commitment.id}
          />

          {capabilities.canLinkOutcomes && (
            <LinkedOutcomesSection
              commitment={commitment}
              commitmentId={commitment.id}
            />
          )}

          {capabilities.canSeeSiblings && (
            <CommitmentSiblings commitment={commitment} />
          )}

          <MetadataFooter commitment={commitment} />
        </aside>
      </div>

      <ConfirmationDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete commitment?"
        description={`"${commitment.title}" will be permanently removed.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  )
}

export default function CommitmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  // `[id]` matches any string, so guard before firing a request — /commitments/foo
  // must render not-found without hitting the API.
  const isValid = UUID_RE.test(id)

  return (
    <ProtectedRoute loadingMessage="Loading commitment...">
      <PageLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isValid ? (
            <CommitmentPageContent commitmentId={id} />
          ) : (
            <NotAvailable
              title="Commitment not found"
              description="That link doesn't point to a valid commitment."
            />
          )}
        </div>
      </PageLayout>
    </ProtectedRoute>
  )
}
