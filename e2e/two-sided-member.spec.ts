import { expect, test, type APIRequestContext } from '@playwright/test'
import {
  API,
  apiToken,
  auth,
  buildGroup,
  gotoSandboxTab,
  login,
  USERS,
} from './helpers'

/**
 * One person on both sides of a sandbox: Marcus leads the coaches here and is
 * coached here too.
 *
 * Fixture "E2E Two Sided": admin (AE) · Marcus (lead coach, coaches Ilse) ·
 * Priya (coach) · Dana (supervisor, no group). Marcus is put on the coachees
 * list through the page, then Priya is paired with him.
 *
 * The file name is load-bearing: specs run alphabetically against one shared
 * database and this gives Marcus one more sandbox, so it sorts last — after
 * every spec that counts the cards on his home page.
 */
test.describe.configure({ mode: 'serial' })

const NAME = 'E2E Two Sided'
const ILSE = { email: 'e2e-ilse-two@ptg-e2e.com', name: 'Ilse Brandt' }

let sandboxId = ''
let marcusMemberId = ''

async function api(
  request: APIRequestContext,
  token: string,
  method: 'get' | 'post' | 'put',
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

function termStart(): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 10)
}

test.describe('Sandboxes — one person on both sides', () => {
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
    const member = await api(
      request,
      token,
      'post',
      `/sandboxes/${sandboxId}/members`,
      { side: 'ours', roles: ['lead_coach'], user_id: marcus.id },
    )
    marcusMemberId = member.id
    await api(request, token, 'post', `/sandboxes/${sandboxId}/members`, {
      side: 'theirs',
      roles: ['supervisor'],
      email: USERS.dana.email,
      name: USERS.dana.name,
    })
    await buildGroup(request, token, sandboxId, {
      coach_user_ids: [marcus.id],
      coachees: [ILSE],
      hours_per_coachee: 12,
    })
  })

  test('one of ours is added to the coachees from our people, and is invited like any coachee', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'people')
    const theirs = page.getByTestId('their-side')
    await expect(theirs.getByTestId('person-row')).toHaveCount(2)

    await theirs.getByTestId('add-our-coachees').click()
    const dialog = page.getByTestId('add-our-coachees-dialog')
    await dialog.getByLabel('Filter our people').fill('marcus')
    await dialog.getByLabel(`Add ${USERS.marcus.name}`).click()
    await dialog.getByTestId('add-coaches-submit').click()
    await expect(dialog).toBeHidden()

    // On the coachees list now, marked as one of ours, with an invitation to send…
    const asCoachee = theirs
      .getByTestId('person-row')
      .filter({ hasText: USERS.marcus.name })
    await expect(asCoachee).toHaveCount(1)
    await expect(asCoachee.getByTestId('one-of-ours')).toBeVisible()
    await expect(asCoachee).toContainText('Coachee')
    await expect(asCoachee.getByTestId('invitation-badge')).toHaveText(
      'Has an account',
    )
    // …and still where he was: leading the coaches, and coaching.
    await expect(
      page
        .getByTestId('our-side')
        .getByTestId('person-row')
        .filter({ hasText: USERS.marcus.name }),
    ).toContainText('Lead coach')
    await expect(
      page
        .getByTestId('coaches-side')
        .getByTestId('person-row')
        .filter({ hasText: USERS.marcus.name }),
    ).toHaveCount(1)

    await asCoachee
      .getByRole('button', { name: `Actions for ${USERS.marcus.name}` })
      .click()
    await page.getByRole('menuitem', { name: 'Send invitation' }).click()
    await expect(asCoachee.getByTestId('invitation-badge')).toHaveText(/Sent/)
  })

  test('he reaches his own coaching from the sandbox, and it shows nobody coached beside him', async ({
    page,
    request,
  }) => {
    const token = await apiToken(request, USERS.admin.email)
    const priya = (
      await api(request, token, 'get', '/sandboxes/people/search?q=priya')
    )[0]
    await buildGroup(request, token, sandboxId, {
      name: 'Coaches’ Circle',
      coach_user_ids: [priya.id],
      coachees: [
        { email: USERS.marcus.email, name: USERS.marcus.name },
        { email: 'e2e-joost-two@ptg-e2e.com', name: 'Joost Vermeer' },
      ],
      hours_per_coachee: 6,
    })

    await login(page, USERS.marcus.email)
    await page.goto(`/sandboxes/${sandboxId}`)
    await page.getByTestId('my-coaching').click()
    await page.waitForURL(new RegExp(`/clients/${marcusMemberId}`))
    await expect(page.getByRole('main')).toContainText('Priya')
    await expect(page.getByRole('main')).not.toContainText('Joost')
  })

  test('someone with no reason to know sees no trace that he is coached', async ({
    request,
  }) => {
    const dana = await apiToken(request, USERS.dana.email)
    const overview = await api(
      request,
      dana,
      'get',
      `/sandboxes/${sandboxId}/overview`,
    )
    const marcus = overview.members.find(
      (m: { id: string }) => m.id === marcusMemberId,
    )
    // That he coaches is no secret; that he is coached is.
    expect(marcus.role_labels).toEqual(['Lead coach', 'Coach'])
    expect(marcus.roster).toEqual(['coach'])
    expect(
      marcus.memberships.map((m: { kind: string }) => m.kind),
    ).not.toContain('coachee')
    expect(marcus.invitation_status).toBeNull()
    expect(JSON.stringify(overview)).not.toContain('Circle')
  })

  test('taking him off the coachees keeps him as lead coach and coach', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/admin/sandboxes/${sandboxId}`, 'people')
    const asCoachee = page
      .getByTestId('their-side')
      .getByTestId('person-row')
      .filter({ hasText: USERS.marcus.name })
    await asCoachee
      .getByRole('button', { name: `Actions for ${USERS.marcus.name}` })
      .click()
    // Off the list — never out of the sandbox from here.
    await expect(
      page.getByRole('menuitem', { name: 'Remove from sandbox' }),
    ).toHaveCount(0)
    await page.getByTestId('remove-from-list-item').click()
    const dialog = page.getByTestId('remove-from-list')
    await expect(dialog).toContainText('Coaches’ Circle')
    await expect(dialog).not.toContainText('they leave the sandbox')
    await dialog.getByTestId('remove-list-confirm').click()
    await expect(asCoachee).toHaveCount(0)
    await expect(
      page
        .getByTestId('our-side')
        .getByTestId('person-row')
        .filter({ hasText: USERS.marcus.name }),
    ).toContainText('Lead coach')
    await expect(
      page
        .getByTestId('coaches-side')
        .getByTestId('person-row')
        .filter({ hasText: USERS.marcus.name }),
    ).toHaveCount(1)
  })
})
