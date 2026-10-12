import {
  test,
  expect,
  type APIRequestContext,
  type Locator,
  type Page,
} from '@playwright/test'
import {
  API,
  USERS,
  apiToken,
  auth,
  buildGroup,
  gotoSandboxTab,
  hideDevtools,
  invitationToken,
  login,
  PASSWORD,
} from './helpers'

/**
 * Slice 2 — people on their own timelines: each coachee's gold sealing,
 * midpoint input and results review as a commitment held by their coach.
 *
 *   • Aisha joined with the sandbox: her gold sealing closed before it was
 *     created ("Not active"), her midpoint follows the sandbox's dates
 *   • Leila joined late: her gold sealing is dated from her first day
 *   • Priya moves Leila's midpoint by hand; it stops following and the log
 *     says so; "Use default dates" brings it back
 *   • the admin moves the sandbox's midpoint: the dialog says who follows,
 *     Priya's adjusted row keeps its dates, the toast counts
 *   • a group with no coach yet: "Awaiting a coach", until one is added
 *   • Leila (the coachee) sees her own windows on the portal and in the
 *     outcomes header, and no milestone rows
 *
 * Fixtures: seed script (`reset`); the sandbox is built here through the
 * API as the admin. `MILESTONE_RULES_ENABLED=true` in the backend `.env`
 * makes the group hooks create the rows synchronously.
 */

const NAME = 'E2E Personal Milestones'
const LEILA = { email: 'e2e-leila-ms@ptg-e2e.com', name: 'Leila Nasser' }
const AISHA = { email: 'e2e-aisha-ms@ptg-e2e.com', name: 'Aisha Mensah' }
const CARLA = { email: 'e2e-carla-ms@ptg-e2e.com', name: 'Carla Nunes' }
const REASON = 'Her second session falls after the default window'

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

const iso = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const d = (s: string) => {
  const [y, m, day] = s.split('-').map(Number)
  return new Date(y, m - 1, day)
}
const plusDays = (date: Date, n: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + n)
  return next
}
const monthsAgo = (n: number) => {
  const t = new Date()
  t.setDate(1)
  t.setMonth(t.getMonth() - n)
  return iso(t)
}

function monthIndex(x: Date) {
  return x.getFullYear() * 12 + x.getMonth()
}

async function pickDay(page: Page, fieldId: string, from: Date, target: Date) {
  await expect(page.locator('[data-slot="popover-content"]')).toHaveCount(0)
  await page.click(`#${fieldId}`)
  const calendar = page.locator('[data-slot="popover-content"]')
  await expect(calendar).toHaveCount(1)
  const steps = monthIndex(target) - monthIndex(from)
  const nav = steps > 0 ? /next month/i : /previous month/i
  for (let i = 0; i < Math.abs(steps); i++) {
    await calendar.getByRole('button', { name: nav }).click()
  }
  await calendar
    .locator(
      `button[data-day="${target.getMonth() + 1}/${target.getDate()}/${target.getFullYear()}"]`,
    )
    .first()
    .click()
}

type Row = {
  id: string
  kind: string
  title: string
  status: string
  start_date: string | null
  target_date: string | null
  assignee: { user_id: string; name: string } | null
  coachee: { member_id: string; name: string } | null
  milestone: {
    id: string
    occurrence: string
    source_kind: string
    follows: boolean
    assignee_pinned: boolean
    coach_pending: boolean
    resolved_reason: string | null
  } | null
}

async function milestoneRows(
  request: APIRequestContext,
  token: string,
  sandboxId: string,
): Promise<Row[]> {
  const body = await api(
    request,
    token,
    'get',
    `/sandboxes/${sandboxId}/commitments`,
  )
  return (body.rows as Row[]).filter(r => r.kind === 'milestone')
}

function rowOf(rows: Row[], who: string, occurrence: string): Row {
  const hit = rows.find(
    r => r.coachee?.name === who && r.milestone?.occurrence === occurrence,
  )
  if (!hit) throw new Error(`No ${occurrence} row for ${who}`)
  return hit
}

