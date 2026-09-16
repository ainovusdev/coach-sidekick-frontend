'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { useRouter } from 'next/navigation'
import { CommitmentDetailPanel } from '@/components/commitments/commitment-detail-panel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LinksCard } from '@/components/sandboxes/rail/links-card'
import {
  SetupCard,
  type SetupTarget,
} from '@/components/sandboxes/rail/setup-card'
import { OutcomesPanel } from '@/components/sandboxes/outcomes/outcomes-panel'
import { SandboxHero } from '@/components/sandboxes/sandbox-hero'
import { SettingsPanel } from '@/components/sandboxes/settings-panel'
import { PeopleTab } from '@/components/sandboxes/tabs/people-tab'
import { TodayTab } from '@/components/sandboxes/tabs/today-tab'
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
import {
  DEFAULT_TAB,
  TAB_FOR_ANCHOR,
  TAB_LABEL,
  tabsFor,
  toSandboxTab,
  type SandboxTab,
} from '@/components/sandboxes/sandbox-tabs'
import {
  replaceParams,
  scrollToSection,
  useCloseCommitment,
  useSandboxLanding,
  writeSelection,
} from '@/components/sandboxes/use-sandbox-landing'
import {
  useInsightViewer,
  useSandboxReporting,
} from '@/hooks/queries/use-sandbox-insights'
import type { InsightSelection } from '@/types/sandbox-analytics'
import { InsightsPanel } from './insights/insights-panel'
import { cn } from '@/lib/utils'
import type { SandboxOverview } from '@/types/sandbox'

/**
 * The page our own side works from: a hero, five tabs, and a rail of things
 * you want beside you whichever tab is open.
 *
 * The shell owns three things and nothing else — which tab is showing, what the
 * reporting is filtered to, and which commitment is open. Every dialog, drawer
 * and mutation belongs to the tab that uses it.
 */
