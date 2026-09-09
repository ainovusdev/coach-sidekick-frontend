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
 * term has got to. Top of the rail, in view whichever tab is open — the pencil
 * opens Settings rather than a dialog.
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
      className="rounded-xl border border-line bg-paper p-5"
      data-testid="identity-card"
    >
      <nav className="text-xs text-ink-3">
        <Link href={view.href.index()} className="hover:text-ink">
          {view.indexLabel}
        </Link>
        <span className="mx-1">/</span>
        <span className="text-ink-2">{sandbox.name}</span>
      </nav>
      <div className="mt-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold leading-tight text-ink break-words">
            {sandbox.name}
          </h1>
          <p className="text-sm text-ink-3">{sandbox.organisation}</p>
        </div>
        {view.can.editSandbox && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-ink-3"
            aria-label="Edit sandbox details"
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
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

      <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
        {(owners.length > 0 || view.can.editSandbox) && (
          <div className="flex justify-between gap-3">
            <dt className="text-ink-3">Owner</dt>
            <dd className="text-right text-ink-2">
              {owners.length ? (
                listNames(owners, 2)
              ) : (
                <span className="text-ink-4">Not set</span>
              )}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <dt className="text-ink-3">Account executive</dt>
          <dd className="text-right text-ink-2">{listNames(aes, 2) || '—'}</dd>
        </div>
      </dl>
    </div>
  )
}
