'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Eye } from 'lucide-react'
import { CommitmentDetailPanel } from '@/components/commitments/commitment-detail-panel'
import { OutcomesSummary } from '@/components/sandboxes/outcomes/outcomes-panel'
import {
  replaceParams,
  scrollToSection,
  useCloseCommitment,
  useSandboxLanding,
  writeSelection,
} from '@/components/sandboxes/use-sandbox-landing'
import { cn } from '@/lib/utils'
import type { InsightSelection } from '@/types/sandbox-analytics'
import type { SandboxOverview } from '@/types/sandbox'
import { AccountTeam } from './account-team'
import { headline } from './client-view-copy'
import { CoachesStrip } from './coaches-strip'
import { ComingUp } from './coming-up'
import { GroupsTable } from './groups-table'
import { Headline } from './headline'
import { LearningHighlights } from './learning-highlights'
import { MilestonesList } from './milestones-list'
import { NeedsYou } from './needs-you'
import { OutcomesBoard } from './outcomes-board'
import { PeopleRoster } from './people-roster'
import { ProgressSection } from './progress-section'
import { Scorecards } from './scorecards'
import { Panel, Section } from './section'
import { StatusHero } from './status-hero'
import { TermRibbon } from './term-ribbon'
import { UpdatesFeed } from './updates-feed'
import { useClientView } from './use-client-view'
import { WatchList } from './watch-list'

/**
 * Where a link lands on this page.
 *
 * Notifications and dashboard rows were written against the cockpit's
 * sections, so every anchor and `?tab=` it can carry has to arrive somewhere
 * sensible here too: `#commitments` means "what needs me", `#delivery` means
 * the groups, `#invitations` means the people to ask.
 */
const SECTION_FOR_LINK: Record<string, string> = {
  commitments: 'needs',
  today: 'needs',
  outcomes: 'outcomes',
  timeline: 'timeline',
  delivery: 'groups',
  groups: 'groups',
  insights: 'insights',
  team: 'team',
  invitations: 'team',
  vision: 'vision',
  general: 'vision',
  people: 'people',
  learning: 'learning',
  watch: 'watch',
  settings: 'vision',
}

const NAV = [
  { id: 'vision', label: 'Overview' },
  { id: 'needs', label: 'Needs you' },
  { id: 'insights', label: 'Progress' },
  { id: 'groups', label: 'Groups' },
  { id: 'people', label: 'People' },
  { id: 'outcomes', label: 'Outcomes' },
  { id: 'learning', label: 'Learning' },
]

export interface ClientViewPreview {
  from: 'admin' | 'member'
}

/**
 * The sandbox as its sponsor reads it: where delivery stands, who is being
 * coached and how they are doing, what is agreed, what is coming, and the one
 * short list of things that need this person.
 *
 * Supervisors get the same page scoped to their groups — the API decides what
 * comes back, and the wording follows `my_scope` rather than second-guessing
 * it here.
 */
