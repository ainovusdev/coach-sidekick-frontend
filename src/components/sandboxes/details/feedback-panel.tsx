'use client'

import { useState } from 'react'
import { ChevronDown, Trophy } from 'lucide-react'
import { useSandboxFeedback } from '@/hooks/queries/use-sandbox-details'
import { fmtDay } from '@/lib/sandbox/format'
import { TONE_CLASS } from '@/lib/tone'
import { cn } from '@/lib/utils'
import type { InsightSelection } from '@/types/sandbox-analytics'
import type {
  SandboxFeedbackAnswer,
  SandboxSessionFeedback,
  SandboxWin,
} from '@/types/sandbox-details'
import { detailSection } from './detail-chart'

const chip =
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'

function shown(answer: string) {
  const value = String(answer).trim()
  if (/^([1-9]|10)$/.test(value)) return `${value} / 10`
  if (/^(yes|no)$/i.test(value))
    return value[0].toUpperCase() + value.slice(1).toLowerCase()
  return value
}

/**
 * What came back after each session: the coachees' Thrill Forms and the coach's
 * reflection, then every win a coach recorded. Internal only — the page's
 * `can_read_feedback` keeps the client's side from even asking.
 */
export function FeedbackPanel({
  sandboxId,
  viewer,
  selection,
  enabled,
  onSession,
}: {
  sandboxId: string
  viewer: string | null
  selection: InsightSelection
  enabled: boolean
  onSession: (id: string) => void
}) {
  const feedback = useSandboxFeedback(sandboxId, viewer, selection, enabled)
  const [all, setAll] = useState(false)
  const data = feedback.data
  if (!enabled || !data || !data.visible) return null

  const sessions = all ? data.sessions : data.sessions.slice(0, 5)
  return (
    <>
      <section className={detailSection} data-testid="session-feedback">
        <h2 className="text-lg font-semibold text-ink">Session feedback</h2>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-3">
          The coachee&apos;s Thrill Form and the coach&apos;s reflection after
          each session. Read by the account executive, the lead coach and the
          coach who ran the session — never the client&apos;s side or the
          coachee.
        </p>
        {!data.sessions.length ? (
          <p className="mt-5 text-sm text-ink-3">
            No forms have gone out for this selection yet. They are sent when a
            session completes.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {sessions.map((s, i) => (
              <SessionRow
                key={s.session_id}
                session={s}
                defaultOpen={i === 0}
                onSession={onSession}
              />
            ))}
          </ul>
        )}
        {data.sessions.length > 5 && (
          <button
            className="mt-3 text-xs font-medium text-ds-accent"
            onClick={() => setAll(v => !v)}
          >
            {all ? 'Show fewer' : `Show all ${data.sessions.length} sessions`}
          </button>
        )}
      </section>
      {data.wins.length > 0 && <Wins wins={data.wins} />}
    </>
  )
}

