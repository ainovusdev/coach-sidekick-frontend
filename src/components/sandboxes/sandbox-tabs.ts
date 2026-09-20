/**
 * The sandbox page's tabs.
 *
 * A tab is a place to stand, not a permission: what a person may do inside one
 * is still decided by the `can.*` flags each panel already reads. Even Settings
 * is shown to everyone — it holds the vision, which every member may read, and
 * the sandbox form gates itself.
 */

import type { SandboxCan } from '@/components/sandboxes/sandbox-view-context'

export const SANDBOX_TABS = [
  'today',
  'delivery',
  'outcomes',
  'people',
  'groups',
  'settings',
] as const

export type SandboxTab = (typeof SANDBOX_TABS)[number]

export const DEFAULT_TAB: SandboxTab = 'today'

export const TAB_LABEL: Record<SandboxTab, string> = {
  today: 'Today',
  delivery: 'Delivery',
  outcomes: 'Outcomes',
  people: 'People',
  groups: 'Groups',
  settings: 'Settings',
}

/**
 * Tab names written before the page went from eight tabs to five.
 *
 * `?tab=insights` is in the wild — in copied links, in bookmarks, and in the
 * dashboard rows people have open right now — so an old name still lands where
 * its content went.
 *
 * This map is for the cockpit only. The client view reads the same URL and
 * gives `?tab=` its own meanings, so the shared parser keeps the raw string and
 * each layout decides for itself (see `use-sandbox-landing.ts`).
 */
export const LEGACY_TAB: Record<string, SandboxTab> = {
  insights: 'delivery',
  team: 'people',
  timeline: 'today',
  general: 'settings',
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
  insights: 'delivery',
  delivery: 'delivery',
  timeline: 'today',
  commitments: 'today',
  outcomes: 'outcomes',
  team: 'people',
  invitations: 'people',
  groups: 'groups',
  vision: 'settings',
  settings: 'settings',
}

export function isSandboxTab(
  value: string | null | undefined,
): value is SandboxTab {
  return !!value && (SANDBOX_TABS as readonly string[]).includes(value)
}

/** A tab name from a URL, accepting the spelling this page used to use. */
export function toSandboxTab(
  value: string | null | undefined,
): SandboxTab | null {
  if (!value) return null
  return isSandboxTab(value) ? value : (LEGACY_TAB[value] ?? null)
}

/** The tabs this person gets, in order. */
export function tabsFor(_can: SandboxCan): SandboxTab[] {
  return [...SANDBOX_TABS]
}
