import {
  test,
  expect,
  request as playwrightRequest,
  type APIRequestContext,
  type Page,
} from '@playwright/test'
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
 * Slice 2 — comments and mentions on a commitment.
 *
 *   • Marcus writes a comment, picks Priya from the @ list, posts with ⌘/Ctrl+Enter
 *   • editing shows "(edited)"
 *   • Priya's bell says "mentioned you" and lands on the highlighted comment
 *   • she replies under it; Marcus deletes a comment of his own via the confirm dialog
 *   • Kofi (coachee) sees the thread in his portal and can mention only his profile's people
 *
 * Fixtures: seed script (`reset`). Kofi's login and client row under Marcus
 * are created by `seedClient` (the API cannot link an existing login).
 */

const MOD = process.platform === 'darwin' ? 'Meta' : 'Control'
/**
 * A coachee of our own: Dana must stay a plain account with no client row
 * (the sandbox specs rely on it), so the thread's coachee is a login the seed
 * script creates for this file.
 */
const KOFI = { email: 'e2e-kofi@ptg-e2e.com', name: 'Kofi Mensah' }

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

const created: { id: string; by: string }[] = []

async function cleanup(request: APIRequestContext) {
  const tokens: Record<string, string> = {}
  for (const c of created.splice(0)) {
    tokens[c.by] ??= await apiToken(request, c.by)
    await request.delete(`${API}/commitments/${c.id}`, {
      headers: auth(tokens[c.by]),
    })
  }
  for (const who of [USERS.marcus.email, USERS.priya.email, KOFI.email]) {
    tokens[who] ??= await apiToken(request, who)
    await request.post(`${API}/notifications/read-all`, {
      headers: auth(tokens[who]),
    })
  }
}

/** Type into the composer's editor (ProseMirror), optionally picking a mention. */
async function typeComment(
  page: Page,
  scope: ReturnType<Page['locator']>,
  text: string,
) {
  const editor = scope.getByTestId('comment-editor').first()
  await editor.click()
  await page.keyboard.type(text)
}

