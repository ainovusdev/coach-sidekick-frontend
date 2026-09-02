'use client'

import Link from 'next/link'
import { Boxes } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/auth-context'
import { useMySandboxes } from '@/hooks/queries/use-sandboxes'
import {
  fmtTerm,
  listNames,
  pluralise,
  STATUS_CLASS,
  STATUS_LABEL,
} from '@/lib/sandbox/format'
import { cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/types/sandbox'

/** The sandboxes I am on — every role, every side. */
export default function MySandboxesPage() {
  const { isAdmin } = useAuth()
  const { data, isLoading } = useMySandboxes()
  const rows = data?.sandboxes ?? []

  return (
    <div className="space-y-6" data-testid="my-sandboxes">
      <PageHeader
        title="Sandboxes"
        description="The coaching contracts you are part of."
        icon={Boxes}
        actions={
          isAdmin() ? (
            <Link
              href="/admin/sandboxes"
              className="text-sm font-medium text-ink-2 underline-offset-2 hover:text-ink hover:underline"
            >
              Manage all sandboxes →
            </Link>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="You're not on a sandbox yet"
          description="When an account executive adds you to one, it appears here."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(s => (
            <li key={s.id}>
              <Link
                href={`/sandboxes/${s.id}`}
                className="flex h-full flex-col rounded-xl border border-line bg-paper p-5 transition-colors hover:border-ink-4"
                data-testid="sandbox-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-ink">
                      {s.name}
                    </h2>
                    <p className="truncate text-sm text-ink-3">
                      {s.organisation}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      STATUS_CLASS[s.status],
                    )}
                  >
                    {STATUS_LABEL[s.status]}
                  </span>
                </div>
                <p className="mt-3 font-mono text-xs text-ink-3">
                  {fmtTerm(s.term_start, s.term_months)}
                </p>
                <p className="mt-3 text-sm text-ink-2">
                  {s.my_roles.length
                    ? s.my_roles.map(r => ROLE_LABELS[r] ?? r).join(' · ')
                    : 'Member'}
                </p>
                <p className="mt-auto pt-3 text-xs text-ink-3">
                  {pluralise(s.group_count, 'group')} ·{' '}
                  {pluralise(s.coachee_count, 'coachee')}
                  {s.account_executive_names.length > 0 &&
                    ` · ${listNames(s.account_executive_names, 1)}`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
