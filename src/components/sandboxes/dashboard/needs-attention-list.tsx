'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  ATTENTION_GROUP_LABEL,
  ATTENTION_ORDER,
  attentionHref,
  SEVERITY_TONE,
  TONE_DOT,
} from '@/lib/sandbox/delivery'
import { cn } from '@/lib/utils'
import type { AttentionItem, AttentionKind } from '@/types/sandbox-delivery'

/**
 * Everything that needs a look, grouped by kind, one line per item with a
 * deep link into the sandbox. Renders the calm empty state when there is
 * nothing — never a bare zero.
 */
export function NeedsAttentionList({
  items,
  showSandbox,
  basePath = '/sandboxes',
  limit,
  className,
  onSelect,
}: {
  items: AttentionItem[]
  /** Name the sandbox on each row (when the list spans several). */
  showSandbox: boolean
  basePath?: string
  /** Show only the first N rows overall (home strip). */
  limit?: number
  className?: string
  /**
   * Handle the click here instead of linking out. The sandbox page is already
   * on the sandbox a row names, and a link that only changes the hash would not
   * reach it — the tab has to be switched in place.
   */
  onSelect?: (item: AttentionItem) => void
}) {
  const shown = limit ? items.slice(0, limit) : items
  const groups = ATTENTION_ORDER.map(kind => ({
    kind,
    rows: shown.filter(i => i.kind === kind),
  })).filter(g => g.rows.length > 0)

  if (items.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border border-line bg-paper px-5 py-6 text-center',
          className,
        )}
        data-testid="attention-empty"
      >
        <p className="text-sm font-medium text-ink">Nothing needs you</p>
        <p className="mt-1 text-sm text-ink-3">
          Every sandbox is on pace and every invitation has landed.
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn('rounded-xl border border-line bg-paper', className)}
      data-testid="needs-attention"
    >
      {groups.map(({ kind, rows }) => (
        <div key={kind} data-testid="attention-group" data-kind={kind}>
          <h3 className="border-b border-line px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
            {ATTENTION_GROUP_LABEL[kind as AttentionKind]}
            <span className="ml-1.5 font-normal normal-case tracking-normal text-ink-4">
              {rows.length}
            </span>
          </h3>
          <ul className="divide-y divide-line">
            {rows.map((item, i) => {
              const rowClass =
                'group flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-surface-2'
              const body = (
                <>
                  <span
                    className={cn(
                      'h-2 w-2 shrink-0 rounded-full',
                      TONE_DOT[SEVERITY_TONE[item.severity]],
                    )}
                    aria-label={item.severity}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">
                      {item.headline}
                    </span>
                    <span className="block truncate text-xs text-ink-3">
                      {showSandbox && (
                        <>
                          <span className="text-ink-2">
                            {item.sandbox_name}
                          </span>
                          {' · '}
                        </>
                      )}
                      {item.detail}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-4 transition-colors group-hover:text-ink" />
                </>
              )
              return (
                <li
                  key={`${item.kind}-${item.sandbox_id}-${item.member_id ?? item.group_id ?? item.event_id ?? i}`}
                >
                  {onSelect ? (
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      className={rowClass}
                      data-testid="attention-row"
                      data-kind={item.kind}
                      data-severity={item.severity}
                    >
                      {body}
                    </button>
                  ) : (
                    <Link
                      href={attentionHref(item, basePath)}
                      className={rowClass}
                      data-testid="attention-row"
                      data-kind={item.kind}
                      data-severity={item.severity}
                    >
                      {body}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
      {limit && items.length > shown.length && (
        <p className="border-t border-line px-5 py-2 text-xs text-ink-3">
          +{items.length - shown.length} more
        </p>
      )}
    </div>
  )
}
