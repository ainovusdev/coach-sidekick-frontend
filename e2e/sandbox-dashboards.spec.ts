import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test'
import {
  API,
  USERS,
  apiToken,
  auth,
  gotoSandboxTab,
  invitationToken,
  login,
  seedSession,
} from './helpers'

/**
 * Phase 3 — delivery + dashboards. Delivery is derived from coaching
 * sessions, so the fixture inserts sessions straight into the local DB
 * (see `seedSession`) and the term is built relative to today.
 *
 * Fixture "E2E Delivery": Marcus coaches Kofi (13.5 h → 18 sessions, three
 * delivered, one scheduled) and Lena (13.5 h, nothing delivered); Priya
 * coaches Zara in "Managers" (no hours set). Dana supervises Managers.
 */
test.describe.configure({ mode: 'serial' })

const NAME = 'E2E Delivery'
const ORG = 'PTG'
const KOFI = { email: 'e2e-kofi-delivery@ptg-e2e.com', name: 'Kofi Mensah' }
const LENA = { email: 'e2e-lena-delivery@ptg-e2e.com', name: 'Lena Fischer' }
const ZARA = { email: 'e2e-zara-delivery@ptg-e2e.com', name: 'Zara Quinn' }

let sandboxId = ''
let kofiClientId = ''

/** Local calendar day as YYYY-MM-DD (no UTC shift — the API compares dates). */
function localDay(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Session days are UTC on the wire (started_at::date), like the seed's stamps. */
function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

/** Marcus's group card (cards show avatars, not names; the other group is "Managers"). */
function marcusCard(page: Page) {
  return page.getByTestId('group-card').filter({ hasNotText: 'Managers' })
}

/** The 1st of the month three months back — a 6-month term at about halfway. */
function termStart(): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 3)
  return localDay(d)
}

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

