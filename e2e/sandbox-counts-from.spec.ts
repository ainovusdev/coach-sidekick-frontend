import { expect, test, type APIRequestContext } from '@playwright/test'
import {
  API,
  apiToken,
  auth,
  buildGroup,
  call,
  gotoSandboxTab,
  login,
  seedSession,
  USERS,
} from './helpers'

/**
 * Correcting a window after the fact. A session only counts inside an agreement
 * window, so coaching that began before the pairing was set up is rescued by
 * moving the window — a late joiner's "counts from", or the group's start —
 * and the page says what that will count before it is saved.
 *
 * Fixture (through the API): a term that began two months ago ·
 *   "Late joiner" — Marcus coaches Ines from the start; Jonas is added today
 *     and had two sessions with Marcus before that.
 *   "Late start"  — Priya coaches Keiko, the group set to start five days ago,
 *     with one session fifteen days ago.
 */
test.describe.configure({ mode: 'serial' })

const INES = { email: 'e2e-ines-cf@ptg-e2e.com', name: 'Ines Carvalho' }
const JONAS = { email: 'e2e-jonas-cf@ptg-e2e.com', name: 'Jonas Lindqvist' }
const KEIKO = { email: 'e2e-keiko-cf@ptg-e2e.com', name: 'Keiko Tanaka' }

let sandboxId = ''
let token = ''
const groupId: Record<string, string> = {}

const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function termStart(): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 2)
  return d.toISOString().slice(0, 10)
}

async function delivered(
  request: APIRequestContext,
  group: string,
  email: string,
) {
  const delivery = await call(
    request,
    token,
    'get',
    `/sandboxes/${sandboxId}/delivery`,
  )
  const g = delivery.groups.find(
    (x: { group_id: string }) => x.group_id === group,
  )
  const c = g.coachees.find((x: { email: string }) => x.email === email)
  return c.delivered.sessions as number
}

async function coachId(request: APIRequestContext, q: string): Promise<string> {
  const found = await call(
    request,
    token,
    'get',
    `/sandboxes/people/search?q=${q}&coaches_only=true&sandbox_id=${sandboxId}`,
  )
  return found[0].id
}

