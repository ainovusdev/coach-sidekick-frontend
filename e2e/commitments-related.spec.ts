import { test, expect, type APIRequestContext } from '@playwright/test'
import {
  API,
  USERS,
  apiToken,
  auth,
  hideDevtools,
  login,
  seedClient,
} from './helpers'

/**
 * Related commitments — generic and symmetric.
 *
 *   • Marcus quick-adds a related commitment under one row and relates an
 *     existing one from the popover; both panels list each other
 *   • ticking a related row moves the count; the hub row shows "2 related"
 *   • unrelating from one side removes the pair for both
 *   • Zainab (coachee) sees the section in her portal, adds a related
 *     commitment of her own and hops between the two panels
 *
 * Fixtures: seed script (`reset`). Zainab's login and client row under Marcus
 * are created by `seedClient` — a fixture of this file's own, so the other
 * specs' coachees (Kofi, Dana) are untouched.
 */

const IMANI = { email: 'e2e-zainab@ptg-e2e.com', name: 'Zainab Musa' }

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

/** Later specs assert exact bell counts, so every row is removed again. */
const created: { id: string; by: string }[] = []

async function cleanup(request: APIRequestContext) {
  const tokens: Record<string, string> = {}
  for (const c of created.splice(0)) {
    tokens[c.by] ??= await apiToken(request, c.by)
    await request.delete(`${API}/commitments/${c.id}`, {
      headers: auth(tokens[c.by]),
    })
  }
  for (const who of [USERS.marcus.email, IMANI.email]) {
    tokens[who] ??= await apiToken(request, who)
    await request.post(`${API}/notifications/read-all`, {
      headers: auth(tokens[who]),
    })
  }
}

