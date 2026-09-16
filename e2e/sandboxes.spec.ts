import { expect, test, type Page } from '@playwright/test'
import {
  API,
  PASSWORD,
  USERS,
  apiToken,
  auth,
  gotoSandboxTab,
  invitationToken,
  login,
  muteAgent,
} from './helpers'
import type { SandboxTab } from '../src/components/sandboxes/sandbox-tabs'

test.describe.configure({ mode: 'serial' })

const SANDBOX_NAME = 'E2E PTG Leadership'
const ORG = 'PTG'
const NADIA = { email: 'e2e-nadia@ptg-e2e.com', name: 'Nadia Osei' }
const KOFI = { email: 'e2e-kofi@ptg-e2e.com', name: 'Kofi Mensah' }
const LENA = { email: 'e2e-lena@ptg-e2e.com', name: 'Lena Fischer' }

let sandboxUrl = ''
let sandboxId = ''

async function openSandbox(page: Page, tab?: SandboxTab) {
  await page.goto(tab ? `${sandboxUrl}?tab=${tab}` : sandboxUrl)
  await expect(page.getByTestId('identity-card')).toContainText(SANDBOX_NAME)
}

test.describe('Sandboxes — admin creation flow', () => {
  test('creates a sandbox from the form and lands on the cockpit', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await page.goto('/admin/sandboxes')
    await expect(page.getByTestId('sandboxes-page')).toBeVisible()
    await page.getByTestId('new-sandbox').click()
    await expect(page.getByTestId('new-sandbox-page')).toBeVisible()

    await page.fill('#organisation', ORG)
    await expect(page.locator('#name')).toHaveValue(ORG) // name follows the organisation
    await page.fill('#name', SANDBOX_NAME)

    // Start on the 1st of next month: open the calendar, go forward one month, click day 1.
    const next = new Date()
    next.setDate(1)
    next.setMonth(next.getMonth() + 1)
    await page.click('#term_start')
    await page.getByRole('button', { name: /next month/i }).click()
    await page
      .locator(
        `button[data-day="${next.getMonth() + 1}/1/${next.getFullYear()}"]`,
      )
      .first()
      .click()

    await expect(page.getByTestId('term-6')).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await expect(page.getByTestId('term-preview')).toContainText('6 months')
    await expect(page.getByTestId('term-preview')).toContainText(
      'Creates 2 check-ins, 1 midpoint report and a results review in',
    )

    await page.getByTestId('term-3').click()
    await expect(page.getByTestId('term-preview')).toContainText(
      'Creates 1 check-in and a results review in',
    )
    await page.getByTestId('term-6').click()

    await page.fill(
      '#vision',
      'Every leader at PTG runs a weekly one-to-one that people look forward to.',
    )
    await page.getByTestId('create-sandbox').click()

    await page.waitForURL(/\/admin\/sandboxes\/[0-9a-f-]{36}$/)
    sandboxUrl = page.url()
    sandboxId = sandboxUrl.split('/').pop() as string

    await expect(page.getByTestId('identity-card')).toContainText(SANDBOX_NAME)
    await expect(page.getByTestId('identity-card')).toContainText(ORG)
    await expect(page.getByTestId('status-pill')).toHaveText('Upcoming')
    await expect(page.getByTestId('setup-progress')).toHaveText('2 of 5 done')
    await page.getByTestId('sandbox-tab-timeline').click()
    await expect(page.getByTestId('timeline-event')).toHaveCount(5)
    await page.getByTestId('sandbox-tab-general').click()
    await expect(page.getByTestId('vision-panel')).toContainText(
      'weekly one-to-one',
    )
  })

  test('shows the design fixture dates for a 6-month term from 1 Jun 2026', async ({
    page,
    request,
  }) => {
    const token = await apiToken(request, USERS.admin.email)
    const resp = await request.post(`${API}/sandboxes/`, {
      headers: auth(token),
      data: {
        name: 'E2E Fixed Term',
        organisation: ORG,
        term_start: '2026-06-01',
        term_months: 6,
      },
    })
    expect(resp.status()).toBe(201)
    const created = await resp.json()

    await login(page, USERS.admin.email)
    await gotoSandboxTab(
      page,
      `/admin/sandboxes/${created.sandbox.id}`,
      'timeline',
    )
    const events = page.getByTestId('timeline-event')
    await expect(events).toHaveCount(5)
    await expect(events.nth(0)).toContainText('1 Jun – 1 Jul')
    await expect(events.nth(1)).toContainText('27 Jul – 7 Aug')
    await expect(events.nth(2)).toContainText('1 – 31 Aug')
    await expect(events.nth(3)).toContainText('28 Sep – 9 Oct')
    await expect(events.nth(4)).toContainText('1 – 11 Dec')
    await expect(page.getByTestId('identity-card')).toContainText('Month')

    // the list shows both sandboxes
    await page.goto('/admin/sandboxes')
    await expect(
      page.getByTestId('sandbox-row').filter({ hasText: SANDBOX_NAME }),
    ).toBeVisible()
    await expect(
      page.getByTestId('sandbox-row').filter({ hasText: 'E2E Fixed Term' }),
    ).toBeVisible()
  })

  test('builds the team on both sides', async ({ page }) => {
    await login(page, USERS.admin.email)
    await openSandbox(page)
    await page.getByTestId('sandbox-tab-team').click()

    // our side: Marcus as lead coach
    await page.getByRole('button', { name: 'Add from our people' }).click()
    await page.getByTestId('our-people-search').fill('marcus')
    await page
      .getByTestId('our-people-results')
      .getByRole('button', { name: /Marcus Bell/ })
      .click()
    await page.getByTestId('role-lead_coach').click()
    await page.getByTestId('add-our-person').click()
    await expect(
      page.getByTestId('person-row').filter({ hasText: 'Marcus Bell' }),
    ).toContainText('Lead coach')

    // their side: Nadia as primary client (new person, by email)
    await page.getByRole('button', { name: 'Add by email' }).click()
    await page.fill('#their-email-0', NADIA.email)
    await page.fill('#their-name-0', NADIA.name)
    await page.getByTestId('add-their-people').click()
    const nadiaRow = page
      .getByTestId('person-row')
      .filter({ hasText: NADIA.name })
    await expect(nadiaRow).toContainText('Primary client')
    await expect(nadiaRow).toContainText('Not sent')

    // their side: Dana, who already has an account, as supervisor
    await page.getByRole('button', { name: 'Add by email' }).click()
    await page.fill('#their-email-0', USERS.dana.email)
    await expect(page.getByTestId('their-person-row')).toContainText(
      'Already in Coach Sidekick',
    )
    await expect(page.locator('#their-name-0')).toHaveValue(USERS.dana.name)
    await page.getByRole('combobox', { name: 'Role' }).click()
    await page.getByRole('option', { name: 'Supervisor' }).click()
    await page.getByTestId('add-their-people').click()
    const danaRow = page
      .getByTestId('person-row')
      .filter({ hasText: USERS.dana.name })
    await expect(danaRow).toContainText('Supervisor')
    await expect(danaRow).toContainText('Has an account')

    // duplicate → inline "already on this sandbox"
    await page.getByRole('button', { name: 'Add by email' }).click()
    await page.fill('#their-email-0', NADIA.email)
    await expect(page.getByTestId('their-person-row')).toContainText(
      'Already on this sandbox',
    )
    await page.keyboard.press('Escape')

    await page.getByTestId('sandbox-tab-today').click()
    await expect(page.getByTestId('setup-progress')).toHaveText('3 of 5 done')
    await expect(page.getByTestId('setup-team')).toContainText(
      '2 ours · 2 theirs',
    )
  })

  test('builds a one-to-one group with the contract maths', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await openSandbox(page, 'groups')

    await page.getByTestId('build-group').click()
    const drawer = page.getByTestId('group-drawer')
    await expect(drawer).toBeVisible()

    await drawer.getByTestId('coach-search').fill('marcus')
    await drawer
      .getByTestId('coach-results')
      .getByRole('button', { name: /Marcus Bell/ })
      .click()
    await expect(drawer.getByTestId('selected-coaches')).toContainText(
      'Marcus Bell',
    )

    await drawer.getByRole('button', { name: `+ ${NADIA.name}` }).click()
    await expect(drawer.getByTestId('coachee-list')).toContainText(NADIA.name)

    await drawer.getByTestId('hours-input').fill('13.5')
    await expect(drawer.getByTestId('expected-sessions')).toHaveText(
      '18 sessions',
    )
    await expect(drawer.getByTestId('cadence-agreement')).toContainText(
      'expects 18',
    )
    await expect(drawer.getByTestId('cadence-agreement')).toHaveClass(
      /text-forest/,
    )

    await drawer.getByTestId('cadence-1-week').click()
    await expect(drawer.getByTestId('cadence-agreement')).toHaveClass(
      /text-amber-token/,
    )
    await drawer.getByTestId('cadence-2-3-month').click()

    await drawer.getByTestId('submit-group').click()
    await expect(drawer).toBeHidden()

    const card = page
      .getByTestId('group-card')
      .filter({ hasText: 'Marcus → Nadia' })
    await expect(card).toBeVisible()
    await expect(card).toContainText('One to one')
    await expect(card).toContainText('13.5 h at 45 min → 18 sessions')
    await expect(card).toContainText('2–3 per month')
    await page.getByTestId('sandbox-tab-today').click()
    await expect(page.getByTestId('setup-progress')).toHaveText('4 of 5 done')
  })

  test('saves a two-coach group as incomplete, then finishes it', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await openSandbox(page, 'groups')

    await page.getByTestId('new-group').click()
    const drawer = page.getByTestId('group-drawer')

    for (const coach of ['marcus', 'priya']) {
      await drawer.getByTestId('coach-search').fill(coach)
      await drawer
        .getByTestId('coach-results')
        .getByRole('button')
        .first()
        .click()
    }
    for (const person of [KOFI, LENA]) {
      await drawer.getByTestId('coachee-email').fill(person.email)
      await drawer.getByTestId('coachee-name').fill(person.name)
      await drawer.getByTestId('coachee-add').click()
    }
    await expect(drawer.getByTestId('coachee-row')).toHaveCount(2)

    await drawer.getByTestId('cadence-1-week').click()
    await expect(drawer.getByTestId('cadence-agreement')).toContainText('blank')
    await expect(drawer.getByTestId('submit-group')).toBeDisabled()
    await drawer.getByTestId('save-incomplete').click()
    await expect(drawer).toBeHidden()

    await expect(page.getByTestId('incomplete-banner')).toContainText(
      'One group is incomplete',
    )
    const incomplete = page.locator(
      '[data-testid="group-card"][data-complete="false"]',
    )
    await expect(incomplete).toHaveCount(1)
    await expect(incomplete).toContainText('Needs hours per coachee')
    await page.getByTestId('sandbox-tab-today').click()
    await expect(page.getByTestId('setup-groups')).toContainText('1 incomplete')
    await page.getByTestId('sandbox-tab-groups').click()

    await incomplete.getByTestId('finish-group').click()
    await expect(drawer).toContainText('Finish Group 2')
    await drawer.getByTestId('hours-input').fill('10')
    await expect(drawer.getByTestId('expected-sessions')).toHaveText(
      '13 sessions',
    )
    await expect(drawer.getByTestId('cadence-agreement')).toContainText(
      'expects 13',
    )
    await expect(drawer.getByTestId('cadence-agreement')).toHaveClass(
      /text-amber-token/,
    )
    await drawer.getByTestId('cadence-custom').click()
    await expect(drawer.locator('#shape-rate')).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await drawer.locator('#shape-total').click()
    await expect(drawer.getByTestId('cadence-agreement')).toContainText(
      'expects 13',
    )
    await drawer.getByTestId('cadence-2-3-month').click()
    await expect(drawer.getByTestId('cadence-agreement')).toHaveClass(
      /text-forest/,
    )
    await drawer.getByTestId('submit-group').click()
    await expect(drawer).toBeHidden()

    await expect(page.getByTestId('incomplete-banner')).toHaveCount(0)
    await expect(
      page.locator('[data-testid="group-card"][data-complete="true"]'),
    ).toHaveCount(2)
    const groupCard = page
      .getByTestId('group-card')
      .filter({ hasText: 'Group 2' })
    await expect(groupCard).toContainText('2 coaches, 2 coachees')
    await page.getByTestId('sandbox-tab-today').click()
    await expect(page.getByTestId('setup-groups')).toContainText(
      '2 groups · 3 coachees',
    )
  })

  test('coach sees the coachees as clients and cannot open the admin panel', async ({
    page,
    request,
  }) => {
    await login(page, USERS.marcus.email)
    await page.goto('/clients')
    await expect(page.getByText(NADIA.name).first()).toBeVisible()
    await expect(page.getByText(KOFI.name).first()).toBeVisible()

    await page.goto('/admin/sandboxes')
    await page.waitForTimeout(3000)
    await expect(page.getByTestId('sandboxes-page')).toHaveCount(0)

    // The ops table stays admin-only; the member view is where a coach goes.
    const coachToken = await apiToken(request, USERS.marcus.email)
    const resp = await request.get(`${API}/sandboxes/`, {
      headers: auth(coachToken),
    })
    expect(resp.status()).toBe(403)
    const mine = await request.get(`${API}/sandboxes/mine`, {
      headers: auth(coachToken),
    })
    expect(mine.status()).toBe(200)
    expect(
      (await mine.json()).sandboxes.map((s: { id: string }) => s.id),
    ).toContain(sandboxId)
  })

  test('sends, revokes and resends invitations', async ({ page }) => {
    await login(page, USERS.admin.email)
    await openSandbox(page, 'team')

    const panel = page.getByTestId('invitations-panel')
    await expect(panel.getByTestId('invitations-title')).toHaveText(
      '4 people are waiting on an invitation',
    )
    const row = (email: string) =>
      panel.locator(`[data-testid="invitation-row"][data-email="${email}"]`)
    await expect(
      row(USERS.dana.email).getByTestId('invitation-badge'),
    ).toHaveText('Has an account')
    await expect(row(NADIA.email)).toContainText('Vision, timeline, all groups')
    await expect(row(KOFI.email)).toContainText('Their own sessions')

    await panel.getByTestId('preview-email').click()
    await expect(page.getByTestId('email-preview')).toContainText(
      'invited you to',
    )
    await expect(
      page.getByTestId('email-preview').locator('iframe'),
    ).toBeVisible()
    await page.keyboard.press('Escape')

    await panel.getByTestId('send-all').click()
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(panel.getByTestId('invitations-title')).toHaveText(
      'Everyone has been invited',
    )
    await expect(
      row(NADIA.email).getByTestId('invitation-badge'),
    ).toContainText('Sent')
    await expect(
      row(USERS.dana.email).getByTestId('invitation-badge'),
    ).toContainText('Sent')

    await row(LENA.email).getByTestId('revoke-one').click()
    await page.getByRole('button', { name: 'Revoke', exact: true }).click()
    await expect(row(LENA.email).getByTestId('invitation-badge')).toHaveText(
      'Not sent',
    )
    await expect(panel.getByTestId('invitations-title')).toHaveText(
      'One person is waiting on an invitation',
    )

    await row(KOFI.email).getByTestId('resend-one').click()
    await expect(
      page.getByText('Invitation resent with a fresh link'),
    ).toBeVisible()

    await page.getByTestId('sandbox-tab-today').click()
    await expect(page.getByTestId('setup-invitations')).toContainText(
      'still waiting',
    )
  })

  test('a new coachee signs up from the link and lands in the client portal', async ({
    browser,
  }) => {
    const { token } = invitationToken(NADIA.email)
    const context = await browser.newContext()
    const page = await context.newPage()
    await muteAgent(page)
    await page.goto(`/sandboxes/invite/${token}`)
    await expect(page.getByText(`invited you to ${SANDBOX_NAME}`)).toBeVisible()
    await expect(page.getByTestId('invite-name')).toHaveValue(NADIA.name)
    await page.getByTestId('invite-password').fill(PASSWORD)
    await page.getByTestId('invite-confirm').fill(PASSWORD)
    await page.getByTestId('invite-submit').click()
    await page.waitForURL(/\/client-portal\/dashboard/, { timeout: 45_000 })
    await expect(page.getByTestId('sandbox-note')).toContainText(
      `${SANDBOX_NAME} with ${ORG}`,
    )
    await expect(page.getByTestId('sandbox-note')).toContainText('Marcus')
    await context.close()
  })

  test('an existing account connects with its password and lands on the welcome page', async ({
    browser,
  }) => {
    const { token } = invitationToken(USERS.dana.email)
    const context = await browser.newContext()
    const page = await context.newPage()
    await muteAgent(page)
    await page.goto(`/sandboxes/invite/${token}`)
    await expect(
      page.getByText('You already have a Coach Sidekick account'),
    ).toBeVisible()
    await page.getByTestId('invite-password').fill(PASSWORD)
    await page.getByTestId('invite-submit').click()
    // The welcome page hands straight over to the sandbox itself — and Dana
    // supervises this one, so what she arrives at is the client view.
    await page.waitForURL(/\/sandboxes\/[0-9a-f-]{36}$/, { timeout: 45_000 })
    await expect(page.getByTestId('client-view')).toBeVisible()
    await expect(page.getByTestId('client-hero')).toContainText(SANDBOX_NAME)
    await expect(page.getByTestId('sandbox-view')).toHaveAttribute(
      'data-audience',
      'theirs',
    )
    await context.close()
  })

  test('a revoked link explains itself, and accepted rows show as accepted', async ({
    browser,
    page,
  }) => {
    const { token, status } = invitationToken(LENA.email)
    expect(status).toBe('revoked')
    const context = await browser.newContext()
    const other = await context.newPage()
    await other.goto(`/sandboxes/invite/${token}`)
    await expect(other.getByText('This invitation was withdrawn')).toBeVisible()
    await context.close()

    await login(page, USERS.admin.email)
    await openSandbox(page, 'team')
    const panel = page.getByTestId('invitations-panel')
    await expect(
      panel
        .locator(`[data-testid="invitation-row"][data-email="${NADIA.email}"]`)
        .getByTestId('invitation-badge'),
    ).toHaveText('Accepted')
    await expect(
      panel
        .locator(
          `[data-testid="invitation-row"][data-email="${USERS.dana.email}"]`,
        )
        .getByTestId('invitation-badge'),
    ).toHaveText('Accepted')
    await expect(
      page.getByTestId('person-row').filter({ hasText: NADIA.name }),
    ).toContainText('Accepted')
  })

  test('removing a member who is in a group asks first, then removes from the group too', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await openSandbox(page, 'team')

    const kofiRow = page
      .getByTestId('person-row')
      .filter({ hasText: KOFI.name })
    await kofiRow
      .getByRole('button', { name: `Actions for ${KOFI.name}` })
      .click()
    await page.getByRole('menuitem', { name: 'Remove from sandbox' }).click()
    await page.getByTestId('remove-confirm').click()
    await expect(page.getByRole('dialog')).toContainText('is in Group 2')
    await page.getByTestId('remove-anyway').click()
    await expect(kofiRow).toHaveCount(0)
    await page.getByTestId('sandbox-tab-groups').click()
    await expect(
      page.getByTestId('group-card').filter({ hasText: 'Group 2' }),
    ).toContainText('2 coaches, 1 coachee')
    expect(sandboxId).toMatch(/[0-9a-f-]{36}/)
  })
})
