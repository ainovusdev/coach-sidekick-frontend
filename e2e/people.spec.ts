import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test'
import {
  API,
  apiToken,
  auth,
  buildGroup,
  gotoSandboxTab,
  login,
  USERS,
} from './helpers'

/**
 * The Team tab's people table: everyone on the sandbox in one table, filters,
 * per-row actions (change groups), bulk invite and bulk remove. It was a page
 * of its own until the sandbox became tabbed; `/people` still redirects here.
 *
 * Fixture (built through the API): admin (AE) · Marcus (lead coach, coaches
 * Amara 1:1) · Priya (coaches "Managers" with Tariq) · Amara (primary client)
 * · Dana (supervisor, has an account) · Tariq (coachee only).
 */
test.describe.configure({ mode: 'serial' })

const NAME = 'E2E People'
const ORG = 'PTG'
const AMARA = { email: 'e2e-amara@ptg-e2e.com', name: 'Amara Diallo' }
const TARIQ = { email: 'e2e-tariq@ptg-e2e.com', name: 'Tariq Haddad' }

let sandboxId = ''

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

function row(page: Page, text: string) {
  return page.getByTestId('person-row').filter({ hasText: text })
}

async function pick(page: Page, label: string, option: string) {
  await page.getByRole('combobox', { name: label }).click()
  await page.getByRole('option', { name: option, exact: true }).click()
}

