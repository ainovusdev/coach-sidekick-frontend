import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test'
import {
  API,
  PASSWORD,
  USERS,
  apiToken,
  auth,
  invitationToken,
  login,
} from './helpers'

/**
 * Phase 2 — the member view. One route tree at /sandboxes for everyone on
 * a sandbox; what each person sees and may change is decided by the API.
 *
 * Fixture (built through the API as the admin): "E2E Access" · Marcus is
 * the lead coach and coaches Yusuf 1:1 · Priya coaches "Managers" with Wren
 * · Dana (has an account) supervises Managers · Omar (has an account, no
 * app role) is the primary client admin · Kofi-like coachee Yusuf accepts
 * his invitation so he has a portal.
 */
test.describe.configure({ mode: 'serial' })

const NAME = 'E2E Access'
const ORG = 'PTG'
const YUSUF = { email: 'e2e-yusuf@ptg-e2e.com', name: 'Yusuf Bello' }
const WREN = { email: 'e2e-wren@ptg-e2e.com', name: 'Wren Adeyemi' }
const IMANI = { email: 'e2e-imani@ptg-e2e.com', name: 'Imani Cole' }

let sandboxId = ''
let otherSandboxId = ''

async function api(
  request: APIRequestContext,
  token: string,
  method: 'get' | 'post' | 'put',
  path: string,
  data?: unknown,
) {
  const resp = await request[method](`${API}${path}`, {
    headers: auth(token),
    data,
  })
  if (!resp.ok())
    throw new Error(`${method} ${path} → ${resp.status()} ${await resp.text()}`)
  return resp.json()
}

async function expectReadOnlyCockpit(page: Page) {
  await expect(page.getByTestId('sandbox-cockpit')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Edit sandbox details' }),
  ).toHaveCount(0)
  await expect(page.getByTestId('add-event')).toHaveCount(0)
  await expect(page.getByTestId('event-menu')).toHaveCount(0)
  await expect(page.getByTestId('setup-card')).toHaveCount(0)
  await expect(page.getByTestId('invitations-panel')).toHaveCount(0)
  await expect(page.getByTestId('new-group')).toHaveCount(0)
  await expect(page.getByTestId('add-another-group')).toHaveCount(0)
  // The timeline is a calendar: no card opens its commitment.
  await expect(page.getByTestId('timeline-event').first()).toBeVisible()
  await expect(page.locator('[data-commitment-id]')).toHaveCount(0)
  await expect(page.getByTestId('event-progress')).toHaveCount(0)
}

