'use client'

import Link from 'next/link'
import { Eye, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  canPreviewClientView,
  useSandboxView,
} from '@/components/sandboxes/sandbox-view-context'
import {
  fmtDay,
  fmtWindow,
  listNames,
  STATUS_CLASS,
  STATUS_LABEL,
} from '@/lib/sandbox/format'
import { lifecycleOf, parseDateOnly, startsInText } from '@/lib/sandbox/term'
import { cn } from '@/lib/utils'
import type { SandboxOverview } from '@/types/sandbox'

/**
 * Which sandbox this is, above everything.
 *
 * It used to be a card at the top of a 300px rail, where the name was `text-xl`
 * and the owner and the account executive were a justified `<dl>` — which threw
 * label and value a screen apart the moment the rail was wider than it was
 * designed for. A page's subject belongs at the top of the page, so the five
 * facts moved out of the rail and became the page's own heading.
 *
 * The breadcrumb doubles as the organisation eyebrow: the old crumb ended in
 * the sandbox name the H1 repeated one line later.
 */
export function SandboxHero({
  overview,
  onEdit,
}: {
  overview: SandboxOverview
  /** The pencil goes to Settings, where the form lives. */
  onEdit: () => void
}) {
  const { sandbox, members, today } = overview
  const view = useSandboxView()
  const life = lifecycleOf(sandbox, today, value => fmtDay(value))

  const start = parseDateOnly(sandbox.term_start)
  const now = parseDateOnly(today)
  const caption =
    sandbox.status === 'upcoming' && start && now
      ? startsInText(start, now)
      : sandbox.status === 'ended'
        ? `Ended ${fmtDay(sandbox.term_end, true)}`
        : `Today ${fmtDay(today)}`

  // Our side can read the page their client reads — under our own access, so
  // no data crosses and nothing can be written as them.
  const canPreview = canPreviewClientView(overview, view.audience === 'admin')
  // `from` is the route we are on, not the hat we wear: an admin reading a
  // sandbox at /sandboxes expects "Back to your view" to return there.
  const previewHref = `/sandboxes/${sandbox.id}?view=client&from=${
    view.basePath === '/admin/sandboxes' ? 'admin' : 'member'
  }`

  const myCoachingHref = overview.my_coachee_member_id
    ? `/sandboxes/${sandbox.id}/clients/${overview.my_coachee_member_id}`
    : null

  const owners = members
    .filter(m => m.roles.includes('sandbox_owner'))
    .map(m => m.name || m.email)
  const aes = members
    .filter(m => m.roles.includes('account_executive'))
    .map(m => m.name || m.email)

  return (
    <section
      className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_260px]"
      data-testid="sandbox-hero"
    >
      <div className="min-w-0">
        <nav className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
          <Link href={view.href.index()} className="hover:text-ink">
            {view.indexLabel}
          </Link>
          <span className="mx-1.5 text-ink-4">/</span>
          <span className="text-ink-2">{sandbox.organisation}</span>
        </nav>
        <h1 className="mt-1.5 text-3xl font-semibold leading-tight text-ink">
          {sandbox.name}
        </h1>
        {sandbox.vision && (
          <blockquote
            className="mt-3 max-w-prose border-l-2 border-line pl-4 text-[15px] leading-relaxed text-ink-2"
            data-testid="sandbox-vision"
          >
            {sandbox.vision}
          </blockquote>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          {(owners.length > 0 || view.can.editSandbox) && (
            <span className="text-ink-3">
              Owner{' '}
              <span className="text-ink-2">
                {owners.length ? listNames(owners, 2) : 'not set'}
              </span>
            </span>
          )}
          <span className="text-ink-3">
            Account executive{' '}
            <span className="text-ink-2">{listNames(aes, 2) || 'not set'}</span>
          </span>
        </div>
        {(view.can.editSandbox || canPreview || myCoachingHref) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
            {myCoachingHref && (
              // Someone who works here and is coached here: their own coaching
              // is a page apart from the people they work with.
              <Link
                href={myCoachingHref}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-2 underline-offset-4 hover:text-ink hover:underline"
                data-testid="my-coaching"
              >
                My coaching
              </Link>
            )}
            {view.can.editSandbox && (
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-7 gap-1.5 px-2 text-xs text-ink-2"
                onClick={onEdit}
                data-testid="edit-sandbox"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                Edit details
              </Button>
            )}
            {canPreview && (
              // A plain anchor on purpose: this only changes the query string
              // on the route we are already on, and a client-side push would
              // leave the page mounted with the old reading of the URL.
              <a
                href={previewHref}
                className="inline-flex items-center gap-1.5 text-xs text-ink-3 underline-offset-4 hover:text-ink hover:underline"
                data-testid="see-client-view"
              >
                <Eye className="h-3.5 w-3.5" aria-hidden />
                See the client’s view
              </a>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-line bg-paper p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
            Term
          </p>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              STATUS_CLASS[sandbox.status],
            )}
            data-testid="status-pill"
          >
            {STATUS_LABEL[sandbox.status]}
          </span>
        </div>
        <p
          className="mt-3 text-sm font-medium text-ink"
          data-testid="term-life"
        >
          {life.label}
        </p>
        <p className="font-mono text-[11px] text-ink-3">
          {fmtWindow(sandbox.term_start, sandbox.term_end)}
        </p>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-ink transition-[width]"
            style={{ width: `${(life.fraction * 100).toFixed(1)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-ink-3">{caption}</p>
      </div>
    </section>
  )
}
