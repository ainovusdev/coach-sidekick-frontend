'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowRight, MessageSquare } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAgentThreads } from '@/hooks/queries/use-agent-threads'
import { STARTERS_BY_SCOPE } from '@/components/admin/agent/agent-starters'
import { useAgentModal } from '@/components/agent/agent-modal'

/**
 * "Ask Sidekick" entry section for the coach dashboard. An input + a few starter
 * chips + recent saved conversations — asking a question or opening a saved
 * conversation pops the agent open as an on-page modal (you keep your place);
 * the explicit "Open" button is the way to the dedicated full /agent page.
 *
 * Deliberately a lightweight launcher (not a full embedded console) so it doesn't
 * crowd the dense coach dashboard.
 */
export function AskSidekickCard() {
  const router = useRouter()
  const { openAgent } = useAgentModal()
  const [value, setValue] = useState('')
  const starters = STARTERS_BY_SCOPE.coach.slice(0, 4)
  const { data } = useAgentThreads('coach')
  const recent = (data?.threads ?? []).slice(0, 3)

  const ask = (q: string) => {
    const text = q.trim()
    if (!text) return
    openAgent({ scope: 'coach', query: text })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    ask(value)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface-1 shadow-sm">
      <div className="flex items-center gap-3 border-b border-line bg-ds-accent-bg px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ds-accent text-ink-on-dark shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-ink">Ask Sidekick</h3>
          <p className="text-xs text-ink-3">
            Your AI sidekick — query clients, sessions, transcripts, and scores
            in plain English.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto hidden gap-1.5 text-ds-accent hover:text-ds-accent sm:inline-flex"
          onClick={() => router.push('/agent')}
        >
          Open
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="p-5">
        <form onSubmit={submit} className="relative">
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Ask anything about your clients, sessions, or transcripts…"
            aria-label="Ask Sidekick"
            className="h-11 w-full rounded-lg border border-line bg-paper pl-4 pr-11 text-sm text-ink placeholder:text-ink-3 focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ds-accent/30"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!value.trim()}
            aria-label="Ask"
            className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {starters.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="rounded-full border border-line bg-paper px-3 py-1.5 text-left text-xs text-ink-2 transition hover:-translate-y-px hover:border-line-strong hover:bg-ds-accent-bg hover:text-ink hover:shadow-sm"
            >
              {s}
            </button>
          ))}
        </div>

        {recent.length > 0 && (
          <div className="mt-4 border-t border-line pt-3">
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-3">
              Recent conversations
            </p>
            <div className="flex flex-col">
              {recent.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => openAgent({ scope: 'coach', threadId: t.id })}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-ink-2 transition hover:bg-ds-accent-bg hover:text-ink"
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-ink-3" />
                  <span className="line-clamp-1">{t.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