test.describe('Sandboxes — member access', () => {
  test('builds the fixture', async ({ request }) => {
    const token = await apiToken(request, USERS.admin.email)
    const created = await api(request, token, 'post', '/sandboxes/', {
      name: NAME,
      organisation: ORG,
      term_start: '2026-06-01',
      term_months: 6,
      links: [{ label: 'Proposal', url: 'https://drive.novus.com/access' }],
    })
    sandboxId = created.sandbox.id
    const marcus = (
      await api(request, token, 'get', '/sandboxes/people/search?q=marcus')
    )[0]
    const priya = (
      await api(request, token, 'get', '/sandboxes/people/search?q=priya')
    )[0]
    await api(request, token, 'post', `/sandboxes/${sandboxId}/members`, {
      side: 'ours',
      roles: ['lead_coach'],
      user_id: marcus.id,
    })
    await api(request, token, 'post', `/sandboxes/${sandboxId}/members`, {
      side: 'theirs',
      roles: ['primary_client_admin'],
      email: USERS.omar.email,
      name: USERS.omar.name,
    })
    const dana = await api(
      request,
      token,
      'post',
      `/sandboxes/${sandboxId}/members`,
      {
        side: 'theirs',
        roles: ['supervisor'],
        email: USERS.dana.email,
        name: USERS.dana.name,
      },
    )
    await api(request, token, 'post', `/sandboxes/${sandboxId}/groups`, {
      coach_user_ids: [marcus.id],
      coachees: [YUSUF],
      hours_per_coachee: 13.5,
      cadence: { shape: 'range', min: 2, max: 3, per: 'month' },
    })
    await api(request, token, 'post', `/sandboxes/${sandboxId}/groups`, {
      name: 'Managers',
      coach_user_ids: [priya.id],
      coachees: [WREN],
      hours_per_coachee: 10,
      cadence: { shape: 'rate', count: 1, per: 'fortnight' },
      supervisor_member_ids: [dana.id],
    })
    // Yusuf signs up through his invitation, so he has a portal.
    const overview = await api(
      request,
      token,
      'get',
      `/sandboxes/${sandboxId}/overview`,
    )
    const yusuf = overview.members.find(
      (m: { email: string }) => m.email === YUSUF.email,
    )
    await api(request, token, 'post', `/sandboxes/${sandboxId}/invitations`, {
      member_ids: [yusuf.id],
    })
    const { token: invite } = invitationToken(YUSUF.email)
    const signup = await request.post(
      `${API}/sandbox-invitations/accept-signup`,
      {
        data: { token: invite, password: PASSWORD, full_name: YUSUF.name },
      },
    )
    expect(signup.ok()).toBeTruthy()

    // Imani, the primary client, signs up too. Not a coachee, so no app role.
    const imani = await api(
      request,
      token,
      'post',
      `/sandboxes/${sandboxId}/members`,
      {
        side: 'theirs',
        roles: ['primary_client'],
        email: IMANI.email,
        name: IMANI.name,
      },
    )
    await api(request, token, 'post', `/sandboxes/${sandboxId}/invitations`, {
      member_ids: [imani.id],
    })
    const { token: imaniInvite } = invitationToken(IMANI.email)
    const imaniSignup = await request.post(
      `${API}/sandbox-invitations/accept-signup`,
      {
        data: { token: imaniInvite, password: PASSWORD, full_name: IMANI.name },
      },
    )
    expect(imaniSignup.ok()).toBeTruthy()

    // A second sandbox nobody but the admin is on.
    const other = await api(request, token, 'post', '/sandboxes/', {
      name: 'E2E Access B',
      organisation: 'Other Org',
      term_start: '2026-07-01',
      term_months: 3,
    })
    otherSandboxId = other.sandbox.id
  })

  test('a lead coach reaches the sandbox from /sandboxes and manages groups but not the term', async ({
    page,
  }) => {
    await login(page, USERS.marcus.email)
    await page.goto('/sandboxes')
    await expect(page.getByTestId('my-sandboxes')).toBeVisible()
    const card = page.getByTestId('sandbox-card').filter({ hasText: NAME })
    await expect(card).toContainText('Lead coach')
    await card.click()
    await page.waitForURL(new RegExp(`/sandboxes/${sandboxId}$`))

    await expect(page.getByTestId('sandbox-view')).toHaveAttribute(
      'data-audience',
      'ours',
    )
    await expect(page.getByTestId('sandbox-cockpit')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Edit sandbox details' }),
    ).toHaveCount(0)
    await expect(page.getByTestId('add-event')).toHaveCount(0)
    await expect(page.getByTestId('setup-card')).toHaveCount(0)
    await expect(page.getByTestId('invitations-panel')).toHaveCount(0)
    await expect(page.getByTestId('people-link')).toHaveCount(0)
    // our side keeps the working links
    await expect(page.getByTestId('links-card')).toContainText('Proposal')
    // a lead coach manages groups: sees every group and the group tools
    await expect(page.getByTestId('group-card')).toHaveCount(2)
    await expect(page.getByTestId('new-group')).toBeVisible()
    await expect(page.getByTestId('groups-scope-note')).toHaveCount(0)
    await page.getByRole('button', { name: 'Actions for Managers' }).click()
    await expect(
      page.getByRole('menuitem', { name: 'Edit group' }),
    ).toBeVisible()
    await page.keyboard.press('Escape')
    // the breadcrumb leads back to the member index, not the admin panel
    await expect(
      page.getByTestId('identity-card').getByRole('link', {
        name: 'My sandboxes',
      }),
    ).toHaveAttribute('href', '/sandboxes')
  })

  test('a plain coach is read-only and sees only their own group', async ({
    page,
  }) => {
    await login(page, USERS.priya.email)
    await page.goto(`/sandboxes/${sandboxId}`)
    await expectReadOnlyCockpit(page)
    await expect(page.getByTestId('groups-scope-note')).toBeVisible()
    await expect(page.getByTestId('group-card')).toHaveCount(1)
    await expect(page.getByTestId('group-card')).toContainText('Managers')
    await expect(
      page.getByRole('button', { name: 'Actions for Managers' }),
    ).toHaveCount(0)
    const team = page.getByTestId('team-panel')
    await expect(team).toContainText(WREN.name)
    await expect(team).toContainText(USERS.marcus.name) // lead coach is a contact
    await expect(team).not.toContainText(YUSUF.name) // the other group's coachee
    await expect(
      team.getByRole('button', { name: /^Actions for/ }),
    ).toHaveCount(0)
  })

  test('a coach who is not on a sandbox is told it is not there', async ({
    page,
    request,
  }) => {
    const token = await apiToken(request, USERS.priya.email)
    const resp = await request.get(
      `${API}/sandboxes/${otherSandboxId}/overview`,
      { headers: auth(token) },
    )
    expect(resp.status()).toBe(404)
    await login(page, USERS.priya.email)
    await page.goto(`/sandboxes/${otherSandboxId}`)
    // the heading, not the 404 toast that carries the same words for a moment
    await expect(
      page.getByRole('heading', { name: 'Sandbox not found' }),
    ).toBeVisible()
  })

  test('a primary client admin with no app role lands in the minimal chrome and sees the whole sandbox, read-only', async ({
    page,
  }) => {
    await login(page, USERS.omar.email)
    await page.waitForURL(/\/sandboxes$/)
    await expect(page.getByTestId('sandbox-header')).toBeVisible()
    await page.getByTestId('sandbox-card').filter({ hasText: NAME }).click()
    await page.waitForURL(new RegExp(`/sandboxes/${sandboxId}$`))

    await expect(page.getByTestId('sandbox-view')).toHaveAttribute(
      'data-audience',
      'theirs',
    )
    await expectReadOnlyCockpit(page)
    await expect(page.getByTestId('links-card')).toHaveCount(0)
    await expect(page.getByTestId('vision-empty')).toBeVisible()
    await expect(page.getByTestId('timeline-event')).toHaveCount(5)
    await expect(page.getByTestId('group-card')).toHaveCount(2)
    await expect(page.getByTestId('groups-scope-note')).toHaveCount(0)
    await expect(page.getByTestId('people-link')).toHaveCount(0)
    await expect(page.getByTestId('team-panel')).not.toContainText(
      'No one is emailed yet',
    )
  })

  test('a primary client who signed up from her invitation signs in to the sandboxes list, not the portal', async ({
    page,
  }) => {
    await login(page, IMANI.email)
    await page.waitForURL(/\/sandboxes$/)
    await expect(
      page.getByText("You don't have access to the portal"),
    ).toHaveCount(0)
    await expect(
      page.getByTestId('sandbox-card').filter({ hasText: NAME }),
    ).toBeVisible()
  })

  test('a supervisor sees only the group they supervise', async ({ page }) => {
    await login(page, USERS.dana.email)
    await page.goto(`/sandboxes/${sandboxId}`)
    await expectReadOnlyCockpit(page)
    await expect(page.getByTestId('groups-scope-note')).toBeVisible()
    await expect(page.getByTestId('group-card')).toHaveCount(1)
    await expect(page.getByTestId('group-card')).toContainText('Managers')
    await expect(page.getByTestId('links-card')).toHaveCount(0)
    await expect(page.getByTestId('team-panel')).not.toContainText(YUSUF.name)
    await expect(page.getByTestId('timeline-event')).toHaveCount(5)
  })

  test('a coachee sees their own coaching under the portal header', async ({
    page,
  }) => {
    await login(page, YUSUF.email)
    await page.goto(`/sandboxes/${sandboxId}`)
    await expect(page.getByTestId('sandbox-view')).toHaveAttribute(
      'data-audience',
      'coachee',
    )
    await expectReadOnlyCockpit(page)
    await expect(page.getByTestId('group-card')).toHaveCount(1)
    await expect(page.getByTestId('group-card')).toContainText('Marcus')
    await expect(page.getByTestId('timeline-event')).toHaveCount(2)
    await expect(page.getByTestId('team-panel')).not.toContainText(WREN.name)
  })

  test('the welcome link now lands on the sandbox itself', async ({ page }) => {
    await login(page, USERS.omar.email)
    await page.goto(`/sandboxes/welcome/${sandboxId}`)
    await page.waitForURL(new RegExp(`/sandboxes/${sandboxId}$`))
    await expect(page.getByTestId('sandbox-cockpit')).toBeVisible()
  })

  test('an admin at /sandboxes/{id} keeps every control', async ({ page }) => {
    await login(page, USERS.admin.email)
    await page.goto(`/sandboxes/${sandboxId}`)
    await expect(page.getByTestId('sandbox-view')).toHaveAttribute(
      'data-audience',
      'ours',
    )
    await expect(
      page.getByRole('button', { name: 'Edit sandbox details' }),
    ).toBeVisible()
    await expect(page.getByTestId('add-event')).toBeVisible()
    await expect(page.getByTestId('setup-card')).toBeVisible()
    await expect(page.getByTestId('invitations-panel')).toBeVisible()
    await expect(page.getByTestId('links-card')).toContainText('Proposal')
    // the People page under the member route, with the member breadcrumb
    await page.getByTestId('people-link').click()
    await page.waitForURL(new RegExp(`/sandboxes/${sandboxId}/people$`))
    await expect(page.getByTestId('people-page')).toBeVisible()
    await expect(page.getByTestId('back-to-overview')).toHaveAttribute(
      'href',
      `/sandboxes/${sandboxId}`,
    )
    // our side shows when the added email went out, and can send it again
    const marcus = page
      .getByTestId('person-row')
      .filter({ hasText: USERS.marcus.name })
    await expect(marcus.getByTestId('notified')).toContainText('Emailed')
    await marcus
      .getByRole('button', { name: `Actions for ${USERS.marcus.name}` })
      .click()
    await page.getByRole('menuitem', { name: 'Preview email' }).click()
    await expect(page.getByTestId('email-preview')).toContainText(
      `You were added to ${NAME}`,
    )
  })
})