test.describe('commitments — related', () => {
  let clientId = ''

  test.beforeAll(() => {
    clientId = seedClient({
      coachEmail: USERS.marcus.email,
      clientEmail: IMANI.email,
      name: IMANI.name,
    }).id
  })

  test.afterEach(async ({ request }) => {
    await cleanup(request)
  })

  test('coach: quick add, relate existing, tick, hop, unrelate', async ({
    page,
    request,
  }) => {
    const marcus = await apiToken(request, USERS.marcus.email)
    const plan = await api(request, marcus, 'post', '/commitments/', {
      title: 'E2E Plan the offsite',
      client_id: clientId,
    })
    created.push({ id: plan.id, by: USERS.marcus.email })
    const venue = await api(request, marcus, 'post', '/commitments/', {
      title: 'E2E Book the venue',
      client_id: clientId,
    })
    created.push({ id: venue.id, by: USERS.marcus.email })

    await login(page, USERS.marcus.email)
    await page.goto(`/commitments?open=${plan.id}`)
    await hideDevtools(page)
    const panel = page.getByTestId('commitment-detail-panel')
    const section = panel.getByTestId('related-commitments')
    await expect(section).toBeVisible()
    await expect(section.getByTestId('related-empty')).toBeVisible()

    // Quick add: a new commitment in the same context, related to this one.
    const input = section.getByTestId('related-add-input')
    await input.fill('E2E Draft the agenda')
    await input.press('Enter')
    const agenda = section
      .getByTestId('related-row')
      .filter({ hasText: 'E2E Draft the agenda' })
    await expect(agenda).toBeVisible()
    created.push({
      id: (await agenda.getAttribute('data-id')) ?? '',
      by: USERS.marcus.email,
    })
    await expect(section.getByTestId('related-count')).toHaveText('0/1')

    // Relate an existing open commitment from the same client.
    await section.getByTestId('related-link-existing').click()
    const search = page.getByTestId('related-link-search')
    await expect(search).toBeFocused()
    await search.fill('venue')
    await page
      .getByTestId('related-link-option')
      .filter({ hasText: 'E2E Book the venue' })
      .click()
    const venueRow = section
      .getByTestId('related-row')
      .filter({ hasText: 'E2E Book the venue' })
    await expect(venueRow).toBeVisible()
    await expect(section.getByTestId('related-count')).toHaveText('0/2')

    // Tick one: the count moves and the row reads as done.
    await venueRow.getByTestId('related-toggle').click()
    await expect(section.getByTestId('related-count')).toHaveText('1/2')
    await expect(venueRow).toHaveAttribute('data-status', 'completed')

    // Hop: the panel swaps to the venue row, which lists the plan back.
    await venueRow.getByTestId('related-title').click()
    await expect(panel.getByTestId('commitment-panel-title')).toHaveText(
      'E2E Book the venue',
    )
    await expect(
      panel
        .getByTestId('related-row')
        .filter({ hasText: 'E2E Plan the offsite' }),
    ).toBeVisible()

    // The hub row carries the count.
    await page.keyboard.press('Escape')
    await expect(panel).toHaveAttribute('data-open', 'false')
    const hubRow = page
      .getByTestId('commitment-row')
      .filter({ hasText: 'E2E Plan the offsite' })
    await expect(hubRow.getByTestId('commitment-related-count')).toContainText(
      '2 related',
    )

    // Unrelate from the plan: gone on this side...
    await hubRow.getByTestId('commitment-row-title').click()
    await expect(panel.getByTestId('commitment-panel-title')).toHaveText(
      'E2E Plan the offsite',
    )
    const agendaRow = section
      .getByTestId('related-row')
      .filter({ hasText: 'E2E Draft the agenda' })
    await agendaRow.hover()
    await agendaRow.getByTestId('related-unlink').click()
    await expect(agendaRow).toHaveCount(0)
    await expect(section.getByTestId('related-count')).toHaveText('1/1')
    // ...and on the other (the API is the truth for both directions).
    const agendaDetail = await api(
      request,
      marcus,
      'get',
      `/commitments/${created[created.length - 1].id}`,
    )
    expect(agendaDetail.related).toHaveLength(0)
    expect(agendaDetail.related_total).toBe(0)
  })

  test('coachee: the portal shows the section and adds a related commitment', async ({
    page,
    request,
  }) => {
    const marcus = await apiToken(request, USERS.marcus.email)
    const read = await api(request, marcus, 'post', '/commitments/', {
      title: 'E2E Read chapter 3',
      client_id: clientId,
    })
    created.push({ id: read.id, by: USERS.marcus.email })
    const notes = await api(request, marcus, 'post', '/commitments/', {
      title: 'E2E Take notes',
      client_id: clientId,
      related_ids: [read.id],
    })
    created.push({ id: notes.id, by: USERS.marcus.email })

    await login(page, IMANI.email)
    await page.goto(`/client-portal/dashboard?commitment=${read.id}`)
    await hideDevtools(page)
    const panel = page.getByTestId('commitment-detail-panel')
    const section = panel.getByTestId('related-commitments')
    await expect(section).toBeVisible()
    await expect(
      section.getByTestId('related-row').filter({ hasText: 'E2E Take notes' }),
    ).toBeVisible()
    await expect(section.getByTestId('related-count')).toHaveText('0/1')

    const input = section.getByTestId('related-add-input')
    await input.fill('E2E Summarise the chapter')
    await input.press('Enter')
    const mine = section
      .getByTestId('related-row')
      .filter({ hasText: 'E2E Summarise the chapter' })
    await expect(mine).toBeVisible()
    created.push({
      id: (await mine.getAttribute('data-id')) ?? '',
      by: USERS.marcus.email,
    })
    // Her own row (the chip names her login), ticks from here.
    await expect(mine.getByTestId('assignee-chip')).not.toHaveAttribute(
      'data-assignee',
      'none',
    )
    await mine.getByTestId('related-toggle').click()
    await expect(section.getByTestId('related-count')).toHaveText('1/2')

    // Hop inside the portal panel and back.
    await mine.getByTestId('related-title').click()
    await expect(panel.getByTestId('commitment-panel-title')).toHaveText(
      'E2E Summarise the chapter',
    )
    await expect(
      panel
        .getByTestId('related-row')
        .filter({ hasText: 'E2E Read chapter 3' }),
    ).toBeVisible()
  })
})