test.describe('commitments — comments and mentions', () => {
  test.describe.configure({ mode: 'serial' })
  // The tests share one commitment, so the rows (and the bells other specs
  // count) are cleared once, at the end.
  test.afterAll(async () => {
    const ctx = await playwrightRequest.newContext()
    try {
      await cleanup(ctx)
    } finally {
      await ctx.dispose()
    }
  })

  let commitmentId = ''
  let commentId = ''

  test('coach comments, mentions a colleague and edits', async ({
    page,
    request,
  }) => {
    // Priya is granted access to Kofi, so she is in Marcus's reach here.
    const kofi = seedClient({
      coachEmail: USERS.marcus.email,
      clientEmail: KOFI.email,
      name: KOFI.name,
      grantTo: [USERS.priya.email],
    })
    const token = await apiToken(request, USERS.marcus.email)
    const row = await api(request, token, 'post', '/commitments/', {
      title: 'E2E comments thread',
      client_id: kofi.id,
    })
    commitmentId = row.id
    created.push({ id: row.id, by: USERS.marcus.email })

    await login(page, USERS.marcus.email)
    await page.goto(`/commitments?open=${row.id}`)
    await hideDevtools(page)

    const thread = page.getByTestId('comment-thread')
    await expect(thread).toBeVisible()
    await expect(thread.getByTestId('comment-item')).toHaveCount(0)

    // "@Pri" → the mention list shows Priya → Enter inserts the chip.
    await typeComment(page, thread, 'Can you take a look @Pri')
    const list = page.getByTestId('mention-list')
    await expect(list).toBeVisible()
    await expect(list.getByTestId('mention-option')).toHaveCount(1)
    await expect(list.getByTestId('mention-option').first()).toContainText(
      'Priya Raman',
    )
    await page.keyboard.press('Enter')
    await expect(list).toBeHidden()
    const editor = thread.getByTestId('comment-editor').first()
    await expect(editor.locator('span[data-type="mention"]')).toHaveText(
      '@Priya Raman',
    )

    // Post with the keyboard.
    await page.keyboard.type(' please?')
    await page.keyboard.press(`${MOD}+Enter`)
    const item = thread.getByTestId('comment-item').first()
    await expect(item).toBeVisible()
    await expect(item).toContainText('Can you take a look')
    await expect(item).toContainText('@Priya Raman')
    await expect(item).toContainText('You') // the author sees themself as "You"
    await expect(editor).toHaveText('') // composer cleared
    await expect
      .poll(async () => {
        const body = await api(
          request,
          token,
          'get',
          `/comments?target_type=commitment&target_id=${row.id}`,
        )
        return body.comments.length
      })
      .toBe(1)
    const body = await api(
      request,
      token,
      'get',
      `/comments?target_type=commitment&target_id=${row.id}`,
    )
    commentId = body.comments[0].id
    expect(
      body.comments[0].mentions.map((m: { name: string }) => m.name),
    ).toEqual(['Priya Raman'])

    // Edit → "(edited)".
    await item.hover()
    await item.getByTestId('comment-edit').click()
    const editBox = item.getByTestId('comment-editor').first()
    await editBox.click()
    await page.keyboard.press('End')
    await page.keyboard.type(' Thanks!')
    await item.getByTestId('comment-submit').click()
    await expect(item).toContainText('Thanks!')
    await expect(item).toContainText('(edited)')
    // The chip survived the edit.
    await expect(item.locator('span[data-type="mention"]')).toHaveText(
      '@Priya Raman',
    )
  })

  test('the mentioned colleague lands on the comment and replies', async ({
    page,
  }) => {
    expect(commitmentId).not.toBe('')
    await login(page, USERS.priya.email)

    await page.getByTestId('notification-bell').click()
    const note = page
      .getByTestId('notification-item')
      .filter({ hasText: 'mentioned you' })
      .first()
    await expect(note).toBeVisible()
    await expect(note).toHaveAttribute('data-event', 'commitment_mentioned')
    await expect(note).toContainText(
      'Marcus Bell mentioned you on “E2E comments thread”',
    )
    await note.click()
    await page.waitForURL(
      url =>
        url.pathname === `/commitments/${commitmentId}` &&
        url.searchParams.get('comment') === commentId,
    )
    await hideDevtools(page)

    const target = page.locator(`#comment-${commentId}`)
    await expect(target).toBeVisible()
    await expect(target).toHaveClass(/ring-2/)
    // Priya may not edit Marcus's comment.
    await target.hover()
    await expect(target.getByTestId('comment-edit')).toHaveCount(0)

    // Reply under it.
    await target.getByTestId('comment-reply').click()
    const replyBox = target.getByTestId('comment-composer').first()
    await expect(replyBox).toBeVisible()
    await replyBox.getByTestId('comment-editor').click()
    await page.keyboard.type('On it — draft by Friday.')
    await replyBox.getByTestId('comment-submit').click()
    const replies = target.getByTestId('comment-item')
    await expect(replies).toHaveCount(1)
    await expect(replies.first()).toContainText('draft by Friday')
    await expect(replies.first()).toContainText('You')
    await expect(target).toContainText('Marcus Bell') // the author line of the top comment
  })

  test('the author deletes a comment through the confirm dialog', async ({
    page,
    request,
  }) => {
    expect(commitmentId).not.toBe('')
    const token = await apiToken(request, USERS.marcus.email)
    await api(request, token, 'post', '/comments', {
      target_type: 'commitment',
      target_id: commitmentId,
      body: '<p>Scratch this one</p>',
    })

    await login(page, USERS.marcus.email)
    // The reply above landed in Marcus's bell as "commented".
    await page.getByTestId('notification-bell').click()
    await expect(
      page
        .getByTestId('notification-item')
        .filter({ hasText: 'Priya Raman commented on' })
        .first(),
    ).toBeVisible()
    await page.keyboard.press('Escape')

    await page.goto(`/commitments/${commitmentId}`)
    await hideDevtools(page)
    const thread = page.getByTestId('comment-thread')
    const scratch = thread
      .getByTestId('comment-item')
      .filter({ hasText: 'Scratch this one' })
    await expect(scratch).toHaveCount(1)
    await scratch.hover()
    await scratch.getByTestId('comment-delete').click()
    await page.getByTestId('comment-delete-confirm').click()
    await expect(scratch).toHaveCount(0)
    // The threaded pair is untouched.
    await expect(thread.getByTestId('comment-item')).toHaveCount(2)
  })

  test('the coachee sees the thread and can mention only the people on his profile', async ({
    page,
  }) => {
    expect(commitmentId).not.toBe('')
    await login(page, KOFI.email)
    await page.goto(`/client-portal/dashboard?commitment=${commitmentId}`)
    await hideDevtools(page)

    const thread = page.getByTestId('comment-thread')
    await expect(thread).toBeVisible()
    await expect(thread.getByTestId('comment-item').first()).toContainText(
      'Can you take a look',
    )

    await typeComment(page, thread, 'Thanks both @')
    const list = page.getByTestId('mention-list')
    await expect(list).toBeVisible()
    await expect(list.getByTestId('mention-option').first()).toBeVisible()
    const names = (
      await list.getByTestId('mention-option').allInnerTexts()
    ).join(' ')
    // His coach and the co-coach with access to his profile — nobody else
    // (the admin oversees Marcus but has no access to Kofi's profile).
    expect(names).toContain('Marcus Bell')
    expect(names).toContain('Priya Raman')
    expect(names).not.toContain('Admin')
    await page.keyboard.press('Escape')
    await expect(list).toBeHidden()
    // Escape with a draft keeps the panel open.
    await expect(thread).toBeVisible()
  })
})
