import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import type { APIRequestContext, Page } from '@playwright/test'

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

export async function login(
  page: Page,
  email: string,
  password = PASSWORD,
): Promise<void> {
  await muteAgent(page)
  await page.goto('/auth')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(url => !url.pathname.startsWith('/auth'), {
    timeout: 30_000,
  })
  await hideDevtools(page)
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
