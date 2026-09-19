import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test'
import { API, USERS, apiToken, auth, login } from './helpers'

/**
 * The coach's side of a sandbox: their groups on the home page, a session
 * started from the group, and the agreement a session credits settled before it
 * happens rather than in review afterwards.
 *
 * Fixture "E2E Coach Groups": Marcus coaches Nadia and Tomas in the first group
 * and Nadia again in "Directors" — so Nadia alone is ambiguous. Priya coaches
 * "Coaches' Circle", where Marcus is a *coachee*.
 *
 * The file name is load-bearing: specs run alphabetically against one shared
 * database, and this fixture gives Marcus one more sandbox. The home strip shows
 * three, so running before `sandbox-dashboards` pushes that spec's "E2E Delivery"
 * card off it. Keep this sorted after it.
 */
test.describe.configure({ mode: 'serial' })

const NAME = 'E2E Coach Groups'
const NADIA = { email: 'e2e-nadia-groups@ptg-e2e.com', name: 'Nadia Okafor' }
const TOMAS = { email: 'e2e-tomas-groups@ptg-e2e.com', name: 'Tomas Reyes' }
const MEET = 'https://zoom.us/j/5550001234'

let sandboxId = ''
let mainGroupId = ''
let directorsId = ''

function localDay(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function termStart(): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 3)
  return localDay(d)
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

/** Recall never gets called: capture what the app would have sent it. */
async function fakeBot(page: Page) {
  const sent: Record<string, unknown>[] = []
  await page.route('**/api/v1/bots/create', route => {
    const body = route.request().postDataJSON()
    sent.push(body)
    return route.fulfill({
      json: {
        id: 'bot_e2e_groups',
        status: 'joining',
        meeting_url: body.meeting_url,
        session_id: body.session_id ?? '00000000-0000-4000-8000-000000000000',
      },
    })
  })
  return sent
}

function rows(page: Page) {
  return page.getByTestId('sandbox-group-row').filter({ hasText: NAME })
}

function mainRow(page: Page) {
  return rows(page).filter({ hasText: TOMAS.name })
}

function directorsRow(page: Page) {
  return rows(page).filter({ hasText: 'Directors' })
}

async function groupSessions(request: APIRequestContext): Promise<number> {
  const token = await apiToken(request, USERS.marcus.email)
  const list = await api(request, token, 'get', '/group-sessions/')
  // `total`, not the page length: the list is paginated at 20.
  return list.total
}

