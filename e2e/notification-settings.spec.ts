import { expect, test, type Page } from '@playwright/test'
import { API, USERS, apiToken, login } from './helpers'

/**
 * Notifications reach people on two channels — the in-app bell and email.
 * The email half has a switch of the person's own, kept in the bell popover
 * so it is in the same place under every header.
 */
test.describe.configure({ mode: 'serial' })

const WHO = USERS.priya.email

/** The switch flips before its save lands, so wait for the save itself. */
function saved(page: Page) {
  return page.waitForResponse(
    response =>
      response.url().endsWith('/notifications/settings') &&
      response.request().method() === 'PUT',
  )
}

test('the email switch lives in the bell and sticks', async ({
  page,
  request,
}) => {
  await login(page, WHO)
  const bell = page.getByTestId('notification-bell').first()
  await bell.click()
  const popover = page.getByTestId('notification-popover')
  await expect(popover).toBeVisible()
  const toggle = popover.getByTestId('notification-email-toggle')
  await expect(toggle).toHaveAttribute('data-state', 'checked')
  await expect(popover).toContainText(`also go to ${WHO}`)

  const off = saved(page)
  await toggle.click()
  await expect(toggle).toHaveAttribute('data-state', 'unchecked')
  await expect(popover).toContainText('Only shown here, no emails')
  expect((await off).ok()).toBeTruthy()

  // persisted on the server, not just in the popover
  const token = await apiToken(request, WHO)
  const settings = await request.get(`${API}/notifications/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(settings.ok()).toBeTruthy()
  expect(await settings.json()).toEqual({ email_enabled: false, email: WHO })

  await page.reload()
  await page.getByTestId('notification-bell').first().click()
  const again = page
    .getByTestId('notification-popover')
    .getByTestId('notification-email-toggle')
  await expect(again).toHaveAttribute('data-state', 'unchecked')

  // and back on, so the fixture user is left as it was
  const on = saved(page)
  await again.click()
  await expect(again).toHaveAttribute('data-state', 'checked')
  expect((await on).ok()).toBeTruthy()
  const restored = await request.get(`${API}/notifications/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect((await restored.json()).email_enabled).toBe(true)
})
