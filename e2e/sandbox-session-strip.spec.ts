import { expect, test, type APIRequestContext } from '@playwright/test'
import {
  API,
  apiToken,
  auth,
  buildGroup,
  call,
  login,
  seedSession,
  USERS,
} from './helpers'

/**
 * The session page's one-line verdict on sandbox credit: which agreement the
 * session counts toward, or why it does not — with the correction on the same
 * line, deep-linked into the group drawer.
 *
 * Fixture "E2E Session Strip": Marcus (lead coach, so he may correct dates)
 * coaches Ruth from the term start and Sam, who joins the group today. A
 * session a week ago counts for Ruth and not for Sam — until Sam's "counts
 * from" is moved back. Sorted after `sandbox-session-feedback`.
 */
test.describe.configure({ mode: 'serial' })

const NAME = 'E2E Session Strip'
const GROUP = 'Strip group'
const RUTH = { email: 'e2e-ruth-strip@ptg-e2e.com', name: 'Ruth Adeyemi' }
const SAM = { email: 'e2e-sam-strip@ptg-e2e.com', name: 'Sam Lindqvist' }

let token = ''
let sandboxId = ''
let groupId = ''
let ruthSession = ''
let samSession = ''

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
async function coachId(request: APIRequestContext, q: string) {
  const rows = await call(
    request,
    token,
    'get',
    `/sandboxes/people/search?q=${q}`,
  )
  return rows[0].id as string
}

test.describe('sandbox session strip', () => {
  test('builds the fixture', async ({ request }) => {
    token = await apiToken(request, USERS.admin.email)
    const created = await call(request, token, 'post', '/sandboxes/', {
      name: NAME,
      organisation: 'PTG',
      term_start: termStart(),
      term_months: 6,
    })
    sandboxId = created.sandbox.id
    const marcus = await coachId(request, 'marcus')
    const group = await buildGroup(request, token, sandboxId, {
      name: GROUP,
      kind: 'group',
      coach_user_ids: [marcus],
      coachees: [RUTH],
      hours_per_coachee: 12,
      session_length_minutes: 60,
      cadence: { shape: 'rate', count: 2, per: 'month' },
    })
    groupId = group.id
    // Marcus may correct dates himself: lead coach.
    const overview = await call(
      request,
      token,
      'get',
      `/sandboxes/${sandboxId}/overview`,
    )
    const me = overview.members.find(
      (m: { user_id: string }) => m.user_id === marcus,
    )
    const promoted = await request.patch(
      `${API}/sandboxes/${sandboxId}/members/${me.id}`,
      { headers: auth(token), data: { roles: ['lead_coach'] } },
    )
    expect(promoted.ok(), await promoted.text()).toBe(true)
    // Sam goes on the list, then into the group — today.
    const sam = await call(
      request,
      token,
      'post',
      `/sandboxes/${sandboxId}/members`,
      {
        side: 'theirs',
        roles: [],
        roster: ['coachee'],
        ...SAM,
      },
    )
    await call(
      request,
      token,
      'post',
      `/sandboxes/${sandboxId}/groups/${groupId}/members`,
      { kind: 'coachee', member_id: sam.id },
    )
    ruthSession = seedSession({
      coachEmail: USERS.marcus.email,
      clientEmail: RUTH.email,
      daysAgo: 7,
      minutes: 60,
    }).id
    samSession = seedSession({
      coachEmail: USERS.marcus.email,
      clientEmail: SAM.email,
      daysAgo: 7,
      minutes: 60,
    }).id
  })

  test('a session before someone counts says so, and the fix is one link away', async ({
    page,
  }) => {
    await login(page, USERS.marcus.email)
    await page.goto(`/sessions/${samSession}`)
    const strip = page.getByTestId('session-attribution')
    const line = strip.getByTestId('attribution-diagnostic')
    await expect(line).toHaveAttribute('data-reason', 'before_coachee_start')
    await expect(line).toContainText('not counted')
    await expect(line).toContainText(`${NAME} · ${GROUP}`)
    await line
      .getByRole('link', { name: 'Change the day they count from' })
      .click()

    // Lands on the sandbox's Groups tab with that group's drawer open on the
    // "joined after the start" list.
    await expect(page).toHaveURL(
      new RegExp(`/sandboxes/${sandboxId}\\?tab=groups`),
    )
    const drawer = page.getByTestId('group-drawer')
    const row = drawer.getByTestId('counts-from-row')
    await expect(row).toContainText(SAM.name)
    await row.getByTestId('counts-from-change').click()
    const dialog = page.getByTestId('counts-from-dialog')
    await expect(dialog.getByTestId('counts-from-preview')).toContainText(
      'session',
    )
    await dialog
      .getByTestId('counts-from-reason')
      .fill('Coaching began a month ago.')
    await dialog.getByTestId('counts-from-save').click()
    await expect(dialog).toHaveCount(0)
    await expect(drawer.getByTestId('counts-from-list')).toHaveCount(0)

    // Back on the session: counted now, and the diagnosis is gone.
    await page.goto(`/sessions/${samSession}`)
    await expect(strip).toContainText(`Counts toward ${NAME} · ${GROUP}`)
    await expect(strip.getByTestId('attribution-diagnostic')).toHaveCount(0)
  })

  test('a counted session names its agreement and offers today’s choices', async ({
    page,
  }) => {
    await login(page, USERS.marcus.email)
    await page.goto(`/sessions/${ruthSession}`)
    const strip = page.getByTestId('session-attribution')
    await expect(strip).toContainText(
      `${RUTH.name}: Counts toward ${NAME} · ${GROUP}`,
    )
    const choices = page.waitForResponse(
      r => r.url().includes('/attributions/') && r.url().endsWith('/choices'),
    )
    await strip.getByRole('button', { name: 'Change' }).click()
    expect((await choices).status()).toBe(200)
    const dialog = page.getByTestId('assignment-dialog')
    const select = dialog.getByLabel('Count this coaching toward', {
      exact: true,
    })
    await expect(select).toHaveValue(groupId)
    await expect(
      select.getByRole('option', { name: `${NAME} · ${GROUP}` }),
    ).toHaveCount(1)
    await select.selectOption('exclude')
    await dialog
      .getByLabel('Reason', { exact: true })
      .fill('Not a coaching session.')
    await dialog.getByRole('button', { name: 'Confirm assignment' }).click()
    await expect(dialog).toHaveCount(0)
    await expect(strip).toContainText('Excluded from sandbox delivery.')
  })
})