test.describe('Sandboxes — delivery and dashboards', () => {
  test('builds the fixture with sessions', async ({ request }) => {
    const token = await apiToken(request, USERS.admin.email)
    const created = await api(request, token, 'post', '/sandboxes/', {
      name: NAME,
      organisation: ORG,
      term_start: termStart(),
      term_months: 6,
    })
    sandboxId = created.sandbox.id
    const marcus = (
      await api(request, token, 'get', '/sandboxes/people/search?q=marcus')
    )[0]
    const priya = (
      await api(request, token, 'get', '/sandboxes/people/search?q=priya')
    )[0]
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
      coachees: [KOFI, LENA],
      hours_per_coachee: 13.5,
      cadence: { shape: 'rate', count: 3, per: 'month' },
    })
    const managers = await api(
      request,
      token,
      'post',
      `/sandboxes/${sandboxId}/groups`,
      {
        name: 'Managers',
        coach_user_ids: [priya.id],
        coachees: [ZARA],
        supervisor_member_ids: [dana.id],
      },
    )
    expect(managers.name).toBe('Managers')

    for (const daysAgo of [70, 40, 12]) {
      const s = seedSession({
        coachEmail: USERS.marcus.email,
        clientEmail: KOFI.email,
        daysAgo,
      })
      kofiClientId = s.client_id
    }
    seedSession({
      coachEmail: USERS.marcus.email,
      clientEmail: KOFI.email,
      daysAgo: -4,
      status: 'scheduled',
    })

    const delivery = await api(
      request,
      token,
      'get',
      `/sandboxes/${sandboxId}/delivery`,
    )
    const kofi = delivery.groups[0].coachees.find(
      (c: { email: string }) => c.email === KOFI.email,
    )
    expect(kofi.delivered.sessions).toBe(3)
    expect(kofi.delivered.next_scheduled_on).toBe(isoDaysAgo(-4))
    expect(kofi.pace.expected_sessions).toBe(18)
    expect(['behind', 'on_track']).toContain(kofi.pace.state)
  })

  test('the portfolio lists what needs attention and the cards', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await page.goto('/sandboxes')
    const dash = page.getByTestId('sandbox-dashboard')
    await expect(dash).toHaveAttribute('data-persona', 'portfolio')
    await expect(page.getByTestId('stat-sandboxes')).toBeVisible()

    const attention = page.getByTestId('needs-attention')
    await expect(attention).toBeVisible()
    // Lena has had no session with ~9 expected by now
    await expect(
      attention
        .getByTestId('attention-row')
        .filter({ hasText: 'Lena hasn’t had a session yet' }),
    ).toBeVisible()
    // nobody has been invited on a running term
    await expect(
      attention
        .getByTestId('attention-row')
        .filter({ hasText: `${KOFI.name} hasn’t been invited` }),
    ).toBeVisible()
    // Managers has no hours → incomplete
    await expect(
      attention
        .getByTestId('attention-row')
        .filter({ hasText: 'Managers isn’t finished' }),
    ).toBeVisible()

    const card = page.getByTestId('sandbox-card').filter({ hasText: NAME })
    await expect(card).toBeVisible()
    await expect(card.getByTestId('pace-chip')).toBeVisible()
    await expect(card).toContainText('3 coachees')

    // an attention row deep-links to the sandbox section
    await attention
      .getByTestId('attention-row')
      .filter({ hasText: 'Managers isn’t finished' })
      .click()
    await expect(page).toHaveURL(new RegExp(`/sandboxes/${sandboxId}#groups`))
    await expect(page.getByTestId('groups-panel')).toBeVisible()
  })

  test('Today lists what needs this sandbox, and a row moves the tab', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await page.goto(`/sandboxes/${sandboxId}`)
    const attention = page.getByTestId('attention-panel')
    await expect(attention.getByTestId('attention-row').first()).toBeVisible()
    // Only the first few rows show until asked, urgent first.
    const more = page.getByTestId('attention-more')
    if (await more.count()) await more.click()

    // the same rows the dashboard shows, for this sandbox alone
    await expect(
      attention
        .getByTestId('attention-row')
        .filter({ hasText: 'Lena hasn’t had a session yet' }),
    ).toBeVisible()
    await expect(
      attention
        .getByTestId('attention-row')
        .filter({ hasText: `${KOFI.name} hasn’t been invited` }),
    ).toBeVisible()
    // the sandbox is not named on its own rows
    await expect(attention).not.toContainText(NAME)

    // a row moves the tab in place — the page is already on this sandbox
    await attention
      .getByTestId('attention-row')
      .filter({ hasText: 'Managers isn’t finished' })
      .click()
    await expect(page.getByTestId('sandbox-tab-groups')).toHaveAttribute(
      'data-state',
      'active',
    )
    await expect(page.getByTestId('groups-panel')).toBeVisible()
  })

  test('the cockpit shows delivery per coachee with the contract', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    // Delivery sits with the groups it is delivered by.
    await gotoSandboxTab(page, `/sandboxes/${sandboxId}`, 'groups')
    const panel = page.getByTestId('delivery-panel')
    await expect(panel).toBeVisible()
    const groups = panel.getByTestId('delivery-group')
    await expect(groups).toHaveCount(2)

    const kofi = panel
      .getByTestId('delivery-coachee')
      .filter({ hasText: KOFI.name })
    await expect(kofi).toContainText('3 of 18 sessions')
    await expect(kofi.getByTestId('pace-chip')).toBeVisible()
    await expect(kofi).toContainText('Next')

    const lena = panel
      .getByTestId('delivery-coachee')
      .filter({ hasText: LENA.name })
    await expect(lena).toContainText('No sessions yet')
    await expect(lena.getByTestId('pace-chip')).toHaveAttribute(
      'data-state',
      'not_started',
    )

    // a group without hours says so instead of pretending
    const managers = groups.filter({ hasText: 'Managers' })
    await expect(managers.getByTestId('delivery-no-contract')).toContainText(
      'Hours per coachee isn’t set',
    )
    await expect(
      managers.getByTestId('delivery-coachee').filter({ hasText: ZARA.name }),
    ).toBeVisible()
  })

  test('the coach sees a home strip and a client-profile card', async ({
    page,
  }) => {
    await login(page, USERS.marcus.email)
    const strip = page.getByTestId('sandbox-strip')
    await expect(strip).toBeVisible()
    await expect(
      strip.getByTestId('sandbox-card').filter({ hasText: NAME }),
    ).toBeVisible()
    await expect(strip.getByTestId('strip-attention')).toBeVisible()

    await page.goto(`/clients/${kofiClientId}`)
    const card = page.getByTestId('sandbox-context-card')
    await expect(card).toBeVisible()
    await expect(card).toContainText(`Part of ${NAME} with ${ORG}`)
    await expect(card.getByTestId('ctx-sessions')).toContainText('3 of 18')
    await expect(card.getByTestId('ctx-hours')).toContainText('of 13.5 h')
    await expect(card.getByTestId('ctx-open')).toHaveAttribute(
      'href',
      `/sandboxes/${sandboxId}`,
    )

    // his own dashboard (Marcus is a lead coach elsewhere, so he may rank as portfolio)
    await page.goto('/sandboxes')
    await expect(page.getByTestId('sandbox-dashboard')).toHaveAttribute(
      'data-persona',
      /coach|portfolio/,
    )
    await expect(page.getByTestId('stat-sandboxes')).toBeVisible()
    await expect(
      page.getByTestId('sandbox-card').filter({ hasText: NAME }),
    ).toBeVisible()
  })

  test('a coach in one group sees only that group', async ({
    page,
    request,
  }) => {
    const token = await apiToken(request, USERS.priya.email)
    const dash = await api(request, token, 'get', '/sandboxes/dashboard')
    // Priya creates her own sandbox in sandbox-create-coach.spec.ts (she is
    // its account executive), so in a full run she ranks as portfolio.
    expect(dash.persona).toMatch(/^(coach|portfolio)$/)
    const mine = dash.cards.find(
      (c: { sandbox: { id: string } }) => c.sandbox.id === sandboxId,
    )
    expect(
      mine.my_groups.map((g: { display_name: string }) => g.display_name),
    ).toEqual(['Managers'])
    await login(page, USERS.priya.email)
    await expect(page.getByTestId('sandbox-strip')).toBeVisible()
    await page.goto('/sandboxes')
    const card = page.getByTestId('sandbox-card').filter({ hasText: NAME })
    await expect(card).toContainText('1 coachee')
  })

  test('the supervisor sees delivery for her group only', async ({ page }) => {
    await login(page, USERS.dana.email)
    await page.goto('/sandboxes')
    await expect(page.getByTestId('sandbox-dashboard')).toHaveAttribute(
      'data-persona',
      'client_side',
    )
    await expect(
      page.getByTestId('attention-row').filter({ hasText: 'invited' }),
    ).toHaveCount(0)
    await gotoSandboxTab(page, `/sandboxes/${sandboxId}`, 'groups')
    const panel = page.getByTestId('delivery-panel')
    await expect(panel.getByTestId('delivery-group')).toHaveCount(1)
    await expect(panel).toContainText('Managers')
    await expect(panel).not.toContainText(KOFI.name)
  })

  test('the coachee sees expected vs delivered on the portal', async ({
    page,
    request,
  }) => {
    // Kofi accepts his invitation so he has a portal
    const token = await apiToken(request, USERS.admin.email)
    const overview = await api(
      request,
      token,
      'get',
      `/sandboxes/${sandboxId}/overview`,
    )
    const kofi = overview.members.find(
      (m: { email: string }) => m.email === KOFI.email,
    )
    await api(request, token, 'post', `/sandboxes/${sandboxId}/invitations`, {
      member_ids: [kofi.id],
    })
    const inv = (
      await api(request, token, 'get', `/sandboxes/${sandboxId}/overview`)
    ).invitations.find((i: { email: string }) => i.email === KOFI.email)
    expect(inv.status).toBe('pending')
    const accept = await request.post(
      `${API}/sandbox-invitations/accept-signup`,
      {
        data: {
          token: invitationToken(KOFI.email).token,
          password: 'Password123!',
          full_name: KOFI.name,
        },
      },
    )
    expect(accept.ok()).toBeTruthy()

    await login(page, KOFI.email)
    await page.goto('/client-portal/dashboard')
    const note = page.getByTestId('sandbox-note')
    await expect(note).toBeVisible()
    await expect(note).toContainText(`${NAME} with ${ORG}`)
    await expect(note).toContainText('coached by Marcus')
    await expect(note.getByTestId('portal-progress')).toContainText(
      '3 of 18 sessions',
    )
    await expect(note.getByTestId('progress-rail')).toBeVisible()

    // and his own dashboard is the coachee persona with just himself
    await page.goto('/sandboxes')
    await expect(page.getByTestId('sandbox-dashboard')).toHaveAttribute(
      'data-persona',
      'coachee',
    )
    await expect(page.getByTestId('attention-section')).toHaveCount(0)
  })

  // ---- chunk 6 leftovers: once sessions exist, changes warn and removal blocks

  test('a group with sessions on record cannot be removed', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/sandboxes/${sandboxId}`, 'groups')
    const card = marcusCard(page)
    await card.getByRole('button', { name: /Actions for/ }).click()
    await page.getByRole('menuitem', { name: 'Remove group' }).click()
    const blocked = page.getByTestId('group-blocked')
    await expect(blocked).toContainText('can’t be removed yet')
    await expect(blocked).toContainText('3 sessions on record')
    await expect(blocked).toContainText(KOFI.name)
    await blocked.getByRole('button', { name: 'Got it' }).click()
    await expect(blocked).toHaveCount(0)
    await expect(marcusCard(page)).toBeVisible()
  })

  test('taking a coachee with sessions out of a group warns first', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/sandboxes/${sandboxId}`, 'groups')
    const card = marcusCard(page)
    await card.getByRole('button', { name: /Actions for/ }).click()
    await page.getByRole('menuitem', { name: 'Edit group' }).click()
    const drawer = page.getByTestId('group-drawer')
    await drawer.getByRole('button', { name: `Remove ${KOFI.name}` }).click()
    await drawer.getByTestId('submit-group').click()
    const warning = drawer.getByTestId('leaving-with-sessions')
    await expect(warning).toContainText(`${KOFI.name} has had 3 sessions`)
    await expect(warning).toContainText('keeps every session on record')
    // still in the group until we say so
    await expect(
      page.getByTestId('delivery-coachee').filter({ hasText: KOFI.name }),
    ).toBeVisible()
    await drawer.getByTestId('submit-group-anyway').click()
    await expect(drawer).toHaveCount(0)
    // Lena is the only coachee left, so the group reads as a 1:1 again
    await expect(marcusCard(page)).toContainText('Marcus → Lena')
    await expect(
      page.getByTestId('delivery-coachee').filter({ hasText: KOFI.name }),
    ).toHaveCount(0)
  })

  test('the people table warns the same way and moves without a word otherwise', async ({
    page,
    request,
  }) => {
    // Kofi left the sandbox with his last group (no hat, no group). Put him back
    // with Marcus — adding never warns — then move him out from the Team tab.
    const token = await apiToken(request, USERS.admin.email)
    let overview = await api(
      request,
      token,
      'get',
      `/sandboxes/${sandboxId}/overview`,
    )
    const before = overview.groups.find(
      (g: { display_name: string }) => g.display_name !== 'Managers',
    )
    await api(
      request,
      token,
      'post',
      `/sandboxes/${sandboxId}/groups/${before.id}/members`,
      {
        kind: 'coachee',
        email: KOFI.email,
        name: KOFI.name,
      },
    )
    overview = await api(
      request,
      token,
      'get',
      `/sandboxes/${sandboxId}/overview`,
    )
    const marcusGroup = overview.groups.find(
      (g: { id: string }) => g.id === before.id,
    )
    expect(
      marcusGroup.coachees.map((c: { email: string }) => c.email),
    ).toContain(KOFI.email)

    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/sandboxes/${sandboxId}`, 'team')
    const row = (text: string) =>
      page.getByTestId('person-row').filter({ hasText: text })
    await row(KOFI.name)
      .getByRole('button', { name: `Actions for ${KOFI.name}` })
      .click()
    await page.getByRole('menuitem', { name: 'Change groups' }).click()
    const dialog = page.getByTestId('groups-dialog')
    // the group's display name changes as people move (1:1 ↔ "Group 1"), so pick by id
    const marcusOption = dialog.locator(
      `[data-testid="group-option"][data-group="${marcusGroup.id}"]`,
    )
    const managersOption = dialog
      .getByTestId('group-option')
      .filter({ hasText: 'Managers' })
    await marcusOption.getByTestId('group-coachee').click()
    await managersOption.getByTestId('group-coachee').click()
    await page.getByTestId('save-groups').click()
    const warning = dialog.getByTestId('leaving-with-sessions')
    await expect(warning).toContainText(
      `${KOFI.name.split(' ')[0]} has had 3 sessions`,
    )
    await expect(dialog).toBeVisible()
    await page.getByTestId('save-groups-anyway').click()
    await expect(dialog).toHaveCount(0)
    await expect(row(KOFI.name)).toContainText('Managers')

    // Lena has had no session → straight through
    await row(LENA.name)
      .getByRole('button', { name: `Actions for ${LENA.name}` })
      .click()
    await page.getByRole('menuitem', { name: 'Change groups' }).click()
    await marcusOption.getByTestId('group-coachee').click()
    await managersOption.getByTestId('group-coachee').click()
    await page.getByTestId('save-groups').click()
    await expect(dialog).toHaveCount(0)
    await expect(row(LENA.name)).toContainText('Managers')

    // Marcus's group has no coachees left, so it can go
    await page.getByTestId('sandbox-tab-groups').click()
    await marcusCard(page)
      .getByRole('button', { name: /Actions for/ })
      .click()
    await page.getByRole('menuitem', { name: 'Remove group' }).click()
    await page.getByRole('button', { name: 'Remove group' }).click()
    await expect(page.getByTestId('group-card')).toHaveCount(1)
  })
})
