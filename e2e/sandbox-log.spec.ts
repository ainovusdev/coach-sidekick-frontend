import {
  test,
  expect,
  type APIRequestContext,
  type Locator,
  type Page,
} from '@playwright/test'
import {
  API,
  USERS,
  apiToken,
  auth,
  buildGroup,
  gotoClientView,
  gotoSandboxTab,
  hideDevtools,
  login,
} from './helpers'

/**
 * The sandbox's log of changes — the Activity tab.
 *
 *   • Priya (account executive) moves Midpoint reporting with a reason; the
 *     tab says "Priya Raman moved Midpoint reporting" and carries the reason,
 *     and the window's own dialog shows the same line as its history
 *   • Marcus (a coach in one group) sees the move, and the people in his own
 *     group, but not who was put into the other group
 *   • Dana (their side) has no tab; `?tab=activity` lands on her own view
 *   • the admin filters the log by kind and by group
 *
 * Fixtures: seed script (`reset`); the sandbox is built here through the API
 * as Priya. Named after `sandbox-dashboards` on purpose: this gives Marcus one
 * more sandbox, and that spec's home strip shows three.
 */

const NAME = 'E2E Change Log'
const ORG = 'Preferred Travel Group'
const AISHA = { email: 'e2e-aisha-log@ptg-e2e.com', name: 'Aisha Mensah' }
const BRUNO = { email: 'e2e-bruno-log@ptg-e2e.com', name: 'Bruno Costa' }
const REASON = 'Client asked to push the report a fortnight'

async function api(
  request: APIRequestContext,
  token: string,
  method: 'get' | 'post' | 'patch',
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
  return resp.json()
}

function monthIndex(d: Date) {
  return d.getFullYear() * 12 + d.getMonth()
}

async function pickDay(page: Page, fieldId: string, from: Date, target: Date) {
  await expect(page.locator('[data-slot="popover-content"]')).toHaveCount(0)
  await page.click(`#${fieldId}`)
  const calendar = page.locator('[data-slot="popover-content"]')
  await expect(calendar).toHaveCount(1)
  const steps = monthIndex(target) - monthIndex(from)
  const nav = steps > 0 ? /next month/i : /previous month/i
  for (let i = 0; i < Math.abs(steps); i++) {
    await calendar.getByRole('button', { name: nav }).click()
  }
  await calendar
    .locator(
      `button[data-day="${target.getMonth() + 1}/${target.getDate()}/${target.getFullYear()}"]`,
    )
    .first()
    .click()
}

const d = (iso: string) => {
  const [y, m, day] = iso.split('-').map(Number)
  return new Date(y, m - 1, day)
}
const plusDays = (date: Date, n: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + n)
  return next
}

function rows(page: Page): Locator {
  return page.getByTestId('change-row')
}

test.describe.configure({ mode: 'serial' })

