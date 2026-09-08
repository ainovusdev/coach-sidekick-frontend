import { expect, test } from '@playwright/test'
import { API, USERS, apiToken, auth, hideDevtools, login } from './helpers'

/**
 * The sandbox page is tabbed. What has to keep working:
 *
 *   • it opens on Today, and the tab you pick survives a refresh
 *   • every `#section` link written before the tabs existed still lands —
 *     notification payloads and the dashboard's attention rows use them
 *   • a person only gets the tabs they have something in
 *   • the commitment panel opens from any tab, not only the one that lists
 *     commitments
 */
test.describe.configure({ mode: 'serial' })

const NAME = 'E2E Tabs'
const ORG = 'PTG Tabs'

let sandboxId = ''

const activeTab = (page: import('@playwright/test').Page) =>
  page.getByTestId('sandbox-tabs').locator('[role="tab"][data-state="active"]')

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
    await page.getByTestId('sandbox-tab-groups').click()
    await expect(page).toHaveURL(/\?tab=groups$/)
    await expect(page.getByTestId('groups-panel')).toBeVisible()

    // A refresh comes back to the same place.
    await page.reload()
    await expect(activeTab(page)).toHaveAttribute(
      'data-testid',
      'sandbox-tab-groups',
    )
    // Nonsense in the URL falls back to Today rather than showing nothing.
    await page.goto(`/admin/sandboxes/${sandboxId}?tab=nowhere`)
    await expect(activeTab(page)).toHaveAttribute(
      'data-testid',
      'sandbox-tab-today',
    )
  })

  test('each section keeps its own tab', async ({ page }) => {
    await login(page, USERS.admin.email)
    const on = async (tab: string, testid: string) => {
      await page.goto(`/admin/sandboxes/${sandboxId}?tab=${tab}`)
      await expect(page.getByTestId(testid)).toBeVisible()
    }
    await on('timeline', 'timeline-panel')
    await on('outcomes', 'outcomes-panel')
    await on('team', 'team-panel')
    await on('groups', 'delivery-panel')
    await on('general', 'vision-panel')
    await on('settings', 'settings-panel')
    await on('today', 'commitments-panel')
  })

  test('the anchors older links use still land', async ({ page }) => {
    await login(page, USERS.admin.email)
    // Written by notification payloads and by attentionHref on the dashboard.
    const landings: [string, string][] = [
      ['timeline', 'timeline'],
      ['vision', 'general'],
      ['outcomes', 'outcomes'],
      ['commitments', 'today'],
      ['team', 'team'],
      ['invitations', 'team'],
      ['delivery', 'groups'],
      ['groups', 'groups'],
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

    // And it opens from a timeline card, where no commitment list is mounted.
    await page.goto(`/admin/sandboxes/${sandboxId}?tab=timeline`)
    await expect(page.getByTestId('commitments-panel')).toHaveCount(0)
    await page.getByTestId('timeline-event').first().click()
    await expect(panel).toHaveAttribute('data-open', 'true')
  })

  test('their side gets no Settings tab', async ({ page }) => {
    await login(page, USERS.dana.email)
    await page.goto(`/sandboxes/${sandboxId}`)
    await hideDevtools(page)
    await expect(page.getByTestId('sandbox-tabs')).toBeVisible()
    await expect(page.getByTestId('sandbox-tab-settings')).toHaveCount(0)
    await expect(page.getByTestId('sandbox-tab-today')).toBeVisible()
    // …and asking for it by hand still shows them the page, on Today.
    await page.goto(`/sandboxes/${sandboxId}?tab=settings`)
    await expect(page.getByTestId('settings-panel')).toHaveCount(0)
    await expect(page.getByTestId('sandbox-cockpit')).toBeVisible()
  })
})
