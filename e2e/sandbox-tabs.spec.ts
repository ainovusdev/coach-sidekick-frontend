import { expect, test } from '@playwright/test'
import {
  API,
  USERS,
  apiToken,
  auth,
  gotoClientView,
  hideDevtools,
  login,
} from './helpers'

/**
 * The sandbox page is tabbed — six of them, one per job. What has to keep
 * working:
 *
 *   • it opens on Today, and the tab you pick survives a refresh
 *   • every `#section` link written before the tabs existed still lands —
 *     notification payloads and the dashboard's attention rows use them
 *   • so do the tab names from when there were eight of them, which are in
 *     bookmarks and in copied links
 *   • the commitment panel opens from any tab, not only the one that lists
 *     commitments
 */
test.describe.configure({ mode: 'serial' })

const NAME = 'E2E Tabs'
const ORG = 'PTG Tabs'

let sandboxId = ''

type Page = import('@playwright/test').Page

const activeTab = (page: Page) =>
  page.getByTestId('sandbox-tabs').locator('[role="tab"][data-state="active"]')

/** Visible is not the same as reachable: a sticky bar can sit on top of it. */
function inView(page: Page, id: string) {
  return page.evaluate(section => {
    const el = document.getElementById(section)
    if (!el) return 'missing'
    const box = el.getBoundingClientRect()
    return box.top < window.innerHeight && box.bottom > 0
      ? 'in view'
      : 'off screen'
  }, id)
}

