'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Boxes } from 'lucide-react'
import { ApiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-client'
import { SandboxService } from '@/services/sandbox-service'
import { fmtDay } from '@/lib/sandbox/format'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useInsightViewer,
  withSandboxViewer,
} from '@/hooks/queries/use-sandbox-insights'
import { detailControl } from './details/detail-chart'
import { sandboxEntityHref } from '@/lib/sandbox/detail-links'
import { useFeatureFlagEnabled } from '@/hooks/use-feature-flag'

const base = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/sandboxes`
export interface ClientSandboxMarker {
  sandbox_id: string
  sandbox_name: string
  group_id: string
  group_name: string
  member_id: string
  starts_on: string
  ends_on: string
}
export function useSandboxClientMarkers(
  clientIds: (string | undefined | null)[],
  onDate?: string,
) {
  // Behind `sandboxes`: these markers hang off session pickers and session
  // pages that every coach uses, so the flag stops the membership probe itself.
  const flagOn = useFeatureFlagEnabled('sandboxes')
  const viewer = useInsightViewer()
  const ids = [...new Set(clientIds.filter((id): id is string => !!id))].sort()
  // Most coaches are in no sandbox: ask once whether this viewer is in any
  // (ended terms too, for backdated sessions) before sending client ids.
  const membership = useQuery({
    queryKey: [...queryKeys.sandboxes.mine(), 'any', viewer],
    queryFn: () =>
      withSandboxViewer(viewer, () =>
        SandboxService.mine({ includeEnded: true }),
      ),
    enabled: flagOn && !!viewer,
    staleTime: 60 * 1000,
  })
  const inSandbox = flagOn && (membership.data?.total ?? 0) > 0
  const query = useQuery({
    queryKey: ['sandbox-client-markers', viewer, ids, onDate ?? null],
    queryFn: () =>
      withSandboxViewer(viewer, async () => {
        const batches = []
        for (let i = 0; i < ids.length; i += 100)
          batches.push(ids.slice(i, i + 100))
        const results: {
          clients: { client_id: string; contexts: ClientSandboxMarker[] }[]
        }[] = await Promise.all(
          batches.map(client_ids =>
            ApiClient.post(`${base}/client-contexts`, {
              client_ids,
              ...(onDate ? { on_date: onDate } : {}),
            }),
          ),
        )
        return Object.fromEntries(
          results
            .flatMap(result => result.clients)
            .filter(row => ids.includes(row.client_id))
            .map(row => [row.client_id, row.contexts]),
        )
      }),
    enabled: !!viewer && inSandbox && ids.length > 0,
    gcTime: 0,
    staleTime: 30000,
  })
  return viewer && inSandbox && !query.isError ? (query.data ?? {}) : {}
}
export function SandboxClientBadge({
  contexts = [],
}: {
  contexts?: ClientSandboxMarker[]
}) {
  if (!contexts.length) return null
  return (
    <span
      className="ml-2 inline-flex max-w-full items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 align-middle text-[10px] font-medium text-ink-3"
      title={[...new Set(contexts.map(c => c.sandbox_name))].join(', ')}
      data-testid="sandbox-client-badge"
    >
      <Boxes className="h-3 w-3 shrink-0" aria-hidden />
      Sandbox
    </span>
  )
}
export interface SandboxAssignmentChoice {
  sandbox_id: string
  group_id: string
}

/**
 * Which agreement this session will count toward, and — when more than one could
 * claim it — the choice itself.
 *
 * A session the resolver cannot settle sits in `needs_review` and earns nobody
 * anything until a human opens it. Deciding here, before the session happens,
 * is the difference between a sentence and a control: pass `onChange` and the
 * caller sends the chosen group with the session.
 */
export function SandboxAssignmentHint({
  clientIds,
  onDate,
  value,
  onChange,
}: {
  clientIds: (string | undefined | null)[]
  onDate?: string
  value?: SandboxAssignmentChoice | null
  onChange?: (choice: SandboxAssignmentChoice | null) => void
}) {
  const markers = useSandboxClientMarkers(clientIds, onDate)
  const rows = clientIds
    .filter((id): id is string => !!id)
    .flatMap(id => (markers[id]?.length ? [{ id, contexts: markers[id] }] : []))
  // Everyone in the room who is in a sandbox has to be able to count toward the
  // group, or choosing it would credit some of them and strand the rest.
  const shared = useMemo(() => {
    if (!rows.length) return []
    return rows[0].contexts.filter(candidate =>
      rows.every(row =>
        row.contexts.some(c => c.group_id === candidate.group_id),
      ),
    )
  }, [rows])
  const ambiguous = rows.some(row => row.contexts.length > 1)
  const loaded = rows.length > 0
  const selected = value?.group_id ?? ''

  useEffect(() => {
    // Nothing loaded yet is not "no longer an option": a caller that opened this
    // from a group row arrives with a choice already made, and clearing it
    // before the markers land would ask the coach a question they answered.
    if (!onChange || !loaded) return
    // One shared agreement and nothing else in play: say so, and send it, so the
    // session is settled the same way whether or not the coach read the line.
    if (!ambiguous && shared.length === 1) {
      if (selected !== shared[0].group_id)
        onChange({
          sandbox_id: shared[0].sandbox_id,
          group_id: shared[0].group_id,
        })
      return
    }
    // The chosen group stopped being an option — a changed date, a changed room.
    if (selected && !shared.some(c => c.group_id === selected)) onChange(null)
  }, [ambiguous, shared, selected, onChange, loaded])

  if (!rows.length) return null

  const one = !ambiguous && shared.length === 1 ? shared[0] : null
  // Read-only callers get the good news and nothing else. Telling a coach the
  // assignment "needs review" on a surface with no way to settle it is a dead
  // end; every surface that can create a session passes `onChange` instead.
  if (!one && !onChange) return null
  return (
    <div
      className="space-y-2 rounded-lg bg-surface-2 px-3 py-2 text-xs leading-relaxed text-ink-3"
      data-testid="sandbox-assignment-hint"
    >
      {one ? (
        <p>
          Counts toward{' '}
          <Link
            className="font-medium text-ink-2 hover:underline"
            href={sandboxEntityHref(one.sandbox_id, 'client', one.member_id)}
          >
            {one.sandbox_name}
          </Link>{' '}
          · {one.group_name}
        </p>
      ) : !onChange ? null : shared.length === 0 ? (
        <p data-testid="sandbox-assignment-none">
          These people are in different agreements, so this session can’t count
          toward one of them. It will wait for review.
        </p>
      ) : (
        <label className="block">
          <span className="font-medium text-ink-2">Count this toward</span>
          <select
            className={`${detailControl} mt-1`}
            aria-label="Count this toward"
            data-testid="sandbox-assignment-choice"
            value={selected}
            onChange={e => {
              const picked = shared.find(c => c.group_id === e.target.value)
              onChange(
                picked
                  ? { sandbox_id: picked.sandbox_id, group_id: picked.group_id }
                  : null,
              )
            }}
          >
            <option value="">Decide later</option>
            {shared.map(c => (
              <option key={c.group_id} value={c.group_id}>
                {c.sandbox_name} · {c.group_name}
              </option>
            ))}
          </select>
          {!selected && (
            <span className="mt-1 block">
              Left undecided, this session waits for review and counts toward
              nothing.
            </span>
          )}
        </label>
      )}
    </div>
  )
}
export interface SessionAttributionCandidate {
  sandbox_id: string
  sandbox_name: string
  group_id: string
  group_name: string
  member_id: string
}
export interface SessionAttributionItem {
  id: string
  session_id: string
  member_id: string | null
  subject_user_id: string
  subject_name?: string
  started_on?: string | null
  scheduled_on?: string | null
  status: string
  revision: number
  group_id: string | null
  client_ids: string[]
  can_resolve: boolean
  candidates: SessionAttributionCandidate[]
  /** The agreement this row credits, named — only when the viewer may see it. */
  selected?: {
    sandbox_id: string
    sandbox_name: string
    group_id: string
    group_name: string
  } | null
}
/**
 * Why one of the coach's own participants is not credited: the boundary that
 * keeps the session out, and where that boundary is corrected. Only groups the
 * viewer coaches are ever named.
 */
export interface SessionAttributionDiagnostic {
  client_id: string
  client_name?: string | null
  reason:
    | 'before_coachee_start'
    | 'before_coach_start'
    | 'before_term'
    | 'after_end'
    | 'no_matching_coachee'
    | 'excluded'
    | 'not_delivered'
  boundary_on?: string
  sandbox_id?: string
  sandbox_name?: string
  group_id?: string
  group_name?: string
  enrollment_id?: string | null
  can_manage?: boolean
}
interface AttributionResponse {
  items: SessionAttributionItem[]
  diagnostics?: SessionAttributionDiagnostic[]
}
export function SessionAttribution({
  sessionId,
  sandboxId,
  memberId,
  groupId,
  coachId,
}: {
  sessionId?: string
  sandboxId?: string
  memberId?: string
  groupId?: string
  coachId?: string
}) {
  const flagOn = useFeatureFlagEnabled('sandboxes')
  const viewer = useInsightViewer()
  if (!flagOn) return null
  return (
    <AttributionContent
      key={`${viewer}:${sessionId}:${sandboxId}:${memberId}:${groupId}:${coachId}`}
      viewer={viewer}
      sessionId={sessionId}
      sandboxId={sandboxId}
      memberId={memberId}
      groupId={groupId}
      coachId={coachId}
    />
  )
}
function AttributionContent({
  viewer,
  sessionId,
  sandboxId,
  memberId,
  groupId,
  coachId,
}: {
  viewer: string | null
  sessionId?: string
  sandboxId?: string
  memberId?: string
  groupId?: string
  coachId?: string
}) {
  const queryClient = useQueryClient()
  const key = [
    'sandbox-session-attributions',
    viewer,
    sessionId ?? null,
    sandboxId ?? null,
    memberId ?? null,
    groupId ?? null,
    coachId ?? null,
  ]
  const query = useQuery<AttributionResponse>({
    queryKey: key,
    queryFn: () =>
      withSandboxViewer(viewer, () =>
        ApiClient.get(
          sandboxId
            ? `${base}/${sandboxId}/attributions?${new URLSearchParams({ ...(sessionId ? { session_id: sessionId } : { status: 'needs_review' }), ...(memberId ? { subject_member_id: memberId } : {}), ...(groupId ? { group_id: groupId } : {}), ...(coachId ? { coach_user_id: coachId } : {}) })}`
            : `${base}/session-attributions/${sessionId}`,
        ),
      ),
    enabled: !!viewer && !!(sessionId || sandboxId),
    gcTime: 0,
    staleTime: 0,
  })
  const data = query.isError ? undefined : query.data
  const items = useMemo(
    () =>
      (data?.items ?? [])
        .filter(
          item =>
            !memberId ||
            item.member_id === memberId ||
            item.candidates.some(c => c.member_id === memberId),
        )
        .filter(
          item =>
            !groupId ||
            item.group_id === groupId ||
            item.candidates.some(c => c.group_id === groupId),
        ),
    [data, memberId, groupId],
  )
  // A person who already has a row (credited, needs a choice, excluded) is
  // explained by that row; a diagnostic for them would say the same thing
  // twice. Diagnostics are for the participants no row reaches.
  const diagnostics = sandboxId
    ? []
    : (data?.diagnostics ?? []).filter(
        d => !items.some(i => i.client_ids.includes(d.client_id)),
      )
  const onSaved = () => {
    void queryClient.invalidateQueries({ queryKey: key })
    void queryClient.invalidateQueries({ queryKey: ['sandbox-entity'] })
    void queryClient.invalidateQueries({ queryKey: ['sandbox-reporting'] })
  }
  if (!items.length && !diagnostics.length) return null
  // On the session page the whole thing is a strip: one line per person, the
  // correction on the same line. The sandbox pages keep the card.
  if (!sandboxId)
    return (
      <section
        className="space-y-1.5 rounded-lg bg-surface-2 px-3 py-2 text-xs leading-relaxed text-ink-3"
        aria-label="Sandbox session assignment"
        data-testid="session-attribution"
      >
        {items.map(item => (
          <AttributionRow
            key={`${item.id}:${item.revision}`}
            item={item}
            viewer={viewer}
            onSaved={onSaved}
            strip
          />
        ))}
        {diagnostics.map(d => (
          <DiagnosticLine key={d.client_id} diagnostic={d} />
        ))}
      </section>
    )
  return (
    <section
      className="space-y-3 rounded-xl border border-line bg-paper p-4"
      aria-label="Sandbox session assignment"
      data-testid="session-attribution"
    >
      <h2 className="text-sm font-semibold text-ink">
        Sandbox session assignment
      </h2>
      {items.map(item => (
        <AttributionRow
          key={`${item.id}:${item.revision}`}
          item={item}
          viewer={viewer}
          sandboxId={sandboxId}
          onSaved={onSaved}
        />
      ))}
    </section>
  )
}
/** Where a boundary is corrected: the group drawer, Settings, or the person. */
function diagnosticAction(d: SessionAttributionDiagnostic) {
  const groupHref = (focus: 'counts-from' | 'start') =>
    d.sandbox_id && d.group_id
      ? `/sandboxes/${d.sandbox_id}?tab=groups&group=${d.group_id}&focus=${focus}`
      : null
  switch (d.reason) {
    case 'before_coachee_start':
      return d.can_manage
        ? {
            href: groupHref('counts-from'),
            label: 'Change the day they count from',
          }
        : {
            href: null,
            label: `Ask whoever manages groups in ${d.sandbox_name} to change the day they count from.`,
          }
    case 'before_coach_start':
      return d.can_manage
        ? {
            href: groupHref('counts-from'),
            label: 'Change the day you count from',
          }
        : {
            href: null,
            label: `Ask whoever manages groups in ${d.sandbox_name} to change the day you count from.`,
          }
    case 'before_term':
      return d.sandbox_id
        ? {
            href: `/sandboxes/${d.sandbox_id}?tab=settings`,
            label: 'Open the term',
          }
        : { href: null, label: '' }
    case 'after_end':
      return d.can_manage
        ? { href: groupHref('start'), label: 'Open the group' }
        : { href: null, label: '' }
    case 'no_matching_coachee':
      return { href: `/clients/${d.client_id}`, label: 'Open their profile' }
    default:
      return { href: null, label: '' }
  }
}
function DiagnosticLine({
  diagnostic: d,
}: {
  diagnostic: SessionAttributionDiagnostic
}) {
  const who = d.client_name ? `${d.client_name}: ` : ''
  const boundary = fmtDay(d.boundary_on, true)
  const place =
    d.group_name && d.sandbox_name ? `${d.sandbox_name} · ${d.group_name}` : ''
  const text = (() => {
    switch (d.reason) {
      case 'before_coachee_start':
        return `not counted — they count toward ${place} from ${boundary}, after this session.`
      case 'before_coach_start':
        return `not counted — you count toward ${place} from ${boundary}, after this session.`
      case 'before_term':
        return `not counted — ${d.sandbox_name}’s term begins ${boundary}, after this session.`
      case 'after_end':
        return `not counted — ${place} ended ${boundary}, before this session.`
      case 'no_matching_coachee':
        return 'not counted — not in a sandbox agreement with you on this day.'
      case 'excluded':
        return 'excluded from sandbox delivery.'
      default:
        return 'counts toward a sandbox once the session is completed.'
    }
  })()
  const action = diagnosticAction(d)
  return (
    <p data-testid="attribution-diagnostic" data-reason={d.reason}>
      {who}
      {text}
      {action.href ? (
        <Link
          className="ml-2 font-medium text-ds-accent hover:underline"
          href={action.href}
        >
          {action.label}
        </Link>
      ) : action.label ? (
        <span className="ml-1">{action.label}</span>
      ) : null}
    </p>
  )
}
function AttributionRow({
  item,
  viewer,
  sandboxId,
  onSaved,
  strip = false,
}: {
  item: SessionAttributionItem
  viewer: string | null
  sandboxId?: string
  onSaved: () => void
  strip?: boolean
}) {
  const [editing, setEditing] = useState(
    !strip && item.status === 'needs_review',
  )
  const assigned =
    item.selected ?? item.candidates.find(c => c.group_id === item.group_id)
  const pending = item.status === 'needs_review'
  const who = item.subject_name ? `${item.subject_name}: ` : ''
  const summary =
    item.status === 'excluded'
      ? 'Excluded from sandbox delivery.'
      : assigned
        ? `Counts toward ${assigned.sandbox_name} · ${assigned.group_name}`
        : pending
          ? 'Sandbox assignment needs review.'
          : 'Sandbox assignment recorded.'
  return (
    <>
      <p className={strip ? '' : 'text-xs text-ink-3'}>
        {who}
        {summary}
        {item.can_resolve && (
          <button
            className="ml-3 text-ds-accent hover:underline"
            onClick={() => setEditing(true)}
          >
            {pending ? 'Choose' : strip ? 'Change' : 'Review assignment'}
          </button>
        )}
      </p>
      {item.can_resolve && (
        <AssignmentDialog
          item={item}
          viewer={viewer}
          sandboxId={sandboxId}
          open={editing}
          onOpenChange={setEditing}
          onSaved={onSaved}
        />
      )}
    </>
  )
}
interface ChoicesResponse {
  revision: number
  candidates: SessionAttributionCandidate[]
  stored_is_stale?: boolean
}
/**
 * The choice itself. Which agreements are on offer is asked afresh when the
 * dialog opens: the list a row stores is what the resolver saw when it last
 * wrote the row, and a window corrected since then makes a pairing eligible
 * that the stored list never heard of. A backend that cannot answer (older
 * than this dialog) falls back to the stored list.
 */
function AssignmentDialog({
  item,
  viewer,
  sandboxId,
  open,
  onOpenChange,
  onSaved,
}: {
  item: SessionAttributionItem
  viewer: string | null
  sandboxId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [choice, setChoice] = useState(item.group_id ?? '')
  const [reason, setReason] = useState('')
  const target =
    sandboxId ?? item.selected?.sandbox_id ?? item.candidates[0]?.sandbox_id
  const choices = useQuery<ChoicesResponse>({
    queryKey: [
      'sandbox-attribution-choices',
      viewer,
      target,
      item.id,
      item.revision,
    ],
    queryFn: () =>
      withSandboxViewer(viewer, () =>
        ApiClient.get(`${base}/${target}/attributions/${item.id}/choices`),
      ),
    enabled: open && !!viewer && !!target,
    retry: false,
    gcTime: 0,
    staleTime: 0,
  })
  const live =
    choices.data && Array.isArray(choices.data.candidates) ? choices.data : null
  const candidates = live ? live.candidates : item.candidates
  const revision = live ? live.revision : item.revision
  const mutation = useMutation({
    mutationFn: () =>
      withSandboxViewer(viewer, () => {
        const candidate = candidates.find(c => c.group_id === choice)
        const to = candidate?.sandbox_id ?? target
        if (!to) throw new Error('No authorized sandbox')
        return ApiClient.patch(`${base}/${to}/attributions/${item.id}`, {
          revision,
          group_id: choice === 'exclude' ? null : choice,
          exclude: choice === 'exclude',
          reason: reason.trim(),
        })
      }),
    onSuccess: () => {
      onOpenChange(false)
      onSaved()
    },
  })
  const sessionDate = fmtDay(item.started_on || item.scheduled_on, true)
  const pending = item.status === 'needs_review'
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="assignment-dialog">
        <DialogHeader>
          <DialogTitle>
            {item.subject_name ? `${item.subject_name}: ` : ''}
            {pending
              ? 'Sandbox assignment needs review'
              : 'Change sandbox assignment'}
          </DialogTitle>
          <DialogDescription>
            {sessionDate || 'Session date unavailable'} · Choose which agreement
            should receive this session’s coaching hours.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={e => {
            e.preventDefault()
            mutation.mutate()
          }}
        >
          <label className="block text-xs text-ink-3">
            Count this coaching toward
            <select
              className={`${detailControl} mt-1`}
              aria-label="Count this coaching toward"
              value={choice}
              required
              disabled={choices.isLoading}
              onChange={e => setChoice(e.target.value)}
            >
              <option value="">
                {choices.isLoading
                  ? 'Checking today’s agreements…'
                  : 'Choose a group'}
              </option>
              {candidates.map(c => (
                <option
                  key={`${c.sandbox_id}:${c.group_id}`}
                  value={c.group_id}
                >
                  {c.sandbox_name} · {c.group_name}
                </option>
              ))}
              <option value="exclude">Exclude from sandbox delivery</option>
            </select>
          </label>
          {!choices.isLoading && candidates.length === 0 && (
            <p
              className="text-xs text-ink-3"
              data-testid="assignment-no-choices"
            >
              No agreement covers this session’s day today. Correct the day
              someone counts from first, then come back.
            </p>
          )}
          <label className="block text-xs text-ink-3">
            Reason
            <input
              className={`${detailControl} mt-1`}
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              maxLength={1000}
            />
          </label>
          {mutation.isError && (
            <p role="alert" className="text-xs text-vermillion">
              The assignment could not be saved. Refresh this page to check the
              latest choices.
            </p>
          )}
          <Button
            size="sm"
            type="submit"
            disabled={mutation.isPending || !reason.trim() || !choice}
          >
            {mutation.isPending ? 'Saving…' : 'Confirm assignment'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