test.describe('Sandboxes — the coach’s groups', () => {
  test('builds the fixture', async ({ request }) => {
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
    const main = await api(
      request,
      token,
      'post',
      `/sandboxes/${sandboxId}/groups`,
      {
        coach_user_ids: [marcus.id],
        coachees: [NADIA, TOMAS],
        hours_per_coachee: 13.5,
      },
    )
    mainGroupId = main.id
    const directors = await api(
      request,
      token,
      'post',
      `/sandboxes/${sandboxId}/groups`,
      {
        name: 'Directors',
        coach_user_ids: [marcus.id],
        coachees: [NADIA],
        hours_per_coachee: 18,
      },
    )
    directorsId = directors.id
    await api(request, token, 'post', `/sandboxes/${sandboxId}/groups`, {
      name: 'Coaches’ Circle',
      coach_user_ids: [priya.id],
      coachees: [{ email: USERS.marcus.email, name: USERS.marcus.name }],
    })
  })

  test('the home page lists the groups a coach coaches, not one they sit in', async ({
    page,
  }) => {
    await login(page, USERS.marcus.email)
    await page.goto('/')
    await expect(page.getByTestId('sandbox-groups')).toBeVisible()
    await expect(rows(page)).toHaveCount(2)
    await expect(mainRow(page)).toContainText(NADIA.name)
    await expect(directorsRow(page)).toBeVisible()
    await expect(
      page
        .getByTestId('sandbox-group-row')
        .filter({ hasText: 'Coaches’ Circle' }),
    ).toHaveCount(0)
  })

  test('a group session cannot start with nothing recording it', async ({
    page,
    request,
  }) => {
    const before = await groupSessions(request)
    await login(page, USERS.marcus.email)
    await page.goto('/')
    await mainRow(page).getByTestId('start-group-session').click()
    const submit = page.getByTestId('group-session-submit')
    await expect(submit).toBeDisabled()
    // The roster is shown, never chosen.
    await expect(page.getByRole('dialog')).toContainText('2 coachees')
    await expect(page.getByRole('dialog')).toContainText(TOMAS.name)
    await page.keyboard.press('Escape')
    expect(await groupSessions(request)).toBe(before)
  })

  test('starting from the group takes the whole roster and sends the bot', async ({
    page,
    request,
  }) => {
    const before = await groupSessions(request)
    const sent = await fakeBot(page)
    await login(page, USERS.marcus.email)
    await page.goto('/')
    await mainRow(page).getByTestId('start-group-session').click()
    await page.getByTestId('group-session-url').fill(MEET)
    const created = page.waitForResponse(
      r =>
        r.url().endsWith('/api/v1/group-sessions/') &&
        r.request().method() === 'POST',
    )
    await page.getByTestId('group-session-submit').click()
    const session = await (await created).json()
    expect(session.participant_count).toBe(2)
    expect(session.sandbox_group_id).toBe(mainGroupId)
    await expect(page).toHaveURL(/\/meeting\/bot_e2e_groups/)
    expect(sent).toHaveLength(1)
    expect(sent[0].session_id).toBe(session.id)
    expect(await groupSessions(request)).toBe(before + 1)
  })

  test('a session that already happened waits for its recording', async ({
    page,
  }) => {
    await login(page, USERS.marcus.email)
    await page.goto('/')
    await directorsRow(page).getByTestId('start-group-session').click()
    const created = page.waitForResponse(
      r =>
        r.url().endsWith('/api/v1/group-sessions/') &&
        r.request().method() === 'POST',
    )
    await page.getByTestId('group-session-upload').click()
    const session = await (await created).json()
    expect(session.status).toBe('pending_upload')
    await expect(page).toHaveURL(new RegExp(`/sessions/${session.id}`))
  })

  test('a session booked for today is started, not duplicated', async ({
    page,
    request,
  }) => {
    const token = await apiToken(request, USERS.marcus.email)
    // Later today on this machine's clock, without ever crossing midnight.
    const when = new Date()
    const endOfDay = new Date(when)
    endOfDay.setHours(23, 58, 0, 0)
    when.setMinutes(when.getMinutes() + 45)
    const booked = await api(
      request,
      token,
      'post',
      '/group-sessions/schedule',
      {
        sandbox_id: sandboxId,
        sandbox_group_id: mainGroupId,
        scheduled_for: (when < endOfDay ? when : endOfDay).toISOString(),
        meeting_url: MEET,
      },
    )
    const before = await groupSessions(request)

    await login(page, USERS.marcus.email)
    await page.goto('/')
    const row = mainRow(page)
    await expect(row.getByTestId('start-todays-session')).toBeVisible()
    await expect(row.getByTestId('start-group-session')).toHaveCount(0)
    // Never the raw meeting link: that joins the call with no bot in it.
    await expect(row.locator(`a[href="${MEET}"]`)).toHaveCount(0)
    await row.getByTestId('start-todays-session').click()
    await expect(page).toHaveURL(new RegExp(`/sessions/${booked.id}`))
    expect(await groupSessions(request)).toBe(before)
  })

  test('a 1:1 started from a group row already knows its agreement', async ({
    page,
  }) => {
    const sent = await fakeBot(page)
    await login(page, USERS.marcus.email)
    await page.goto('/')
    // Nadia sits in two of Marcus's groups; clicking from Directors is the answer.
    await directorsRow(page).getByTestId('start-one-to-one').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByTestId('sandbox-assignment-choice')).toHaveValue(
      directorsId,
    )
    await dialog.getByPlaceholder(/meeting URL/i).fill(MEET)
    await dialog.getByRole('button', { name: 'Start Recording' }).click()
    await expect.poll(() => sent.length).toBe(1)
    expect(sent[0].sandbox_id).toBe(sandboxId)
    expect(sent[0].sandbox_group_id).toBe(directorsId)
  })

  test('the everyday live start asks which agreement, and sends the answer', async ({
    page,
  }) => {
    const sent = await fakeBot(page)
    await login(page, USERS.marcus.email)
    await page.goto('/')
    await page.getByPlaceholder('Select client (optional)').click()
    await page.getByPlaceholder('Type to search clients...').fill('Nadia')
    // Her name is also on the group rows above; pick the one in the open picker.
    await page
      .locator('div.shadow-lg', {
        has: page.getByPlaceholder('Type to search clients...'),
      })
      .getByText(NADIA.name)
      .click()

    const choice = page.getByTestId('sandbox-assignment-choice')
    await expect(choice).toBeVisible()
    await expect(choice).toHaveValue('')
    await expect(page.getByTestId('sandbox-assignment-hint')).toContainText(
      'counts toward nothing',
    )
    await choice.selectOption(mainGroupId)
    await page
      .getByPlaceholder(/meeting URL/i)
      .first()
      .fill(MEET)
    await page.getByRole('button', { name: 'Start Recording' }).click()
    await expect.poll(() => sent.length).toBe(1)
    expect(sent[0].sandbox_group_id).toBe(mainGroupId)
  })

  test('a coach with no groups sees no section', async ({ page }) => {
    await page.route('**/api/v1/sandboxes/dashboard*', async route => {
      const resp = await route.fetch()
      const body = await resp.json()
      return route.fulfill({
        json: {
          ...body,
          cards: (body.cards ?? []).map((c: { my_groups: unknown[] }) => ({
            ...c,
            my_groups: [],
          })),
        },
      })
    })
    await login(page, USERS.marcus.email)
    await page.goto('/')
    await expect(
      page.getByPlaceholder('Select client (optional)'),
    ).toBeVisible()
    await expect(page.getByTestId('sandbox-groups')).toHaveCount(0)
    // The dashboard refetches on its own clock. A refetch caught mid-
    // `route.fetch()` when the page closes rejects inside the handler and fails
    // a test whose assertions all passed.
    await page.unrouteAll({ behavior: 'ignoreErrors' })
  })
})
