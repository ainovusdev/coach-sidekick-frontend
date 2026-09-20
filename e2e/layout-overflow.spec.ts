import { expect, test } from '@playwright/test'
import { API, USERS, apiToken, auth, login } from './helpers'

/**
 * No page scrolls sideways.
 *
 * Every one of these was a real bug, and none of them failed a functional test:
 * the header's account cluster outgrew its container once a viewer had the
 * Admin button, five nav labels did not fit a tablet, the upcoming-session rows
 * and the session-history actions could not wrap on a phone, and the sandbox
 * card grid sized its one implicit column to its longest truncated title.
 *
 * The admin is the wide case for the header (one more button) and for the
 * sandbox list (the seeded programme names are long); Marcus is the wide case
 * for the home page (upcoming sessions, the strip, his groups).
 */
const WIDTHS = [1440, 1280, 1024, 768, 390]

const CASES = [
  { who: 'marcus', paths: ['/', '/sessions', '/clients'] },
  { who: 'admin', paths: ['/', '/sandboxes', '/sessions'] },
] as const

for (const { who, paths } of CASES) {
  test(`${who}: nothing is wider than the screen`, async ({ page }) => {
    await login(page, USERS[who].email)
    for (const path of paths) {
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(path)
        await page.waitForLoadState('networkidle').catch(() => {})
        const over = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        )
        expect(over, `${path} at ${width}px`).toBeLessThanOrEqual(0)
      }
    }
  })
}

test('People and Groups on a sandbox fit every width', async ({
  page,
  request,
}) => {
  // Three lists on People, a table of pairings and a grid of cards on Groups.
  const token = await apiToken(request, USERS.admin.email)
  const resp = await request.get(`${API}/sandboxes/`, { headers: auth(token) })
  const list = await resp.json()
  const sandboxes = Array.isArray(list) ? list : (list.sandboxes ?? list.items)
  expect(sandboxes.length).toBeGreaterThan(0)
  await login(page, USERS.admin.email)
  for (const tab of ['people', 'groups', 'commitments']) {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(`/sandboxes/${sandboxes[0].id}?tab=${tab}`)
      await expect(page.getByTestId(`sandbox-tab-${tab}`)).toHaveAttribute(
        'data-state',
        'active',
      )
      await page.waitForLoadState('networkidle').catch(() => {})
      const over = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      )
      expect(over, `${tab} at ${width}px`).toBeLessThanOrEqual(0)
    }
  }
})

test('a phone keeps an upcoming session title clear of its date', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await login(page, USERS.marcus.email)
  await page.goto('/')
  const row = page
    .locator('div.group', { has: page.getByTitle('Click to reschedule') })
    .first()
  await expect(row).toBeVisible()
  const title = await row.getByTitle('Click to edit title').boundingBox()
  const date = await row.getByTitle('Click to reschedule').boundingBox()
  // Stacked, not overlapping: the title used to shrink to nothing and print
  // its text straight over the date.
  expect(title!.y + title!.height).toBeLessThanOrEqual(date!.y + 1)
})
