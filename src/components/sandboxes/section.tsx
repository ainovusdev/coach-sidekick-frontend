import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The two shells a sandbox page is made of: a Section in the main column and a
 * Panel in the rail. Both views use them, so one rhythm holds across the page —
 * header `px-5 py-3.5`, body `px-5 py-4`, and nothing carries a shadow.
 *
 * Both anchor themselves, so `#outcomes`, `#timeline` and the rest keep landing
 * wherever the link came from.
 */

export function Section({
  id,
  title,
  sub,
  aside,
  note,
  footer,
  children,
  className,
  bodyClassName,
  testId,
  dataState,
}: {
  id: string
  title: string
  sub?: ReactNode
  aside?: ReactNode
  /** A line between the header and the body — usually what this view is scoped to. */
  note?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  /** Defaults to the client view's name; the cockpit passes its panel's own. */
  testId?: string
  dataState?: string
}) {
  return (
    <section
      id={id}
      data-testid={testId ?? `client-section-${id}`}
      data-state={dataState}
      aria-labelledby={`${id}-title`}
      className={cn(
        'scroll-mt-(--section-offset) rounded-xl border border-line bg-paper',
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3.5">
        <h2 id={`${id}-title`} className="text-base font-semibold text-ink">
          {title}
          {sub && (
            <span className="ml-2 text-sm font-normal text-ink-3">{sub}</span>
          )}
        </h2>
        {aside}
      </header>
      {note && (
        <p className="border-b border-line px-5 py-2 text-xs text-ink-3">
          {note}
        </p>
      )}
      <div className={cn('px-5 py-4', bodyClassName)}>{children}</div>
      {footer && <div className="border-t border-line px-5 py-3">{footer}</div>}
    </section>
  )
}

export function Panel({
  id,
  title,
  aside,
  children,
  className,
  bodyClassName,
  testId,
}: {
  id: string
  title: string
  aside?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  testId?: string
}) {
  return (
    <section
      id={id}
      data-testid={testId ?? `client-panel-${id}`}
      aria-labelledby={`${id}-title`}
      className={cn(
        'scroll-mt-(--section-offset) rounded-xl border border-line bg-paper',
        className,
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <h2
          id={`${id}-title`}
          className="text-[11px] font-semibold uppercase tracking-wider text-ink-3"
        >
          {title}
        </h2>
        {aside}
      </header>
      <div className={cn('px-4 py-3', bodyClassName)}>{children}</div>
    </section>
  )
}

/** A calm line where a list would be — never a bare zero. */
export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm text-ink-3" data-testid="client-empty">
      {children}
    </p>
  )
}
