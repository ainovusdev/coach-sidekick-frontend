import {
  test,
  expect,
  request as playwrightRequest,
  type APIRequestContext,
} from '@playwright/test'
import {
  API,
  USERS,
  apiToken,
  auth,
  hideDevtools,
  login,
  seedClient,
  seedScheduledSession,
  sweepCommitments,
} from './helpers'

/**
 * Slice 4 — automatic commitments.
 *
 *   • a 1:1 scheduled later today makes "Prepare for your session with …"
 *     for the coach: Automatic chip in the hub, "N due today" on the home
 *     page, bell says "New for you" and "Due today"
 *   • the detail panel explains it (chip tooltip, "Created automatically")
 *     and offers Dismiss; dismissing takes it off the open list
 *   • a second tick creates nothing again (source_key)
 *
 * Fixtures: `seedClient` (Farah, Marcus's coachee), `seedScheduledSession`,
 * and the seed script's `sweep` (the background sweeper is off locally).
 */

const FARAH = { email: 'e2e-farah@ptg-e2e.com', name: 'Farah Mensah' }
const TITLE = `Prepare for your session with ${FARAH.name}`

async function api(
  request: APIRequestContext,
  token: string,
  method: 'get' | 'post' | 'patch' | 'delete',
  path: string,
  data?: unknown,
) {
  const resp = await request[method](`${API}${path}`, {
    headers: auth(token),
    data,
  })
  if (!resp.ok())
    throw new Error(
      `${method.toUpperCase()} ${path} → ${resp.status()} ${await resp.text()}`,
    )
  return resp.status() === 204 ? null : resp.json()
}

test.describe('commitments — automatic', () => {
  test.describe.configure({ mode: 'serial' })

  let sessionId = ''
  let commitmentId = ''

  // Later specs count Marcus's bell exactly; clear it once we are done. The
  // row and the session go with Farah at the next `reset` (an automatic row
  // is dismissed, never deleted — deleting would let the next tick remake it).
  test.afterAll(async () => {
    const ctx = await playwrightRequest.newContext()
    try {
      const token = await apiToken(ctx, USERS.marcus.email)
      await ctx.post(`${API}/notifications/read-all`, { headers: auth(token) })
    } finally {
      await ctx.dispose()
    }
  })

  /** Later today in the browser's own day, so "due today" holds at any hour. */
  function hoursUntilLateToday(): number {
    const now = new Date()
    const late = new Date(now)
    late.setHours(23, 30, 0, 0)
    const hours = (late.getTime() - now.getTime()) / 36e5
    return hours < 0.2 ? 0.1 : Math.min(hours, 23.5)
  }

  test('a session later today puts session prep on the coach', async ({
    page,
    request,
  }) => {
    seedClient({
      coachEmail: USERS.marcus.email,
      clientEmail: FARAH.email,
      name: FARAH.name,
    })
    sessionId = seedScheduledSession({
      coachEmail: USERS.marcus.email,
      clientEmail: FARAH.email,
      hoursFromNow: hoursUntilLateToday(),
    }).id
    const first = sweepCommitments()
    expect(first.created).toBeGreaterThanOrEqual(1)

    const token = await apiToken(request, USERS.marcus.email)
    const mine = await api(request, token, 'get', '/commitments/my-commitments')
    const row = mine.find(
      (c: { session_id?: string; title: string }) =>
        c.session_id === sessionId && c.title === TITLE,
    )
    expect(row).toBeTruthy()
    commitmentId = row.id
    expect(row.source).toBe('rule')
    expect(row.assignee.user_id).toBeTruthy()
    expect(row.metadata.auto.why).toContain('before your session with Farah')

    // Home: the chip counts it (due today, on Marcus's list).
    await login(page, USERS.marcus.email)
    await expect(page.getByTestId('attention-due-today')).toContainText(
      'due today',
    )

    // Hub: the row carries the Automatic chip, and the tooltip explains.
    await page.goto('/commitments?view=mine&due=today')
    await hideDevtools(page)
    const line = page
      .getByTestId('commitment-row')
      .filter({ hasText: TITLE })
      .first()
    await expect(line).toBeVisible()
    const chip = line.getByTestId('commitment-automatic')
    await expect(chip).toHaveAttribute('data-rule', 'session_prep')
    await chip.hover()
    await expect(
      page.getByRole('tooltip').filter({ hasText: 'before your session' }),
    ).toBeVisible()

    // Bell: told once it exists, and that it is due today.
    await page.getByTestId('notification-bell').click()
    const bell = page.getByTestId('notification-item')
    await expect(
      bell.filter({ hasText: `New for you: ${TITLE}` }),
    ).toBeVisible()
    await expect(bell.filter({ hasText: `Due today: ${TITLE}` })).toBeVisible()
    await expect(
      bell.filter({ hasText: `New for you: ${TITLE}` }).first(),
    ).toHaveAttribute('data-event', 'commitment_assigned')
  })

  test('the page explains the row and the panel lets the coach dismiss it', async ({
    page,
    request,
  }) => {
    await login(page, USERS.marcus.email)
    // The full page carries the timeline: origin line for a rule-made row.
    await page.goto(`/commitments/${commitmentId}`)
    await hideDevtools(page)
    await expect(page.getByTestId('commitment-automatic').first()).toBeVisible()
    await expect(page.getByTestId('activity-created-auto')).toContainText(
      'Created automatically · session prep',
    )

    // The slide-over panel: chip under the title, Dismiss in the menu.
    await page.goto(`/commitments?view=mine&open=${commitmentId}`)
    await hideDevtools(page)
    const panel = page.getByTestId('commitment-detail-panel')
    await expect(panel).toHaveAttribute('data-open', 'true')
    await expect(panel.getByTestId('commitment-automatic')).toBeVisible()
    await panel.getByTestId('commitment-menu').click()
    await page.getByTestId('commitment-dismiss').click()
    await page.keyboard.press('Escape')

    const token = await apiToken(request, USERS.marcus.email)
    await expect
      .poll(async () => {
        const c = await api(
          request,
          token,
          'get',
          `/commitments/${commitmentId}`,
        )
        return c.status
      })
      .toBe('abandoned')
    // Off the active list; the All tab still shows it as abandoned.
    await page.goto('/commitments?view=mine&tab=active')
    await hideDevtools(page)
    await expect(
      page.getByTestId('commitment-row').filter({ hasText: TITLE }),
    ).toHaveCount(0)
    await page.goto('/commitments?view=mine&tab=all')
    await hideDevtools(page)
    await expect(
      page.getByTestId('commitment-row').filter({ hasText: TITLE }).first(),
    ).toContainText('Abandoned')
  })

  test('a second tick does not make it again', async ({ request }) => {
    const again = sweepCommitments()
    const token = await apiToken(request, USERS.marcus.email)
    const rows = await api(
      request,
      token,
      'get',
      `/commitments/?include_drafts=true&involving_me=true`,
    )
    const list = Array.isArray(rows) ? rows : rows.commitments
    const forSession = list.filter(
      (c: { session_id?: string; source?: string }) =>
        c.session_id === sessionId && c.source === 'rule',
    )
    expect(forSession).toHaveLength(1)
    expect(again.created).toBe(0)
  })
})
