import { expect, test, type APIRequestContext } from '@playwright/test'
import { API, apiToken, auth, gotoSandboxTab, login, USERS } from './helpers'

/**
 * The Groups tab: 1:1 pairings made many at a time, groups built from the lists
 * on People, and a copy of either.
 *
 * Fixture (through the API): admin (AE) · Marcus and Priya on the coaches list
 * · Ines, Jonas and Keiko on the coachees list · Sunita as supervisor. Nobody is
 * in a group yet — building them is what the spec is about.
 */
test.describe.configure({ mode: 'serial' })

const NAME = 'E2E Groups Page'
const INES = { email: 'e2e-ines-gp@ptg-e2e.com', name: 'Ines Carvalho' }
const JONAS = { email: 'e2e-jonas-gp@ptg-e2e.com', name: 'Jonas Lindqvist' }
const KEIKO = { email: 'e2e-keiko-gp@ptg-e2e.com', name: 'Keiko Tanaka' }
const SUNITA = { email: 'e2e-sunita-gp@ptg-e2e.com', name: 'Sunita Rao' }

let sandboxId = ''
const memberId: Record<string, string> = {}

async function api(
  request: APIRequestContext,
  token: string,
  method: 'get' | 'post' | 'put' | 'patch',
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

function termStart(): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 2)
  return d.toISOString().slice(0, 10)
}