test.describe('Sandboxes — People page', () => {
  test('builds the fixture and lists everyone', async ({ page, request }) => {
    const token = await apiToken(request, USERS.admin.email)
    const created = await api(request, token, 'post', '/sandboxes/', {
      name: NAME,
      organisation: ORG,
      term_start: '2026-06-01',
      term_months: 6,
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
      roles: ['primary_client'],
      email: AMARA.email,
      name: AMARA.name,
    })
    await api(request, token, 'post', `/sandboxes/${sandboxId}/members`, {
      side: 'theirs',
      roles: ['supervisor'],
      email: USERS.dana.email,
      name: USERS.dana.name,
    })
    await buildGroup(request, token, sandboxId, {
      coach_user_ids: [marcus.id],
      coachees: [{ email: AMARA.email, name: AMARA.name }],
      hours_per_coachee: 13.5,
      cadence: { shape: 'range', min: 2, max: 3, per: 'month' },
    })
    await buildGroup(request, token, sandboxId, {
      name: 'Managers',
      coach_user_ids: [priya.id],
      coachees: [{ email: TARIQ.email, name: TARIQ.name }],
      hours_per_coachee: 10,
      cadence: { shape: 'rate', count: 1, per: 'fortnight' },
    })

    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'people')
    await expect(page.getByTestId('people-table')).toContainText('Team 6')
    await expect(page.getByTestId('people-summary')).toHaveText(
      `2 managing · 2 coaches · 3 from ${ORG}`,
    )
    // Marcus leads the coaches and coaches too, so he is on both of our lists.
    await expect(page.getByTestId('person-row')).toHaveCount(7)

    const amara = row(page, AMARA.name)
    await expect(amara).toContainText('Primary client')
    await expect(amara).toContainText('Coachee')
    await expect(amara).toContainText('Marcus → Amara')
    await expect(amara.getByTestId('invitation-badge')).toHaveText('Not sent')

    const marcusRow = page
      .getByTestId('our-side')
      .getByTestId('person-row')
      .filter({ hasText: 'Marcus Bell' })
    await expect(marcusRow).toContainText('Lead coach')
    await expect(marcusRow).toContainText('Coach')
    await expect(marcusRow.getByTestId('notified')).toContainText('Emailed')

    await expect(row(page, USERS.dana.name)).toContainText('Supervisor')
    await expect(
      row(page, USERS.dana.name).getByTestId('invitation-badge'),
    ).toHaveText('Has an account')
    await expect(row(page, TARIQ.name)).toContainText('Managers')
    await expect(row(page, 'E2E Admin')).toContainText('(you)')
  })

  test('splits the two sides, and filters by role, group and invitation', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'people')
    const rows = page.getByTestId('person-row')
    await expect(rows).toHaveCount(7)

    // each list is its own card, and only theirs talks about invitations
    const our = page.getByTestId('our-side')
    const their = page.getByTestId('their-side')
    await expect(our.getByTestId('person-row')).toHaveCount(2)
    await expect(
      page.getByTestId('coaches-side').getByTestId('person-row'),
    ).toHaveCount(2)
    await expect(their.getByTestId('person-row')).toHaveCount(3)
    await expect(our).toContainText('Notified')
    await expect(their).toContainText('Invitation')

    // a filter narrows both, and a side with nothing left says so
    await pick(page, 'Role', 'Supervisor')
    await expect(rows).toHaveCount(1)
    await expect(rows).toContainText(USERS.dana.name)
    await expect(our).toContainText('No one from the managing team matches')

    await page.getByTestId('clear-filters').click()
    await expect(rows).toHaveCount(7)

    await pick(page, 'Group', 'Marcus → Amara')
    await expect(rows).toHaveCount(3) // Marcus on both of our lists, and Amara
    await pick(page, 'Group', 'No group')
    await expect(rows).toHaveCount(2) // the admin and Dana
    await page.getByTestId('clear-filters').click()

    await pick(page, 'Invitation', 'Has an account')
    await expect(rows).toHaveCount(1)
    await page.getByTestId('clear-filters').click()

    await page.getByTestId('people-search').fill('tariq')
    await expect(rows).toHaveCount(1)
    await expect(rows).toContainText(TARIQ.name)
    await page.getByTestId('people-search').fill('nobody')
    await expect(page.getByText('No one matches')).toBeVisible()
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(rows).toHaveCount(7)
  })

  test('moves a coachee to another group and attaches a supervisor', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'people')

    await row(page, AMARA.name)
      .getByRole('button', { name: `Actions for ${AMARA.name}` })
      .click()
    await page.getByRole('menuitem', { name: 'Change groups' }).click()
    const dialog = page.getByTestId('groups-dialog')
    await expect(dialog).toContainText(`Groups for ${AMARA.name}`)
    const options = dialog.getByTestId('group-option')
    await expect(options).toHaveCount(2)
    await expect(page.getByTestId('save-groups')).toBeDisabled()
    await options
      .filter({ hasText: 'Marcus → Amara' })
      .getByTestId('group-coachee')
      .click()
    await options
      .filter({ hasText: 'Managers' })
      .getByTestId('group-coachee')
      .click()
    await page.getByTestId('save-groups').click()
    await expect(dialog).toHaveCount(0)
    await expect(row(page, AMARA.name)).toContainText('Managers')
    await expect(row(page, AMARA.name)).not.toContainText('Marcus')

    // Dana holds the supervisor hat, so she can supervise a group.
    await row(page, USERS.dana.name)
      .getByRole('button', { name: `Actions for ${USERS.dana.name}` })
      .click()
    await page.getByRole('menuitem', { name: 'Change groups' }).click()
    await expect(dialog.getByTestId('group-supervisor')).toHaveCount(2)
    await dialog
      .getByTestId('group-option')
      .filter({ hasText: 'Managers' })
      .getByTestId('group-supervisor')
      .click()
    await page.getByTestId('save-groups').click()
    await expect(row(page, USERS.dana.name)).toContainText(
      'Managers (supervises)',
    )

    // The Groups tab reflects it straight away.
    await page.getByTestId('sandbox-tab-groups').click()
    const managers = page
      .getByTestId('group-card')
      .filter({ hasText: 'Managers' })
    await expect(managers).toContainText('2 coachees')
    await expect(managers).toContainText(USERS.dana.name.split(' ')[0])
  })

  test('bulk invite and bulk remove', async ({ page }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'people')

    await page.getByRole('checkbox', { name: `Select ${AMARA.name}` }).click()
    await page.getByRole('checkbox', { name: `Select ${TARIQ.name}` }).click()
    await expect(page.getByTestId('bulk-bar')).toContainText('2 selected')
    await expect(page.getByTestId('bulk-invite')).toHaveText(
      'Send 2 invitations',
    )
    await page.getByTestId('bulk-invite').click()
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(
      row(page, AMARA.name).getByTestId('invitation-badge'),
    ).toHaveText(/Sent/)
    await expect(
      row(page, TARIQ.name).getByTestId('invitation-badge'),
    ).toHaveText(/Sent/)
    await expect(page.getByTestId('bulk-bar')).toHaveCount(0)

    await page.getByRole('checkbox', { name: `Select ${TARIQ.name}` }).click()
    await page.getByTestId('bulk-remove').click()
    const dialog = page.getByTestId('bulk-remove-dialog')
    await expect(dialog).toContainText('Remove 1 person from the sandbox?')
    await expect(dialog.getByTestId('bulk-remove-row')).toContainText(
      'coachee in Managers · a live invitation',
    )
    await page.getByTestId('bulk-remove-confirm').click()
    await expect(row(page, TARIQ.name)).toHaveCount(0)
    await expect(page.getByTestId('person-row')).toHaveCount(6)
  })

  test('bulk removal will not take the last account executive', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'people')
    await page.getByRole('checkbox', { name: 'Select E2E Admin' }).click()
    await page.getByTestId('bulk-remove').click()
    await expect(page.getByTestId('bulk-remove-blocked')).toBeVisible()
    await expect(page.getByTestId('bulk-remove-confirm')).toBeDisabled()
    await page.getByRole('button', { name: 'Keep them' }).click()
  })

  test('the old People link lands on the People tab', async ({ page }) => {
    await login(page, USERS.admin.email)
    await page.goto(`/admin/sandboxes/${sandboxId}/people`)
    await page.waitForURL(/\?tab=people$/)
    await expect(page.getByTestId('people-table')).toBeVisible()
  })
})
