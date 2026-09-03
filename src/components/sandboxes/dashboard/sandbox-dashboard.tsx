'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Boxes } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { StatStrip, type StatItem } from '@/components/ui/stat-strip'
import { NeedsAttentionList } from '@/components/sandboxes/dashboard/needs-attention-list'
import { SandboxCard } from '@/components/sandboxes/dashboard/sandbox-card'
import { useSandboxDashboard } from '@/hooks/queries/use-sandboxes'
import type {
  Persona,
  SandboxDashboard as Dashboard,
} from '@/types/sandbox-delivery'

const COPY: Record<
  Persona,
  { title: string; description: string; empty: string }
> = {
  portfolio: {
    title: 'Sandboxes',
    description: 'Every contract in flight, and what needs you.',
    empty: 'When a sandbox is created, it appears here with what needs you.',
  },
  coach: {
    title: 'Your sandboxes',
    description: 'The coaching contracts you deliver.',
    empty:
      'When an account executive puts you in a sandbox group, it appears here.',
  },
  client_side: {
    title: 'Sandboxes',
    description: 'Your organisation’s coaching contracts.',
    empty: 'When you are added to a sandbox, it appears here.',
  },
  coachee: {
    title: 'Your coaching',
    description: 'Where you are in your programme.',
    empty: 'When your coaching starts, it appears here.',
  },
}

function totalsFor(d: Dashboard): StatItem[] {
  const t = d.totals
  const delivered =
    t.expected_sessions != null
      ? `${t.delivered_sessions} / ${t.expected_sessions}`
      : `${t.delivered_sessions}`
  switch (d.persona) {
    case 'portfolio':
      return [
        { label: 'Sandboxes', value: t.sandboxes, testId: 'stat-sandboxes' },
        { label: 'Coachees', value: t.coachees, testId: 'stat-coachees' },
        {
          label: 'Behind or not started',
          value: t.behind + t.not_started,
          tone: t.behind + t.not_started > 0 ? 'danger' : 'good',
          testId: 'stat-behind',
        },
        {
          label: 'Invitations outstanding',
          value: t.invitations_outstanding,
          tone: t.invitations_outstanding > 0 ? 'warning' : 'default',
          testId: 'stat-invitations',
        },
        {
          label: 'Outcomes to seal',
          value: t.outcomes_to_seal,
          tone: t.outcomes_to_seal > 0 ? 'warning' : 'good',
          testId: 'stat-outcomes',
        },
      ]
    case 'coach':
      return [
        { label: 'Sandboxes', value: t.sandboxes, testId: 'stat-sandboxes' },
        { label: 'Coachees', value: t.coachees, testId: 'stat-coachees' },
        {
          label: 'Sessions delivered',
          value: delivered,
          testId: 'stat-delivered',
        },
        {
          label: 'Behind',
          value: t.behind,
          tone: t.behind > 0 ? 'danger' : 'good',
          testId: 'stat-behind',
        },
      ]
    case 'client_side':
      return [
        { label: 'Sandboxes', value: t.sandboxes, testId: 'stat-sandboxes' },
        { label: 'Coachees', value: t.coachees, testId: 'stat-coachees' },
        {
          label: 'Sessions delivered',
          value: delivered,
          testId: 'stat-delivered',
        },
        {
          label: 'Windows open',
          value: t.windows_open,
          tone: t.windows_open > 0 ? 'warning' : 'default',
          testId: 'stat-windows',
        },
        {
          label: 'Waiting for your gold seal',
          value: t.outcomes_awaiting_approval,
          tone: t.outcomes_awaiting_approval > 0 ? 'warning' : 'good',
          testId: 'stat-outcomes',
        },
      ]
    default:
      return []
  }
}

/** `/sandboxes` — the one dashboard, rendered per persona. */
export function SandboxDashboardPage({ isAdmin }: { isAdmin: boolean }) {
  const [includeEnded, setIncludeEnded] = useState(false)
  const { data, isLoading, isError } = useSandboxDashboard(includeEnded)
  const persona: Persona = data?.persona ?? (isAdmin ? 'portfolio' : 'coach')
  const copy = COPY[persona]
  const cards = data?.cards ?? []
  const attention = data?.attention ?? []
  const stats = data ? totalsFor(data) : []

  return (
    <div
      className="space-y-6"
      data-testid="sandbox-dashboard"
      data-persona={data?.persona}
    >
      <PageHeader
        title={copy.title}
        description={copy.description}
        icon={Boxes}
        actions={
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-3">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-ink"
                checked={includeEnded}
                onChange={e => setIncludeEnded(e.target.checked)}
                data-testid="include-ended"
              />
              Show ended
            </label>
            {isAdmin && (
              <Link
                href="/admin/sandboxes"
                className="text-sm font-medium text-ink-2 underline-offset-2 hover:text-ink hover:underline"
              >
                Manage all sandboxes →
              </Link>
            )}
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-6" aria-busy>
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <EmptyState
          icon={Boxes}
          title="Sandboxes couldn’t be loaded"
          description="Try again in a moment."
        />
      ) : cards.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title={
            persona === 'coachee'
              ? 'No coaching yet'
              : 'You’re not on a sandbox yet'
          }
          description={copy.empty}
        />
      ) : (
        <>
          {stats.length > 0 && <StatStrip items={stats} />}

          {persona !== 'coachee' && (
            <section className="space-y-3" data-testid="attention-section">
              <h2 className="text-sm font-semibold text-ink">
                Needs attention
                {attention.length > 0 && (
                  <span className="ml-1.5 font-normal text-ink-3">
                    {attention.length}
                  </span>
                )}
              </h2>
              <NeedsAttentionList
                items={attention}
                showSandbox={cards.length > 1}
              />
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-ink">
              {persona === 'coachee' ? 'Your programmes' : 'Sandboxes'}
              <span className="ml-1.5 font-normal text-ink-3">
                {cards.length}
              </span>
            </h2>
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cards.map(card => (
                <li key={card.sandbox.id}>
                  <SandboxCard card={card} today={data!.today} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