function card(page: Page, occurrence: string): Locator {
  return page
    .getByTestId('personal-milestone-card')
    .filter({ has: page.locator(`[data-occurrence="${occurrence}"]`) })
    .first()
}

function personRow(scope: Locator | Page, name: string): Locator {
  return scope.getByTestId('personal-milestone').filter({ hasText: name })
}

async function openMilestones(page: Page, sandboxId: string) {
  await gotoSandboxTab(page, `/sandboxes/${sandboxId}`, 'commitments')
  await hideDevtools(page)
  await page.getByTestId('commitments-by-milestones').click()
  await expect(page.getByTestId('personal-milestones')).toBeVisible()
}

test.describe.configure({ mode: 'serial' })

test.describe('Sandboxes — personal milestones', () => {
  let sandboxId = ''
  let midpoint: {
    id: string
    label: string
    window_start: string
    window_end: string
  }
  let gold: { window_start: string; window_end: string }
  const lateStart = iso(plusDays(new Date(), -10))

  test.beforeAll(async ({ request }) => {
    const admin = await apiToken(request, USERS.admin.email)
    // Two months in: gold sealing (the first month) has closed, the midpoint
    // is still ahead, and the results review sits after the term.
    const created = await api(request, admin, 'post', '/sandboxes/', {
      name: NAME,
      organisation: 'Preferred Travel Group',
      term_start: monthsAgo(2),
      term_months: 6,
      links: [],
    })
    sandboxId = created.sandbox.id
    midpoint = created.timeline.find(
      (e: { kind: string }) => e.kind === 'midpoint_reporting',
    )
    gold = created.timeline.find(
      (e: { kind: string }) => e.kind === 'gold_sealing',
    )
    const find = async (q: string) =>
      (
        await api(
          request,
          admin,
          'get',
          `/sandboxes/people/search?q=${q}&sandbox_id=${sandboxId}`,
        )
      )[0]
    const marcus = await find('marcus')
    const priya = await find('priya')
    // Omar approves: their side, no login needed here.
    await api(request, admin, 'post', `/sandboxes/${sandboxId}/members`, {
      side: 'theirs',
      roles: ['supervisor'],
      email: USERS.omar.email,
      name: USERS.omar.name,
    })
    await buildGroup(request, admin, sandboxId, {
      coach_user_ids: [marcus.id],
      coachees: [AISHA],
      hours_per_coachee: 6,
    })
    // Leila joined ten days ago: her gold sealing is derived from that day.
    await buildGroup(request, admin, sandboxId, {
      coach_user_ids: [priya.id],
      coachees: [LEILA],
      hours_per_coachee: 6,
      starts_on: lateStart,
    })
    // Leila signs up through her invitation, so she has a portal (accepting
    // links Priya's client row for her to the new login).
    const overview = await api(
      request,
      admin,
      'get',
      `/sandboxes/${sandboxId}/overview`,
    )
    const leila = overview.members.find(
      (m: { email: string }) => m.email === LEILA.email,
    )
    await api(request, admin, 'post', `/sandboxes/${sandboxId}/invitations`, {
      member_ids: [leila.id],
    })
    const { token: invite } = invitationToken(LEILA.email)
    const signup = await request.post(
      `${API}/sandbox-invitations/accept-signup`,
      { data: { token: invite, password: PASSWORD, full_name: LEILA.name } },
    )
    expect(signup.ok()).toBeTruthy()
  })

  test.afterAll(async ({ request }) => {
    // Later specs assert exact bell counts for these people.
    for (const who of [USERS.marcus.email, USERS.priya.email]) {
      const t = await apiToken(request, who)
      await request.post(`${API}/notifications/read-all`, { headers: auth(t) })
    }
  })

  test('each coachee has their own rows: inherited, derived, or closed before it was created', async ({
    request,
  }) => {
    const admin = await apiToken(request, USERS.admin.email)
    const rows = await milestoneRows(request, admin, sandboxId)

    // Aisha, with the sandbox from the start.
    const aishaGold = rowOf(rows, AISHA.name, 'gold_sealing')
    expect(aishaGold.status).toBe('abandoned')
    expect(aishaGold.milestone?.resolved_reason).toBe('window_passed')
    const aishaMid = rowOf(rows, AISHA.name, 'midpoint_reporting:1')
    expect(aishaMid.status).toBe('active')
    expect(aishaMid.milestone?.source_kind).toBe('event')
    expect(aishaMid.start_date).toBe(midpoint.window_start)
    expect(aishaMid.target_date).toBe(midpoint.window_end)
    expect(aishaMid.assignee?.name).toBe(USERS.marcus.name)

    // Leila, ten days in.
    const danaGold = rowOf(rows, LEILA.name, 'gold_sealing')
    expect(danaGold.status).toBe('active')
    expect(danaGold.milestone?.source_kind).toBe('derived')
    expect(danaGold.start_date).toBe(lateStart)
    expect(danaGold.target_date! > lateStart).toBe(true)
    expect(danaGold.milestone?.follows).toBe(true)
    expect(danaGold.assignee?.name).toBe(USERS.priya.name)
    const danaReview = rowOf(rows, LEILA.name, 'results_review')
    expect(danaReview.status).toBe('active')
  })

  test('the Milestones view: one card per occurrence, chips say where the dates come from', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await openMilestones(page, sandboxId)

    const goldCard = card(page, 'gold_sealing')
    await expect(goldCard).toContainText('Gold sealing')
    await expect(goldCard).toContainText('Sandbox:')
    const leila = personRow(goldCard, LEILA.name)
    await expect(leila).toHaveCount(1)
    await expect(leila.getByTestId('personal-milestone-source')).toHaveText(
      'From their start date',
    )
    await expect(leila).toContainText('with Priya')
    // Aisha's closed before it existed: folded under Not active.
    await expect(personRow(goldCard, AISHA.name)).toHaveCount(0)
    await expect(
      goldCard.getByTestId('personal-milestone-summary'),
    ).toContainText('1 dropped')
    await goldCard.getByTestId('personal-milestone-inactive-toggle').click()
    const aisha = personRow(goldCard, AISHA.name)
    await expect(aisha).toHaveCount(1)
    await expect(aisha.getByTestId('personal-milestone-source')).toContainText(
      'Dropped · closed before it was created',
    )

    const midCard = card(page, 'midpoint_reporting:1')
    await expect(midCard).toContainText('Midpoint reporting')
    for (const who of [AISHA.name, LEILA.name]) {
      await expect(
        personRow(midCard, who).getByTestId('personal-milestone-source'),
      ).toHaveText('Sandbox dates')
    }
    await expect(
      midCard.getByTestId('personal-milestone-summary'),
    ).toContainText('0 of 2 done')
  })

  test('the coach moves a window by hand; it stops following, and can follow again', async ({
    page,
    request,
  }) => {
    await login(page, USERS.priya.email)
    await openMilestones(page, sandboxId)
    // Priya coaches one group: only Leila's rows are hers to see.
    await expect(page.getByTestId('personal-milestone')).toHaveCount(3)
    await expect(personRow(page, AISHA.name)).toHaveCount(0)

    const midCard = card(page, 'midpoint_reporting:1')
    await personRow(midCard, LEILA.name)
      .getByTestId('personal-milestone-window')
      .click()
    const panel = page.getByTestId('commitment-detail-panel')
    await expect(panel).toHaveAttribute('data-open', 'true')
    await expect(panel.getByTestId('milestone-header')).toContainText(
      'Milestone · Midpoint reporting',
    )
    await expect(panel.getByTestId('milestone-follows')).toContainText(
      "Follows the sandbox's Midpoint reporting",
    )

    await panel.getByTestId('milestone-window').click()
    const dialog = page.getByRole('dialog', { name: 'Move the window' })
    await expect(dialog).toBeVisible()
    const end = d(midpoint.window_end)
    await pickDay(page, 'milestone-end', end, plusDays(end, 7))
    await dialog.getByTestId('milestone-reason').fill(REASON)
    await dialog.getByTestId('milestone-window-save').click()
    await expect(dialog).toHaveCount(0)

    await expect(panel.getByTestId('milestone-follows')).toContainText(
      'Adjusted · default',
    )
    await expect(panel.getByTestId('milestone-use-default')).toBeVisible()

    const priya = await apiToken(request, USERS.priya.email)
    const row = rowOf(
      await milestoneRows(request, priya, sandboxId),
      LEILA.name,
      'midpoint_reporting:1',
    )
    expect(row.milestone?.follows).toBe(false)
    expect(row.target_date).toBe(iso(plusDays(end, 7)))
    // The sandbox's log has the move, with her reason.
    const changes = await api(
      request,
      priya,
      'get',
      `/sandboxes/${sandboxId}/changes?record_type=commitment&record_id=${row.id}&limit=10`,
    )
    const moved = changes.items.find(
      (c: { action: string }) => c.action === 'rescheduled',
    )
    expect(moved).toBeTruthy()
    expect(moved.cause).toBe(REASON)
    expect(moved.summary).toContain('Priya Raman rescheduled')

    // Back to the automation's dates.
    await panel.getByTestId('milestone-use-default').click()
    await expect(panel.getByTestId('milestone-follows')).toContainText(
      "Follows the sandbox's Midpoint reporting",
    )
    const back = rowOf(
      await milestoneRows(request, priya, sandboxId),
      LEILA.name,
      'midpoint_reporting:1',
    )
    expect(back.milestone?.follows).toBe(true)
    expect(back.target_date).toBe(midpoint.window_end)

    // Adjust it again so the next test has an adjusted row to keep.
    await api(request, priya, 'patch', `/commitments/${row.id}`, {
      start_date: midpoint.window_start,
      target_date: iso(plusDays(end, 7)),
    })
  })

  test('moving the sandbox window says who follows; adjusted dates stay', async ({
    page,
    request,
  }) => {
    await login(page, USERS.admin.email)
    await gotoSandboxTab(page, `/sandboxes/${sandboxId}`, 'today')
    await hideDevtools(page)

    const eventCard = page
      .getByTestId('timeline-event')
      .filter({ hasText: midpoint.label })
    await eventCard
      .getByRole('button', { name: `Actions for ${midpoint.label}` })
      .click()
    await page.getByRole('menuitem', { name: 'Adjust window' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText(`Adjust ${midpoint.label}`)
    await expect(dialog.getByTestId('move-preview')).toHaveCount(0)

    const start = d(midpoint.window_start)
    const end = d(midpoint.window_end)
    await pickDay(page, 'event-start', start, plusDays(start, 3))
    await pickDay(page, 'event-end', end, plusDays(end, 3))
    const preview = dialog.getByTestId('move-preview')
    await expect(preview).toContainText(
      `1 person's ${midpoint.label} follows this window`,
    )
    await expect(preview).toContainText('1 keeps adjusted dates')
    await dialog.getByTestId('event-save').click()
    await expect(dialog).toHaveCount(0)
    await expect(page.getByText('1 personal window followed')).toBeVisible()

    const admin = await apiToken(request, USERS.admin.email)
    const rows = await milestoneRows(request, admin, sandboxId)
    const aisha = rowOf(rows, AISHA.name, 'midpoint_reporting:1')
    expect(aisha.start_date).toBe(iso(plusDays(start, 3)))
    expect(aisha.target_date).toBe(iso(plusDays(end, 3)))
    const leila = rowOf(rows, LEILA.name, 'midpoint_reporting:1')
    expect(leila.milestone?.follows).toBe(false)
    expect(leila.target_date).toBe(iso(plusDays(end, 7)))
    midpoint.window_start = iso(plusDays(start, 3))
    midpoint.window_end = iso(plusDays(end, 3))
  })

  test('a group with no coach yet: awaiting a coach, until one is added', async ({
    page,
    request,
  }) => {
    const admin = await apiToken(request, USERS.admin.email)
    const three = await buildGroup(request, admin, sandboxId, {
      coach_user_ids: [],
      coachees: [CARLA],
      hours_per_coachee: 6,
      starts_on: lateStart,
    })
    let rows = await milestoneRows(request, admin, sandboxId)
    const carla = rowOf(rows, CARLA.name, 'gold_sealing')
    expect(carla.assignee).toBeNull()
    expect(carla.milestone?.coach_pending).toBe(true)

    await login(page, USERS.admin.email)
    await openMilestones(page, sandboxId)
    const goldCard = card(page, 'gold_sealing')
    const row = personRow(goldCard, CARLA.name)
    await expect(row.getByTestId('personal-milestone-awaiting')).toHaveText(
      'Awaiting a coach',
    )
    await expect(
      goldCard.getByTestId('personal-milestone-summary'),
    ).toContainText('1 awaiting a coach')

    const marcus = (
      await api(
        request,
        admin,
        'get',
        `/sandboxes/people/search?q=marcus&sandbox_id=${sandboxId}`,
      )
    )[0]
    await api(
      request,
      admin,
      'post',
      `/sandboxes/${sandboxId}/groups/${three.id}/members`,
      {
        kind: 'coach',
        user_id: marcus.id,
      },
    )
    rows = await milestoneRows(request, admin, sandboxId)
    expect(rowOf(rows, CARLA.name, 'gold_sealing').assignee?.name).toBe(
      USERS.marcus.name,
    )
    await page.reload()
    await page.getByTestId('commitments-by-milestones').click()
    await expect(
      personRow(card(page, 'gold_sealing'), CARLA.name),
    ).toContainText('with Marcus')
  })

  test('the coachee sees her own windows, and none of the rows', async ({
    page,
    request,
  }) => {
    const leila = await apiToken(request, LEILA.email)
    // Her profile under Priya: the portal reads one profile at a time.
    const profiles = await api(request, leila, 'get', '/client-portal/profiles')
    const list: { id?: string; client_id?: string }[] = Array.isArray(profiles)
      ? profiles
      : (profiles.profiles ?? profiles.items ?? [])
    expect(list.length).toBeGreaterThan(0)
    for (const profile of list) {
      const resp = await request.get(`${API}/client-portal/commitments`, {
        headers: {
          ...auth(leila),
          'X-Active-Client': (profile.id ?? profile.client_id) as string,
        },
      })
      expect(resp.ok()).toBe(true)
      const mine = (await resp.json()) as { source: string }[]
      expect(mine.filter(c => c.source === 'rule')).toHaveLength(0)
    }

    await login(page, LEILA.email)
    await hideDevtools(page)
    const note = page.getByTestId('sandbox-note')
    await expect(note).toBeVisible()
    const windows = note.getByTestId('portal-personal-windows')
    await expect(windows).toBeVisible()
    const sealing = windows
      .getByTestId('window-row')
      .filter({ hasText: 'Your gold sealing' })
    await expect(sealing).toHaveCount(1)
    await expect(sealing).toHaveAttribute('data-state', 'current')

    // The outcomes header is her window, open now — not the sandbox's, which closed.
    await page.goto(`/sandboxes/${sandboxId}#outcomes`)
    const panel = page.getByTestId('outcomes-panel')
    await expect(panel).toBeVisible()
    const chip = panel.locator('header').getByTestId('window-chip')
    await expect(chip).toHaveAttribute('data-state', 'current')
    await expect(chip).toContainText('Gold sealing')
    expect(gold.window_end < iso(new Date())).toBe(true)
  })
})
