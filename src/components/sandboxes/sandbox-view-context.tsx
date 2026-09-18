'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type {
  SandboxCapability,
  SandboxOverview,
  SandboxScope,
} from '@/types/sandbox'

/**
 * How the sandbox components should behave for the person looking at them.
 *
 * The admin panel needs no provider: the default value is exactly today's
 * admin behaviour (every flag on, admin paths). Member routes wrap the
 * cockpit in a provider built from `overview.my_capabilities` + `my_scope`,
 * which the backend decides — nothing here re-derives permissions from roles.
 */

export interface SandboxCan {
  /** name, organisation, term, vision, links */
  editSandbox: boolean
  editTimeline: boolean
  editTeam: boolean
  editGroups: boolean
  invite: boolean
  /** the admin-voiced setup checklist */
  seeSetup: boolean
  seeInvitations: boolean
  seePeople: boolean
  /** our working links (proposal, HubSpot …) */
  seeLinks: boolean
  /** every group, or only the ones I am in */
  seeAllGroups: boolean
}

export type SandboxAudience = 'admin' | 'ours' | 'theirs'

export interface SandboxView {
  audience: SandboxAudience
  scope: SandboxScope
  basePath: '/admin/sandboxes' | '/sandboxes'
  indexLabel: string
  /**
   * Where the page's own chrome sits, which the two routes disagree about: the
   * member chrome scrolls the window under a 64px sticky header with
   * `px-4 sm:px-6 lg:px-8` gutters, the admin chrome scrolls its own `<main>`
   * with a 24px gutter and no sticky origin.
   */
  /** the sticky tab bar's origin */
  stickyTopClass: 'top-0' | 'top-16'
  /** cancels the container gutter so the bar's background reaches the edge */
  bleedClass: string
  /**
   * `--section-offset` for this chrome: the sticky origin plus the 61px tab
   * bar plus a little air. It is what a linked-to section scrolls clear of and
   * where the rail pins, so the two can never drift apart.
   */
  sectionOffset: '4.5rem' | '8.5rem'
  can: SandboxCan
  href: {
    index: () => string
    overview: (id: string) => string
    groups: (id: string) => string
  }
}

const ALL_ON: SandboxCan = {
  editSandbox: true,
  editTimeline: true,
  editTeam: true,
  editGroups: true,
  invite: true,
  seeSetup: true,
  seeInvitations: true,
  seePeople: true,
  seeLinks: true,
  seeAllGroups: true,
}

const ALL_OFF: SandboxCan = {
  editSandbox: false,
  editTimeline: false,
  editTeam: false,
  editGroups: false,
  invite: false,
  seeSetup: false,
  seeInvitations: false,
  seePeople: false,
  seeLinks: false,
  seeAllGroups: true,
}

function hrefs(basePath: SandboxView['basePath']): SandboxView['href'] {
  return {
    index: () => basePath,
    overview: id => `${basePath}/${id}`,
    // An anchor rather than `?tab=`: the two layouts spell their tabs
    // differently but both own a `#groups` section.
    groups: id => `${basePath}/${id}#groups`,
  }
}

export const ADMIN_SANDBOX_VIEW: SandboxView = {
  audience: 'admin',
  scope: 'all',
  basePath: '/admin/sandboxes',
  indexLabel: 'Sandboxes',
  stickyTopClass: 'top-0',
  bleedClass: '-mx-6 px-6',
  sectionOffset: '4.5rem',
  can: ALL_ON,
  href: hrefs('/admin/sandboxes'),
}

export function canFromCapabilities(
  caps: readonly SandboxCapability[],
  scope: SandboxScope,
): SandboxCan {
  const has = (c: SandboxCapability) => caps.includes(c)
  return {
    editSandbox: has('sandbox.manage'),
    editTimeline: has('timeline.manage'),
    editTeam: has('people.manage'),
    editGroups: has('groups.manage'),
    invite: has('invitations.manage'),
    seeSetup: has('invitations.manage'),
    seeInvitations: has('invitations.manage'),
    seePeople: has('people.manage'),
    seeLinks: has('links.read'),
    seeAllGroups: scope === 'all',
  }
}

/** The view for a member route, from what the overview says the caller may do. */
export function viewFromOverview(
  overview: Pick<SandboxOverview, 'my_capabilities' | 'my_scope' | 'my_roles'>,
  opts: { isAdmin: boolean; isOurs: boolean },
): SandboxView {
  const can = opts.isAdmin
    ? ALL_ON
    : canFromCapabilities(overview.my_capabilities, overview.my_scope)
  return {
    audience: opts.isAdmin ? 'admin' : opts.isOurs ? 'ours' : 'theirs',
    scope: opts.isAdmin ? 'all' : overview.my_scope,
    basePath: '/sandboxes',
    indexLabel: opts.isAdmin ? 'Sandboxes' : 'My sandboxes',
    stickyTopClass: 'top-16',
    bleedClass: '-mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8',
    sectionOffset: '8.5rem',
    can,
    href: hrefs('/sandboxes'),
  }
}

/**
 * Hats that belong to the client's own side of a sandbox, and hats that belong
 * to ours. A member row has exactly one side, so a person cannot hold both.
 */
const THEIR_HATS = ['primary_client', 'primary_client_admin', 'supervisor']
const OUR_HATS = ['account_executive', 'sandbox_owner', 'lead_coach', 'coach']

/**
 * Who gets the client view: decided by the hats on *this sandbox*, never by
 * the app role the person happens to hold elsewhere.
 *
 * A primary client who also coaches somewhere else in the product is still a
 * client here. A platform admin keeps the cockpit (they run the thing), and a
 * plain coachee keeps it too — their page is already their own coaching.
 */
export function isClientAudience(
  overview: Pick<SandboxOverview, 'my_roles'>,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return false
  const roles = overview.my_roles
  return (
    roles.some(r => THEIR_HATS.includes(r)) &&
    !roles.some(r => OUR_HATS.includes(r))
  )
}

/** Our side may see every group, so their numbers match the client's. */
export function canPreviewClientView(
  overview: Pick<SandboxOverview, 'my_scope'>,
  isAdmin: boolean,
): boolean {
  return isAdmin || overview.my_scope === 'all'
}

/**
 * The client layout under the viewer's own access: same reads, no write
 * controls. There is no identity switch — nothing is fetched as anyone else.
 */
export function previewClientView(from: 'admin' | 'member'): SandboxView {
  return {
    audience: 'theirs',
    scope: 'all',
    basePath: '/sandboxes',
    indexLabel: from === 'admin' ? 'Sandboxes' : 'My sandboxes',
    stickyTopClass: 'top-16',
    bleedClass: '-mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8',
    sectionOffset: '8.5rem',
    can: ALL_OFF,
    href: hrefs('/sandboxes'),
  }
}

const SandboxViewContext = createContext<SandboxView>(ADMIN_SANDBOX_VIEW)

export function SandboxViewProvider({
  value,
  children,
}: {
  value: SandboxView
  children: ReactNode
}) {
  return (
    <SandboxViewContext.Provider value={value}>
      {children}
    </SandboxViewContext.Provider>
  )
}

export function useSandboxView(): SandboxView {
  return useContext(SandboxViewContext)
}
