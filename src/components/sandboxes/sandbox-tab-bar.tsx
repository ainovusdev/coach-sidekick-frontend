'use client'

import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

/**
 * The pill bar every sandbox page hangs its tabs on — the cockpit and the
 * client, coach and group pages. Looks only: each page keeps its own reading of
 * the URL, and the client's report keeps its section navigation.
 *
 * The bar sticks under the chrome, so the tabs are reachable from anywhere down
 * a long page. It bleeds to the container edges so the content scrolling under
 * it is covered.
 */
export function SandboxTabBar<T extends string>({
  tabs,
  label,
  stickyTopClass,
  bleedClass,
  testId,
  tabTestId,
}: {
  tabs: readonly T[]
  label: (tab: T) => string
  stickyTopClass: string
  bleedClass: string
  testId?: string
  tabTestId?: (tab: T) => string
}) {
  return (
    <div
      className={cn(
        'sticky z-30 border-b border-line bg-surface-2 py-2',
        stickyTopClass,
        bleedClass,
      )}
    >
      <TabsList
        data-testid={testId}
        className={cn(
          'scroll-fade-x h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl',
          'border border-line bg-paper p-1',
        )}
      >
        {tabs.map(t => (
          <TabsTrigger
            key={t}
            value={t}
            data-testid={tabTestId?.(t)}
            className={cn(
              'flex-none rounded-lg px-3 py-1.5 text-sm text-ink-3',
              'data-[state=active]:bg-surface-2 data-[state=active]:text-ink',
              'data-[state=active]:shadow-none',
            )}
          >
            {label(t)}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  )
}