export function SandboxCockpit({ overview }: { overview: SandboxOverview }) {
  const sandboxId = overview.sandbox.id
  const view = useSandboxView()
  const router = useRouter()
  const { can } = view
  const tabs = tabsFor(can)

  const [tab, setTab] = useState<SandboxTab>(DEFAULT_TAB)
  const [selection, setSelection] = useState<InsightSelection>({
    period: 'term',
    group_id: null,
  })
  const [openCommitmentId, setOpenCommitmentId] = useState<string | null>(null)
  const closeCommitment = useCloseCommitment(setOpenCommitmentId)

  const viewer = useInsightViewer()
  const isTermSelection =
    selection.period === 'term' && selection.group_id === null
  // Reporting is the heaviest read on the page: fetch it only for the tabs
  // that show it.
  const showsTerm = tab === 'today' || (tab === 'delivery' && isTermSelection)
  const termReporting = useSandboxReporting(
    sandboxId,
    viewer,
    { period: 'term', group_id: null },
    { analytics: showsTerm, learning: showsTerm },
  )
  const filteredReporting = useSandboxReporting(
    sandboxId,
    tab === 'delivery' && !isTermSelection ? viewer : null,
    selection,
  )
  const selectedReporting = isTermSelection ? termReporting : filteredReporting
  const onSelection = useCallback((next: InsightSelection) => {
    setSelection(next)
    writeSelection(next)
  }, [])

  /** Where the link that opened this page was pointing, until we get there. */
  const landing = useRef<string | null>(null)

  // Where a link lands (the rules live in `use-sandbox-landing.ts`). The tab
  // name is converted here rather than in the parser: the client view reads the
  // same URL and gives `?tab=` its own meanings.
  useSandboxLanding(sandboxId, url => {
    setSelection(url.selection)
    const next = TAB_FOR_ANCHOR[url.hash] ?? toSandboxTab(url.tab)
    if (next) setTab(next)
    if (url.commitment) setOpenCommitmentId(url.commitment)
    if (!url.hash) return
    landing.current = url.hash
    scrollToSection(url.hash)
  })

  /**
   * Delivery and Today mount nothing until analytics arrives, and the scroll
   * fires two frames after the tab is selected — so a cold `#delivery` link
   * would select the right tab and scroll nowhere. Land again once the read is
   * in, unless we are already there. The other tabs land on the first pass.
   */
  const reportingLoading = !selectedReporting.analytics
  useEffect(() => {
    const target = landing.current
    if (!target) return
    const owner = TAB_FOR_ANCHOR[target]
    if ((owner === 'delivery' || owner === 'today') && reportingLoading) return
    landing.current = null
    const box = document.getElementById(target)?.getBoundingClientRect()
    if (!box || (box.top < window.innerHeight && box.bottom > 0)) return
    scrollToSection(target)
  }, [reportingLoading, tab])

  // Remember the tab in the URL without navigating: a refresh or a copied link
  // comes back here, and the page keeps its static shell.
  const goToTab = useCallback((next: SandboxTab) => {
    // Whatever the link was chasing, this click supersedes it.
    landing.current = null
    setTab(next)
    replaceParams(url => url.searchParams.set('tab', next), { keepHash: false })
  }, [])

  /** Switch tab, then scroll to a section inside it. */
  const goToSection = useCallback(
    (anchor: string) => {
      const owner = TAB_FOR_ANCHOR[anchor]
      if (owner) goToTab(owner)
      landing.current = anchor
      scrollToSection(anchor)
    },
    [goToTab],
  )

  /**
   * The setup checklist is a table of contents: every step goes to the section
   * that owns the work, and lands on that section's own empty state — which
   * carries the button the step used to open directly.
   */
  const onSetupSelect = (target: SetupTarget) => {
    switch (target) {
      case 'term':
        goToSection('timeline')
        break
      case 'vision':
        goToSection('vision')
        break
      case 'team':
        goToSection('team')
        break
      case 'groups':
        goToSection('groups')
        break
      case 'invitations':
        goToSection(
          overview.members.some(m => m.side === 'theirs')
            ? 'invitations'
            : 'team',
        )
        break
    }
  }

  // The rail is only worth a column when something will render in it: a
  // coachee gets neither card, and so gets the full width instead.
  const hasRail = can.seeSetup || can.seeLinks

  return (
    <div
      className="space-y-5"
      data-testid="sandbox-cockpit"
      // Everything that scrolls to a section, and the rail that pins beside
      // them, reads one number — how far down this chrome's content starts.
      style={{ '--section-offset': view.sectionOffset } as CSSProperties}
    >
      <SandboxHero overview={overview} onEdit={() => goToTab('settings')} />

      <Tabs
        value={tab}
        onValueChange={v => goToTab(v as SandboxTab)}
        className="gap-4"
      >
        {/* The bar sticks under the chrome, so the tabs are reachable from
            anywhere down a long page. It bleeds to the container edges so the
            content scrolling under it is covered. */}
        <div
          className={cn(
            'sticky z-30 border-b border-line bg-surface-2 py-2',
            view.stickyTopClass,
            view.bleedClass,
          )}
        >
          <TabsList
            data-testid="sandbox-tabs"
            className={cn(
              'h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl',
              'border border-line bg-paper p-1',
            )}
          >
            {tabs.map(t => (
              <TabsTrigger
                key={t}
                value={t}
                data-testid={`sandbox-tab-${t}`}
                className={cn(
                  'flex-none rounded-lg px-3 py-1.5 text-sm text-ink-3',
                  'data-[state=active]:bg-surface-2 data-[state=active]:text-ink',
                  'data-[state=active]:shadow-none',
                )}
              >
                {TAB_LABEL[t]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div
          className={cn(
            'grid gap-5',
            // Main first in the DOM so the rail drops *below* the content on a
            // narrow screen instead of pushing it three cards down.
            hasRail && 'xl:grid-cols-[minmax(0,1fr)_340px]',
          )}
        >
          <div className="min-w-0">
            <TabsContent value="today">
              <TodayTab
                overview={overview}
                reporting={termReporting}
                openCommitmentId={openCommitmentId}
                onOpenCommitment={setOpenCommitmentId}
                onNavigate={goToSection}
                onResetSelection={() =>
                  onSelection({ period: 'term', group_id: null })
                }
              />
            </TabsContent>

            <TabsContent value="delivery">
              <InsightsPanel
                overview={overview}
                reporting={selectedReporting}
                selection={selection}
                onSelection={onSelection}
                onNavigate={goToSection}
              />
            </TabsContent>

            <TabsContent value="outcomes">
              <OutcomesPanel overview={overview} />
            </TabsContent>

            <TabsContent value="people">
              <PeopleTab overview={overview} />
            </TabsContent>

            <TabsContent value="settings">
              <SettingsPanel overview={overview} />
            </TabsContent>
          </div>

          {hasRail && (
            <aside className="space-y-4 xl:sticky xl:top-(--section-offset) xl:self-start">
              <SetupCard overview={overview} onSelect={onSetupSelect} />
              <LinksCard overview={overview} />
            </aside>
          )}
        </div>
      </Tabs>

      {/* One commitment panel for the whole page, above the tabs: a
          `?commitment=` link can arrive alongside `?tab=delivery` or
          `#outcomes`, where no commitments list is mounted at all. */}
      <CommitmentDetailPanel
        commitmentId={openCommitmentId}
        onClose={closeCommitment}
        onNavigate={setOpenCommitmentId}
        onOpenInPage={
          view.audience === 'ours' && openCommitmentId
            ? () => router.push(`/commitments/${openCommitmentId}`)
            : undefined
        }
      />
    </div>
  )
}
