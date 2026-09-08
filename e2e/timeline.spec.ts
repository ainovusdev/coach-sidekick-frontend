import { expect, test, type Locator, type Page } from '@playwright/test'
import { API, USERS, apiToken, auth, gotoSandboxTab, login } from './helpers'

/**
 * Chunk 4 — timeline hand adjustment + regeneration, on its own sandbox
 * (6 months from 1 Jun 2026: gold sealing 1 Jun–1 Jul · check-in 1 27 Jul–7 Aug
 * · midpoint 1–31 Aug · check-in 2 28 Sep–9 Oct · results review 1–11 Dec).
 */
test.describe.configure({ mode: 'serial' })

const NAME = 'E2E Timeline'
let sandboxId = ''

const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth()

/**
 * Pick a day in a DueDateField. The calendar opens on the month of the
 * field's current value (`from`), or on today's month when it is empty.
 */
async function pickDay(page: Page, fieldId: string, from: Date, target: Date) {
  await page.click(`#${fieldId}`)
  const steps = monthIndex(target) - monthIndex(from)
  const nav = steps > 0 ? /next month/i : /previous month/i
  for (let i = 0; i < Math.abs(steps); i++) {
    await page.getByRole('button', { name: nav }).click()
  }
  await page
    .locator(
      `button[data-day="${target.getMonth() + 1}/${target.getDate()}/${target.getFullYear()}"]`,
    )
    .first()
    .click()
}

const d = (iso: string) => {
  const [y, m, day] = iso.split('-').map(Number)
  return new Date(y, m - 1, day)
}

function events(page: Page): Locator {
  return page.getByTestId('timeline-event')
}

async function openMenu(page: Page, label: string, item: string) {
  await events(page)
    .filter({ hasText: label })
    .getByRole('button', { name: `Actions for ${label}` })
    .click()
  await page.getByRole('menuitem', { name: item }).click()
}

