import {
  test,
  expect,
  request as playwrightRequest,
  type APIRequestContext,
} from '@playwright/test'
import {
  API,
  apiToken,
  auth,
  buildGroup,
  clientSection,
  gotoClientView,
  hideDevtools,
  login,
  USERS,
} from './helpers'

/**
 * Slice 3 — commitments on a sandbox.
 *
 *   • the admin hands Priya a private commitment from the cockpit's
 *     Commitments panel (the private switch is on by default: their side is
 *     in the room)
 *   • Dana (their side, supervisor) does not see it — in the cockpit or the API
 *   • Priya sees it at #commitments with the lock, and in /commitments?sandbox=
 *   • her bell opens the page (it names the sandbox); the cockpit deep link
 *     opens the panel and closing it clears the params
 *
 * Fixtures: seed script (`reset`); the sandbox is built here through the API.
 */

const NAME = 'E2E Commitments Sandbox'
const TARIQ = { email: 'e2e-tariq-cmt@ptg-e2e.com', name: 'Tariq Haddad' }

function termStart(): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 2)
  return d.toISOString().slice(0, 10)
}

async function api(
  request: APIRequestContext,
  token: string,
  method: 'get' | 'post' | 'delete',
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

let sandboxId = ''
let commitmentId = ''

test.describe('Sandboxes — commitments', () => {
  test.describe.configure({ mode: 'serial' })

  test.afterAll(async () => {
    const ctx = await playwrightRequest.newContext()
    try {
      const admin = await apiToken(ctx, USERS.admin.email)
      if (commitmentId)
        await ctx.delete(`${API}/commitments/${commitmentId}`, {
          headers: auth(admin),
        })
      for (const who of [
        USERS.admin.email,
        USERS.priya.email,
        USERS.dana.email,
      ]) {
        const t = await apiToken(ctx, who)
        await ctx.post(`${API}/notifications/read-all`, { headers: auth(t) })
      }
    } finally {
      await ctx.dispose()
    }
  })

  test('the admin hands Priya a private commitment from the cockpit', async ({
    page,
    request,
  }) => {
    const token = await apiToken(request, USERS.admin.email)
    const created = await api(request, token, 'post', '/sandboxes/', {
      name: NAME,
      organisation: 'PTG',
      term_start: termStart(),
      term_months: 6,
    })
    sandboxId = created.sandbox.id
    const priya = (
      await api(request, token, 'get', '/sandboxes/people/search?q=priya')
    )[0]
    await api(request, token, 'post', `/sandboxes/${sandboxId}/members`, {
      side: 'theirs',
      roles: ['supervisor'],
      email: USERS.dana.email,
      name: USERS.dana.name,
    })
    await buildGroup(request, token, sandboxId, {
      coach_user_ids: [priya.id],
      coachees: [TARIQ],
    })

    await login(page, USERS.admin.email)
    await page.goto(`/admin/sandboxes/${sandboxId}`)
    await hideDevtools(page)
    const panel = page.getByTestId('commitments-panel')
    await expect(panel).toBeVisible()
    await expect(panel.getByTestId('sandbox-commitments-empty')).toBeVisible()

    await panel.getByTestId('sandbox-commitments-new').click()
    await expect(page.getByTestId('commitment-create-panel')).toBeVisible()
    await page
      .getByTestId('commitment-title-input')
      .fill('Prep the kickoff deck')
    // Shared means our side of the sandbox (their side never reads the
    // team's list), so the row starts shared; make this one private by hand.
    const priv = page.getByTestId('create-private-toggle')
    await expect(priv).toHaveAttribute('aria-checked', 'false')
    await priv.click()
    await expect(priv).toHaveAttribute('aria-checked', 'true')

    await page.getByTestId('create-assignee-picker').click()
    const search = page.getByTestId('create-assignee-picker-search')
    await expect(search).toBeFocused()
    await search.fill('Pri')
    await page
      .getByTestId('person-option')
      .filter({ hasText: 'Priya Raman' })
      .first()
      .click()
    await page.getByTestId('commitment-create-submit').click()

    const row = panel
      .getByTestId('commitment-row')
      .filter({ hasText: 'Prep the kickoff deck' })
    await expect(row).toBeVisible()
    await expect(row.getByTestId('commitment-private')).toBeVisible()
    await expect(row.getByTestId('assignee-chip')).toContainText('Priya')
    commitmentId = (await row.getAttribute('data-id')) ?? ''
    expect(commitmentId).not.toBe('')
    // The header repeated these counts; now only the chips carry them.
    await expect(
      panel.getByTestId('sandbox-commitments-filter-all'),
    ).toContainText('1')
  })

  test('their side does not see it', async ({ page, request }) => {
    expect(commitmentId).not.toBe('')
    const dana = await apiToken(request, USERS.dana.email)
    const list = await api(
      request,
      dana,
      'get',
      `/commitments/?sandbox_id=${sandboxId}&include_drafts=true`,
    )
    const rows = Array.isArray(list) ? list : list.commitments
    expect(rows).toHaveLength(0)

    // Their side reads the client view, where `#commitments` means "what
    // needs you": our internal work never reaches it, by any name.
    await login(page, USERS.dana.email)
    await gotoClientView(page, `/sandboxes/${sandboxId}`, '#commitments')
    await hideDevtools(page)
    await expect(page.getByTestId('commitments-panel')).toHaveCount(0)
    await expect(page.getByTestId('commitment-row')).toHaveCount(0)
    await expect(page.getByTestId('needs-commitment')).toHaveCount(0)
    await expect(
      clientSection(page, 'needs').getByTestId('needs-you-empty'),
    ).toBeVisible()
    await expect(page.getByTestId('client-view')).not.toContainText(
      'Prep the kickoff deck',
    )
  })

  test('Priya sees it in the cockpit, the hub, and through the deep link', async ({
    page,
  }) => {
    expect(commitmentId).not.toBe('')
    await login(page, USERS.priya.email)

    // A coach's bell opens the full page, which names the sandbox.
    await page.getByTestId('notification-bell').click()
    const note = page
      .getByTestId('notification-item')
      .filter({ hasText: 'Prep the kickoff deck' })
      .first()
    await expect(note).toBeVisible()
    await note.click()
    await page.waitForURL(
      url => url.pathname === `/commitments/${commitmentId}`,
    )
    await hideDevtools(page)
    await expect(page.getByTestId('commitment-context')).toContainText(NAME)
    await expect(page.getByTestId('detail-assignee-picker')).toContainText(
      'You',
    )

    // The cockpit deep link (what a role-less member's bell uses) opens the panel.
    await page.goto(
      `/sandboxes/${sandboxId}?commitment=${commitmentId}#commitments`,
    )
    await hideDevtools(page)
    await expect(page.getByTestId('commitment-fields')).toBeVisible()
    await expect(page.getByTestId('detail-assignee-picker')).toContainText(
      'You',
    )
    // Closing the panel clears the deep link.
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('commitment-fields')).toHaveCount(0)
    await expect
      .poll(() => new URL(page.url()).searchParams.get('commitment'))
      .toBeNull()

    const panel = page.getByTestId('commitments-panel')
    const row = panel
      .getByTestId('commitment-row')
      .filter({ hasText: 'Prep the kickoff deck' })
    await expect(row).toBeVisible()
    await expect(row.getByTestId('commitment-private')).toBeVisible()
    await expect(
      panel.getByTestId('sandbox-commitments-filter-mine'),
    ).toContainText('1')
    await panel.getByTestId('sandbox-commitments-filter-mine').click()
    await expect(row).toBeVisible()

    // The whole list is a tab of its own…
    await panel.getByTestId('sandbox-commitments-see-all').click()
    await expect(page.getByTestId('commitments-tab')).toBeVisible()
    await expect(
      page
        .getByTestId('commitment-item')
        .filter({ hasText: 'Prep the kickoff deck' }),
    ).toBeVisible()

    // …and the hub still filters to this sandbox.
    await page.goto(`/commitments?sandbox=${sandboxId}`)
    await hideDevtools(page)
    await expect(page.getByTestId('hub-sandbox-chip')).toContainText(NAME)
    await expect(
      page
        .getByTestId('commitment-row')
        .filter({ hasText: 'Prep the kickoff deck' }),
    ).toBeVisible()
  })
})
