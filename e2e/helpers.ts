import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import type { APIRequestContext, Page } from '@playwright/test'

import type { SandboxTab } from '../src/components/sandboxes/sandbox-tabs'

export const API = process.env.E2E_API_URL || 'http://localhost:8001/api/v1'
export const PASSWORD = 'Password123!'

export const USERS = {
  admin: { email: 'e2e-admin@novus-e2e.com', name: 'E2E Admin' },
  marcus: { email: 'e2e-marcus@novus-e2e.com', name: 'Marcus Bell' },
  priya: { email: 'e2e-priya@novus-e2e.com', name: 'Priya Raman' },
  dana: { email: 'e2e-dana@ptg-e2e.com', name: 'Dana Whitfield' }, // existing active account
  omar: { email: 'e2e-omar@ptg-e2e.com', name: 'Omar Haddad' }, // client-side admin, no app role
}

/** Locate the backend checkout: env override, sibling of the repo, or sibling of the worktree root. */
export function backendDir(): string {
  const candidates = [
    process.env.E2E_BACKEND_DIR,
    path.resolve(__dirname, '../../coach-sidekick-backend'),
    path.resolve(__dirname, '../../../../../coach-sidekick-backend'),
  ].filter(Boolean) as string[]
  const hit = candidates.find(c =>
    existsSync(path.join(c, 'scripts', 'seed_local_sandbox_fixtures.py')),
  )
  if (!hit)
    throw new Error(
      `Backend checkout not found. Tried: ${candidates.join(', ')}`,
    )
  return hit
}

export function seedFixtures(): void {
  execSync('poetry run python scripts/seed_local_sandbox_fixtures.py reset', {
    cwd: backendDir(),
    stdio: 'pipe',
  })
}

/**
 * Insert one coaching session for a coach's client row — delivery fixtures.
 * `daysAgo` may be negative for a future scheduled session.
 */
export function seedSession(opts: {
  coachEmail: string
  clientEmail: string
  daysAgo: number
  status?: 'completed' | 'ended' | 'scheduled' | 'active' | 'stopped'
  minutes?: number
}): { id: string; client_id: string } {
  const args = [
    'session',
    opts.coachEmail,
    opts.clientEmail,
    String(opts.daysAgo),
    opts.status ?? 'completed',
    String(opts.minutes ?? 45),
  ]
  const out = execSync(
    `poetry run python scripts/seed_local_sandbox_fixtures.py ${args.join(' ')}`,
    { cwd: backendDir(), stdio: 'pipe' },
  ).toString()
  return JSON.parse(out.trim().split('\n').pop() as string)
}

/** A *scheduled* 1:1 `hoursFromNow` hours ahead (the automatic-commitment rules). */
export function seedScheduledSession(opts: {
  coachEmail: string
  clientEmail: string
  hoursFromNow: number
  questionnaireSent?: boolean
}): { id: string; client_id: string; scheduled_for: string } {
  const args = [
    'scheduled',
    opts.coachEmail,
    opts.clientEmail,
    String(opts.hoursFromNow),
    ...(opts.questionnaireSent ? ['questionnaire_sent'] : []),
  ]
  const out = execSync(
    `poetry run python scripts/seed_local_sandbox_fixtures.py ${args.join(' ')}`,
    { cwd: backendDir(), stdio: 'pipe' },
  ).toString()
  return JSON.parse(out.trim().split('\n').pop() as string)
}

/**
 * One automation tick (create / resolve / nudge). The background sweeper is
 * off locally (`COMMITMENT_SWEEPER_ENABLED=false`), so a spec runs it when
 * it wants one.
 */
export function sweepCommitments(): {
  created: number
  resolved: number
  nudged: number
} {
  const out = execSync(
    'poetry run python scripts/seed_local_sandbox_fixtures.py sweep',
    { cwd: backendDir(), stdio: 'pipe' },
  ).toString()
  return JSON.parse(out.trim().split('\n').pop() as string)
}

/**
 * Ensure `coachEmail` has a client row for `clientEmail`, linked to that
 * person's login when one exists. The API never links an existing active
 * account (that goes through the accept-request flow), so the seed script
 * does it directly. Idempotent; `reset` removes it again.
 */
export function seedClient(opts: {
  coachEmail: string
  clientEmail: string
  name?: string
  /** Other coaches granted access to the row (ClientAccess). */
  grantTo?: string[]
}): { id: string; user_id: string | null; name: string } {
  const args = [
    'client',
    opts.coachEmail,
    opts.clientEmail,
    JSON.stringify(opts.name ?? ''),
  ]
  for (const email of opts.grantTo ?? []) args.push(email)
  const out = execSync(
    `poetry run python scripts/seed_local_sandbox_fixtures.py ${args.join(' ')}`,
    { cwd: backendDir(), stdio: 'pipe' },
  ).toString()
  return JSON.parse(out.trim().split('\n').pop() as string)
}

/**
 * A finished group session declared for a sandbox group, with the post-session
 * forms fired exactly as completion fires them. No email leaves the machine.
 */
export function seedHeldGroupSession(opts: {
  coachEmail: string
  groupId: string
  clientEmails: string[]
}): {
  id: string
  tokens: { kind: string; token: string; client_email: string | null }[]
} {
  const args = [
    'held_group',
    opts.coachEmail,
    opts.groupId,
    ...opts.clientEmails,
  ]
  const out = execSync(
    `poetry run python scripts/seed_local_sandbox_fixtures.py ${args.join(' ')}`,
    { cwd: backendDir(), stdio: 'pipe' },
  ).toString()
  return JSON.parse(out.trim().split('\n').pop() as string)
}

