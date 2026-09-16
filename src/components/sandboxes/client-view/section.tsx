import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The two shells the client view is made of: a Section in the main column and
 * a Panel in the rail. Both anchor themselves, so `#outcomes`, `#timeline` and
 * the rest keep landing wherever the link came from.
 */

export function Section({
  id,
  title,
  sub,
  aside,
  children,
  className,
  bodyClassName,
}: {
  id: string
  title: string
  sub?: ReactNode
  aside?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section
      id={id}
      data-testid={`client-section-${id}`}
      className={cn(
        'scroll-mt-28 rounded-xl border border-line bg-paper',
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3.5">
        <h2 className="text-base font-semibold text-ink">
          {title}
          {sub && (
            <span className="ml-2 text-sm font-normal text-ink-3">{sub}</span>
          )}
        </h2>
        {aside}
      </header>
      <div className={cn('px-5 py-4', bodyClassName)}>{children}</div>
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
}: {
  id: string
  title: string
  aside?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section
      id={id}
      data-testid={`client-panel-${id}`}
      className={cn(
        'scroll-mt-28 rounded-xl border border-line bg-paper',
        className,
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
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
