import { test, expect, type APIRequestContext } from '@playwright/test'
import { API, USERS, apiToken, auth, hideDevtools, login } from './helpers'

/**
 * Slice 1 — commitments assigned to a person.
 *
 *   • a client-owned row shows the client chip (dashed avatar: no login yet)
 *   • reassigning from the detail panel by keyboard moves it between sections
 *   • Escape inside the picker closes only the picker, not the panel
 *   • the admin hands a client-less commitment to a coach from /admin/commitments
 *   • the coach sees it under "for you", the bell deep-links, the page says "You"
 *
 * Fixtures: seed script (`reset`) — the e2e admin oversees Marcus and Priya
 * through CoachAccess, so both are in the admin's reach.
 */

const NADIA = { name: 'E2E Nadia Chip', email: 'nadia.chip@ptg-e2e.com' }

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

/**
 * Later specs assert exact bell counts for Marcus and Priya, so every row this
 * file creates is deleted again and the bells are cleared once it is done.
 */
const created: { id: string; by: string }[] = []

async function cleanup(request: APIRequestContext) {
  const tokens: Record<string, string> = {}
  for (const c of created.splice(0)) {
    tokens[c.by] ??= await apiToken(request, c.by)
    await request.delete(`${API}/commitments/${c.id}`, {
      headers: auth(tokens[c.by]),
    })
  }
  for (const who of [
    USERS.marcus.email,
    USERS.priya.email,
    USERS.admin.email,
  ]) {
    tokens[who] ??= await apiToken(request, who)
    await request.post(`${API}/notifications/read-all`, {
      headers: auth(tokens[who]),
    })
  }
}

async function nadiaClient(
  request: APIRequestContext,
  marcus: string,
): Promise<string> {
  const list = await api(
    request,
    marcus,
    'get',
    `/clients/?search=${encodeURIComponent(NADIA.email)}&per_page=50`,
  )
  const existing = (list.clients ?? []).find(
    (c: { email?: string }) => c.email?.toLowerCase() === NADIA.email,
  )
  if (existing) return existing.id
  const created = await api(request, marcus, 'post', '/clients/', NADIA)
  return created.id
}