test.describe('Sandboxes — the page is tabbed', () => {
  test('builds the fixture', async ({ request }) => {
    const token = await apiToken(request, USERS.admin.email)
    const start = new Date()
    start.setMonth(start.getMonth() - 2)
    start.setDate(1)
    const resp = await request.post(`${API}/sandboxes/`, {
      headers: auth(token),
      data: {
        name: NAME,
        organisation: ORG,
        term_start: start.toISOString().slice(0, 10),
        term_months: 6,
        vision: 'Every leader here runs a one-to-one worth having.',
        links: [{ label: 'Proposal', url: 'https://example.com/proposal' }],
      },
    })
    expect(resp.status()).toBe(201)
    sandboxId = (await resp.json()).sandbox.id

    // Their side, so the invitations section exists to be anchored to.
    const added = await request.post(`${API}/sandboxes/${sandboxId}/members`, {
      headers: auth(token),
      data: {
        side: 'theirs',
        roles: ['primary_client'],
        email: USERS.dana.email,
        name: USERS.dana.name,
      },
    })
    expect(added.status()).toBe(201)
  })

  test('opens on Today and remembers the tab you pick', async ({ page }) => {
    await login(page, USERS.admin.email)
    await page.goto(`/admin/sandboxes/${sandboxId}`)
    await hideDevtools(page)

    await expect(activeTab(page)).toHaveAttribute(
      'data-testid',
      'sandbox-tab-today',
    )
    await page.getByTestId('sandbox-tab-people').click()
    await expect(page).toHaveURL(/\?tab=people$/)
    await expect(page.getByTestId('people-table')).toBeVisible()
    // Groups moved off People onto a tab of their own.
    await expect(page.getByTestId('groups-panel')).toHaveCount(0)

    // A refresh comes back to the same place.
    await page.reload()
    await expect(activeTab(page)).toHaveAttribute(
      'data-testid',
      'sandbox-tab-people',
    )
    // Nonsense in the URL falls back to Today rather than showing nothing.
    await page.goto(`/admin/sandboxes/${sandboxId}?tab=nowhere`)
    await expect(activeTab(page)).toHaveAttribute(
      'data-testid',
      'sandbox-tab-today',
    )
  })

  test('each tab shows its own work', async ({ page }) => {
    await login(page, USERS.admin.email)
    const on = async (tab: string, testid: string) => {
      await page.goto(`/admin/sandboxes/${sandboxId}?tab=${tab}`)
      await expect(page.getByTestId(testid)).toBeVisible()
    }
    await on('today', 'timeline-panel')
    await on('today', 'commitments-panel')
    await on('delivery', 'insights-panel')
    await on('outcomes', 'outcomes-panel')
    await on('people', 'people-table')
    await on('groups', 'pairings-panel')
    await on('groups', 'groups-panel')
    await on('settings', 'settings-panel')
    await on('settings', 'vision-panel')
  })

  test('the tab names from the eight-tab page still land', async ({ page }) => {
    await login(page, USERS.admin.email)
    // In bookmarks, in copied links, and in whatever is open right now.
    const aliases: [string, string][] = [
      ['insights', 'delivery'],
      ['timeline', 'today'],
      ['team', 'people'],
      ['general', 'settings'],
    ]
    for (const [was, now] of aliases) {
      await page.goto(`/admin/sandboxes/${sandboxId}?tab=${was}`)
      await expect(activeTab(page)).toHaveAttribute(
        'data-testid',
        `sandbox-tab-${now}`,
      )
    }
  })

  test('the anchors older links use still land', async ({ page }) => {
    await login(page, USERS.admin.email)
    // Written by notification payloads and by attentionHref on the dashboard.
    const landings: [string, string][] = [
      ['insights', 'delivery'],
      ['delivery', 'delivery'],
      ['timeline', 'today'],
      ['commitments', 'today'],
      ['outcomes', 'outcomes'],
      ['team', 'people'],
      ['invitations', 'people'],
      ['groups', 'groups'],
      ['vision', 'settings'],
    ]
    for (const [anchor, tab] of landings) {
      await page.goto(`/admin/sandboxes/${sandboxId}#${anchor}`)
      await expect(activeTab(page)).toHaveAttribute(
        'data-testid',
        `sandbox-tab-${tab}`,
      )
      await expect(page.locator(`#${anchor}`)).toBeVisible()
    }
  })

  test('#delivery lands in the viewport even when reporting is slow', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    // Delivery mounts nothing until analytics arrives, and the scroll fires
    // two frames after the tab is picked — so without landing a second time
    // the link picks the right tab and scrolls nowhere.
    await page.route('**/analytics?*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1200))
      await route.continue()
    })
    await page.goto(`/admin/sandboxes/${sandboxId}#delivery`)
    await hideDevtools(page)
    await expect(activeTab(page)).toHaveAttribute(
      'data-testid',
      'sandbox-tab-delivery',
    )
    await expect(page.getByTestId('delivery-panel')).toBeVisible()
    await expect.poll(() => inView(page, 'delivery')).toBe('in view')
    await page.unroute('**/analytics?*')
  })

  test('#invitations lands even when the roster is filtered to nobody', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await page.goto(`/admin/sandboxes/${sandboxId}?tab=people`)
    await hideDevtools(page)
    // Both side cards disappear when nothing matches, so the anchor cannot
    // live on one of them.
    await page.getByTestId('people-search').fill('nobody at all')
    await expect(page.getByTestId('their-side')).toHaveCount(0)
    await page.evaluate(() => {
      window.location.hash = '#invitations'
    })
    await expect.poll(() => inView(page, 'invitations')).toBe('in view')
  })

  test('a commitment opens from the tab you are on', async ({
    page,
    request,
  }) => {
    const token = await apiToken(request, USERS.admin.email)
    const made = await request.post(`${API}/commitments/`, {
      headers: auth(token),
      data: { title: 'E2E Tabs — book the room', sandbox_id: sandboxId },
    })
    expect(made.ok()).toBe(true)
    const commitmentId = (await made.json()).id

    await login(page, USERS.admin.email)
    // A bell link carries the commitment, whatever tab it lands on.
    await page.goto(`/admin/sandboxes/${sandboxId}?commitment=${commitmentId}`)
    await hideDevtools(page)
    const panel = page.getByTestId('commitment-detail-panel')
    await expect(panel).toHaveAttribute('data-open', 'true')
    await expect(panel).toContainText('book the room')

    // Closing it takes the deep link out of the URL and leaves the tab alone.
    await page.keyboard.press('Escape')
    await expect(panel).toHaveAttribute('data-open', 'false')
    await expect(page).not.toHaveURL(/commitment=/)

    // And it opens on a tab where no commitment list is mounted at all.
    await page.goto(
      `/admin/sandboxes/${sandboxId}?tab=delivery&commitment=${commitmentId}`,
    )
    await expect(page.getByTestId('commitments-panel')).toHaveCount(0)
    await expect(panel).toHaveAttribute('data-open', 'true')
    await expect(panel).toContainText('book the room')

    // A timeline card opens its event's commitment from Today.
    await page.goto(`/admin/sandboxes/${sandboxId}?tab=today`)
    await page.getByTestId('timeline-event').first().click()
    await expect(panel).toHaveAttribute('data-open', 'true')
  })

  test('their side gets no tabs at all, and no settings by hand', async ({
    page,
  }) => {
    await login(page, USERS.dana.email)
    await gotoClientView(page, `/sandboxes/${sandboxId}`)
    await hideDevtools(page)
    // The client view is one page: the tab bar and Settings are both ours.
    await expect(page.getByTestId('sandbox-tabs')).toHaveCount(0)
    await expect(page.getByTestId('sandbox-tab-settings')).toHaveCount(0)
    await expect(page.getByTestId('client-nav')).toBeVisible()
    // …and asking for Settings by hand still shows them their own page.
    await gotoClientView(page, `/sandboxes/${sandboxId}`, '?tab=settings')
    await expect(page.getByTestId('settings-panel')).toHaveCount(0)
    await expect(page.getByTestId('sandbox-cockpit')).toHaveCount(0)
    await expect(page.getByTestId('client-hero')).toBeVisible()
  })
})
