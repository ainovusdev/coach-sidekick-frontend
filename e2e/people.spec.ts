import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test'
import { API, USERS, apiToken, auth, login } from './helpers'

/**
 * Chunk 7 — the People page: everyone on the sandbox in one table, filters,
 * per-row actions (change groups), bulk invite and bulk remove.
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
    await api(request, token, 'post', `/sandboxes/${sandboxId}/groups`, {
      coach_user_ids: [marcus.id],
      coachees: [{ email: AMARA.email, name: AMARA.name }],
      hours_per_coachee: 13.5,
      cadence: { shape: 'range', min: 2, max: 3, per: 'month' },
    })
    await api(request, token, 'post', `/sandboxes/${sandboxId}/groups`, {
      name: 'Managers',
      coach_user_ids: [priya.id],
      coachees: [{ email: TARIQ.email, name: TARIQ.name }],
      hours_per_coachee: 10,
      cadence: { shape: 'rate', count: 1, per: 'fortnight' },
    })

    await login(page, USERS.admin.email)
    await page.goto(`/admin/sandboxes/${sandboxId}/people`)
    await expect(page.getByTestId('people-page')).toBeVisible()
    await expect(page.getByTestId('people-summary')).toHaveText(
      `6 people · 3 ours · 3 from ${ORG}`,
    )
    await expect(page.getByTestId('person-row')).toHaveCount(6)

    const amara = row(page, AMARA.name)
    await expect(amara).toContainText('Primary client')
    await expect(amara).toContainText('Coachee')
    await expect(amara).toContainText('Marcus → Amara')
    await expect(amara.getByTestId('invitation-badge')).toHaveText('Not sent')

    const marcusRow = row(page, 'Marcus Bell')
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

  test('filters by side, role, group and invitation, and searches', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await page.goto(`/admin/sandboxes/${sandboxId}/people`)
    const rows = page.getByTestId('person-row')
    await expect(rows).toHaveCount(6)

    await pick(page, 'Side', 'Their side')
    await expect(rows).toHaveCount(3)
    await pick(page, 'Role', 'Supervisor')
    await expect(rows).toHaveCount(1)
    await expect(rows).toContainText(USERS.dana.name)

    await page.getByTestId('clear-filters').click()
    await expect(rows).toHaveCount(6)

    await pick(page, 'Group', 'Marcus → Amara')
    await expect(rows).toHaveCount(2)
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
    await expect(rows).toHaveCount(6)
  })

  test('moves a coachee to another group and attaches a supervisor', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await page.goto(`/admin/sandboxes/${sandboxId}/people`)

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

    // The overview reflects it straight away.
    await page.getByTestId('back-to-overview').click()
    const managers = page
      .getByTestId('group-card')
      .filter({ hasText: 'Managers' })
    await expect(managers).toContainText('2 coachees')
    await expect(managers).toContainText(USERS.dana.name.split(' ')[0])
  })

  test('bulk invite and bulk remove', async ({ page }) => {
    await login(page, USERS.admin.email)
    await page.goto(`/admin/sandboxes/${sandboxId}/people`)

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
    await expect(page.getByTestId('people-summary')).toContainText('5 people')
  })

  test('bulk removal will not take the last account executive', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await page.goto(`/admin/sandboxes/${sandboxId}/people`)
    await page.getByRole('checkbox', { name: 'Select E2E Admin' }).click()
    await page.getByTestId('bulk-remove').click()
    await expect(page.getByTestId('bulk-remove-blocked')).toBeVisible()
    await expect(page.getByTestId('bulk-remove-confirm')).toBeDisabled()
    await page.getByRole('button', { name: 'Keep them' }).click()
  })

  test('the overview links to People', async ({ page }) => {
    await login(page, USERS.admin.email)
    await page.goto(`/admin/sandboxes/${sandboxId}`)
    await page.getByTestId('people-link').click()
    await page.waitForURL(/\/people$/)
    await expect(page.getByTestId('people-page')).toBeVisible()
  })
})