test.describe('Sandboxes — the log of changes', () => {
  let sandboxId = ''
  let groupTwoId = ''
  let midpoint: { id: string; window_start: string; window_end: string }

  test.beforeAll(async ({ request }) => {
    const priya = await apiToken(request, USERS.priya.email)
    const created = await api(request, priya, 'post', '/sandboxes/', {
      name: NAME,
      organisation: ORG,
      term_start: '2026-06-01',
      term_months: 6,
      links: [],
    })
    sandboxId = created.sandbox.id
    midpoint = created.timeline.find(
      (e: { kind: string }) => e.kind === 'midpoint_reporting',
    )
    const marcus = (
      await api(
        request,
        priya,
        'get',
        `/sandboxes/people/search?q=marcus&sandbox_id=${sandboxId}`,
      )
    )[0]
    const me = (
      await api(
        request,
        priya,
        'get',
        `/sandboxes/people/search?q=priya&sandbox_id=${sandboxId}`,
      )
    )[0]
    await buildGroup(request, priya, sandboxId, {
      coach_user_ids: [marcus.id],
      coachees: [AISHA],
      hours_per_coachee: 6,
    })
    const two = await buildGroup(request, priya, sandboxId, {
      coach_user_ids: [me.id],
      coachees: [BRUNO],
      hours_per_coachee: 6,
    })
    groupTwoId = two.id
    await api(request, priya, 'post', `/sandboxes/${sandboxId}/members`, {
      side: 'theirs',
      roles: ['supervisor'],
      email: USERS.dana.email,
      name: USERS.dana.name,
    })
  })

  test.afterAll(async ({ request }) => {
    // Later specs assert exact bell counts for Marcus.
    const marcus = await apiToken(request, USERS.marcus.email)
    await request.post(`${API}/notifications/read-all`, {
      headers: auth(marcus),
    })
  })

  test('the account executive moves a window with a reason and the log says so', async ({
    page,
  }) => {
    await login(page, USERS.priya.email)
    await gotoSandboxTab(page, `/sandboxes/${sandboxId}`, 'today')
    await hideDevtools(page)

    const card = page
      .getByTestId('timeline-event')
      .filter({ hasText: 'Midpoint reporting' })
    await card
      .getByRole('button', { name: 'Actions for Midpoint reporting' })
      .click()
    await page.getByRole('menuitem', { name: 'Adjust window' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Adjust Midpoint reporting')
    // Not moved yet: the history holds only the window's own creation, from
    // when the sandbox was opened.
    const before = dialog.getByTestId('event-history')
    await expect(before).toContainText(
      'Priya Raman generated Midpoint reporting',
    )
    await expect(before).toContainText('sandbox opened')
    await expect(before).not.toContainText('moved')

    await dialog.locator('#event-note').fill(REASON)
    const start = d(midpoint.window_start)
    const end = d(midpoint.window_end)
    await pickDay(page, 'event-start', start, plusDays(start, 14))
    await pickDay(page, 'event-end', end, plusDays(end, 14))
    await page.getByTestId('event-save').click()
    await expect(dialog).toHaveCount(0)

    await page.getByTestId('sandbox-tab-activity').click()
    await expect(page).toHaveURL(/\?tab=activity$/)
    const panel = page.getByTestId('activity-panel')
    await expect(panel).toBeVisible()
    const moved = rows(page).filter({ hasText: 'moved Midpoint reporting' })
    await expect(moved).toHaveCount(1)
    await expect(moved).toContainText('Priya Raman')
    await expect(moved.getByTestId('change-cause')).toHaveText(REASON)
    // People is on by default: the groups' members were filed too.
    await expect(rows(page).filter({ hasText: BRUNO.name })).not.toHaveCount(0)

    // The window's own dialog shows the same line.
    await page.getByTestId('sandbox-tab-today').click()
    await card
      .getByRole('button', { name: 'Actions for Midpoint reporting' })
      .click()
    await page.getByRole('menuitem', { name: 'Adjust window' }).click()
    const history = page.getByRole('dialog').getByTestId('event-history')
    await expect(history).toContainText('moved Midpoint reporting')
    await expect(history).toContainText(REASON)
  })

  test('a coach sees the move and their own group, not the other group’s people', async ({
    page,
  }) => {
    await login(page, USERS.marcus.email)
    await gotoSandboxTab(page, `/sandboxes/${sandboxId}`, 'activity')
    await hideDevtools(page)
    await expect(page.getByTestId('activity-panel')).toBeVisible()
    await expect(
      rows(page).filter({ hasText: 'moved Midpoint reporting' }),
    ).toHaveCount(1)
    await expect(rows(page).filter({ hasText: AISHA.name })).not.toHaveCount(0)
    await expect(rows(page).filter({ hasText: BRUNO.name })).toHaveCount(0)
    // Scope `groups`: no group filter to widen the page with.
    await expect(page.getByTestId('activity-group')).toHaveCount(0)
  })

  test('the client’s side has no tab and the link lands on their own view', async ({
    page,
  }) => {
    await login(page, USERS.dana.email)
    await gotoClientView(page, `/sandboxes/${sandboxId}`, '?tab=activity')
    await expect(page.getByTestId('sandbox-tab-activity')).toHaveCount(0)
    await expect(page.getByTestId('activity-panel')).toHaveCount(0)
    await expect(rows(page)).toHaveCount(0)
    await expect(page.getByTestId('client-view')).not.toContainText(REASON)
  })

  test('the admin filters the log by kind and by group', async ({ page }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'activity')
    await hideDevtools(page)
    const moved = rows(page).filter({ hasText: 'moved Midpoint reporting' })
    await expect(moved).toHaveCount(1)

    // Dates off: the move goes, the people stay.
    await page.getByTestId('activity-kind-dates').click()
    await expect(moved).toHaveCount(0)
    await expect(rows(page).filter({ hasText: AISHA.name })).not.toHaveCount(0)

    // One group: only its people.
    await page.getByTestId('activity-group').selectOption(groupTwoId)
    await expect(rows(page).filter({ hasText: BRUNO.name })).not.toHaveCount(0)
    await expect(rows(page).filter({ hasText: AISHA.name })).toHaveCount(0)
  })
})
