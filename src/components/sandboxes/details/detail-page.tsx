'use client'

import { sandboxEntityHref } from '@/lib/sandbox/detail-links'
import { SessionAttribution } from '@/components/sandboxes/session-attribution'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Flag, Users } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { StatStrip } from '@/components/ui/stat-strip'
import { CommitmentDetailPanel } from '@/components/commitments/commitment-detail-panel'
import { OutcomeList } from '@/components/sandboxes/outcomes/outcome-list'
import { ProgressRail } from '@/components/sandboxes/progress-rail'
import { PaceChip } from '@/components/sandboxes/pace-chip'
import { LearningPanel } from '@/components/sandboxes/insights/learning-panel'
import {
  useInsightViewer,
  useSandboxReporting,
} from '@/hooks/queries/use-sandbox-insights'
import { useSandboxEntity } from '@/hooks/queries/use-sandbox-details'
import { fmtDay } from '@/lib/sandbox/format'
import { fmtHoursShort, STATE_LABEL } from '@/lib/sandbox/delivery'
import type { InsightSelection } from '@/types/sandbox-analytics'
import type {
  SandboxEntityDetail,
  SandboxEntityKind,
  SandboxRelationship,
} from '@/types/sandbox-details'
import type { DeliveryState } from '@/types/sandbox-delivery'
import {
  ActivityPanel,
  ActivityRows,
  SessionDetailDrawer,
} from './activity-panel'
import { ConcernsPanel } from './concerns-panel'
import { FeedbackPanel } from './feedback-panel'
import { DetailChart, detailControl, detailSection } from './detail-chart'

