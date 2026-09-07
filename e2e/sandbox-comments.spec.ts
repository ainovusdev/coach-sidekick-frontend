import {
  test,
  expect,
  request as playwrightRequest,
  type APIRequestContext,
  type Page,
} from '@playwright/test'
import { API, USERS, apiToken, auth, hideDevtools, login } from './helpers'

/**
 * Slice 5 — comment threads beyond commitments.
 *
 *   • Marcus (coach) opens the thread on Idris's outcome from the cockpit,
 *     mentions the admin, and the row now says "1 comment"; the same thread
 *     reads from the sandbox card on Idris's client profile; Marcus also
 *     writes under the vision
 *   • the admin's bell carries both; the vision link lands on #vision with the
 *     comment ringed, the outcome link opens that thread ringed, and the admin
 *     replies there
 *   • Marcus's bell carries the reply and lands on it
 *
 * Fixtures: seed script (`reset`); the sandbox is built here through the API.
 */

const MOD = process.platform === 'darwin' ? 'Meta' : 'Control'
const NAME = 'E2E Comments Sandbox'
const IDRIS = { email: 'e2e-idris@ptg-e2e.com', name: 'Idris Bello' }
const OUTCOME = 'Chair the Q4 board meeting without notes'
const SPRINT = 'Autumn sprint — presence'
const VISION =
  'Every director leaves the term able to run a room without notes.'

function termStart(): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 2)
  return d.toISOString().slice(0, 10)
}

