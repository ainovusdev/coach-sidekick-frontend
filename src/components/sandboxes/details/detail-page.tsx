'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { HelpCircle } from 'lucide-react'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { StatStrip, type StatItem } from '@/components/ui/stat-strip'
import { CommitmentDetailPanel } from '@/components/commitments/commitment-detail-panel'
import { OutcomeList } from '@/components/sandboxes/outcomes/outcome-list'
import { LearningPanel } from '@/components/sandboxes/insights/learning-panel'
import { SandboxTabBar } from '@/components/sandboxes/sandbox-tab-bar'
import { Empty, Section } from '@/components/sandboxes/section'
import { SessionAttribution } from '@/components/sandboxes/session-attribution'
import {
  useInsightViewer,
  useSandboxReporting,
} from '@/hooks/queries/use-sandbox-insights'
import { useSandboxEntity } from '@/hooks/queries/use-sandbox-details'
import { fmtHoursShort } from '@/lib/sandbox/delivery'
import {
  hoursGap,
  lastSessionOn,
  nextSessionOn,
  nothingBooked,
  outcomeCounts,
  outcomeSentence,
  outcomeSubjects,
} from '@/lib/sandbox/detail-view'
import { fmtDay, pluralise } from '@/lib/sandbox/format'
import type { InsightSelection } from '@/types/sandbox-analytics'
import type {
  SandboxEntityDetail,
  SandboxEntityKind,
} from '@/types/sandbox-details'
import {
  ActivityPanel,
  ActivityRows,
  SessionDetailDrawer,
} from './activity-panel'
import { CoacheeTable } from './coachee-table'
import { ConcernsPanel } from './concerns-panel'
import { DetailChart } from './detail-chart'
import { DetailHero } from './detail-hero'
import {
  AttentionPanel,
  AttentionSummary,
  CoachingPanel,
  ComingUpPanel,
} from './detail-rail'
import { FeedbackPanel } from './feedback-panel'
import { RhythmSection } from './rhythm-section'
import { PeoplePanel } from './people-panel'

// These pages live on the member routes, under the app header: the same
// offsets the cockpit reads from its view there.
const STICKY_TOP = 'top-16'
const BLEED = '-mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8'
const SECTION_OFFSET = '8.5rem'

