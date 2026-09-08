'use client'

import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProgressRail } from '@/components/sandboxes/progress-rail'
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
import {
  fmtDay,
  listNames,
  STATUS_CLASS,
  STATUS_LABEL,
} from '@/lib/sandbox/format'
import {
  monthOfTerm,
  parseDateOnly,
  startsInText,
  termProgress,
} from '@/lib/sandbox/term'
import { cn } from '@/lib/utils'
import type { SandboxOverview } from '@/types/sandbox'

/**
 * Which sandbox this is: the name, the organisation, who runs it and where the
 * term has got to. The page's header — the tabs sit directly beneath it.
 */
export function IdentityCard({
  overview,
  onEdit,
}: {
  overview: SandboxOverview
  onEdit: () => void
}) {
  const { sandbox, members, today } = overview
  const view = useSandboxView()

  const start = parseDateOnly(sandbox.term_start)!
  const end = parseDateOnly(sandbox.term_end)!
  const now = parseDateOnly(today)!
  const progress =
    sandbox.status === 'active'
      ? termProgress(start, end, now)
      : sandbox.status === 'ended'
        ? 1
        : 0

  const caption =
    sandbox.status === 'upcoming'
      ? startsInText(start, now)
      : sandbox.status === 'active'
        ? `Month ${monthOfTerm(start, now)} of ${sandbox.term_months} · today ${fmtDay(today)}`
        : `Ended ${fmtDay(sandbox.term_end, true)}`

  const owners = members
    .filter(m => m.roles.includes('sandbox_owner'))
    .map(m => m.name || m.email)
  const aes = members
    .filter(m => m.roles.includes('account_executive'))
    .map(m => m.name || m.email)

  return (
    <div
      className="rounded-xl border border-line bg-paper px-5 py-4"
      data-testid="identity-card"
    >
      <nav className="text-xs text-ink-3">
        <Link href={view.href.index()} className="hover:text-ink">
          {view.indexLabel}
        </Link>
        <span className="mx-1">/</span>
        <span className="text-ink-2">{sandbox.name}</span>
      </nav>

      {/* Name and organisation on the left; who runs it on the right. The
          progress rail spans the width underneath, so the term reads as one
          line rather than a column of facts. */}
      <div className="mt-2 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold leading-tight text-ink break-words">
              {sandbox.name}
            </h1>
            {view.can.editSandbox && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-ink-3"
                aria-label="Edit sandbox details"
                onClick={onEdit}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-sm text-ink-3">{sandbox.organisation}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                STATUS_CLASS[sandbox.status],
              )}
              data-testid="status-pill"
            >
              {STATUS_LABEL[sandbox.status]}
            </span>
            <span className="text-xs text-ink-3">{caption}</span>
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-8 gap-y-1.5 text-sm">
          {(owners.length > 0 || view.can.editSandbox) && (
            <div>
              <dt className="text-xs text-ink-3">Owner</dt>
              <dd className="text-ink-2">
                {owners.length ? (
                  listNames(owners, 2)
                ) : (
                  <span className="text-ink-4">Not set</span>
                )}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-ink-3">Account executive</dt>
            <dd className="text-ink-2">{listNames(aes, 2) || '—'}</dd>
          </div>
        </dl>
      </div>

      <ProgressRail
        className="mt-4"
        value={progress}
        max={1}
        marker={sandbox.status === 'active' ? progress : null}
        markerLabel="Today"
        captions={[
          fmtDay(sandbox.term_start),
          `${sandbox.term_months} months`,
          fmtDay(sandbox.term_end),
        ]}
      />
    </div>
  )
}
