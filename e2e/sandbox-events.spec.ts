import { test, expect, type APIRequestContext } from '@playwright/test'
import {
  API,
  USERS,
  apiToken,
  auth,
  gotoSandboxTab,
  hideDevtools,
  login,
} from './helpers'

/**
 * Every timeline event is a commitment.
 *
 *   • Priya (account executive) opens Gold sealing from its card, sees the
 *     event window as the panel's eyebrow, and quick-adds "Confirm
 *     attendees" for Marcus; the card counts it
 *   • Marcus (lead coach) gets the bell, opens the card, ticks his row off
 *     from the event, and his own panel lists Gold sealing back
 *   • Dana (their side) sees a calendar: no card opens anything
 *
 * Fixtures: seed script (`reset`); the sandbox is built here through the API
 * as Priya. Later specs assert exact bell counts, so the row is removed and
 * Marcus's bell cleared at the end.
 */

const NAME = 'E2E Events Directors'
const ORG = 'Preferred Travel Group'

async function api(
  request: APIRequestContext,
  token: string,
  method: 'get' | 'post' | 'patch' | 'delete',
  path: string,
  data?: unknown,
) {
  const resp = await request[method](`${API}${path}`, {
    headers: auth(token),
    data,
  })
  if (!resp.ok())
    throw new Error(
      `${method.toUpperCase()} ${path} → ${resp.status()} ${await resp.text()}`,
    )
  return resp.status() === 204 ? null : resp.json()
}

// One sandbox for the file; a failure must not restart the worker and
// rebuild it, so the later tests are skipped instead.
test.describe.configure({ mode: 'serial' })

