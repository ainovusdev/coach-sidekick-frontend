'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SandboxCard } from '@/components/sandboxes/dashboard/sandbox-card'
import { useAuth } from '@/contexts/auth-context'
import { useSandboxDashboard } from '@/hooks/queries/use-sandboxes'
import { useFeatureFlagEnabled } from '@/hooks/use-feature-flag'

const MAX_CARDS = 3

/**
 * "Your sandboxes" on the coach home: up to three compact cards and how many
 * things need a look. Renders nothing for coaches outside every sandbox —
 * never an empty card on the home page.
 */
export function SandboxStrip() {
  const { isCoach, isAdmin } = useAuth()
  // Behind `sandboxes`: this sits on the coach home page, so with the flag off
  // it must not even ask the dashboard endpoint.
  const flagOn = useFeatureFlagEnabled('sandboxes')
  const enabled = flagOn && (isCoach() || isAdmin())
  const { data } = useSandboxDashboard(false, enabled)
  if (!enabled || !data || data.cards.length === 0) return null

  const cards = data.cards.slice(0, MAX_CARDS)
  const more = data.cards.length - cards.length
  const attention = data.attention.length

  return (
    <section className="mb-6" data-testid="sandbox-strip">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          Your sandboxes
          {attention > 0 && (
            <Link
              href="/sandboxes"
              className="rounded-full bg-amber-token-bg px-2 py-0.5 text-xs font-medium text-amber-token hover:underline"
              data-testid="strip-attention"
            >
              {attention} need{attention === 1 ? 's' : ''} attention
            </Link>
          )}
        </h2>
        <Link
          href="/sandboxes"
          className="flex items-center gap-1 text-sm text-ink-3 transition-colors hover:text-ink"
          data-testid="strip-all"
        >
          {more > 0 ? `+${more} more` : 'All sandboxes'}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(card => (
          <li key={card.sandbox.id} className="min-w-0">
            <SandboxCard card={card} today={data.today} compact />
          </li>
        ))}
      </ul>
    </section>
  )
}
