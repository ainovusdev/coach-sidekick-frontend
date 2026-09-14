import { expect, test, type Page } from '@playwright/test'
import { login, seedClient, USERS } from './helpers'

// Client lists and pickers ask for sandbox markers only when the viewer is in a
// sandbox. Membership is mocked so the order other specs run in cannot change it.
const NAME = 'Imogen Vale'
let clientId = ''

async function watch(page: Page, total: number) {
  const counts = { mine: 0, contexts: 0 }
  await page.route('**/sandboxes/mine*', route => {
    counts.mine++
    return route.fulfill({ json: { sandboxes: [], total } })
  })
  await page.route('**/sandboxes/client-contexts', route => {
    counts.contexts++
    const input = route.request().postDataJSON()
    return route.fulfill({
      json: {
        clients: input.client_ids.map((id: string) => ({
          client_id: id,
          contexts:
            id === clientId
              ? [
                  {
                    sandbox_id: 'c5a52f6c-a2c3-4c15-8750-6c15bc3a52e0',
                    sandbox_name: 'Harbour leadership coaching',
                    group_id: 'c5a52f6c-a2c3-4c15-8750-6c15bc3a52e1',
                    group_name: 'Directors',
                    member_id: 'c5a52f6c-a2c3-4c15-8750-6c15bc3a52e2',
                    starts_on: '2026-01-01',
                    ends_on: '2027-01-01',
                  },
                ]
              : [],
        })),
      },
    })
  })
  return counts
}

test.describe('Sandbox client markers', () => {
  test.beforeAll(() => {
    clientId = seedClient({
      coachEmail: USERS.marcus.email,
      clientEmail: 'e2e-markers-imogen@ptg-e2e.com',
      name: NAME,
    }).id
  })

  test('a coach in no sandbox never asks for markers', async ({ page }) => {
    const counts = await watch(page, 0)
    await login(page, USERS.marcus.email)
    await page.goto('/clients')
    await expect(page.getByText(NAME).first()).toBeVisible()
    await expect.poll(() => counts.mine).toBeGreaterThan(0)
    // Give a regressed hook time to fire before asserting it never did.
    await page.waitForTimeout(1500)
    expect(counts.contexts).toBe(0)
    await expect(page.getByTestId('sandbox-client-badge')).toHaveCount(0)
  })

  test('a coach in a sandbox sees the marker on an enrolled client', async ({
    page,
  }) => {
    const counts = await watch(page, 1)
    await login(page, USERS.marcus.email)
    await page.goto('/clients')
    await expect(page.getByTestId('sandbox-client-badge')).toHaveCount(1)
    expect(counts.contexts).toBeGreaterThan(0)
  })
})
