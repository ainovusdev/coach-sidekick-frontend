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
  /** the sticky rail offset: admin's main scrolls, member chrome has a 64px header */
  railTopClass: 'xl:top-0' | 'xl:top-20'
  can: SandboxCan
  href: {
    index: () => string
    overview: (id: string) => string
    people: (id: string) => string
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

function hrefs(basePath: SandboxView['basePath']): SandboxView['href'] {
  return {
    index: () => basePath,
    overview: id => `${basePath}/${id}`,
    people: id => `${basePath}/${id}/people`,
    groups: id => `${basePath}/${id}#groups`,
  }
}

export const ADMIN_SANDBOX_VIEW: SandboxView = {
  audience: 'admin',
  scope: 'all',
  basePath: '/admin/sandboxes',
  indexLabel: 'Sandboxes',
  railTopClass: 'xl:top-0',
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
    railTopClass: 'xl:top-20',
    can,
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