test.describe('Sandboxes — counts from', () => {
  test('builds the fixture', async ({ request }) => {
    token = await apiToken(request, USERS.admin.email)
    const created = await call(request, token, 'post', '/sandboxes/', {
      name: 'E2E Counts From',
      organisation: 'PTG',
      term_start: termStart(),
      term_months: 6,
    })
    sandboxId = created.sandbox.id
    const marcus = await coachId(request, 'marcus')
    const priya = await coachId(request, 'priya')

    const late = await buildGroup(request, token, sandboxId, {
      name: 'Late joiner',
      kind: 'group',
      coach_user_ids: [marcus],
      coachees: [INES],
      hours_per_coachee: 12,
      session_length_minutes: 60,
      cadence: { shape: 'rate', count: 2, per: 'month' },
    })
    groupId.late = late.id
    // Jonas goes on the list, then into the group — today.
    const jonas = await call(
      request,
      token,
      'post',
      `/sandboxes/${sandboxId}/members`,
      {
        side: 'theirs',
        roles: [],
        roster: ['coachee'],
        ...JONAS,
      },
    )
    await call(
      request,
      token,
      'post',
      `/sandboxes/${sandboxId}/groups/${late.id}/members`,
      {
        kind: 'coachee',
        member_id: jonas.id,
      },
    )
    for (const n of [20, 10])
      seedSession({
        coachEmail: USERS.marcus.email,
        clientEmail: JONAS.email,
        daysAgo: n,
        minutes: 60,
      })

    const start = await buildGroup(request, token, sandboxId, {
      name: 'Late start',
      kind: 'group',
      coach_user_ids: [priya],
      coachees: [KEIKO],
      hours_per_coachee: 12,
      session_length_minutes: 60,
      cadence: { shape: 'rate', count: 2, per: 'month' },
      starts_on: daysAgo(5),
    })
    groupId.start = start.id
    seedSession({
      coachEmail: USERS.priya.email,
      clientEmail: KEIKO.email,
      daysAgo: 15,
      minutes: 60,
    })

    expect(await delivered(request, groupId.late, JONAS.email)).toBe(0)
    expect(await delivered(request, groupId.start, KEIKO.email)).toBe(0)
  })

  test('a late joiner’s earlier sessions count once the date is corrected', async ({
    page,
    request,
  }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'groups')
    await page.getByRole('button', { name: 'Actions for Late joiner' }).click()
    await page.getByRole('menuitem', { name: 'Edit group' }).click()
    const drawer = page.getByTestId('group-drawer')
    const row = drawer.getByTestId('counts-from-row')
    await expect(row).toHaveCount(1)
    await expect(row).toContainText('Jonas Lindqvist')
    await expect(row).toContainText('Counts from')
    await row.getByTestId('counts-from-change').click()

    const dialog = page.getByTestId('counts-from-dialog')
    // Opens on the earliest day it can be: the group's start.
    await expect(dialog.getByTestId('counts-from-preview')).toContainText(
      'Adds 2 sessions · 2 h for Jonas',
    )
    await expect(dialog.getByTestId('counts-from-save')).toBeDisabled()
    await dialog
      .getByTestId('counts-from-reason')
      .fill('Coaching began before he was added.')
    await dialog.getByTestId('counts-from-save').click()
    await expect(dialog).toBeHidden()
    await expect(page.getByText('2 more sessions count')).toBeVisible()
    // He now counts from the group's start like everyone else.
    await expect(drawer.getByTestId('counts-from-list')).toHaveCount(0)
    expect(await delivered(request, groupId.late, JONAS.email)).toBe(2)
  })

  test('moving a group’s start back says what it will count, then counts it', async ({
    page,
    request,
  }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'groups')
    await page.getByRole('button', { name: 'Actions for Late start' }).click()
    await page.getByRole('menuitem', { name: 'Edit group' }).click()
    const drawer = page.getByTestId('group-drawer')
    await drawer.getByRole('button', { name: 'Use the term start' }).click()
    await drawer.getByTestId('submit-group').click()
    // It stops to say what the new start counts; nothing is saved yet.
    await expect(drawer.getByTestId('start-preview')).toContainText(
      'Adds 1 session · 1 h for Keiko',
    )
    expect(await delivered(request, groupId.start, KEIKO.email)).toBe(0)
    await expect(drawer.getByTestId('submit-group')).toHaveText(
      'Save and count them',
    )
    await drawer.getByTestId('submit-group').click()
    await expect(drawer).toBeHidden()
    expect(await delivered(request, groupId.start, KEIKO.email)).toBe(1)
  })

  test('a later start that would drop counted sessions is refused', async ({
    request,
  }) => {
    const resp = await request.post(
      `${API}/sandboxes/${sandboxId}/groups/${groupId.start}/start-preview`,
      { headers: auth(token), data: { starts_on: daysAgo(1) } },
    )
    expect(resp.status()).toBe(409)
    expect((await resp.json()).detail.code).toBe('credit_held')
  })

  test('joining a group from People asks when they count from', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'people')
    const person = page
      .getByTestId('person-row')
      .filter({ hasText: KEIKO.name })
    await person.getByRole('button', { name: /Actions for/ }).click()
    await page.getByRole('menuitem', { name: /groups/i }).click()
    const dialog = page.getByTestId('groups-dialog')
    await expect(dialog.getByTestId('joined-on')).toHaveCount(0)
    await dialog
      .locator(`[data-group="${groupId.late}"]`)
      .getByTestId('group-coachee')
      .click()
    await expect(dialog.getByTestId('joined-on')).toBeVisible()
    await dialog.getByTestId('save-groups').click()
    await expect(dialog).toBeHidden()
  })
})
