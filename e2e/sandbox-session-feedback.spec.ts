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
  login,
  seedHeldGroupSession,
  USERS,
} from './helpers'

/**
 * After a sandbox session two forms go out: each coachee's Thrill Form and the
 * coach's reflection. Our side reads both on the sandbox's pages; the client's
 * side is told nothing — no section, and no request that could leak one.
 *
 * Fixture "E2E Session Feedback": Marcus coaches Kofi and Lena in one group,
 * Priya is the lead coach, Omar is the client's admin. Sorted after
 * `sandbox-dashboards` for the same reason as `sandbox-groups-coach`.
 */
test.describe.configure({ mode: 'serial' })

const NAME = 'E2E Session Feedback'
const KOFI = { email: 'e2e-kofi-feedback@ptg-e2e.com', name: 'Kofi Asante' }
const LENA = { email: 'e2e-lena-feedback@ptg-e2e.com', name: 'Lena Fischer' }
const WINS = ['Kofi ran his first offsite', 'Lena hired a deputy']

let sandboxId = ''
let groupId = ''
let sessionId = ''
let reflectionToken = ''
let kofiToken = ''

function termStart(): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 3)
  return d.toISOString().slice(0, 10)
}

/** A finished session with a transcript asks for an AI analysis on load. */
async function noAnalysis(page: Page) {
  await page.route('**/api/v1/analysis/**', route =>
    route.request().method() === 'POST' ? route.abort() : route.continue(),
  )
}

/** `layout-overflow` runs before this fixture exists, so its rule is kept here. */
async function noSideways(page: Page, label: string) {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 })
    const over = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    )
    expect(over, `${label} at ${width}px`).toBeLessThanOrEqual(0)
  }
  await page.setViewportSize({ width: 1440, height: 900 })
}

