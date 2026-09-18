import { expect, test } from '@playwright/test'
import { USERS, login, muteAgent } from './helpers'

// Unique to this spec — every spec shares one database.
const ORG = 'Meridian Labs'
const NAME = 'E2E Meridian Growth'

test.describe('Sandboxes — a coach opens their own', () => {
  test('from the dashboard, and becomes its account executive', async ({
    page,
  }) => {
    await muteAgent(page)
    await login(page, USERS.priya.email)
    await page.goto('/sandboxes')
    await expect(page.getByTestId('sandbox-dashboard')).toBeVisible()

    await page.getByTestId('new-sandbox').click()
    await expect(page).toHaveURL(/\/sandboxes\/new$/)
    await expect(page.getByTestId('new-sandbox-page')).toBeVisible()

    await page.fill('#organisation', ORG)
    await expect(page.locator('#name')).toHaveValue(ORG)
    await page.fill('#name', NAME)

    // Start on the 1st of next month.
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
    await expect(page.getByTestId('term-preview')).toContainText('6 months')

    await page.getByTestId('create-sandbox').click()

    // A coach lands on the member cockpit, not the admin console.
    await page.waitForURL(/\/sandboxes\/[0-9a-f-]{36}$/)
    await expect(page.getByTestId('sandbox-hero')).toContainText(NAME)
    await expect(page.getByTestId('sandbox-hero')).toContainText(ORG)
    await page.getByTestId('sandbox-tab-people').click()
    const team = page.getByTestId('people-table')
    await expect(team).toContainText(USERS.priya.name)
    await expect(team).toContainText(/account executive/i)

    // …and the new sandbox is on their dashboard.
    await page.goto('/sandboxes')
    await expect(page.getByTestId('sandbox-dashboard')).toContainText(NAME)
  })
})