function SessionRow({
  session,
  defaultOpen,
  onSession,
}: {
  session: SandboxSessionFeedback
  defaultOpen: boolean
  onSession: (id: string) => void
}) {
  const [open, setOpen] = useState(defaultOpen)
  const done = session.thrill_forms.filter(f => f.status === 'completed').length
  const reflection = session.reflection
  const about = (name: string, key: string) =>
    reflection?.answers.find(a => a.subject_name === name && a.key === key)
      ?.answer
  const general = (reflection?.answers ?? []).filter(
    a => !a.subject_name && String(a.answer).trim(),
  )
  return (
    <li data-testid="feedback-session">
      <button
        className="flex w-full items-start gap-3 rounded-lg py-4 text-left hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ds-accent"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink">
            {session.participants.join(', ') || 'Session'}
          </span>
          <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-3">
            <time dateTime={session.occurred_at}>
              {fmtDay(session.occurred_at.slice(0, 10), true)}
            </time>
            <span>{session.coach_name}</span>
            {session.group_name && <span>{session.group_name}</span>}
          </span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            <span
              className={cn(
                chip,
                TONE_CLASS[
                  reflection?.status === 'completed' ? 'good' : 'muted'
                ],
              )}
            >
              {reflection?.status === 'completed'
                ? 'Coach reflection in'
                : reflection
                  ? 'Coach reflection awaited'
                  : 'No coach reflection'}
            </span>
            {session.thrill_forms.length > 0 && (
              <span
                className={cn(
                  chip,
                  TONE_CLASS[
                    done === session.thrill_forms.length ? 'good' : 'muted'
                  ],
                )}
              >
                Thrill Forms {done} of {session.thrill_forms.length}
              </span>
            )}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'mt-1 h-4 w-4 shrink-0 text-ink-3 transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>
      {open && (
        <div className="space-y-5 pb-5">
          {reflection?.status === 'completed' && (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wider text-ink-3">
                From the coach
              </h3>
              <ul className="mt-2 space-y-1.5">
                {session.participants.map(name => {
                  const track = about(name, 'on_track')
                  const rapport = about(name, 'rapport')
                  if (!track && !rapport) return null
                  return (
                    <li
                      key={name}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
                    >
                      <span className="min-w-0 font-medium text-ink">
                        {name}
                      </span>
                      {track && (
                        <span
                          className={cn(
                            chip,
                            TONE_CLASS[
                              track === 'Off track' ? 'warning' : 'good'
                            ],
                          )}
                        >
                          {track}
                        </span>
                      )}
                      {rapport && (
                        <span className="text-xs text-ink-3">
                          Rapport{' '}
                          <span className="font-semibold tabular-nums text-ink">
                            {rapport} / 10
                          </span>
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
              <Answers answers={general} />
              {reflection.wins.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {reflection.wins.map((w, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-ink"
                    >
                      <Trophy
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-token"
                        aria-hidden
                      />
                      <span className="min-w-0">{w}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {session.thrill_forms.map(form => (
            <div key={form.member_id ?? form.client_name}>
              <h3 className="text-xs font-medium uppercase tracking-wider text-ink-3">
                Thrill Form · {form.client_name}
              </h3>
              {form.status === 'sent' ? (
                <p className="mt-2 text-sm text-ink-3">Sent, not opened yet.</p>
              ) : (
                <Answers answers={form.answers} />
              )}
            </div>
          ))}
          <button
            className="text-xs font-medium text-ds-accent"
            onClick={() => onSession(session.session_id)}
          >
            Open session
          </button>
        </div>
      )}
    </li>
  )
}

function Answers({ answers }: { answers: SandboxFeedbackAnswer[] }) {
  if (!answers.length) return null
  return (
    <dl className="mt-3 space-y-3">
      {answers.map((a, i) => (
        <div key={i}>
          <dt className="text-xs leading-relaxed text-ink-3">
            {a.question_text}
          </dt>
          <dd className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {a.key === 'next_call'
              ? fmtDay(String(a.answer).slice(0, 10), true)
              : shown(a.answer)}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function Wins({ wins }: { wins: SandboxWin[] }) {
  const [all, setAll] = useState(false)
  const rows = all ? wins : wins.slice(0, 6)
  return (
    <section className={detailSection} data-testid="sandbox-wins">
      <h2 className="text-lg font-semibold text-ink">Wins</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-3">
        Captured by coaches in their reflections.
      </p>
      <ul className="mt-4 space-y-3">
        {rows.map((w, i) => (
          <li key={i} className="flex items-start gap-3">
            <Trophy
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-token"
              aria-hidden
            />
            <span className="min-w-0">
              <span className="block text-sm text-ink">{w.text}</span>
              <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-3">
                <time dateTime={w.occurred_at}>
                  {fmtDay(w.occurred_at.slice(0, 10), true)}
                </time>
                <span>{w.coach_name}</span>
                {w.group_name && <span>{w.group_name}</span>}
              </span>
            </span>
          </li>
        ))}
      </ul>
      {wins.length > 6 && (
        <button
          className="mt-3 text-xs font-medium text-ds-accent"
          onClick={() => setAll(v => !v)}
        >
          {all ? 'Show fewer' : `Show all ${wins.length} wins`}
        </button>
      )}
    </section>
  )
}
