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

export async function login(
  page: Page,
  email: string,
  password = PASSWORD,
): Promise<void> {
  await page.goto('/auth')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(url => !url.pathname.startsWith('/auth'), {
    timeout: 30_000,
  })
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