const filterControl =
  'h-8 max-w-[14rem] rounded-lg border border-line bg-paper px-2.5 text-xs text-ink focus-visible:outline-2 focus-visible:outline-ds-accent'

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
  const coach = kind === 'coach'
  const contract = (data.portfolio ?? data.analytics).current_contract
  const onTrack = contract.coachees_on_track
  const coacheesReached =
    data.analytics.coaches.find(c => c.user_id === entityId)
      ?.coachees_reached ?? data.analytics.metrics.participation.count
  const tabs = ['overview', 'activity', thirdTab] as const
  const outcomes = outcomeCounts(data.outcomes, outcomeSubjects(data))
  const gap = hoursGap(data.analytics.current_contract)
  const unbooked = nothingBooked(data.relationships)
  const next = nextSessionOn(data.relationships)
  const last = lastSessionOn(data.relationships)
  const estimated = data.analytics.coverage.sessions_with_estimated_duration
  const goLearningDestination = (anchor: string) => {
    if (anchor === 'insights') {
      setAllLearning(true)
      return
    }
    if (anchor === 'outcomes' && kind === 'client') changeTab('outcomes')
    else if (anchor === 'timeline') changeTab('activity')
    else window.location.assign(`/sandboxes/${sandboxId}#${anchor}`)
  }

  const sessionsItem: StatItem = {
    label: 'Sessions held',
    value: data.analytics.metrics.sessions_held,
    sub: last ? `Last ${fmtDay(last)}` : 'None recorded yet',
  }
  const outcomesItem: StatItem = {
    label: 'Outcomes agreed',
    value: outcomes.total ? `${outcomes.agreed} of ${outcomes.total}` : '—',
    sub: outcomes.total
      ? 'Agreement, not achievement'
      : // The API says when outcomes are withheld rather than empty.
        data.stats && data.stats.outcomes === null
        ? 'Not available to you'
        : 'None proposed yet',
  }
  const stats: StatItem[] = coach
    ? [
        sessionsItem,
        {
          label: 'Coachees reached',
          value: coacheesReached,
          sub: 'Recorded participation',
        },
        {
          label: 'Assigned coachees on track',
          value: onTrack.total ? `${onTrack.count}/${onTrack.total}` : '—',
          sub: onTrack.total ? 'Current agreement' : 'Not measurable yet',
        },
        {
          label: 'Nothing booked',
          value: unbooked.length,
          tone: unbooked.length ? 'warning' : 'default',
          sub: 'No next session',
        },
      ]
    : kind === 'group'
      ? [
          sessionsItem,
          {
            label: 'Hours received',
            value: fmtHoursShort(data.analytics.metrics.hours_received),
            sub: estimated
              ? `${pluralise(estimated, 'duration')} estimated`
              : 'Selected period',
          },
          {
            label: 'Coachees on track',
            value: onTrack.total ? `${onTrack.count} of ${onTrack.total}` : '—',
            sub: contract.coachees_unmeasurable
              ? `${contract.coachees_unmeasurable} not measurable yet`
              : `As of ${fmtDay(contract.as_of)}`,
          },
          {
            label: 'Nothing booked',
            value: unbooked.length,
            tone: unbooked.length ? 'warning' : 'default',
            sub: 'No next session',
          },
          outcomesItem,
        ]
      : [
          sessionsItem,
          {
            label: 'Hours received',
            value: fmtHoursShort(data.analytics.metrics.hours_received),
            sub: estimated
              ? `${pluralise(estimated, 'duration')} estimated`
              : 'Selected period',
          },
          {
            label: 'Hours against plan',
            value: gap ? gap.text : '—',
            tone: gap?.tone ?? 'muted',
            sub: gap
              ? `Hours, as of ${fmtDay(contract.as_of)}`
              : 'Not measurable yet',
          },
          {
            label: 'Next session',
            value: next ? fmtDay(next) : 'None booked',
            tone: next || !unbooked.length ? 'default' : ('warning' as const),
            sub: next ? 'On the calendar' : 'Nothing on the calendar',
          },
          outcomesItem,
        ]

  const filters = (
    <>
      <select
        aria-label="Reporting period"
        value={selection.period}
        className={filterControl}
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
      {kind !== 'group' && data.analytics.available_groups.length > 0 && (
        <select
          aria-label="Group"
          value={selection.group_id ?? ''}
          className={filterControl}
          onChange={e => changeSelection({ group_id: e.target.value || null })}
        >
          <option value="">All groups</option>
          {data.analytics.available_groups.map(g => (
            <option value={g.group_id} key={g.group_id}>
              {g.display_name}
            </option>
          ))}
        </select>
      )}
      {kind === 'client' && data.available_coaches.length > 1 && (
        <select
          aria-label="Coach"
          value={selection.coach_user_id ?? ''}
          className={filterControl}
          onChange={e =>
            changeSelection({ coach_user_id: e.target.value || null })
          }
        >
          <option value="">All coaches</option>
          {data.available_coaches.map(p => (
            <option key={p.user_id} value={p.user_id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
      {kind === 'coach' &&
        data.my_scope !== 'self' &&
        data.available_clients.length > 1 && (
          <select
            aria-label="Coachee"
            value={selection.subject_member_id ?? ''}
            className={filterControl}
            onChange={e =>
              changeSelection({ subject_member_id: e.target.value || null })
            }
          >
            <option value="">All coachees</option>
            {data.available_clients.map(p => (
              <option key={p.member_id} value={p.member_id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
    </>
  )

  const rail = (
    <aside
      className="space-y-4 xl:sticky xl:top-(--section-offset) xl:self-start"
      aria-label="Coaching context"
    >
      <AttentionPanel
        items={data.attention}
        onCommitment={setCommitmentId}
        className="hidden xl:block"
      />
      <CoachingPanel
        data={data}
        max={kind === 'client' ? undefined : 5}
        onViewAll={() => changeTab(thirdTab)}
      />
      <ComingUpPanel data={data} />
    </aside>
  )

  return (
    <div
      data-testid="sandbox-entity-detail"
      data-kind={kind}
      data-mode={data.presentation_mode}
      className="min-w-0 space-y-5"
      style={{ '--section-offset': SECTION_OFFSET } as CSSProperties}
    >
      <DetailHero
        data={data}
        filters={filters}
        help={<HowCounted data={data} />}
      />
      <Tabs value={tab} onValueChange={changeTab} className="gap-4">
        <SandboxTabBar
          tabs={tabs}
          label={t => t.charAt(0).toUpperCase() + t.slice(1)}
          stickyTopClass={STICKY_TOP}
          bleedClass={BLEED}
          testId="detail-tabs"
        />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <TabsContent value="overview" className="mt-0 space-y-5">
              <div>
                <h2 className="sr-only">
                  {data.my_scope === 'self'
                    ? 'Your coaching at a glance'
                    : 'Coaching at a glance'}
                </h2>
                <StatStrip
                  items={stats}
                  // Five numbers two-up leave a hole; the last one takes the row.
                  className="max-sm:[&>*:last-child:nth-child(odd)]:col-span-2"
                />
                {kind === 'group' && (
                  <p className="mt-2 px-1 text-xs leading-relaxed text-ink-3">
                    A group meeting counts once. One hour with four
                    participating coachees contributes four hours received.
                  </p>
                )}
              </div>
              <AttentionSummary
                items={data.attention}
                onCommitment={setCommitmentId}
              />
              {kind !== 'client' && <CoacheeTable data={data} />}
              <DetailChart data={data.analytics} coach={coach} />
              <RhythmSection data={data} />
              {kind === 'client' && (
                <Section
                  id="outcomes-summary"
                  title="Outcomes"
                  sub={outcomeSentence(outcomes)}
                  testId="detail-outcomes-summary"
                  aside={
                    <button
                      type="button"
                      className="text-xs font-medium text-ds-accent"
                      onClick={() => changeTab('outcomes')}
                    >
                      Open outcomes
                    </button>
                  }
                >
                  {outcomes.total === 0 ? (
                    <Empty>
                      No outcomes yet. Coach and coachee draft one or two, then
                      the approver agrees them.
                    </Empty>
                  ) : outcomes.waitingForYou.length > 0 ? (
                    <ul className="divide-y divide-line">
                      {outcomes.waitingForYou.map(row => (
                        <li
                          key={row.outcome.id}
                          className="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0"
                        >
                          <span className="min-w-0 truncate text-sm text-ink">
                            {row.outcome.title}
                          </span>
                          <span className="flex-none text-xs font-medium text-amber-token">
                            Waiting for you
                            {row.days != null &&
                              row.days > 0 &&
                              ` · ${pluralise(row.days, 'day')}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-ink-3">
                      Agreed outcomes record what coaching is meant to support —
                      agreement, not achievement.
                    </p>
                  )}
                </Section>
              )}
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
                <Section
                  id="learning"
                  title="Learning in this sandbox"
                  testId="detail-learning-note"
                >
                  <p className="max-w-prose text-sm leading-relaxed text-ink-3">
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
                </Section>
              ) : null}
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
              <Section
                id="recent"
                title="Recent activity"
                testId="detail-recent"
                aside={
                  <button
                    type="button"
                    className="text-xs font-medium text-ds-accent"
                    onClick={() => changeTab('activity')}
                  >
                    View activity
                  </button>
                }
              >
                <ActivityRows
                  items={data.activity.items.slice(0, 4)}
                  onSession={setSessionId}
                  onCommitment={setCommitmentId}
                />
              </Section>
            </TabsContent>
            <TabsContent value="activity" className="mt-0">
              <ActivityPanel
                sandboxId={sandboxId}
                viewer={viewer}
                selection={selection}
                milestones={data.milestones}
                onSession={setSessionId}
                onCommitment={setCommitmentId}
              />
            </TabsContent>
            <TabsContent value={thirdTab} className="mt-0">
              {kind === 'client' ? (
                <Section
                  id="outcomes"
                  title="Agreed outcomes"
                  testId="detail-outcomes"
                  note="What coaching is intended to support, and how it will be discussed. Agreement and related learning do not establish achievement."
                >
                  {!data.outcomes.coachees.length && (
                    <Empty>No outcomes are available in this view.</Empty>
                  )}
                  {data.outcomes.coachees.map((coachee, i) => (
                    <OutcomeList
                      key={coachee.member_id}
                      className={i > 0 ? 'mt-5' : undefined}
                      sandboxId={sandboxId}
                      coachee={coachee}
                      canReopen={data.outcomes.can_reopen}
                      maxPerCoachee={data.outcomes.max_per_coachee}
                    />
                  ))}
                </Section>
              ) : (
                <PeoplePanel data={data} />
              )}
            </TabsContent>
          </div>
          {rail}
        </div>
      </Tabs>
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

/** How the numbers are counted — one small popover instead of a grey footer. */
function HowCounted({ data }: { data: SandboxEntityDetail }) {
  const { coverage, definitions } = data.analytics
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-ink-3 hover:text-ink"
          data-testid="detail-how-counted"
        >
          <HelpCircle className="h-3.5 w-3.5" aria-hidden />
          How these are counted
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-[70vh] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto text-xs leading-relaxed text-ink-3"
      >
        <p>
          Delivery is recorded activity. Learning describes supported patterns.
          Agreed outcomes record agreement, not achievement.
        </p>
        <p className="mt-2">
          {coverage.sessions_with_learning_evidence} of {coverage.sessions_held}{' '}
          completed sessions have usable learning evidence.{' '}
          {coverage.sessions_with_estimated_duration} session durations use the
          planned length.
        </p>
        {coverage.learning_note && (
          <p className="mt-2">{coverage.learning_note}</p>
        )}
        <dl className="mt-3 space-y-2.5 border-t border-line pt-3">
          {Object.entries(definitions).map(([key, value]) => (
            <div key={key}>
              <dt className="font-medium capitalize text-ink-2">
                {key.replaceAll('_', ' ')}
              </dt>
              <dd className="mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>
      </PopoverContent>
    </Popover>
  )
}