export function invitationToken(email: string): {
  token: string
  status: string
} {
  const out = execSync(
    `poetry run python scripts/seed_local_sandbox_fixtures.py token ${email}`,
    {
      cwd: backendDir(),
      stdio: 'pipe',
    },
  ).toString()
  return JSON.parse(out.trim().split('\n').pop() as string)
}

/**
 * Client-profile and portal pages fire the AI prep agent on load. Locally it has
 * no LLM keys or read-only DSN and stalls the single-worker backend for minutes,
 * which makes every later test time out — so browser tests never let it start.
 */
export async function muteAgent(page: Page): Promise<void> {
  await page.route('**/agent/**', route => route.abort())
}

/**
 * The React Query devtools bubble (dev builds only) floats bottom-right,
 * exactly where side-panel footers put their primary button, so it can swallow
 * clicks. Hide it for the current document; call again after a full `goto`.
 */
export async function hideDevtools(page: Page): Promise<void> {
  await page
    .addStyleTag({ content: '.tsqd-parent-container{display:none!important}' })
    .catch(() => undefined)
}

/**
 * Be this person. A test that meets a sandbox as several people in turn has to
 * sign the last one out first: a signed-in tab is bounced away from /auth, so
 * the form never arrives and the fill times out.
 */
export async function login(
  page: Page,
  email: string,
  password = PASSWORD,
): Promise<void> {
  await muteAgent(page)
  await page.goto('/auth')
  const form = await page
    .waitForSelector('#email', { timeout: 5_000 })
    .catch(() => null)
  if (!form) {
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.context().clearCookies()
    await page.goto('/auth')
    await page.waitForSelector('#email')
  }
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(url => !url.pathname.startsWith('/auth'), {
    timeout: 30_000,
  })
  await hideDevtools(page)
}

/**
 * Open a sandbox on one of its tabs and wait for the bar to be there.
 *
 * The page opens on Today, so anything asserting on the timeline, the team,
 * the groups, the outcomes or the settings has to say which tab it means.
 */
export async function gotoSandboxTab(
  page: Page,
  base: string,
  tab: SandboxTab,
): Promise<void> {
  await page.goto(`${base}?tab=${tab}`)
  await page.getByTestId(`sandbox-tab-${tab}`).waitFor()
}

/**
 * Open a sandbox as its client side reads it — one long page, no tabs — and
 * wait for it to be there. `link` is whatever the caller would have put on the
 * URL (`#outcomes`, `?tab=insights`); the view maps it to one of its sections.
 */
export async function gotoClientView(
  page: Page,
  base: string,
  link = '',
): Promise<void> {
  await page.goto(`${base}${link}`)
  await page.getByTestId('client-view').waitFor()
}

/** A section in the main column: `needs`, `groups`, `people`, `outcomes`… */
export function clientSection(page: Page, id: string) {
  return page.getByTestId(`client-section-${id}`)
}

/** A panel in the rail: `watch`, `coming`, `timeline`, `updates`, `team`… */
export function clientPanel(page: Page, id: string) {
  return page.getByTestId(`client-panel-${id}`)
}

export async function apiToken(
  request: APIRequestContext,
  email: string,
  password = PASSWORD,
): Promise<string> {
  const resp = await request.post(`${API}/auth/login`, {
    data: { email, password },
  })
  if (!resp.ok())
    throw new Error(
      `login failed for ${email}: ${resp.status()} ${await resp.text()}`,
    )
  const body = await resp.json()
  return body.access_token as string
}

export function auth(token: string) {
  return { Authorization: `Bearer ${token}` }
}

type GroupBody = {
  coach_user_ids?: string[]
  coachees?: { email?: string; user_id?: string; name?: string | null }[]
  [key: string]: unknown
}

async function call(
  request: APIRequestContext,
  token: string,
  method: 'get' | 'post' | 'put',
  path: string,
  data?: unknown,
) {
  const resp = await request[method](`${API}${path}`, {
    headers: auth(token),
    ...(data === undefined ? {} : { data }),
  })
  if (!resp.ok())
    throw new Error(`${method} ${path}: ${resp.status()} ${await resp.text()}`)
  return resp.json()
}

/**
 * Build a group the way the product now requires: everyone it names goes on
 * the sandbox's list of coaches or coachees first, then the group picks them.
 * Specs that are about something else call this instead of the two steps.
 */
export async function buildGroup(
  request: APIRequestContext,
  token: string,
  sandboxId: string,
  body: GroupBody,
) {
  const overview = await call(
    request,
    token,
    'get',
    `/sandboxes/${sandboxId}/overview`,
  )
  type Held = { id: string; user_id: string; email: string; roster: string[] }
  const members: Held[] = overview.members
  const list = async (
    kind: 'coach' | 'coachee',
    held: Held | undefined,
    who: Record<string, unknown>,
  ) => {
    if (!held)
      return call(request, token, 'post', `/sandboxes/${sandboxId}/members`, {
        side: kind === 'coach' ? 'ours' : 'theirs',
        roles: [],
        roster: [kind],
        ...who,
      })
    if (!held.roster.includes(kind))
      await call(
        request,
        token,
        'put',
        `/sandboxes/${sandboxId}/members/${held.id}/roster`,
        { roster: [...held.roster, kind] },
      )
  }
  for (const id of body.coach_user_ids ?? [])
    await list(
      'coach',
      members.find(m => m.user_id === id),
      { user_id: id },
    )
  for (const c of body.coachees ?? []) {
    const held = members.find(m =>
      c.user_id
        ? m.user_id === c.user_id
        : m.email.toLowerCase() === c.email?.toLowerCase(),
    )
    await list('coachee', held, { email: c.email, name: c.name ?? null })
  }
  return call(request, token, 'post', `/sandboxes/${sandboxId}/groups`, body)
}
