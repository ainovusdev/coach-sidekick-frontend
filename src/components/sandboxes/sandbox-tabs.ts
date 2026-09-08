/**
 * The sandbox page's tabs.
 *
 * A tab is a place to stand, not a permission: what a person may do inside one
 * is still decided by the `can.*` flags each panel already reads. Only Settings
 * is hidden outright, because everything in it writes.
 */

import type { SandboxCan } from '@/components/sandboxes/sandbox-view-context'

export const SANDBOX_TABS = [
  'today',
  'outcomes',
  'team',
  'groups',
  'timeline',
  'general',
  'settings',
] as const

export type SandboxTab = (typeof SANDBOX_TABS)[number]

export const DEFAULT_TAB: SandboxTab = 'today'

export const TAB_LABEL: Record<SandboxTab, string> = {
  today: 'Today',
  outcomes: 'Outcomes',
  team: 'Team',
  groups: 'Groups',
  timeline: 'Timeline',
  general: 'General',
  settings: 'Settings',
}

/**
 * Which tab owns each section anchor.
 *
 * Notification payloads and the dashboard's attention rows link to
 * `#<section>` (`attentionHref` in `src/lib/sandbox/delivery.ts`), and those
 * URLs were written before the tabs existed. They must keep landing, so a hash
 * arriving from outside picks the tab before anything scrolls.
 */
export const TAB_FOR_ANCHOR: Record<string, SandboxTab> = {
  timeline: 'timeline',
  vision: 'general',
  outcomes: 'outcomes',
  commitments: 'today',
  team: 'team',
  invitations: 'team',
  delivery: 'groups',
  groups: 'groups',
}

export function isSandboxTab(
  value: string | null | undefined,
): value is SandboxTab {
  return !!value && (SANDBOX_TABS as readonly string[]).includes(value)
}

/** The tabs this person gets, in order. */
export function tabsFor(can: SandboxCan): SandboxTab[] {
  return SANDBOX_TABS.filter(tab => tab !== 'settings' || can.editSandbox)
}