async function api(
  request: APIRequestContext,
  token: string,
  method: 'get' | 'post' | 'delete',
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

/** Type into a thread's composer (ProseMirror). */
async function typeComment(
  page: Page,
  scope: ReturnType<Page['locator']>,
  text: string,
) {
  const editor = scope.getByTestId('comment-editor').first()
  await editor.click()
  await page.keyboard.type(text)
}

let sandboxId = ''
let outcomeId = ''
let clientId = ''
let outcomeCommentId = ''
let visionCommentId = ''
let replyId = ''

test.describe('Sandboxes — comment threads', () => {
  test.describe.configure({ mode: 'serial' })

  test.afterAll(async () => {
    const ctx = await playwrightRequest.newContext()
    try {
      for (const who of [USERS.admin.email, USERS.marcus.email]) {
        const t = await apiToken(ctx, who)
        await ctx.post(`${API}/notifications/read-all`, { headers: auth(t) })
      }
    } finally {
      await ctx.dispose()
    }
  })

  test('builds the fixture', async ({ request }) => {
    const admin = await apiToken(request, USERS.admin.email)
    const created = await api(request, admin, 'post', '/sandboxes/', {
      name: NAME,
      organisation: 'Halcyon Health',
      term_start: termStart(),
      term_months: 6,
      vision: VISION,
    })
    sandboxId = created.sandbox.id
    // Creating a sandbox puts its creator on it as account executive — that
    // is what puts the admin in Marcus's reach for an @mention.
    const marcus = (
      await api(request, admin, 'get', '/sandboxes/people/search?q=marcus')
    )[0]
    await api(request, admin, 'post', `/sandboxes/${sandboxId}/groups`, {
      coach_user_ids: [marcus.id],
      coachees: [IDRIS],
    })

    // Marcus drafts the outcome, and owns Idris's client row
    const marcusToken = await apiToken(request, USERS.marcus.email)
    const outcomes = await api(
      request,
      marcusToken,
      'get',
      `/sandboxes/${sandboxId}/outcomes`,
    )
    const idris = outcomes.coachees.find(
      (c: { email: string }) => c.email === IDRIS.email,
    )
    const outcome = await api(
      request,
      marcusToken,
      'post',
      `/sandboxes/${sandboxId}/outcomes`,
      {
        member_id: idris.member_id,
        title: OUTCOME,
        measure: 'Board feedback in December',
      },
    )
    outcomeId = outcome.id
    expect(outcome.comment_count).toBe(0)
    const clients = await api(
      request,
      marcusToken,
      'get',
      `/clients/?search=${encodeURIComponent(IDRIS.email)}&per_page=50`,
    )
    clientId = clients.clients.find(
      (c: { email: string | null }) => c.email === IDRIS.email,
    ).id
  })

  test('the coach comments on the outcome and under the vision from the cockpit', async ({
    page,
    request,
  }) => {
    await login(page, USERS.marcus.email)
    await page.goto(`/sandboxes/${sandboxId}#outcomes`)
    await hideDevtools(page)

    const row = page.locator(
      `[data-testid="outcome-row"][data-outcome="${outcomeId}"]`,
    )
    const toggle = row.getByTestId('outcome-comments-toggle')
    await expect(toggle).toHaveText('Comment')
    await expect(toggle).toHaveAttribute('data-count', '0')
    await toggle.click()
    const thread = row.getByTestId('outcome-comments')
    await expect(thread).toBeVisible()
    await expect(thread.getByTestId('comment-item')).toHaveCount(0)

    // "@E2E" → Marcus himself and the admin (account executive on the
    // sandbox); a space would end the query, so pick the admin by name.
    await typeComment(page, thread, 'Ready for the seal? @E2E')
    const list = page.getByTestId('mention-list')
    const option = list
      .getByTestId('mention-option')
      .filter({ hasText: USERS.admin.name })
    await expect(option).toHaveCount(1)
    await option.click()
    await page.keyboard.press(`${MOD}+Enter`)
    const item = thread.getByTestId('comment-item').first()
    await expect(item).toContainText('Ready for the seal?')
    await expect(item.locator('span[data-type="mention"]')).toHaveText(
      `@${USERS.admin.name}`,
    )
    await expect(toggle).toHaveText('1 comment')

    // Under the vision, no mention.
    const vision = page.getByTestId('vision-comments')
    await vision.scrollIntoViewIfNeeded()
    await expect(vision.getByTestId('comment-item')).toHaveCount(0)
    await typeComment(page, vision, 'Shall we add a line about presence?')
    await page.keyboard.press(`${MOD}+Enter`)
    await expect(vision.getByTestId('comment-item')).toHaveCount(1)

    const token = await apiToken(request, USERS.marcus.email)
    const outcomeThread = await api(
      request,
      token,
      'get',
      `/comments?target_type=outcome&target_id=${outcomeId}`,
    )
    outcomeCommentId = outcomeThread.comments[0].id
    expect(
      outcomeThread.comments[0].mentions.map((m: { name: string }) => m.name),
    ).toEqual([USERS.admin.name])
    const visionThread = await api(
      request,
      token,
      'get',
      `/comments?target_type=sandbox_vision&target_id=${sandboxId}`,
    )
    visionCommentId = visionThread.comments[0].id

    // The same thread reads from the sandbox card on Idris's client profile.
    await page.goto(`/clients/${clientId}`)
    await hideDevtools(page)
    const card = page.getByTestId('outcomes-block')
    const cardRow = card.locator(`[data-outcome="${outcomeId}"]`)
    await expect(cardRow.getByTestId('outcome-comments-toggle')).toHaveText(
      '1 comment',
    )
    await cardRow.getByTestId('outcome-comments-toggle').click()
    await expect(
      cardRow.getByTestId('outcome-comments').getByTestId('comment-item'),
    ).toHaveCount(1)
    await expect(
      cardRow.getByTestId('outcome-comments').getByTestId('comment-item'),
    ).toContainText('Ready for the seal?')
  })

  test('the admin lands on both comments from the bell and replies on the outcome', async ({
    page,
    request,
  }) => {
    expect(outcomeCommentId).not.toBe('')
    await login(page, USERS.admin.email)

    // The vision comment: "commented", #vision, ringed.
    await page.getByTestId('notification-bell').click()
    const visionNote = page
      .getByTestId('notification-item')
      .filter({ hasText: `the ${NAME} vision` })
      .first()
    await expect(visionNote).toBeVisible()
    await expect(visionNote).toHaveAttribute('data-event', 'commented')
    await expect(visionNote).toContainText(
      `Marcus Bell commented on “the ${NAME} vision”`,
    )
    await visionNote.click()
    await page.waitForURL(
      url =>
        url.pathname === `/sandboxes/${sandboxId}` &&
        url.searchParams.get('comment') === visionCommentId &&
        url.hash === '#vision',
    )
    await hideDevtools(page)
    const visionTarget = page.locator(`#comment-${visionCommentId}`)
    await expect(visionTarget).toBeVisible()
    await expect(visionTarget).toHaveClass(/ring-2/)

    // The mention on the outcome: that thread opens by itself, ringed.
    await page.getByTestId('notification-bell').click()
    const note = page
      .getByTestId('notification-item')
      .filter({ hasText: 'mentioned you' })
      .first()
    await expect(note).toHaveAttribute('data-event', 'mentioned')
    await expect(note).toContainText(
      `Marcus Bell mentioned you on “${OUTCOME}”`,
    )
    await expect(note).toContainText(IDRIS.name) // the context line
    await note.click()
    await page.waitForURL(
      url =>
        url.pathname === `/sandboxes/${sandboxId}` &&
        url.searchParams.get('outcome') === outcomeId &&
        url.searchParams.get('comment') === outcomeCommentId,
    )
    await hideDevtools(page)
    const target = page.locator(`#comment-${outcomeCommentId}`)
    await expect(target).toBeVisible()
    await expect(target).toHaveClass(/ring-2/)

    // Reply under it.
    await target.hover()
    await target.getByTestId('comment-reply').click()
    const replyBox = target.getByTestId('comment-composer').first()
    await expect(replyBox).toBeVisible()
    await replyBox.getByTestId('comment-editor').click()
    await page.keyboard.type('Yes — sealing it on Friday.')
    await replyBox.getByTestId('comment-submit').click()
    const replies = target.getByTestId('comment-item')
    await expect(replies).toHaveCount(1)
    await expect(replies.first()).toContainText('sealing it on Friday')
    // The row above may still be the optimistic one; take the id from the API.
    const token = await apiToken(request, USERS.admin.email)
    await expect
      .poll(async () => {
        const body = await api(
          request,
          token,
          'get',
          `/comments?target_type=outcome&target_id=${outcomeId}`,
        )
        replyId = body.comments[0]?.replies?.[0]?.id ?? ''
        return replyId
      })
      .not.toBe('')
    const row = page.locator(
      `[data-testid="outcome-row"][data-outcome="${outcomeId}"]`,
    )
    await expect(row.getByTestId('outcome-comments-toggle')).toHaveText(
      '2 comments',
    )
  })

  test("the coach's bell carries the reply and lands on it", async ({
    page,
  }) => {
    expect(replyId).not.toBe('')
    await login(page, USERS.marcus.email)
    await page.getByTestId('notification-bell').click()
    const note = page
      .getByTestId('notification-item')
      .filter({ hasText: `commented on “${OUTCOME}”` })
      .first()
    await expect(note).toBeVisible()
    await expect(note).toContainText(
      `${USERS.admin.name} commented on “${OUTCOME}”`,
    )
    await note.click()
    await page.waitForURL(
      url =>
        url.pathname === `/sandboxes/${sandboxId}` &&
        url.searchParams.get('comment') === replyId,
    )
    await hideDevtools(page)
    const target = page.locator(`#comment-${replyId}`)
    await expect(target).toBeVisible()
    await expect(target).toHaveClass(/ring-2/)
    await expect(target).toContainText('sealing it on Friday')
  })

  test('a bell link to a sprint comment opens the panel on a client with no sessions yet', async ({
    page,
    request,
  }) => {
    // Goals can exist before the first session is recorded; the link must not
    // land on the welcome screen that replaces the tabs until then.
    const marcus = await apiToken(request, USERS.marcus.email)
    const admin = await apiToken(request, USERS.admin.email)
    const goal = await api(request, marcus, 'post', '/goals/', {
      client_id: clientId,
      title: 'Lead the room, not the slides',
    })
    const target = await api(request, marcus, 'post', '/targets/', {
      client_id: clientId,
      title: 'Run the Q4 offsite end to end',
      goal_ids: [goal.id],
    })
    const start = new Date()
    const end = new Date()
    end.setDate(end.getDate() + 42)
    const sprint = await api(request, marcus, 'post', '/sprints/', {
      client_id: clientId,
      title: SPRINT,
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      target_ids: [target.id],
    })
    const first = await api(request, marcus, 'post', '/comments', {
      target_type: 'sprint',
      target_id: sprint.id,
      body: '<p>Pushing the retro to week 7 — the offsite lands in week 6.</p>',
    })
    const reply = await api(request, admin, 'post', '/comments', {
      target_type: 'sprint',
      target_id: sprint.id,
      body: '<p>Fine by me. Keep the board prep inside the sprint though.</p>',
      parent_id: first.id,
    })

    await login(page, USERS.marcus.email)
    await page.getByTestId('notification-bell').click()
    const note = page
      .getByTestId('notification-item')
      .filter({ hasText: `commented on “${SPRINT}”` })
      .first()
    await expect(note).toBeVisible()
    await note.click()
    await page.waitForURL(
      url =>
        url.pathname === `/clients/${clientId}` &&
        url.searchParams.get('sprint') === sprint.id,
    )
    await hideDevtools(page)
    const ringed = page.locator(`#comment-${reply.id}`)
    await expect(ringed).toBeVisible()
    await expect(ringed).toHaveClass(/ring-2/)
    await expect(ringed).toContainText('Keep the board prep')
  })
})