test.describe('Sandboxes — events are commitments', () => {
  let sandboxId = ''
  let marcusId = ''
  let taskId = ''

  test.beforeAll(async ({ request }) => {
    const priya = await apiToken(request, USERS.priya.email)
    const created = await api(request, priya, 'post', '/sandboxes/', {
      name: NAME,
      organisation: ORG,
      term_start: '2026-06-01',
      term_months: 6,
      links: [],
    })
    sandboxId = created.sandbox.id
    const marcus = (
      await api(
        request,
        priya,
        'get',
        `/sandboxes/people/search?q=marcus&sandbox_id=${sandboxId}`,
      )
    )[0]
    marcusId = marcus.id
    await api(request, priya, 'post', `/sandboxes/${sandboxId}/members`, {
      side: 'ours',
      roles: ['lead_coach'],
      user_id: marcus.id,
    })
    await api(request, priya, 'post', `/sandboxes/${sandboxId}/members`, {
      side: 'theirs',
      roles: ['supervisor'],
      email: USERS.dana.email,
      name: USERS.dana.name,
    })
  })

  test.afterAll(async ({ request }) => {
    const priya = await apiToken(request, USERS.priya.email)
    if (taskId)
      await request.delete(`${API}/commitments/${taskId}`, {
        headers: auth(priya),
      })
    const marcus = await apiToken(request, USERS.marcus.email)
    await request.post(`${API}/notifications/read-all`, {
      headers: auth(marcus),
    })
  })

  test('the account executive opens an event and hands out work from it', async ({
    page,
    request,
  }) => {
    await login(page, USERS.priya.email)
    await gotoSandboxTab(page, `/sandboxes/${sandboxId}`, 'timeline')
    await hideDevtools(page)
    const card = page.locator(
      '[data-testid="timeline-event"][data-kind="gold_sealing"]',
    )
    await expect(card).toHaveAttribute('data-commitment-id', /.+/)
    await expect(card.getByTestId('event-progress')).toHaveText('0/4 subtasks')

    await card.click()
    const panel = page.getByTestId('commitment-detail-panel')
    await expect(panel).toHaveAttribute('data-open', 'true')
    await expect(panel.getByTestId('event-header')).toBeVisible()
    await expect(panel.getByTestId('commitment-panel-title')).toHaveText(
      'Gold sealing',
    )
    await expect(panel.getByTestId('due-locked')).toBeVisible()

    // Quick add for Marcus, straight from the event.
    const section = panel.getByTestId('related-commitments')
    await expect(section.getByTestId('related-empty')).toBeVisible()
    await section.getByTestId('related-add-assignee').click()
    const search = page.getByTestId('related-add-assignee-search')
    await expect(search).toBeFocused()
    await search.fill('Marc')
    await page
      .getByTestId('person-option')
      .filter({ hasText: USERS.marcus.name })
      .first()
      .click()
    const input = section.getByTestId('related-add-input')
    await input.fill('E2E Confirm attendees')
    await input.press('Enter')
    const row = section
      .getByTestId('related-row')
      .filter({ hasText: 'E2E Confirm attendees' })
    await expect(row).toBeVisible()
    await expect(section.getByTestId('related-count')).toHaveText('0/1')
    taskId = (await row.getAttribute('data-id')) ?? ''
    expect(taskId).not.toBe('')
    const priya = await apiToken(request, USERS.priya.email)
    const task = await api(request, priya, 'get', `/commitments/${taskId}`)
    expect(task.assignee?.user_id).toBe(marcusId)
    expect(task.sandbox_id).toBe(sandboxId)
    expect(task.related.map((r: { title: string }) => r.title)).toEqual([
      'Gold sealing',
    ])

    // The card counts it; the sandbox's own list does not show the event.
    await page.keyboard.press('Escape')
    await expect(panel).toHaveAttribute('data-open', 'false')
    await expect(card.getByTestId('event-progress')).toHaveText(
      '0/4 subtasks · 1 related',
    )
    await page.getByTestId('sandbox-tab-today').click()
    const list = page.getByTestId('commitments-panel')
    await expect(
      list.getByTestId('commitment-row').filter({ hasText: 'Gold sealing' }),
    ).toHaveCount(0)
    await expect(
      list
        .getByTestId('commitment-row')
        .filter({ hasText: 'E2E Confirm attendees' }),
    ).toBeVisible()
  })

  test('the lead coach is told, ticks it off from the event, and sees the event on his row', async ({
    page,
  }) => {
    await login(page, USERS.marcus.email)
    await page.getByTestId('notification-bell').click()
    await expect(
      page
        .getByTestId('notification-item')
        .filter({ hasText: 'E2E Confirm attendees' }),
    ).toBeVisible()
    await page.keyboard.press('Escape')

    await gotoSandboxTab(page, `/sandboxes/${sandboxId}`, 'timeline')
    await hideDevtools(page)
    const card = page.locator(
      '[data-testid="timeline-event"][data-kind="gold_sealing"]',
    )
    await expect(card.getByTestId('event-progress')).toHaveText(
      '0/4 subtasks · 1 related',
    )
    await card.focus()
    await page.keyboard.press('Enter')
    const panel = page.getByTestId('commitment-detail-panel')
    await expect(panel.getByTestId('commitment-panel-title')).toHaveText(
      'Gold sealing',
    )
    const row = panel
      .getByTestId('related-row')
      .filter({ hasText: 'E2E Confirm attendees' })
    await row.getByTestId('related-toggle').click()
    await expect(row).toHaveAttribute('data-status', 'completed')

    // Hop to his row: the event is listed back, tagged as one.
    await row.getByTestId('related-title').click()
    await expect(panel.getByTestId('commitment-panel-title')).toHaveText(
      'E2E Confirm attendees',
    )
    const back = panel
      .getByTestId('related-row')
      .filter({ hasText: 'Gold sealing' })
    await expect(back).toBeVisible()
    await expect(back.getByTestId('related-event-tag')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(card.getByTestId('event-progress')).toHaveText(
      '0/4 subtasks · 1 related',
    )
  })

  test('a check-in opens with its checklist, grouped and dated', async ({
    page,
  }) => {
    await login(page, USERS.priya.email)
    await gotoSandboxTab(page, `/sandboxes/${sandboxId}`, 'timeline')
    await hideDevtools(page)
    const card = page
      .locator('[data-testid="timeline-event"][data-kind="check_in"]')
      .first()
    await expect(card.getByTestId('event-progress')).toHaveText('0/8 subtasks')

    await card.click()
    const panel = page.getByTestId('commitment-detail-panel')
    const subtasks = panel.getByTestId('subtasks')
    await expect(subtasks.getByTestId('subtask-count')).toHaveText('0/8')
    await expect(subtasks.getByTestId('subtask-section')).toHaveCount(4)
    await expect(
      subtasks.getByTestId('subtask-section').first(),
    ).toHaveAttribute('data-section', 'Scheduling · 45–60 days before')
    await expect(
      subtasks.getByTestId('subtask-section').last(),
    ).toHaveAttribute('data-section', 'After the call')
    const rows = subtasks.getByTestId('subtask-row')
    await expect(rows).toHaveCount(8)
    await expect(rows.first()).toContainText(
      'Confirm the check-in timeline with the lead coach',
    )
    // Every seeded step carries the date it is due.
    await expect(subtasks.getByTestId('subtask-due')).toHaveCount(8)

    // Tick the first: the header, the card and the row all move.
    await rows.first().getByTestId('subtask-toggle').click()
    await expect(subtasks.getByTestId('subtask-count')).toHaveText('1/8')
    await expect(rows.first()).toHaveAttribute('data-status', 'completed')
    await page.keyboard.press('Escape')
    await expect(card.getByTestId('event-progress')).toHaveText('1/8 subtasks')

    // Removing a step leaves the rest of the checklist alone.
    await card.click()
    await rows.nth(7).hover()
    await rows.nth(7).getByTestId('subtask-delete').click()
    await expect(rows).toHaveCount(7)
    await expect(subtasks.getByTestId('subtask-count')).toHaveText('1/7')
    await page.keyboard.press('Escape')
    await expect(card.getByTestId('event-progress')).toHaveText('1/7 subtasks')
  })

  test('their side sees a calendar', async ({ page }) => {
    await login(page, USERS.dana.email)
    await gotoSandboxTab(page, `/sandboxes/${sandboxId}`, 'timeline')
    await hideDevtools(page)
    await expect(page.getByTestId('timeline-event').first()).toBeVisible()
    await expect(page.locator('[data-commitment-id]')).toHaveCount(0)
    await expect(page.getByTestId('event-progress')).toHaveCount(0)
  })
})