async function api(
  request: APIRequestContext,
  token: string,
  method: 'get' | 'post',
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

test.describe('Sandboxes — post-session feedback', () => {
  test('builds the fixture and completes a group session', async ({
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
    const marcus = (
      await api(request, token, 'get', '/sandboxes/people/search?q=marcus')
    )[0]
    const priya = (
      await api(request, token, 'get', '/sandboxes/people/search?q=priya')
    )[0]
    await api(request, token, 'post', `/sandboxes/${sandboxId}/members`, {
      side: 'ours',
      roles: ['lead_coach'],
      user_id: priya.id,
    })
    await api(request, token, 'post', `/sandboxes/${sandboxId}/members`, {
      side: 'theirs',
      roles: ['primary_client_admin'],
      email: USERS.omar.email,
      name: USERS.omar.name,
    })
    const group = await buildGroup(request, token, sandboxId, {
      coach_user_ids: [marcus.id],
      coachees: [KOFI, LENA],
      hours_per_coachee: 13.5,
    })
    groupId = group.id

    const held = seedHeldGroupSession({
      coachEmail: USERS.marcus.email,
      groupId,
      clientEmails: [KOFI.email, LENA.email],
    })
    sessionId = held.id
    // One Thrill Form per coachee in the room, and one reflection for the coach.
    expect(held.tokens.map(t => t.kind).sort()).toEqual([
      'coach_reflection',
      'post_session',
      'post_session',
    ])
    reflectionToken = held.tokens.find(
      t => t.kind === 'coach_reflection',
    )!.token
    kofiToken = held.tokens.find(t => t.client_email === KOFI.email)!.token
  })

  test('the coach is asked once, about each coachee, from the session page', async ({
    page,
  }) => {
    await noAnalysis(page)
    await login(page, USERS.marcus.email)
    await page.goto(`/sessions/${sessionId}`)

    const forms = page.getByTestId('thrill-form-card')
    await expect(forms).toHaveCount(2)
    await expect(forms.filter({ hasText: KOFI.name })).toBeVisible()
    await expect(forms.filter({ hasText: LENA.name })).toBeVisible()

    const card = page.getByTestId('coach-reflection-card')
    await expect(card).toContainText('Yours to fill in')
    await expect(card.getByTestId('coach-reflection-fill')).toHaveAttribute(
      'href',
      new RegExp(`/questionnaire/${reflectionToken}$`),
    )
  })

  test('the reflection form: a section per coachee, a date and a list of wins', async ({
    page,
  }) => {
    await page.goto(`/questionnaire/${reflectionToken}`)
    await expect(page.getByText('Coach Reflection').first()).toBeVisible()
    await page.getByRole('button', { name: 'List' }).click()

    const blocks = page.getByTestId('question-block')
    await expect(blocks).toHaveCount(8)
    // Per-coachee questions come first, grouped under the coachee's name.
    await expect(blocks.nth(0)).toContainText(KOFI.name)
    await expect(blocks.nth(2)).toContainText(LENA.name)

    await blocks.nth(0).getByRole('button', { name: 'On track' }).click()
    await blocks.nth(1).getByRole('button', { name: 'Rate 9' }).click()
    await blocks.nth(2).getByRole('button', { name: 'Off track' }).click()
    await blocks.nth(3).getByRole('button', { name: 'Rate 4' }).click()
    await blocks
      .nth(4)
      .locator('textarea')
      .fill('Lena went quiet when targets came up.')
    await blocks.nth(6).locator('input[type="date"]').fill('2026-10-02')
    const wins = blocks.nth(7)
    await wins.getByTestId('list-add').click()
    await wins.getByPlaceholder('Win 1').fill(WINS[0])
    await wins.getByTestId('list-add').click()
    await wins.getByPlaceholder('Win 2').fill(WINS[1])

    await noSideways(page, 'reflection form')

    await page.getByRole('button', { name: /^Complete/ }).click()
    await expect(page.getByText(/reflection/i).first()).toBeVisible()
    await expect(page.getByTestId('question-block')).toHaveCount(0)
  })

  test('a coachee answers their Thrill Form', async ({ request }) => {
    const form = await (
      await request.get(`${API}/questionnaire/public/${kofiToken}`)
    ).json()
    expect(form.client_name).toBe(KOFI.name)
    const resp = await request.post(
      `${API}/questionnaire/public/${kofiToken}/submit`,
      {
        data: {
          answers: [
            { question_index: 0, answer: '10' },
            { question_index: 3, answer: 'yes' },
          ],
        },
      },
    )
    expect(resp.ok()).toBeTruthy()
  })

  test('the account executive reads both forms and the wins on the group page', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await page.goto(`/sandboxes/${sandboxId}/groups/${groupId}`)

    const section = page.getByTestId('session-feedback')
    await expect(section).toBeVisible()
    const row = section.getByTestId('feedback-session')
    await expect(row).toHaveCount(1)
    await expect(row).toContainText('Coach reflection in')
    await expect(row).toContainText('Thrill Forms 1 of 2')
    // Open by default: on/off track and rapport per coachee, then the notes.
    await expect(row).toContainText('Off track')
    await expect(row).toContainText('9 / 10')
    await expect(row).toContainText('Lena went quiet when targets came up.')
    await expect(row).toContainText(`Thrill Form · ${KOFI.name}`)
    await expect(row).toContainText('Sent, not opened yet.')

    const wins = page.getByTestId('sandbox-wins')
    for (const win of WINS) await expect(wins).toContainText(win)
    await noSideways(page, 'group page feedback')
  })

  test('a coachee’s page shows only what was said about them', async ({
    page,
    request,
  }) => {
    const token = await apiToken(request, USERS.admin.email)
    const overview = await api(
      request,
      token,
      'get',
      `/sandboxes/${sandboxId}/overview`,
    )
    const lena = overview.members.find(
      (m: { email: string }) => m.email === LENA.email,
    )
    await login(page, USERS.admin.email)
    await page.goto(`/sandboxes/${sandboxId}/clients/${lena.id}`)
    const row = page.getByTestId('feedback-session')
    await expect(row).toContainText('Off track')
    await expect(row).not.toContainText(KOFI.name)
    await expect(row).not.toContainText('9 / 10')
  })

  test('the lead coach reads it too', async ({ page }) => {
    await login(page, USERS.priya.email)
    await page.goto(`/sandboxes/${sandboxId}/groups/${groupId}`)
    await expect(page.getByTestId('session-feedback')).toContainText(
      'Lena went quiet when targets came up.',
    )
    await expect(page.getByTestId('sandbox-wins')).toContainText(WINS[0])
  })

  test('the coach sees their completed reflection on the session', async ({
    page,
  }) => {
    await noAnalysis(page)
    await login(page, USERS.marcus.email)
    await page.goto(`/sessions/${sessionId}`)
    const card = page.getByTestId('coach-reflection-card')
    await expect(card).toContainText('Completed')
    await expect(card).toContainText('Off track')
    await expect(card).toContainText(WINS[1])
    await expect(card.getByTestId('coach-reflection-fill')).toHaveCount(0)
    await noSideways(page, 'session page')
  })

  test('the client’s side sees no feedback and never asks for it', async ({
    page,
    request,
  }) => {
    const asked: string[] = []
    page.on('request', r => {
      if (/\/api\/v1\/sandboxes\/[^/]+\/feedback/.test(r.url()))
        asked.push(r.url())
    })
    await login(page, USERS.omar.email)
    await page.goto(`/sandboxes/${sandboxId}/groups/${groupId}`)
    await expect(page.getByText('Recent activity')).toBeVisible()
    await expect(page.getByTestId('session-feedback')).toHaveCount(0)
    await expect(page.getByTestId('sandbox-wins')).toHaveCount(0)
    await expect(page.getByText(WINS[0])).toHaveCount(0)
    expect(asked).toEqual([])

    // And asking directly is answered with nothing at all.
    const token = await apiToken(request, USERS.omar.email)
    const resp = await request.get(
      `${API}/sandboxes/${sandboxId}/feedback?group_id=${groupId}`,
      { headers: auth(token) },
    )
    expect(await resp.json()).toEqual({
      visible: false,
      sessions: [],
      wins: [],
    })
  })
})
