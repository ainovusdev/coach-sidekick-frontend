'use client'

import { withSandboxViewer } from '@/hooks/queries/use-sandbox-insights'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, CheckCheck, MessageSquare, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { SandboxDetailsService } from '@/services/sandbox-details-service'
import { useSandboxEntityActivity } from '@/hooks/queries/use-sandbox-details'
import { fmtDay } from '@/lib/sandbox/format'
import type { InsightSelection } from '@/types/sandbox-analytics'
import type { SandboxActivityItem } from '@/types/sandbox-details'
import type { TimelineEvent } from '@/types/sandbox'
import { detailSection } from './detail-chart'

const icons = {
  session: MessageSquare,
  outcome: CheckCheck,
  commitment: CalendarDays,
  assignment: Users,
}
export function ActivityRows({
  items,
  onSession,
  onCommitment,
}: {
  items: SandboxActivityItem[]
  onSession: (id: string) => void
  onCommitment: (id: string) => void
}) {
  if (!items.length)
    return (
      <p className="py-6 text-sm text-ink-3">
        No activity is recorded for this selection yet.
      </p>
    )
  return (
    <ol className="divide-y divide-line">
      {items.map(item => {
        const Icon = icons[item.kind]
        const content = (
          <>
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-3">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-ink">
                {item.title}
              </span>
              {item.detail && (
                <span className="mt-1 block text-xs leading-relaxed text-ink-3">
                  {item.detail}
                </span>
              )}
              <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-3">
                <time dateTime={item.occurred_at}>
                  {fmtDay(item.occurred_at.slice(0, 10), true)}
                </time>
                {item.duration_minutes != null && (
                  <span>
                    {item.duration_minutes} min
                    {item.duration_estimated ? ' (estimated)' : ''}
                  </span>
                )}
                {item.status && <span>{item.status.replaceAll('_', ' ')}</span>}
              </span>
            </span>
          </>
        )
        const className =
          'flex w-full items-start gap-3 rounded-lg py-4 text-left focus-visible:outline-2 focus-visible:outline-ds-accent'
        return (
          <li key={item.id}>
            {item.session_id ? (
              <button
                className={`${className} hover:bg-surface-2`}
                onClick={() => onSession(item.session_id!)}
              >
                {content}
              </button>
            ) : item.commitment_id ? (
              <button
                className={`${className} hover:bg-surface-2`}
                onClick={() => onCommitment(item.commitment_id!)}
              >
                {content}
              </button>
            ) : item.href ? (
              <Link
                className={`${className} hover:bg-surface-2`}
                href={item.href}
              >
                {content}
              </Link>
            ) : (
              <div className={className}>{content}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
export function ActivityPanel({
  sandboxId,
  viewer,
  selection,
  milestones,
  onSession,
  onCommitment,
}: {
  sandboxId: string
  viewer: string | null
  selection: InsightSelection
  milestones: TimelineEvent[]
  onSession: (id: string) => void
  onCommitment: (id: string) => void
}) {
  const query = useSandboxEntityActivity(sandboxId, viewer, selection, true)
  const items = query.isError
    ? []
    : (query.data?.pages.flatMap(p => p.items) ?? [])
  return (
    <div className="space-y-5">
      <section className={detailSection}>
        <h2 className="text-lg font-semibold text-ink">Coaching activity</h2>
        <p className="mt-1 text-sm text-ink-3">
          Sessions, agreements and recorded follow-up in one place.
        </p>
        {query.isPending ? (
          <p className="py-6 text-sm text-ink-3" role="status">
            Loading activity…
          </p>
        ) : query.isError ? (
          <p className="py-6 text-sm text-ink-3" role="alert">
            Activity could not be loaded.{' '}
            <button className="underline" onClick={() => void query.refetch()}>
              Try again
            </button>
          </p>
        ) : (
          <ActivityRows
            items={items}
            onSession={onSession}
            onCommitment={onCommitment}
          />
        )}
        {query.hasNextPage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage ? 'Loading…' : 'Load earlier activity'}
          </Button>
        )}
      </section>
      {milestones.length > 0 && (
        <section className={detailSection}>
          <h2 className="text-lg font-semibold text-ink">
            Contract milestone windows
          </h2>
          <p className="mt-1 text-sm text-ink-3">
            Planned windows, separate from booked coaching sessions.
          </p>
          <ul className="mt-3 divide-y divide-line">
            {milestones.map(item => (
              <li
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-2 py-3"
              >
                <Link
                  className="text-sm text-ink hover:underline"
                  href={`/sandboxes/${sandboxId}#timeline`}
                >
                  {item.label}
                </Link>
                <span className="text-xs text-ink-3">
                  {fmtDay(item.window_start)} – {fmtDay(item.window_end)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
export function SessionDetailDrawer({
  sandboxId,
  sessionId,
  viewer,
  selection,
  onClose,
}: {
  sandboxId: string
  sessionId: string | null
  viewer: string | null
  selection: InsightSelection
  onClose: () => void
}) {
  const query = useQuery({
    queryKey: [
      'sandbox-session-detail',
      viewer,
      sandboxId,
      sessionId,
      selection,
    ],
    queryFn: () =>
      withSandboxViewer(viewer, async () => {
        const result = await SandboxDetailsService.session(
          sandboxId,
          sessionId!,
          selection,
        )
        if (result.session_id !== sessionId) throw new Error('Session changed')
        return result
      }),
    enabled: !!viewer && !!sessionId,
    gcTime: 0,
    staleTime: 0,
  })
  const data = query.isError ? undefined : query.data
  return (
    <Sheet
      open={!!sessionId}
      onOpenChange={open => {
        if (!open) onClose()
      }}
    >
      <SheetContent className="w-full overflow-y-auto bg-paper sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{data?.label ?? 'Coaching session'}</SheetTitle>
          <SheetDescription>
            Delivery and learning available in this sandbox.
          </SheetDescription>
        </SheetHeader>
        {query.isPending ? (
          <p role="status" className="mt-6 text-sm text-ink-3">
            Loading session…
          </p>
        ) : query.isError ? (
          <p role="alert" className="mt-6 text-sm text-ink-3">
            This session is unavailable in your current scope.
          </p>
        ) : (
          data && (
            <div className="mt-6 space-y-6">
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
                <dt className="text-ink-3">Coach</dt>
                <dd className="text-ink">{data.coach.name}</dd>
                <dt className="text-ink-3">Date</dt>
                <dd>
                  {data.started_at || data.scheduled_for
                    ? fmtDay(
                        (data.started_at ?? data.scheduled_for)!.slice(0, 10),
                        true,
                      )
                    : 'Not recorded'}
                </dd>
                <dt className="text-ink-3">Status</dt>
                <dd>{data.status.replaceAll('_', ' ')}</dd>
                <dt className="text-ink-3">Duration</dt>
                <dd>
                  {data.duration_minutes == null
                    ? 'Unavailable'
                    : `${data.duration_minutes} minutes${data.duration_estimated ? ' (estimated)' : ''}`}
                </dd>
                {data.participants.length > 0 && (
                  <>
                    <dt className="text-ink-3">Participants</dt>
                    <dd>{data.participants.map(p => p.name).join(', ')}</dd>
                  </>
                )}
              </dl>
              <section className="border-t border-line pt-5">
                <h3 className="font-semibold text-ink">Learning evidence</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-3">
                  {data.learning_note}
                </p>
                {data.learning_available &&
                  data.learning_fields.map((field, i) => (
                    <div className="mt-4" key={i}>
                      <h4 className="text-sm font-medium text-ink">
                        {field.label}
                      </h4>
                      <p className="mt-1 text-sm leading-relaxed text-ink-2">
                        {field.text}
                      </p>
                    </div>
                  ))}
              </section>
              {data.full_session_href && (
                <Link
                  className="inline-flex text-sm font-medium text-ds-accent underline underline-offset-4"
                  href={data.full_session_href}
                >
                  Open full session
                </Link>
              )}
            </div>
          )
        )}
      </SheetContent>
    </Sheet>
  )
}