function stateChip(state: DeliveryState) {
  return <PaceChip state={state} />
}
export function SandboxDetailPage(props: {
  sandboxId: string
  kind: SandboxEntityKind
  entityId: string
}) {
  const viewer = useInsightViewer()
  // The whole detail tree (including open drawers) belongs to this identity.
  return (
    <DetailContent
      key={`${viewer}:${props.sandboxId}:${props.kind}:${props.entityId}`}
      {...props}
      viewer={viewer}
    />
  )
}
function DetailContent({
  sandboxId,
  kind,
  entityId,
  viewer,
}: {
  sandboxId: string
  kind: SandboxEntityKind
  entityId: string
  viewer: string | null
}) {
  const thirdTab =
    kind === 'client' ? 'outcomes' : kind === 'coach' ? 'coachees' : 'people'
  const [tab, setTab] = useState('overview')
  const [selection, setSelection] = useState<InsightSelection>({
    entity_kind: kind,
    period: 'term',
    group_id: kind === 'group' ? entityId : null,
    subject_member_id: kind === 'client' ? entityId : null,
    coach_user_id: kind === 'coach' ? entityId : null,
  })
  const [urlReady, setUrlReady] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [commitmentId, setCommitmentId] = useState<string | null>(null)
  const [allAttention, setAllAttention] = useState(false)
  const [allLearning, setAllLearning] = useState(false)
  useEffect(() => {
    const read = () => {
      const params = new URLSearchParams(window.location.search)
      const wantedTab = window.location.hash.slice(1) || params.get('tab')
      setTab(
        wantedTab === 'activity' || wantedTab === thirdTab
          ? wantedTab
          : 'overview',
      )
      const period = params.get('period')
      setSelection({
        entity_kind: kind,
        period: period === '30d' || period === '90d' ? period : 'term',
        group_id: kind === 'group' ? entityId : params.get('group_id'),
        subject_member_id:
          kind === 'client'
            ? entityId
            : kind === 'coach'
              ? params.get('subject_member_id')
              : null,
        coach_user_id:
          kind === 'coach'
            ? entityId
            : kind === 'client'
              ? params.get('coach_user_id')
              : null,
      })
      setCommitmentId(params.get('commitment'))
      setUrlReady(true)
    }
    read()
    window.addEventListener('popstate', read)
    window.addEventListener('hashchange', read)
    return () => {
      window.removeEventListener('popstate', read)
      window.removeEventListener('hashchange', read)
    }
  }, [entityId, kind, thirdTab])
  const writeUrl = useCallback(
    (nextTab: string, nextSelection: InsightSelection) => {
      const url = new URL(window.location.href)
      url.hash = ''
      url.searchParams.set('tab', nextTab)
      url.searchParams.set('period', nextSelection.period)
      for (const key of [
        'group_id',
        'subject_member_id',
        'coach_user_id',
      ] as const) {
        const fixed =
          (key === 'group_id' && kind === 'group') ||
          (key === 'subject_member_id' && kind === 'client') ||
          (key === 'coach_user_id' && kind === 'coach')
        if (!fixed && nextSelection[key])
          url.searchParams.set(key, nextSelection[key])
        else url.searchParams.delete(key)
      }
      window.history.replaceState(null, '', url)
    },
    [kind],
  )
  const changeTab = (value: string) => {
    setTab(value)
    writeUrl(value, selection)
  }
  const changeSelection = (patch: Partial<InsightSelection>) => {
    const next = { ...selection, ...patch }
    setSelection(next)
    setSessionId(null)
    setAllLearning(false)
    writeUrl(tab, next)
  }
  const detail = useSandboxEntity(
    sandboxId,
    kind,
    entityId,
    urlReady ? viewer : null,
    selection,
  )
  const data = !detail.isError && viewer ? detail.data : undefined
  const learningAllowed = !!data && data.permissions.can_generate_learning
  const reporting = useSandboxReporting(
    sandboxId,
    urlReady && learningAllowed ? viewer : null,
    selection,
    { analytics: false, learning: learningAllowed },
  )
  if (detail.isError)
    return (
      <div className="mx-auto max-w-xl py-10">
        <Link
          href={`/sandboxes/${sandboxId}`}
          className="text-sm text-ds-accent"
        >
          Back to sandbox
        </Link>
        <h1 className="mt-6 text-2xl font-semibold text-ink">
          This page is unavailable
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-3">
          The link may be incorrect, or this person or group is outside your
          current sandbox access.
        </p>
        <Button
          variant="outline"
          className="mt-5"
          onClick={() => void detail.refetch()}
        >
          Try again
        </Button>
      </div>
    )
  if (!data)
    return (
      <div role="status" className="py-20 text-center text-sm text-ink-3">
        Loading coaching progress…
      </div>
    )
  const current = data.analytics.current_contract
  const coach = kind === 'coach'
  const portfolio = data.portfolio?.current_contract ?? current
  const onTrack = portfolio.coachees_on_track
  const coacheesReached =
    data.analytics.coaches.find(c => c.user_id === entityId)
      ?.coachees_reached ?? data.analytics.metrics.participation.count
  const attention = allAttention ? data.attention : data.attention.slice(0, 3)
  const currentRelationships = data.relationships.filter(r => r.current)
  const formerRelationships = data.relationships.filter(r => !r.current)
  const goLearningDestination = (anchor: string) => {
    if (anchor === 'insights') {
      setAllLearning(true)
      return
    }
    if (anchor === 'outcomes' && kind === 'client') changeTab('outcomes')
    else if (anchor === 'timeline') changeTab('activity')
    else window.location.assign(`/sandboxes/${sandboxId}#${anchor}`)
  }
  return (
    <div
      data-testid="sandbox-entity-detail"
      data-kind={kind}
      data-mode={data.presentation_mode}
      className="min-w-0"
    >
      <Link
        href={`/sandboxes/${sandboxId}`}
        className="mb-6 inline-flex max-w-full items-center gap-2 text-sm text-ink-3 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" />
        <span className="truncate">{data.sandbox_name}</span>
      </Link>
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:gap-8">
        <aside
          className="min-w-0 space-y-5 lg:sticky lg:top-24"
          aria-label="Coaching context"
        >
          <div className="rounded-xl border border-line bg-paper p-5">
            <div className="flex items-center gap-3 lg:block">
              {kind === 'group' ? (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2">
                  <Users className="h-5 w-5 text-ink-3" />
                </span>
              ) : (
                <PersonAvatar name={data.entity.name} size="lg" />
              )}
              <div className="min-w-0 lg:mt-4">
                <h1 className="break-words text-xl font-semibold leading-tight tracking-tight text-ink">
                  {data.entity.name}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-ink-3">
                  {data.entity.subtitle}
                </p>
              </div>
            </div>
            {!data.entity.active && (
              <p className="mt-4 text-xs text-ink-3">
                Former participant. Coaching history remains available.
              </p>
            )}
            <div className="mt-5 border-t border-line pt-4">
              <p className="text-xs text-ink-3">
                {data.my_scope === 'self'
                  ? 'Your coaching and learning'
                  : kind === 'coach'
                    ? 'Coach in this sandbox'
                    : kind === 'group'
                      ? 'Group in this sandbox'
                      : 'Client in this sandbox'}
              </p>
              <Link
                href={`/sandboxes/${sandboxId}#outcomes`}
                className="mt-2 flex items-center justify-between text-sm text-ink-2 hover:text-ds-accent"
              >
                Sandbox outcomes
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              {data.permissions.can_manage_groups && (
                <Link
                  href={`/sandboxes/${sandboxId}#groups`}
                  className="mt-2 flex items-center justify-between text-sm text-ink-2 hover:text-ds-accent"
                >
                  Manage groups
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
          <p className="hidden px-1 text-xs leading-relaxed text-ink-3 lg:block">
            Delivery is recorded activity. Learning describes supported
            patterns. Agreed outcomes record agreement, not achievement.
          </p>
        </aside>
        <div className="min-w-0">
          <Tabs value={tab} onValueChange={changeTab}>
            <TabsList className="mb-5 flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-line bg-transparent p-0 pb-2">
              {['overview', 'activity', thirdTab].map(value => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="shrink-0 rounded-lg px-4 py-2 text-sm data-[state=active]:bg-paper data-[state=active]:text-ink data-[state=active]:shadow-none"
                >
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
            <div
              className="mb-6 flex flex-wrap items-end gap-3"
              aria-label="Reporting filters"
            >
              <label className="min-w-40 flex-1 text-xs text-ink-3 sm:flex-none">
                Reporting period
                <select
                  aria-label="Reporting period"
                  value={selection.period}
                  className={`${detailControl} mt-1`}
                  onChange={e =>
                    changeSelection({
                      period: e.target.value as InsightSelection['period'],
                    })
                  }
                >
                  <option value="term">Contract to date</option>
                  <option value="90d">Last 90 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
              </label>
              {kind !== 'group' &&
                data.analytics.available_groups.length > 0 && (
                  <label className="min-w-36 flex-1 text-xs text-ink-3 sm:flex-none">
                    Group
                    <select
                      aria-label="Group"
                      value={selection.group_id ?? ''}
                      className={`${detailControl} mt-1`}
                      onChange={e =>
                        changeSelection({ group_id: e.target.value || null })
                      }
                    >
                      <option value="">All accessible groups</option>
                      {data.analytics.available_groups.map(g => (
                        <option value={g.group_id} key={g.group_id}>
                          {g.display_name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              {kind === 'client' && data.available_coaches.length > 1 && (
                <label className="min-w-36 flex-1 text-xs text-ink-3 sm:flex-none">
                  Coach
                  <select
                    aria-label="Coach"
                    value={selection.coach_user_id ?? ''}
                    className={`${detailControl} mt-1`}
                    onChange={e =>
                      changeSelection({ coach_user_id: e.target.value || null })
                    }
                  >
                    <option value="">All accessible coaches</option>
                    {data.available_coaches.map(p => (
                      <option key={p.user_id} value={p.user_id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {kind === 'coach' &&
                data.my_scope !== 'self' &&
                data.available_clients.length > 1 && (
                  <label className="min-w-36 flex-1 text-xs text-ink-3 sm:flex-none">
                    Coachee
                    <select
                      aria-label="Coachee"
                      value={selection.subject_member_id ?? ''}
                      className={`${detailControl} mt-1`}
                      onChange={e =>
                        changeSelection({
                          subject_member_id: e.target.value || null,
                        })
                      }
                    >
                      <option value="">All accessible coachees</option>
                      {data.available_clients.map(p => (
                        <option key={p.member_id} value={p.member_id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
            </div>
            <TabsContent value="overview" className="mt-0 space-y-5">
              <div>
                <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink">
                  {data.my_scope === 'self'
                    ? 'Your coaching at a glance'
                    : 'Coaching at a glance'}
                </h2>
                <StatStrip
                  items={
                    coach
                      ? [
                          {
                            label: 'Sessions held',
                            value: data.analytics.metrics.sessions_held,
                            sub: 'Selected period',
                          },
                          {
                            label: 'Coachees reached',
                            value: coacheesReached,
                            sub: 'Recorded participation',
                          },
                          {
                            label: 'Assigned coachees on track',
                            value: `${onTrack.count}/${onTrack.total}`,
                            sub: 'Current agreement',
                          },
                          {
                            label: 'Needs attention',
                            value: new Set(
                              data.attention
                                .filter(x => x.member_id)
                                .map(x => x.member_id),
                            ).size,
                            sub: 'Coachees with recorded signals',
                          },
                        ]
                      : [
                          {
                            label: 'Sessions held',
                            value: data.analytics.metrics.sessions_held,
                            sub: 'Selected period',
                          },
                          {
                            label: 'Hours received',
                            value: fmtHoursShort(
                              data.analytics.metrics.hours_received,
                            ),
                            sub: 'Selected period',
                          },
                          {
                            label:
                              kind === 'client'
                                ? 'Current pace'
                                : 'Coachees on track',
                            value:
                              kind === 'client'
                                ? STATE_LABEL[current.state]
                                : onTrack.total
                                  ? `${onTrack.count}/${onTrack.total}`
                                  : 'Not started',
                            sub: `As of ${fmtDay(current.as_of)}`,
                          },
                          {
                            label: 'Agreed outcomes',
                            value:
                              kind === 'client'
                                ? data.outcomes.coachees
                                    .flatMap(c => c.outcomes)
                                    .filter(o => o.status === 'sealed').length
                                : `${data.analytics.metrics.agreed_outcomes.count}/${data.analytics.metrics.agreed_outcomes.total}`,
                            sub: 'Agreement, not achievement',
                          },
                        ]
                  }
                />
                {kind === 'group' && (
                  <p className="mt-2 text-xs leading-relaxed text-ink-3">
                    A group meeting counts once. One hour with four
                    participating coachees contributes four hours received.
                  </p>
                )}
              </div>
              {!coach && (
                <section className={detailSection}>
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-ink">
                        Current agreement
                      </h2>
                      <p className="mt-1 text-sm text-ink-3">
                        {fmtHoursShort(current.hours_received)} received
                        {current.hours_promised == null
                          ? '; agreed hours unavailable'
                          : ` of ${fmtHoursShort(current.hours_promised)} agreed`}
                        . As of {fmtDay(current.as_of, true)}.
                      </p>
                    </div>
                    {stateChip(current.state)}
                  </div>
                  {current.hours_promised != null && (
                    <ProgressRail
                      value={current.hours_received}
                      max={current.hours_promised}
                      marker={current.expected_hours}
                      markerLabel={
                        current.expected_hours == null
                          ? undefined
                          : `${fmtHoursShort(current.expected_hours)} expected by today`
                      }
                    />
                  )}
                  <p className="mt-3 text-xs text-ink-3">
                    {current.expected_hours == null
                      ? 'Expected delivery is unavailable until the agreement is measurable.'
                      : `${fmtHoursShort(current.expected_hours)} expected by today. The marker shows the current expectation.`}
                  </p>
                </section>
              )}
              <DetailChart data={data.analytics} coach={coach} />
              <section className={detailSection}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-ink">
                    Needs attention
                  </h2>
                  {data.attention.length > 3 && (
                    <button
                      className="text-xs font-medium text-ds-accent"
                      onClick={() => setAllAttention(!allAttention)}
                    >
                      {allAttention
                        ? 'Show less'
                        : `View all ${data.attention.length}`}
                    </button>
                  )}
                </div>
                {!attention.length ? (
                  <p className="mt-3 text-sm text-ink-3">
                    No delivery or agreement items need attention in this view.
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-line">
                    {attention.map(item => (
                      <li className="flex items-start gap-3 py-3" key={item.id}>
                        <Flag
                          className={`mt-0.5 h-4 w-4 shrink-0 ${item.severity === 'urgent' ? 'text-vermillion' : item.severity === 'warn' ? 'text-amber-token' : 'text-ink-3'}`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink">
                            {item.headline}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-ink-3">
                            {item.detail}
                          </p>
                          {item.commitment_id ? (
                            <button
                              className="mt-2 text-xs font-medium text-ds-accent"
                              onClick={() =>
                                setCommitmentId(item.commitment_id!)
                              }
                            >
                              View follow-up
                            </button>
                          ) : (
                            item.href && (
                              <Link
                                className="mt-2 inline-block text-xs font-medium text-ds-accent"
                                href={item.href}
                              >
                                View details
                              </Link>
                            )
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              {(data.permissions.can_raise_concern ||
                data.permissions.can_manage_concerns) && (
                <SessionAttribution
                  sandboxId={sandboxId}
                  memberId={selection.subject_member_id ?? undefined}
                  groupId={selection.group_id ?? undefined}
                  coachId={selection.coach_user_id ?? undefined}
                />
              )}
              {learningAllowed ? (
                <LearningPanel
                  reporting={reporting}
                  preview={!allLearning}
                  onNavigate={goLearningDestination}
                />
              ) : kind === 'client' && data.my_scope !== 'self' ? (
                <section className={detailSection}>
                  <h2 className="text-lg font-semibold text-ink">
                    Learning in this sandbox
                  </h2>
                  <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-3">
                    Shared group insights describe recurring themes across
                    participants. They are separate from this person’s delivery
                    and agreed outcomes.
                  </p>
                  <Link
                    className="mt-3 inline-block text-sm font-medium text-ds-accent"
                    href={`/sandboxes/${sandboxId}#insights`}
                  >
                    View shared sandbox insights
                  </Link>
                </section>
              ) : null}
              {currentRelationships.length > 0 && (
                <RelationshipList
                  data={data}
                  rows={
                    kind === 'client'
                      ? currentRelationships
                      : currentRelationships.slice(0, 5)
                  }
                  onViewAll={
                    kind !== 'client' && currentRelationships.length > 5
                      ? () => changeTab(thirdTab)
                      : undefined
                  }
                  total={currentRelationships.length}
                  title={
                    coach
                      ? 'Assigned coaching relationships'
                      : 'Current coaching relationships'
                  }
                />
              )}
              {formerRelationships.length > 0 && (
                <RelationshipList
                  data={data}
                  rows={formerRelationships}
                  title="Previous coaching relationships"
                  former
                />
              )}
              {(data.permissions.can_raise_concern ||
                data.permissions.can_manage_concerns) && (
                <ConcernsPanel
                  sandboxId={sandboxId}
                  kind={kind}
                  entityId={entityId}
                  viewer={viewer}
                />
              )}
              <FeedbackPanel
                sandboxId={sandboxId}
                viewer={viewer}
                selection={selection}
                enabled={!!data.permissions.can_read_feedback}
                onSession={setSessionId}
              />
              <section className={detailSection}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-ink">
                    Recent activity
                  </h2>
                  <button
                    className="text-xs font-medium text-ds-accent"
                    onClick={() => changeTab('activity')}
                  >
                    View activity
                  </button>
                </div>
                <ActivityRows
                  items={data.activity.items.slice(0, 4)}
                  onSession={setSessionId}
                  onCommitment={setCommitmentId}
                />
              </section>
              <section
                className="px-1 text-xs leading-relaxed text-ink-3"
                aria-label="Data coverage"
              >
                <h2 className="font-medium text-ink-2">About this view</h2>
                <p className="mt-1">
                  {data.analytics.coverage.sessions_with_learning_evidence} of{' '}
                  {data.analytics.coverage.sessions_held} completed sessions
                  have usable learning evidence.{' '}
                  {data.analytics.coverage.sessions_with_estimated_duration}{' '}
                  session durations use the planned length.
                </p>
                <p className="mt-1 max-w-prose">
                  {data.analytics.coverage.learning_note}
                </p>
                <details className="mt-2">
                  <summary className="cursor-pointer underline underline-offset-4">
                    Metric definitions
                  </summary>
                  <dl className="mt-3 space-y-3">
                    {Object.entries(data.analytics.definitions).map(
                      ([key, value]) => (
                        <div key={key}>
                          <dt className="font-medium text-ink-2">
                            {key.replaceAll('_', ' ')}
                          </dt>
                          <dd className="mt-1 max-w-prose">{value}</dd>
                        </div>
                      ),
                    )}
                  </dl>
                </details>
              </section>
            </TabsContent>
            <TabsContent value="activity">
              <ActivityPanel
                sandboxId={sandboxId}
                viewer={viewer}
                selection={selection}
                milestones={data.milestones}
                onSession={setSessionId}
                onCommitment={setCommitmentId}
              />
            </TabsContent>
            <TabsContent value={thirdTab}>
              {kind === 'client' ? (
                <section className={detailSection}>
                  <h2 className="text-lg font-semibold text-ink">
                    Agreed outcomes
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-ink-3">
                    What coaching is intended to support, and how it will be
                    discussed. Agreement and related learning do not establish
                    achievement.
                  </p>
                  {!data.outcomes.coachees.length && (
                    <p className="mt-5 text-sm text-ink-3">
                      No outcomes are available in this view.
                    </p>
                  )}
                  {data.outcomes.coachees.map(coachee => (
                    <OutcomeList
                      key={coachee.member_id}
                      className="mt-5"
                      sandboxId={sandboxId}
                      coachee={coachee}
                      canReopen={data.outcomes.can_reopen}
                      maxPerCoachee={data.outcomes.max_per_coachee}
                    />
                  ))}
                </section>
              ) : (
                <PeoplePanel data={data} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <SessionDetailDrawer
        sandboxId={sandboxId}
        sessionId={sessionId}
        viewer={viewer}
        selection={selection}
        onClose={() => setSessionId(null)}
      />
      <CommitmentDetailPanel
        commitmentId={commitmentId}
        onClose={() => setCommitmentId(null)}
        clientMode={data.my_scope === 'self'}
      />
    </div>
  )
}
function RelationshipList({
  data,
  rows,
  title,
  former = false,
  onViewAll,
  total,
}: {
  data: SandboxEntityDetail
  rows: SandboxRelationship[]
  title: string
  former?: boolean
  onViewAll?: () => void
  total?: number
}) {
  return (
    <section className={detailSection}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {onViewAll && (
          <button
            className="text-xs font-medium text-ds-accent"
            onClick={onViewAll}
          >
            View all {total} relationships
          </button>
        )}
      </div>
      {former && (
        <p className="mt-1 text-sm text-ink-3">
          Delivery at the end of each assignment. These agreements are separate
          from current pace.
        </p>
      )}
      <ul className="mt-3 divide-y divide-line">
        {rows.map((row, i) => (
          <li
            key={`${row.member_id}:${row.group_id}:${row.starts_on}:${i}`}
            className="py-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={sandboxEntityHref(
                    data.sandbox_id,
                    data.entity.kind === 'client' ? 'group' : 'client',
                    data.entity.kind === 'client'
                      ? row.group_id
                      : row.member_id,
                  )}
                  className="text-sm font-medium text-ink hover:text-ds-accent hover:underline"
                >
                  {data.entity.kind === 'client' ? row.group_name : row.name}
                </Link>
                <p className="mt-1 text-xs text-ink-3">
                  {data.entity.kind !== 'client' && (
                    <Link
                      href={sandboxEntityHref(
                        data.sandbox_id,
                        'group',
                        row.group_id,
                      )}
                      className="hover:underline"
                    >
                      {row.group_name}.{' '}
                    </Link>
                  )}
                  {row.coach_names.map((name, index) => (
                    <span key={row.coach_ids[index] ?? name}>
                      {index > 0 && ', '}
                      <Link
                        className="hover:underline"
                        href={sandboxEntityHref(
                          data.sandbox_id,
                          'coach',
                          row.coach_ids[index],
                        )}
                      >
                        {name}
                      </Link>
                    </span>
                  ))}
                </p>
              </div>
              {former ? (
                <span className="text-xs text-ink-3">Ended assignment</span>
              ) : (
                stateChip(row.state)
              )}
            </div>
            <div className="mt-3 flex flex-wrap justify-between gap-x-6 gap-y-2 text-xs text-ink-3">
              <span>
                <strong className="font-medium text-ink-2">
                  {fmtHoursShort(row.hours_received)}
                </strong>
                {row.hours_promised == null
                  ? ' received; agreement unavailable'
                  : ` of ${fmtHoursShort(row.hours_promised)} agreed`}
              </span>
              <span>
                {fmtDay(row.starts_on)} – {fmtDay(row.ends_on)}
              </span>
            </div>
            <p className="mt-2 text-xs text-ink-3">
              Last session:{' '}
              {row.last_activity_on
                ? fmtDay(row.last_activity_on)
                : 'None recorded'}
              {!former &&
                `. Next: ${row.next_activity_on ? fmtDay(row.next_activity_on) : 'None scheduled'}`}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
function PeoplePanel({ data }: { data: SandboxEntityDetail }) {
  const kinds =
    data.entity.kind === 'coach'
      ? ['coachee']
      : ['coach', 'coachee', 'supervisor']
  return (
    <div className="space-y-5">
      {kinds.map(kind => {
        const people = data.people.filter(p => p.kind === kind)
        return (
          <section key={kind} className={detailSection}>
            <h2 className="text-lg font-semibold text-ink">
              {kind === 'coachee'
                ? 'Coachees'
                : kind === 'coach'
                  ? 'Coaches'
                  : 'Supervisors'}
            </h2>
            {!people.length ? (
              <p className="mt-4 text-sm text-ink-3">
                No {kind === 'coachee' ? 'coachees' : `${kind}s`} visible in
                this selection.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {people.map(person => {
                  const relationships = data.relationships.filter(
                    r => r.member_id === person.member_id && r.current,
                  )
                  return (
                    <li
                      key={`${person.kind}:${person.user_id}`}
                      className="flex items-start gap-3 py-4"
                    >
                      <PersonAvatar name={person.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        {person.href ? (
                          <Link
                            href={person.href}
                            className="text-sm font-medium text-ink hover:text-ds-accent hover:underline"
                          >
                            {person.name}
                          </Link>
                        ) : (
                          <span className="text-sm font-medium text-ink">
                            {person.name}
                          </span>
                        )}
                        <p className="mt-1 text-xs text-ink-3">
                          {!person.active
                            ? 'Former participant'
                            : relationships.map(r => r.group_name).join(', ') ||
                              'Current participant'}
                        </p>
                        {relationships.map((r, i) => (
                          <div
                            key={`${r.group_id}:${i}`}
                            className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-3"
                          >
                            {stateChip(r.state)}
                            <span>
                              {fmtHoursShort(r.hours_received)} received
                              {r.hours_promised == null
                                ? ''
                                : ` of ${fmtHoursShort(r.hours_promised)}`}
                            </span>
                            <span>
                              Last:{' '}
                              {r.last_activity_on
                                ? fmtDay(r.last_activity_on)
                                : 'None recorded'}
                              . Next:{' '}
                              {r.next_activity_on
                                ? fmtDay(r.next_activity_on)
                                : 'None scheduled'}
                              .
                            </span>
                          </div>
                        ))}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
