import { expect, test, type APIRequestContext } from '@playwright/test'
import {
  API,
  apiToken,
  auth,
  buildGroup,
  gotoSandboxTab,
  hideDevtools,
  login,
  USERS,
} from './helpers'

/**
 * The sandbox's Commitments tab: the team's work beside what coachees agreed
 * with their coaches — by coach, by coachee — and adding one from the page.
 *
 * Fixture "E2E Tracking": admin (AE) · Marcus coaches Ilse and Koen · Priya
 * leads the coaches and coaches Mina. Priya is the one who shows what leadership
 * may read: the admin is a super admin, who opens every commitment anyway. Marcus and Ilse agreed two things, one already late; Priya and
 * Mina one; the team owes "Confirm attendees" (Marcus).
 *
 * The file name is load-bearing: it gives Marcus one more sandbox, so it sorts
 * after every spec that counts the cards on his home page.
 */
test.describe.configure({ mode: 'serial' })

const NAME = 'E2E Tracking'
const ILSE = { email: 'e2e-ilse-track@ptg-e2e.com', name: 'Ilse Brandt' }
const KOEN = { email: 'e2e-koen-track@ptg-e2e.com', name: 'Koen Maes' }
const MINA = { email: 'e2e-mina-track@ptg-e2e.com', name: 'Mina Okoye' }

let sandboxId = ''

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