test.describe('Sandboxes — the Groups tab', () => {
  test('builds the fixture: people on the lists, no groups', async ({
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
    for (const q of ['marcus', 'priya']) {
      const person = (
        await api(
          request,
          token,
          'get',
          `/sandboxes/people/search?q=${q}&coaches_only=true&sandbox_id=${sandboxId}`,
        )
      )[0]
      const m = await api(
        request,
        token,
        'post',
        `/sandboxes/${sandboxId}/members`,
        { side: 'ours', roles: [], roster: ['coach'], user_id: person.id },
      )
      memberId[q] = m.id
    }
    for (const p of [INES, JONAS, KEIKO])
      await api(request, token, 'post', `/sandboxes/${sandboxId}/members`, {
        side: 'theirs',
        roles: [],
        roster: ['coachee'],
        ...p,
      })
    await api(request, token, 'post', `/sandboxes/${sandboxId}/members`, {
      side: 'theirs',
      roles: ['supervisor'],
      ...SUNITA,
    })
  })

  test('several pairings are made in one go, on one contract', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'groups')
    await expect(page.getByTestId('groups-gate')).toHaveCount(0)
    await page.getByTestId('add-pairings').click()
    const sheet = page.getByTestId('add-pairings-sheet')

    await sheet.getByTestId('pairings-hours').fill('12')
    await expect(sheet.getByTestId('pairings-expected')).toHaveText(
      '16 sessions',
    )
    // One coach, a row for every coachee — then drop the one we don't want.
    await sheet.getByTestId('fan-coach').selectOption({ label: 'Marcus Bell' })
    await sheet.getByTestId('fan-out').click()
    const rows = sheet.getByTestId('pairing-row')
    await expect(rows).toHaveCount(3)
    await rows
      .filter({
        has: page.locator('[data-testid="pairing-coachee"]', {
          has: page.locator('option:checked', { hasText: KEIKO.name }),
        }),
      })
      .getByRole('button', { name: /Remove row/ })
      .click()
    await expect(rows).toHaveCount(2)
    // The term is already running, so they start today, not two months ago.
    await expect(sheet).toContainText('Sessions before this date don’t count')

    await expect(sheet.getByTestId('submit-pairings')).toHaveText(
      'Create 2 pairings',
    )
    await sheet.getByTestId('submit-pairings').click()
    await expect(sheet).toBeHidden()

    const pairings = page.getByTestId('pairing')
    await expect(pairings).toHaveCount(2)
    await expect(pairings.filter({ hasText: INES.name })).toContainText(
      '12 h at 45 min → 16 sessions',
    )
    // Pairings are not groups: the groups panel is still empty.
    await expect(page.getByTestId('group-card')).toHaveCount(0)
  })

  test('a pairing is duplicated, and a pairing that exists is not made twice by accident', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'groups')
    await page
      .getByTestId('pairing')
      .filter({ hasText: INES.name })
      .getByTestId('pairing-actions')
      .click()
    await page.getByTestId('duplicate-pairing').click()
    const sheet = page.getByTestId('add-pairings-sheet')
    // Same coach, same contract; who is coached is the thing left to choose.
    await expect(sheet.getByTestId('pairings-hours')).toHaveValue('12')
    const row = sheet.getByTestId('pairing-row').first()
    await expect(
      row.getByTestId('pairing-coach').locator('option:checked'),
    ).toHaveText('Marcus Bell')

    await row.getByTestId('pairing-coachee').selectOption({
      label: `${INES.name} (already paired)`,
    })
    await expect(row.getByTestId('pairing-row-note')).toContainText(
      'already coaches',
    )
    await expect(sheet.getByTestId('submit-pairings')).toBeDisabled()

    await row.getByTestId('pairing-coachee').selectOption({ label: KEIKO.name })
    await expect(row.getByTestId('pairing-row-note')).toHaveCount(0)
    await sheet.getByTestId('submit-pairings').click()
    await expect(sheet).toBeHidden()
    await expect(page.getByTestId('pairing')).toHaveCount(3)
  })

  test('a group picks its people from the lists, with a supervisor', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'groups')
    await page.getByTestId('build-group').click()
    const drawer = page.getByTestId('group-drawer')

    // Only the people on the list are offered — not the whole staff directory.
    await drawer.getByTestId('coach-search').click()
    await expect(
      drawer.getByTestId('coach-results').getByTestId('coach-option'),
    ).toHaveCount(2)
    await drawer
      .getByTestId('coach-results')
      .getByRole('button', { name: /Priya/ })
      .click()
    for (const person of [INES, JONAS]) {
      await drawer.getByTestId('coachee-search').fill(person.name)
      await drawer.getByTestId('coachee-results').getByRole('button').click()
    }
    await expect(drawer.getByTestId('coachee-row')).toHaveCount(2)
    // Ines already has a 1:1 with Marcus — allowed, and said.
    await expect(
      drawer.getByTestId('coachee-row').filter({ hasText: INES.name }),
    ).toContainText('also in')
    await drawer.getByLabel(SUNITA.name).click()
    await drawer.getByTestId('hours-input').fill('9')
    await drawer.locator('#group-name').fill('Rising leaders')
    await drawer.getByTestId('submit-group').click()
    await expect(drawer).toBeHidden()

    const card = page
      .getByTestId('group-card')
      .filter({ hasText: 'Rising leaders' })
    await expect(card).toContainText('1 coach, 2 coachees')
    await expect(card).toContainText('supervisor Sunita')
    // …and the pairings are untouched by it.
    await expect(page.getByTestId('pairing')).toHaveCount(3)
  })

  test('a group is duplicated with its coaches, supervisor and contract', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'groups')
    await page
      .getByTestId('group-card')
      .filter({ hasText: 'Rising leaders' })
      .getByRole('button', { name: /Actions for/ })
      .click()
    await page.getByTestId('duplicate-group').click()
    const drawer = page.getByTestId('group-drawer')
    await expect(drawer).toContainText('Copy of Rising leaders')
    await expect(drawer.getByTestId('coach-list')).toContainText('Priya')
    await expect(drawer.getByTestId('coachee-row')).toHaveCount(0)
    await expect(drawer.getByTestId('hours-input')).toHaveValue('9')
    await expect(drawer.getByLabel(SUNITA.name)).toBeChecked()

    await drawer.getByTestId('coachee-search').fill(KEIKO.name)
    await drawer.getByTestId('coachee-results').getByRole('button').click()
    await drawer.locator('#group-name').fill('Rising leaders B')
    await drawer.getByTestId('submit-group').click()
    await expect(drawer).toBeHidden()
    await expect(page.getByTestId('group-card')).toHaveCount(2)
  })

  test('taking a coach off the list ends their pairings, and what is left can still be fixed', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'people')
    const priya = page
      .getByTestId('coaches-side')
      .getByTestId('person-row')
      .filter({ hasText: 'Priya' })
    await priya.getByRole('button', { name: /Actions for/ }).click()
    await page.getByTestId('remove-from-list-item').click()
    const dialog = page.getByTestId('remove-from-list')
    await expect(dialog).toContainText('Rising leaders')
    // Nothing else holds her here, and the dialog says so before it happens.
    await expect(dialog).toContainText('they leave the sandbox')
    await dialog.getByTestId('remove-list-confirm').click()
    await expect(priya).toHaveCount(0)

    await page.getByTestId('sandbox-tab-groups').click()
    await expect(page.getByTestId('incomplete-banner')).toContainText(
      '2 groups are incomplete',
    )
    const card = page
      .getByTestId('group-card')
      .filter({ hasText: 'Rising leaders B' })
    await expect(card).toContainText('Needs a coach')
    await card.getByTestId('finish-group').click()
    const drawer = page.getByTestId('group-drawer')
    await drawer.getByTestId('coach-search').click()
    await drawer
      .getByTestId('coach-results')
      .getByRole('button', { name: /Marcus/ })
      .click()
    await drawer.getByTestId('submit-group').click()
    await expect(drawer).toBeHidden()
    await expect(card).not.toContainText('Needs a coach')
  })

  test('a lead coach arranges people but cannot bring anyone in', async ({
    page,
    request,
  }) => {
    const token = await apiToken(request, USERS.admin.email)
    await api(
      request,
      token,
      'patch',
      `/sandboxes/${sandboxId}/members/${memberId.marcus}`,
      { roles: ['lead_coach'] },
    )
    await login(page, USERS.marcus.email)
    await gotoSandboxTab(page, `/sandboxes/${sandboxId}`, 'groups')
    await page.getByTestId('new-group').click()
    const drawer = page.getByTestId('group-drawer')
    await expect(drawer.getByTestId('coach-search')).toBeVisible()
    // Picking from the lists, yes; the way onto them, no.
    await expect(drawer.getByTestId('coach-add-on-people')).toHaveCount(0)

    // And the server agrees: a name that is on no list is refused.
    const mine = await apiToken(request, USERS.marcus.email)
    const resp = await request.post(`${API}/sandboxes/${sandboxId}/groups`, {
      headers: auth(mine),
      data: {
        coach_member_ids: [memberId.marcus],
        coachees: [
          { email: 'e2e-stranger-gp@ptg-e2e.com', name: 'A Stranger' },
        ],
        hours_per_coachee: 6,
      },
    })
    expect(resp.status()).toBe(409)
    expect((await resp.json()).detail.code).toBe('not_on_roster')
  })
})