test.describe('commitments — assign to a person', () => {
  test.afterEach(async ({ request }) => {
    await cleanup(request)
  })

  test('client row shows the client chip; keyboard reassign moves it; Escape closes only the picker', async ({
    page,
    request,
  }) => {
    const marcus = await apiToken(request, USERS.marcus.email)
    const clientId = await nadiaClient(request, marcus)
    const title = `E2E assign: weekly reflection ${Date.now()}`
    const made = await api(request, marcus, 'post', '/commitments/', {
      client_id: clientId,
      title,
      type: 'commitment',
      priority: 'medium',
    })
    created.push({ id: made.id, by: USERS.marcus.email })
    expect(made.assignee_kind).toBe('client')
    // Creating a client with an email links a *pending* login; that is not "joined".
    expect(made.assignee.has_account).toBe(false)

    await login(page, USERS.marcus.email)
    await page.goto('/commitments')
    await hideDevtools(page)

    const row = page.locator(
      `[data-testid="commitment-row"][data-id="${made.id}"]`,
    )
    await expect(row).toBeVisible()
    await expect(page.getByTestId('hub-section-clients')).toContainText(title)
    // A client's own row names the client once (the context link), no chip.
    await expect(row).toContainText(NADIA.name)
    await expect(row.getByTestId('assignee-chip')).toHaveCount(0)

    // Open the detail panel and reassign to the admin using only the keyboard.
    await row.getByTestId('commitment-row-title').click()
    await expect(page).toHaveURL(new RegExp(`open=${made.id}`))
    const picker = page.getByTestId('detail-assignee-picker')
    await expect(picker).toContainText(NADIA.name)
    await expect(picker.locator('.border-dashed')).toHaveCount(1) // no login yet → dashed avatar
    await picker.click()
    const search = page.getByTestId('detail-assignee-picker-search')
    await expect(search).toBeFocused()
    await search.fill('E2E Admin')
    await expect(
      page.locator('[data-testid="person-option"]').first(),
    ).toContainText('E2E Admin')
    await search.press('Enter')
    await expect(
      page.getByTestId('detail-assignee-picker-content'),
    ).toHaveCount(0)
    await expect(picker).toContainText('E2E Admin')
    await expect(page.getByText('Assigned to E2E Admin')).toBeVisible()
    await expect(page.getByTestId('hub-section-others')).toContainText(title)

    // Escape inside the picker closes the picker but leaves the panel open.
    await picker.click()
    await expect(
      page.getByTestId('detail-assignee-picker-content'),
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(
      page.getByTestId('detail-assignee-picker-content'),
    ).toHaveCount(0)
    await expect(page.getByTestId('commitment-fields')).toBeVisible()

    // The panel shows the person, never a role word.
    await expect(page.getByTestId('commitment-fields')).not.toContainText(
      /\bCoach\b/,
    )
    await expect(row.getByTestId('assignee-chip')).toContainText('E2E Admin')
  })

  test('admin hands a client-less commitment to Marcus from /admin/commitments', async ({
    page,
    request,
  }) => {
    const title = `E2E admin: prep Q3 review ${Date.now()}`
    await login(page, USERS.admin.email)
    await page.goto('/admin/commitments')
    await hideDevtools(page)
    await expect(page.getByTestId('commitments-hub-admin')).toBeVisible()
    await page.getByTestId('hub-create').click()
    await expect(page.getByTestId('commitment-create-panel')).toBeVisible()
    await page.getByTestId('commitment-title-input').fill(title)

    // Nothing anchors it yet (no client, no sandbox, nobody) → cannot create.
    await expect(page.getByTestId('commitment-create-submit')).toBeDisabled()

    await page.getByTestId('create-assignee-picker').click()
    const search = page.getByTestId('create-assignee-picker-search')
    await expect(search).toBeFocused() // Radix moves focus in after mount; type only then
    await search.fill('Marcus')
    await expect(
      page.locator('[data-testid="person-option"]').first(),
    ).toContainText('Marcus Bell')
    await search.press('Enter')
    await expect(page.getByTestId('create-assignee-picker')).toContainText(
      'Marcus Bell',
    )
    await expect(page.getByTestId('assignee-hint')).toContainText(
      'Marcus will be notified',
    )
    await expect(page.getByTestId('commitment-create-submit')).toBeEnabled()
    await page.getByTestId('commitment-create-submit').click()

    const row = page.locator('[data-testid="commitment-row"]', {
      hasText: title,
    })
    await expect(row).toBeVisible()
    await expect(row.getByTestId('assignee-chip')).toContainText('Marcus Bell')

    const admin = await apiToken(request, USERS.admin.email)
    const mine = await api(
      request,
      admin,
      'get',
      '/commitments/?involving_me=true&include_drafts=true',
    )
    const made = mine.find((c: { title: string }) => c.title === title)
    created.push({ id: made.id, by: USERS.admin.email })
    expect(made.client_id).toBeNull()
    expect(made.assignee_kind).toBe('user')
  })

  test('Marcus sees what was handed to him: "for you", view=mine, bell deep link says You', async ({
    page,
    request,
  }) => {
    const admin = await apiToken(request, USERS.admin.email)
    const marcusToken = await apiToken(request, USERS.marcus.email)
    const me = await api(request, marcusToken, 'get', '/auth/me')
    const marcusId = me.id ?? me.user?.id
    const title = `E2E admin: send Q3 report ${Date.now()}`
    const made = await api(request, admin, 'post', '/commitments/', {
      title,
      type: 'commitment',
      priority: 'high',
      assigned_to_id: marcusId,
    })
    created.push({ id: made.id, by: USERS.admin.email })
    expect(made.client_id).toBeNull()

    await login(page, USERS.marcus.email)
    await page.goto('/commitments?view=mine')
    await hideDevtools(page)
    const row = page.locator(
      `[data-testid="commitment-row"][data-id="${made.id}"]`,
    )
    await expect(row).toBeVisible()
    await expect(page.getByTestId('hub-stat-for-you')).not.toContainText(/^0\b/)

    await page.getByTestId('notification-bell').click()
    const item = page
      .locator(
        '[data-testid="notification-item"][data-event="commitment_assigned"]',
        { hasText: title },
      )
      .first()
    await expect(item).toBeVisible()
    await expect(item).toContainText('New for you')
    await item.click()
    await expect(page).toHaveURL(new RegExp(`/commitments/${made.id}`))
    await expect(page.getByTestId('commitment-context')).toContainText('You')
  })

  test("Priya's bell carries the admin's assignment and the page says You", async ({
    page,
    request,
  }) => {
    const admin = await apiToken(request, USERS.admin.email)
    const priyaToken = await apiToken(request, USERS.priya.email)
    const me = await api(request, priyaToken, 'get', '/auth/me')
    const priyaId = me.id ?? me.user?.id
    const title = `E2E admin: welcome call ${Date.now()}`
    const made = await api(request, admin, 'post', '/commitments/', {
      title,
      type: 'commitment',
      priority: 'medium',
      assigned_to_id: priyaId,
    })

    // No email for commitment events — in-app only.
    const rows = await api(
      request,
      priyaToken,
      'get',
      '/notifications/?unread_only=true',
    )
    const list = Array.isArray(rows) ? rows : (rows.notifications ?? rows.items)
    created.push({ id: made.id, by: USERS.admin.email })
    const mine = list.find(
      (n: { data?: { commitment_id?: string } }) =>
        n.data?.commitment_id === made.id,
    )
    expect(mine).toBeTruthy()
    expect(mine.emailed_at ?? null).toBeNull()

    await login(page, USERS.priya.email)
    await page.getByTestId('notification-bell').click()
    const item = page
      .locator('[data-testid="notification-item"]', { hasText: title })
      .first()
    await item.click()
    await expect(page).toHaveURL(new RegExp(`/commitments/${made.id}`))
    await expect(page.getByTestId('commitment-context')).toContainText('You')
    await expect(page.getByTestId('assignee-chip').first()).toContainText('You')
  })
})