function day(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${`${d.getDate()}`.padStart(2, '0')}`
}

function termStart(): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 10)
}

function section(page: import('@playwright/test').Page, name: string) {
  return page.getByTestId('commitment-section').filter({ hasText: name })
}

test.describe('Sandboxes — the Commitments tab', () => {
  test('builds the fixture', async ({ request }) => {
    const admin = await apiToken(request, USERS.admin.email)
    sandboxId = (
      await api(request, admin, 'post', '/sandboxes/', {
        name: NAME,
        organisation: 'PTG',
        term_start: termStart(),
        term_months: 6,
      })
    ).sandbox.id
    const marcus = (
      await api(request, admin, 'get', '/sandboxes/people/search?q=marcus')
    )[0]
    const priya = (
      await api(request, admin, 'get', '/sandboxes/people/search?q=priya')
    )[0]
    await api(request, admin, 'post', `/sandboxes/${sandboxId}/members`, {
      side: 'ours',
      roles: ['lead_coach'],
      user_id: priya.id,
    })
    await buildGroup(request, admin, sandboxId, {
      name: 'Alpha',
      coach_user_ids: [marcus.id],
      coachees: [ILSE, KOEN],
      hours_per_coachee: 12,
    })
    await buildGroup(request, admin, sandboxId, {
      coach_user_ids: [priya.id],
      coachees: [MINA],
      hours_per_coachee: 12,
    })
    await api(request, admin, 'post', '/commitments/', {
      sandbox_id: sandboxId,
      title: 'Confirm attendees',
      assigned_to_id: marcus.id,
      status: 'active',
      target_date: day(4),
    })

    // What was agreed in coaching is written by the coach, on their own client.
    for (const [who, coachee, items] of [
      [
        USERS.marcus.email,
        ILSE.name,
        [
          ['Hold the line on scope', day(5)],
          ['Share the Q4 plan with her team', day(-3)],
        ],
      ],
      [USERS.priya.email, MINA.name, [['Book the skip-levels', day(9)]]],
    ] as const) {
      const token = await apiToken(request, who)
      const mine = await api(
        request,
        token,
        'get',
        `/sandboxes/${sandboxId}/commitments`,
      )
      const clientId = mine.coachees.find(
        (c: { name: string }) => c.name === coachee,
      ).my_client_id
      for (const [title, due] of items)
        await api(request, token, 'post', '/commitments/', {
          client_id: clientId,
          title,
          status: 'active',
          target_date: due,
        })
    }
  })

  test('the lead coach follows every coach, and reads only what is hers to read', async ({
    page,
  }) => {
    await login(page, USERS.priya.email)
    await gotoSandboxTab(page, `/sandboxes/${sandboxId}`, 'commitments')
    const tab = page.getByTestId('commitments-tab')
    // The timeline's own work is counted with the rest, so only the shape of
    // the sentence is fixed here.
    await expect(tab.getByTestId('commitments-summary')).toContainText(
      /\d+ open · \d+ overdue/,
    )
    // By coach, to begin with.
    await expect(tab.getByTestId('commitments-by-coach')).toHaveAttribute(
      'aria-selected',
      'true',
    )
    const marcus = section(page, USERS.marcus.name)
    await expect(marcus).toContainText('coaches 2')
    await expect(marcus).toContainText('1 overdue')
    await expect(section(page, USERS.priya.name)).toContainText('1 open')

    // A coaching commitment is followed, not opened: no tick, no link, and a
    // word on why.
    const agreed = marcus
      .getByTestId('commitment-item')
      .filter({ hasText: 'Hold the line on scope' })
    await expect(agreed).toHaveAttribute('data-tracked', 'true')
    await expect(agreed).toContainText(ILSE.name)
    await expect(agreed.getByTestId('commitment-tick')).toHaveCount(0)
    await expect(agreed.getByTestId('commitment-lock')).toBeVisible()
    // The team's own work sits beside it and opens as it always did.
    const work = marcus
      .getByTestId('commitment-item')
      .filter({ hasText: 'Confirm attendees' })
    await expect(work).toHaveAttribute('data-tracked', 'false')
    await expect(work.getByTestId('commitment-tick')).toBeVisible()
    // What she agreed with her own coachee is hers in full.
    await expect(
      section(page, USERS.priya.name)
        .getByTestId('commitment-item')
        .filter({ hasText: 'Book the skip-levels' }),
    ).toHaveAttribute('data-tracked', 'false')

    // One chip narrows to what is late…
    await tab.getByTestId('commitments-status-overdue').click()
    await expect(marcus.getByTestId('commitment-item')).toHaveCount(1)
    await expect(marcus.getByTestId('commitment-due')).toHaveText('3 days late')
    await expect(section(page, USERS.priya.name)).toHaveCount(0)
    // …and the same rows can be read by who was coached.
    await tab.getByTestId('commitments-status-open').click()
    await tab.getByTestId('commitments-by-coachee').click()
    await expect(section(page, ILSE.name)).toContainText(
      `with ${USERS.marcus.name}`,
    )
    await expect(section(page, ILSE.name)).toContainText('2 open')
    await tab.getByTestId('commitments-search').fill('skip-levels')
    await expect(tab.getByTestId('commitment-item')).toHaveCount(1)
    await expect(section(page, MINA.name)).toBeVisible()
    await tab.getByTestId('commitments-by-coach').click()
  })

  test('a commitment is added from a coach’s section, already theirs', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'commitments')
    await hideDevtools(page)
    await page.getByTestId('commitments-by-coach').click()
    const priya = section(page, USERS.priya.name)
    if ((await priya.getAttribute('data-open')) !== 'true')
      await priya.getByTestId('commitment-section-toggle').click()
    await priya.getByTestId('commitment-section-add').click()
    const panel = page.getByTestId('commitment-create-panel')
    await expect(panel.getByTestId('create-assignee-picker')).toContainText(
      'Priya',
    )
    await panel
      .getByTestId('commitment-title-input')
      .fill('Send Mina’s manager the agenda')
    await panel.getByTestId('commitment-create-submit').click()
    await expect(
      priya
        .getByTestId('commitment-item')
        .filter({ hasText: 'Send Mina’s manager the agenda' }),
    ).toBeVisible()
  })

  test('a coach sees their own coachees, in full, and ticks one done', async ({
    page,
  }) => {
    await login(page, USERS.marcus.email)
    await gotoSandboxTab(page, `/sandboxes/${sandboxId}`, 'commitments')
    const tab = page.getByTestId('commitments-tab')
    // By coachee for a coach — and nothing of Priya's.
    await expect(tab.getByTestId('commitments-by-coachee')).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(section(page, MINA.name)).toHaveCount(0)
    await expect(tab).not.toContainText('Book the skip-levels')
    await expect(tab.getByTestId('commitments-filter')).toHaveCount(0)

    const ilse = section(page, ILSE.name)
    const late = ilse
      .getByTestId('commitment-item')
      .filter({ hasText: 'Share the Q4 plan' })
    await expect(late).toHaveAttribute('data-tracked', 'false')
    await late.getByTestId('commitment-tick').click()
    await expect(late).toHaveCount(0)
    await expect(tab.getByTestId('commitments-status-done')).toContainText('1')
    await expect(tab.getByTestId('commitments-summary')).not.toContainText(
      'overdue',
    )
  })

  test('the Today block leads to the tab', async ({ page }) => {
    await login(page, USERS.admin.email)
    await page.goto(`/admin/sandboxes/${sandboxId}`)
    await page.getByTestId('sandbox-commitments-see-all').click()
    await expect(page.getByTestId('commitments-tab')).toBeVisible()
    await expect(page.getByTestId('sandbox-tab-commitments')).toHaveAttribute(
      'data-state',
      'active',
    )
  })
})