export function ClientView({
  overview,
  preview,
}: {
  overview: SandboxOverview
  preview?: ClientViewPreview
}) {
  const sandboxId = overview.sandbox.id
  const [selection, setSelection] = useState<InsightSelection>({
    period: 'term',
    group_id: null,
  })
  const [openCommitmentId, setOpenCommitmentId] = useState<string | null>(null)
  const closeCommitment = useCloseCommitment(setOpenCommitmentId)

  const {
    model,
    term,
    selected,
    sessionsLast30,
    loading,
    moreUpdates,
    loadingMore,
    fetchMoreUpdates,
  } = useClientView(overview, selection, { preview: !!preview })

  /** Where the link that opened this page was pointing, until we get there. */
  const landing = useRef<string | null>(null)

  useSandboxLanding(sandboxId, url => {
    setSelection(url.selection)
    if (url.commitment) setOpenCommitmentId(url.commitment)
    const target =
      SECTION_FOR_LINK[url.hash] ??
      SECTION_FOR_LINK[url.tab ?? ''] ??
      (url.hash || null)
    if (!target) return
    landing.current = target
    scrollToSection(target)
  })

  /**
   * The page keeps growing while its reads arrive — the chart, the roster and
   * the board all have a real height only once they have their data — which
   * moves whatever the link was pointing at out from under the scroll. So land
   * once more when the last of them is in, unless we are already there.
   */
  useEffect(() => {
    const target = landing.current
    if (loading || !target) return
    landing.current = null
    const box = document.getElementById(target)?.getBoundingClientRect()
    if (!box || (box.top < window.innerHeight && box.bottom > 0)) return
    scrollToSection(target)
  }, [loading])

  const onSelection = useCallback((next: InsightSelection) => {
    setSelection(next)
    writeSelection(next)
  }, [])

  /** An attention row or a suggestion naming a cockpit section lands here. */
  const goToSection = useCallback((anchor: string) => {
    const target = SECTION_FOR_LINK[anchor] ?? anchor
    replaceParams(url => {
      url.searchParams.delete('tab')
      url.hash = target
    })
    scrollToSection(target)
  }, [])

  const contract = term.analytics?.current_contract ?? null
  const metrics = term.analytics?.metrics ?? null
  const weeks = term.analytics?.weekly_series ?? []
  const started = model.life.kind !== 'upcoming'
  const scopeLine =
    model.scope === 'groups'
      ? `Your groups: ${model.groups.map(g => g.displayName).join(', ') || 'none yet'}`
      : `${overview.sandbox.term_months}-month programme`

  const sentences = headline({
    life: model.life,
    contract: started ? contract : null,
    metrics: started ? metrics : null,
    needs: model.needs.length,
    nextEvent: model.nextEvent,
    people: model.people.length,
    groups: model.groups.length,
    termStart: overview.sandbox.term_start,
  })

  return (
    <div
      className="space-y-6"
      data-testid="client-view"
      data-scope={model.scope}
    >
      {preview && (
        <div
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-indigo/30 bg-indigo-bg px-4 py-2.5"
          data-testid="client-preview-banner"
        >
          <p className="flex items-center gap-2 text-sm text-indigo">
            <Eye className="h-4 w-4 shrink-0" aria-hidden />
            Client layout · shown with your access · actions and commitments
            hidden
          </p>
          {/* Leaving the preview drops a query parameter on the route we are
              already on, so it has to be a real navigation — a client-side
              push would keep this page mounted, still in preview. */}
          <a
            href={
              preview.from === 'admin'
                ? `/admin/sandboxes/${sandboxId}`
                : `/sandboxes/${sandboxId}`
            }
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo underline underline-offset-4"
            data-testid="client-preview-back"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to your view
          </a>
        </div>
      )}

      {/* One row of anchors: the page is long, and a sponsor arrives looking
          for one of seven things. */}
      <nav
        className="sticky top-16 z-30 -mx-4 flex items-center gap-1 overflow-x-auto border-b border-line bg-paper/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        aria-label="Sections"
        data-testid="client-nav"
      >
        {NAV.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => goToSection(item.id)}
            data-testid={`client-nav-${item.id}`}
            className={cn(
              'flex-none rounded-lg px-2.5 py-1 text-sm text-ink-3 transition-colors',
              'hover:bg-surface-2 hover:text-ink',
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <StatusHero model={model} contract={contract} scopeLine={scopeLine} />

      {model.milestones.length > 0 && (
        <div className="hidden md:block">
          <TermRibbon
            termStart={overview.sandbox.term_start}
            termEnd={overview.sandbox.term_end}
            today={overview.today}
            events={model.milestones}
            weeks={weeks}
          />
        </div>
      )}

      <Headline sentences={sentences} />

      <Scorecards
        model={model}
        contract={started ? contract : null}
        metrics={started ? metrics : null}
        sessionsLast30={sessionsLast30}
        weeks={weeks}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0 space-y-6">
          <Section id="needs" title="Needs you">
            <NeedsYou
              model={model}
              sandboxId={sandboxId}
              onOpenCommitment={setOpenCommitmentId}
            />
          </Section>

          {started && (
            <ProgressSection
              reporting={selected}
              selection={selection}
              onSelection={onSelection}
            />
          )}

          <Section
            id="groups"
            title="Groups"
            sub={model.scope === 'groups' ? 'your groups' : undefined}
          >
            <GroupsTable
              groups={model.groups}
              sandboxId={sandboxId}
              today={model.today}
            />
          </Section>

          <Section id="people" title="People">
            <PeopleRoster
              people={model.people}
              groups={model.groups}
              sandboxId={sandboxId}
            />
          </Section>

          <Section
            id="outcomes"
            title="Outcomes"
            sub={<OutcomesSummary totals={model.outcomeTotals} />}
          >
            <OutcomesBoard
              model={model}
              sandboxId={sandboxId}
              loading={loading}
            />
          </Section>

          <LearningHighlights
            reporting={term}
            allowGenerate={!preview}
            onNavigate={goToSection}
          />
        </main>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-28">
          <Panel id="watch" title="Watch list" bodyClassName="px-4 py-3">
            <WatchList model={model} limit={6} onSelect={goToSection} />
          </Panel>
          <Panel id="coming" title="Coming up">
            <ComingUp model={model} />
          </Panel>
          <Panel id="timeline" title="Milestones">
            <MilestonesList events={model.milestones} today={model.today} />
          </Panel>
          <Panel id="updates" title="Latest updates">
            <UpdatesFeed
              model={model}
              more={moreUpdates}
              loadingMore={loadingMore}
              onMore={fetchMoreUpdates}
            />
          </Panel>
          <Panel id="coaches" title="Coaches">
            <CoachesStrip coaches={model.coaches} />
          </Panel>
          <Panel id="team" title="Your account team">
            <AccountTeam team={model.team} />
          </Panel>
        </aside>
      </div>

      <CommitmentDetailPanel
        commitmentId={openCommitmentId}
        onClose={closeCommitment}
        onNavigate={setOpenCommitmentId}
      />
    </div>
  )
}