test.describe('Sandboxes — timeline hand adjustment', () => {
  test('creates the fixture sandbox', async ({ page, request }) => {
    const token = await apiToken(request, USERS.admin.email)
    const resp = await request.post(`${API}/sandboxes/`, {
      headers: auth(token),
      data: {
        name: NAME,
        organisation: 'PTG',
        term_start: '2026-06-01',
        term_months: 6,
      },
    })
    expect(resp.status()).toBe(201)
    sandboxId = (await resp.json()).sandbox.id

    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'timeline')
    await expect(events(page)).toHaveCount(5)
    await expect(page.getByTestId('timeline-caption')).toHaveText(
      '5 events, generated from the term',
    )
    await expect(page.getByTestId('regenerate-timeline')).toHaveCount(0)
    await expect(page.getByTestId('hand-adjusted')).toHaveCount(0)
  })

  test('moves a check-in window and shifts the later check-in with it', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'timeline')

    await openMenu(page, 'Check-in 1', 'Adjust window')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Adjust Check-in 1')
    // Save is off until something changes.
    await expect(page.getByTestId('event-save')).toBeDisabled()
    await expect(page.getByTestId('shift-following')).toContainText(
      'Also shift the later check-in',
    )

    await pickDay(page, 'event-start', d('2026-07-27'), d('2026-08-03'))
    await pickDay(page, 'event-end', d('2026-08-07'), d('2026-08-14'))
    await expect(page.getByTestId('shift-following')).toContainText('+7 days')
    await page.getByTestId('event-save').click()
    await expect(dialog).toHaveCount(0)

    const checkin1 = events(page).filter({ hasText: 'Check-in 1' })
    await expect(checkin1).toContainText('3 – 14 Aug')
    await expect(checkin1.getByTestId('hand-adjusted')).toHaveText('Adjusted')
    const checkin2 = events(page).filter({ hasText: 'Check-in 2' })
    await expect(checkin2).toContainText('5 – 16 Oct')
    await expect(checkin2.getByTestId('hand-adjusted')).toHaveText('Adjusted')
    await expect(page.getByTestId('timeline-caption')).toHaveText(
      '5 events · 2 adjustments by hand',
    )
    await expect(page.getByTestId('regenerate-timeline')).toBeVisible()
  })

  test('keeps the results review after the term', async ({ page }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'timeline')

    await openMenu(page, 'Results review', 'Adjust window')
    await pickDay(page, 'event-start', d('2026-12-01'), d('2026-11-16'))
    await expect(page.getByTestId('event-problem')).toContainText(
      'always sits after the term, which ends 30 Nov 2026',
    )
    await expect(page.getByTestId('event-save')).toBeDisabled()
    await page.getByRole('button', { name: 'Cancel' }).click()
  })

  test('adds an event with a reason, sorted into date order', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'timeline')

    await page.getByTestId('add-event').click()
    await page.fill('#event-label', 'Board offsite')
    const today = new Date()
    await pickDay(page, 'event-start', today, d('2026-09-14'))
    await pickDay(page, 'event-end', d('2026-09-14'), d('2026-09-15'))
    await expect(page.getByTestId('event-save')).toBeDisabled() // reason missing
    await page.fill('#event-note', 'The client asked for a leadership offsite.')
    await page.getByTestId('event-save').click()

    await expect(events(page)).toHaveCount(6)
    await expect(events(page).nth(3)).toContainText('Board offsite')
    await expect(events(page).nth(3)).toContainText('14 – 15 Sep')
    await expect(events(page).nth(3).getByTestId('hand-adjusted')).toHaveText(
      'Added',
    )
  })

  test('removes an event with a reason, then restores it', async ({ page }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'timeline')

    await openMenu(page, 'Midpoint reporting', 'Remove…')
    await expect(page.getByTestId('remove-event-confirm')).toBeDisabled()
    await page.getByTestId('remove-reason').fill('No midpoint on this contract')
    await page.getByTestId('remove-event-confirm').click()

    await expect(events(page)).toHaveCount(5)
    await expect(events(page).filter({ hasText: 'Midpoint' })).toHaveCount(0)
    await page.getByTestId('removed-toggle').click()
    const removed = page.getByTestId('removed-event')
    await expect(removed).toHaveCount(1)
    await expect(removed).toContainText('Midpoint reporting')
    await expect(removed).toContainText('No midpoint on this contract')

    await page.getByTestId('restore-event').click()
    await expect(events(page)).toHaveCount(6)
    // Date order: gold sealing (Jun), midpoint (1 Aug), then the moved check-in (3 Aug).
    await expect(events(page).nth(1)).toContainText('Midpoint reporting')
    await expect(page.getByTestId('removed-toggle')).toHaveCount(0)
  })

  test('changing the term previews every event and keeps the hand adjustments', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'timeline')

    // The pencil in the header is a shortcut to Settings, where the term lives.
    await page.getByRole('button', { name: 'Edit sandbox details' }).click()
    const settings = page.getByTestId('settings-panel')
    await expect(settings).toContainText('Sandbox details')
    await expect(page.getByTestId('regen-preview')).toHaveCount(0)

    await settings.getByRole('radio', { name: '12' }).click()
    await expect(settings).toContainText('What happens to the timeline')
    const rows = page.getByTestId('regen-row')
    await expect(rows).toHaveCount(9) // the 6 on the timeline today + 3 new
    await expect(
      rows.filter({ hasText: 'Check-in 1' }).first(),
    ).toHaveAttribute('data-action', 'kept')
    await expect(rows.filter({ hasText: 'Board offsite' })).toHaveAttribute(
      'data-action',
      'kept',
    )
    await expect(rows.filter({ hasText: 'Results review' })).toHaveAttribute(
      'data-action',
      'moved',
    )
    await expect(rows.filter({ hasText: 'Check-in 3' })).toHaveAttribute(
      'data-action',
      'added',
    )
    await expect(page.getByTestId('regen-summary')).toContainText('3 new')
    await expect(page.getByTestId('regen-overwrite')).toBeVisible()
    await expect(page.getByTestId('settings-save')).toHaveText(
      'Save and regenerate',
    )
    await page.getByTestId('settings-save').click()

    await expect(page.getByTestId('identity-card')).toContainText('12 months')
    await page.getByTestId('sandbox-tab-timeline').click()
    await expect(events(page)).toHaveCount(9) // 8 generated + the added one
    const checkin1 = events(page).filter({ hasText: 'Check-in 1' })
    await expect(checkin1).toContainText('3 – 14 Aug')
    await expect(checkin1.getByTestId('hand-adjusted')).toHaveText('Adjusted')
    await expect(events(page).filter({ hasText: 'Board offsite' })).toHaveCount(
      1,
    )
    await expect(
      events(page).filter({ hasText: 'Midpoint reporting 1' }),
    ).toContainText('1 – 30 Sep')
    await expect(events(page).last()).toContainText('1 – 11 Jun')
  })

  test('regenerate resets the hand adjustments when asked', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'timeline')

    await page.getByTestId('regenerate-timeline').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Regenerate the timeline')
    await expect(page.getByTestId('regen-overwrite')).toBeChecked()
    await expect(page.getByTestId('regen-preview')).toBeVisible()
    const rows = page.getByTestId('regen-row')
    await expect(rows.filter({ hasText: 'Board offsite' })).toHaveAttribute(
      'data-action',
      'dropped',
    )
    await expect(
      rows.filter({ hasText: 'Check-in 1' }).first(),
    ).toHaveAttribute('data-action', 'overwritten')

    // Unchecking turns it into a no-op: nothing to apply.
    await page.getByTestId('regen-overwrite').click()
    await expect(page.getByTestId('regen-summary')).toContainText('3 kept')
    await expect(page.getByTestId('regen-confirm')).toBeDisabled()
    await page.getByTestId('regen-overwrite').click()
    await page.getByTestId('regen-confirm').click()
    await expect(dialog).toHaveCount(0)

    await expect(events(page)).toHaveCount(8)
    await expect(page.getByTestId('hand-adjusted')).toHaveCount(0)
    await expect(page.getByTestId('timeline-caption')).toHaveText(
      '8 events, generated from the term',
    )
    await expect(page.getByTestId('regenerate-timeline')).toHaveCount(0)
    await expect(events(page).filter({ hasText: 'Check-in 1' })).toContainText(
      '27 Jul – 7 Aug',
    )
  })
})
