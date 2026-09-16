'use client'

import { useState } from 'react'
import { Award, CalendarCheck, Undo2, Users, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import { whenLabel } from './client-view-copy'
import { Empty } from './section'
import type { ClientViewModel } from './client-view-model'
import type { SandboxActivityItem } from '@/types/sandbox-details'

/**
 * What an outcome row says in a sentence. The feed carries one row per history
 * entry; the client wants the headline, not the audit trail — and a draft is
 * never named, because it isn't agreed with anyone yet.
 */
function outcomeText(item: SandboxActivityItem, who: string | null): string {
  const action = (item.title || '').replace(/^Outcome\s+/i, '').toLowerCase()
  const verb =
    {
      sealed: 'was gold sealed',
      proposed: 'was proposed',
      created: 'was started',
      'changes requested': 'was sent back for changes',
      reopened: 'was reopened',
      withdrawn: 'was withdrawn',
    }[action] ?? action
  const subject =
    item.status === 'draft' ? 'A draft outcome' : `“${item.detail ?? ''}”`
  return `${subject} ${verb}${who ? ` · ${who}` : ''}`
}

function Icon({ item }: { item: SandboxActivityItem }) {
  const sentBack = /changes/i.test(item.title || '')
  const [Glyph, className] =
    item.kind === 'session'
      ? [Video, 'bg-ds-accent-bg text-ds-accent']
      : item.kind === 'outcome'
        ? sentBack
          ? [Undo2, 'bg-vermillion-bg text-vermillion']
          : [Award, 'bg-amber-token-bg text-amber-token']
        : item.kind === 'commitment'
          ? [CalendarCheck, 'bg-surface-3 text-ink-2']
          : [Users, 'bg-surface-3 text-ink-2']
  return (
    <span
      className={cn(
        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
        className,
      )}
      aria-hidden
    >
      <Glyph className="h-3.5 w-3.5" />
    </span>
  )
}

/** What has happened, newest first, grouped by the day it happened. */
export function UpdatesFeed({
  model,
  limit = 8,
  more,
  loadingMore,
  onMore,
}: {
  model: ClientViewModel
  limit?: number
  more: boolean
  loadingMore: boolean
  onMore: () => void
}) {
  const [shown, setShown] = useState(limit)
  const items = model.updates.slice(0, shown)
  if (!items.length)
    return (
      <Empty>
        {model.life.kind === 'upcoming'
          ? 'Updates start with the first session.'
          : 'Nothing has happened here yet.'}
      </Empty>
    )

  let lastDay = ''
  return (
    <div>
      <ul className="space-y-2.5">
        {items.map(item => {
          const day = item.occurred_at.slice(0, 10)
          const heading = day !== lastDay ? day : null
          lastDay = day
          const who = item.member_id
            ? (model.updateNames[item.member_id] ?? null)
            : null
          return (
            <li key={item.id} data-testid="update-row" data-kind={item.kind}>
              {heading && (
                <p className="pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-4">
                  {whenLabel(heading, model.today)}
                </p>
              )}
              <div className="flex gap-2.5">
                <Icon item={item} />
                <div className="min-w-0">
                  <p className="text-sm leading-snug text-ink">
                    {item.kind === 'outcome'
                      ? outcomeText(item, who)
                      : item.title}
                  </p>
                  {item.kind !== 'outcome' && item.detail && (
                    <p className="truncate text-xs text-ink-3">
                      {item.detail}
                      {item.duration_minutes
                        ? ` · ${item.duration_minutes} min`
                        : ''}
                    </p>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      {(model.updates.length > items.length || more) && (
        <button
          type="button"
          className="mt-3 text-xs text-ds-accent underline underline-offset-4"
          onClick={() => {
            setShown(n => n + limit)
            // Ask for the next page once the loaded ones run out, so the
            // button keeps working instead of quietly stopping.
            if (model.updates.length <= shown + limit && more) onMore()
          }}
          disabled={loadingMore}
          data-testid="updates-more"
        >
          {loadingMore ? 'Loading…' : 'Show more'}
        </button>
      )}
    </div>
  )
}
