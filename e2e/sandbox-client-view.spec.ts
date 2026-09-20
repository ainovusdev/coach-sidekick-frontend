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
  clientPanel,
  clientSection,
  gotoClientView,
  hideDevtools,
  invitationToken,
  login,
  PASSWORD,
  seedSession,
  USERS,
} from './helpers'

/**
 * The client view — the sandbox as its sponsor reads it.
 *
 * One long page instead of the account executive's tabs: where delivery
 * stands, who is being coached, what is agreed, what is coming, and the one
 * short list of things that need this person. Who gets it is decided by the
 * hats held *on this sandbox*, never by the app role the person has elsewhere.
 *
 * Fixture "E2E Client View" (Northwind, ten weeks into a six-month term):
 * Marcus coaches Leaders (Thandi and Ruth) and Explorers (Bruno, no hours
 * agreed); Priya coaches Managers (Oscar, who has never had a session) with
 * Ines supervising. Clara is the primary client, Ruth is a coachee who is also
 * the client admin, and Ines is a supervisor who is also a primary client. A
 * second sandbox, "E2E Client View Ahead", has not started and puts Marcus —
 * one of our coaches — on the client's side of it.
 */
test.describe.configure({ mode: 'serial' })

const NAME = 'E2E Client View'
const AHEAD = 'E2E Client View Ahead'
const ORG = 'Northwind'
const VISION =
  'Leaders who can hold a hard conversation without losing the room.'

// Everyone here lives on the flow domain, which the seed script's `reset`
// clears: a fixture that keeps its coaching sessions between runs would drift.
const CLARA = { email: 'e2e-cv-clara@ptg-e2e.com', name: 'Clara Nkemdi' }
const RUTH = { email: 'e2e-cv-ruth@ptg-e2e.com', name: 'Ruth Vance' }
const INES = { email: 'e2e-cv-ines@ptg-e2e.com', name: 'Ines Marchetti' }
const THANDI = { email: 'e2e-cv-thandi@ptg-e2e.com', name: 'Thandi Mokoena' }
const OSCAR = { email: 'e2e-cv-oscar@ptg-e2e.com', name: 'Oscar Bright' }
const BRUNO = { email: 'e2e-cv-bruno@ptg-e2e.com', name: 'Bruno Salgado' }

const CONCERN = 'E2E internal: the sponsor is wobbling'
const HANDED = 'E2E Send the quarterly steering pack'
const NADIA_OUTCOME = 'Chair the exec review without notes'
const QUINN_OUTCOME = 'Hand the vendor relationship over'

let sandboxId = ''
let aheadId = ''
let commitmentId = ''
let thandiMemberId = ''
let explorersId = ''

function dayOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${`${d.getDate()}`.padStart(2, '0')}`
}

async function api(
  request: APIRequestContext,
  token: string,
  method: 'get' | 'post' | 'put' | 'patch',
  path: string,
  data?: unknown,
) {
  const resp = await request[method](`${API}${path}`, {
    headers: auth(token),
    data,
  })
  if (!resp.ok())
    throw new Error(`${method} ${path} → ${resp.status()} ${await resp.text()}`)
  return resp.status() === 204 ? null : resp.json()
}

/** Sign someone up from the invitation we just sent them. */
async function signUp(
  request: APIRequestContext,
  token: string,
  id: string,
  member: { id: string },
  person: { email: string; name: string },
) {
  await api(request, token, 'post', `/sandboxes/${id}/invitations`, {
    member_ids: [member.id],
  })
  const resp = await request.post(`${API}/sandbox-invitations/accept-signup`, {
    data: {
      token: invitationToken(person.email).token,
      password: PASSWORD,
      full_name: person.name,
    },
  })
  expect(resp.ok()).toBeTruthy()
}

/** Is the section the link named actually on screen? */
function inView(page: Page, id: string) {
  return page.evaluate(section => {
    const el = document.getElementById(section)
    if (!el) return 'missing'
    const box = el.getBoundingClientRect()
    return box.top < window.innerHeight && box.bottom > 0
      ? 'in view'
      : 'off screen'
  }, id)
}

async function texts(page: Page, testId: string): Promise<string[]> {
  return page.getByTestId(testId).allInnerTexts()
}

test.describe('Sandboxes — the client view', () => {
  test('builds the fixture', async ({ request }) => {
    const token = await apiToken(request, USERS.admin.email)
    const created = await api(request, token, 'post', '/sandboxes/', {
      name: NAME,
      organisation: ORG,
      term_start: dayOffset(-70),
      term_months: 6,
      vision: VISION,
      links: [{ label: 'Proposal', url: 'https://drive.novus.com/northwind' }],
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
      user_id: marcus.id,
    })
    const clara = await api(
      request,
      token,
      'post',
      `/sandboxes/${sandboxId}/members`,
      {
        side: 'theirs',
        roles: ['primary_client'],
        email: CLARA.email,
        name: CLARA.name,
      },
    )
    // A supervisor who is also a primary client: two hats, one scope — all.
    const ines = await api(
      request,
      token,
      'post',
      `/sandboxes/${sandboxId}/members`,
      {
        side: 'theirs',
        roles: ['supervisor', 'primary_client'],
        email: INES.email,
        name: INES.name,
      },
    )

    await buildGroup(request, token, sandboxId, {
      name: 'Leaders',
      coach_user_ids: [marcus.id],
      coachees: [THANDI, RUTH],
      hours_per_coachee: 12,
      cadence: { shape: 'rate', count: 1, per: 'fortnight' },
    })
    await buildGroup(request, token, sandboxId, {
      name: 'Managers',
      coach_user_ids: [priya.id],
      coachees: [OSCAR],
      hours_per_coachee: 10,
      cadence: { shape: 'rate', count: 1, per: 'fortnight' },
      supervisor_member_ids: [ines.id],
    })
    // No hours agreed: this group can never be measured against a promise.
    await buildGroup(request, token, sandboxId, {
      name: 'Explorers',
      coach_user_ids: [marcus.id],
      coachees: [BRUNO],
      cadence: { shape: 'rate', count: 1, per: 'month' },
    })

    const overview = await api(
      request,
      token,
      'get',
      `/sandboxes/${sandboxId}/overview`,
    )
    explorersId = overview.groups.find(
      (g: { display_name: string }) => g.display_name === 'Explorers',
    ).id
    const member = (email: string) =>
      overview.members.find((m: { email: string }) => m.email === email)
    thandiMemberId = member(THANDI.email).id
    const ruth = member(RUTH.email)
    const bruno = member(BRUNO.email)

    // Ruth is coached here *and* runs the relationship: a coachee hat plus a
    // client-admin hat, which together read the whole programme.
    await api(
      request,
      token,
      'patch',
      `/sandboxes/${sandboxId}/members/${ruth.id}`,
      { roles: ['primary_client_admin'] },
    )

    for (const [who, person] of [
      [clara, CLARA],
      [ines, INES],
      [ruth, RUTH],
      [member(THANDI.email), THANDI],
    ] as const)
      await signUp(request, token, sandboxId, who, person)

    // Delivery: Nadia and Ruth have had some coaching, Quinn one session,
    // Oscar none at all — which is what the watch list is for.
    for (const daysAgo of [50, 20])
      seedSession({
        coachEmail: USERS.marcus.email,
        clientEmail: THANDI.email,
        daysAgo,
      })
    seedSession({
      coachEmail: USERS.marcus.email,
      clientEmail: RUTH.email,
      daysAgo: 30,
    })
    seedSession({
      coachEmail: USERS.marcus.email,
      clientEmail: BRUNO.email,
      daysAgo: 5,
    })
    seedSession({
      coachEmail: USERS.marcus.email,
      clientEmail: THANDI.email,
      daysAgo: -6,
      status: 'scheduled',
    })

    // Two outcomes waiting for the client's gold seal.
    const marcusToken = await apiToken(request, USERS.marcus.email)
    await api(
      request,
      marcusToken,
      'post',
      `/sandboxes/${sandboxId}/outcomes`,
      {
        member_id: thandiMemberId,
        title: NADIA_OUTCOME,
        measure: 'Runs the November review from an agenda, not a script.',
        propose: true,
      },
    )
    await api(
      request,
      marcusToken,
      'post',
      `/sandboxes/${sandboxId}/outcomes`,
      {
        member_id: bruno.id,
        title: QUINN_OUTCOME,
        measure: null,
        propose: true,
      },
    )

    // One commitment handed to the client, and one concern about her that is
    // ours alone.
    const handed = await api(request, marcusToken, 'post', '/commitments/', {
      title: HANDED,
      sandbox_id: sandboxId,
      assigned_to_id: clara.user_id,
      visibility: 'shared',
      target_date: dayOffset(9),
    })
    commitmentId = handed.id
    await api(request, token, 'post', `/sandboxes/${sandboxId}/concerns`, {
      subject_kind: 'client',
      subject_id: thandiMemberId,
      title: CONCERN,
      explanation: 'Recorded here so our side can plan the conversation.',
    })

    // A second sandbox that has not started, where one of our own coaches is
    // the client.
    const ahead = await api(request, token, 'post', '/sandboxes/', {
      name: AHEAD,
      organisation: ORG,
      term_start: dayOffset(21),
      term_months: 3,
    })
    aheadId = ahead.sandbox.id
    await api(request, token, 'post', `/sandboxes/${aheadId}/members`, {
      side: 'theirs',
      roles: ['primary_client'],
      email: USERS.marcus.email,
      name: USERS.marcus.name,
    })
  })

  test('a primary client reads a programme report, not the cockpit', async ({
    page,
  }) => {
    await login(page, CLARA.email)
    await gotoClientView(page, `/sandboxes/${sandboxId}`)
    await hideDevtools(page)

    await expect(page.getByTestId('sandbox-cockpit')).toHaveCount(0)
    await expect(page.getByTestId('sandbox-tabs')).toHaveCount(0)
    await expect(page.getByTestId('client-view')).toHaveAttribute(
      'data-scope',
      'all',
    )

    // Hero: who it is for, what it is for, and where the term has got to.
    const hero = page.getByTestId('client-hero')
    await expect(hero).toContainText(ORG)
    await expect(hero).toContainText(NAME)
    await expect(page.getByTestId('client-vision')).toContainText(VISION)
    await expect(page.getByTestId('client-pace')).toBeVisible()
    await expect(page.getByTestId('client-week')).toContainText(
      /Week \d+ of 26/,
    )
    await expect(page.getByTestId('term-ribbon')).toBeVisible()
    await expect(page.getByTestId('ribbon-today')).toBeVisible()

    // The headline is written from the numbers, and drops any clause whose
    // value is missing: one group has no hours agreed, so the programme has no
    // promise to measure against and the pace is said without a figure.
    const headline = page.getByTestId('client-headline')
    await expect(headline).toContainText('behind pace.')
    await expect(headline).not.toContainText('received against')
    await expect(headline).toContainText('of 3 started coachees are on track')
    await expect(headline).toContainText('2 outcomes wait for your gold seal')

    const hours = page.getByTestId('scorecard-hours')
    await expect(hours).toContainText('Promised hours unavailable')
    // No promise, no ring: the card never draws a dial against nothing.
    await expect(hours.getByTestId('pace-ring')).toHaveCount(0)
    await expect(page.getByTestId('scorecard-on-track')).toContainText(
      'of 3 started',
    )
    await expect(page.getByTestId('scorecard-on-track')).toContainText(
      '1 coachee can’t be measured yet',
    )
    await expect(page.getByTestId('scorecard-outcomes')).toContainText(
      'of 4 coachees',
    )
    await expect(page.getByTestId('scorecard-sessions')).toContainText(
      'this term',
    )

    // What needs her: both proposals, and the commitment she was handed.
    await expect(page.getByTestId('needs-row')).toHaveCount(2)
    await expect(page.getByTestId('needs-commitment')).toContainText(HANDED)

    // Groups, then everyone in them as cards.
    await expect(page.getByTestId('client-group-row')).toHaveCount(3)
    await expect(
      page.getByTestId('client-group-row').filter({ hasText: 'Explorers' }),
    ).toContainText(USERS.marcus.name)
    await expect(page.getByTestId('person-card')).toHaveCount(4)
    const people = clientSection(page, 'people')
    await expect(people).toContainText(THANDI.name)
    await expect(people).toContainText(OSCAR.name)

    // The filters are the questions a sponsor asks.
    await page.getByTestId('people-filter-not_started').click()
    await expect(page.getByTestId('person-card')).toHaveCount(1)
    await expect(page.getByTestId('person-card')).toContainText(OSCAR.name)
    await page.getByTestId('people-filter-seal').click()
    await expect(page.getByTestId('person-card')).toHaveCount(2)
    await page.getByTestId('people-filter-all').click()
    await expect(page.getByTestId('person-card')).toHaveCount(4)

    // The rail: what to watch, what is next, what just happened, and whom to ask.
    const watch = clientPanel(page, 'watch')
    await expect(watch.getByTestId('attention-row').first()).toBeVisible()
    await expect(
      clientPanel(page, 'timeline').getByTestId('timeline-event').first(),
    ).toBeVisible()
    await expect(
      clientPanel(page, 'updates').getByTestId('update-row').first(),
    ).toBeVisible()
    // Whom to ask: the account executive and the lead coach, no one else.
    const team = clientPanel(page, 'team')
    await expect(team).toContainText(USERS.admin.name)
    await expect(team).toContainText(USERS.marcus.name)
    await expect(team).not.toContainText(USERS.priya.name)

    // Nothing anywhere reads as a missing value.
    const body = await page.getByTestId('client-view').innerText()
    expect(body).not.toMatch(/undefined|NaN|\[object Object\]/)
  })

  test('the hours ring appears once every group has agreed hours', async ({
    page,
    request,
  }) => {
    const token = await apiToken(request, USERS.admin.email)
    await api(
      request,
      token,
      'patch',
      `/sandboxes/${sandboxId}/groups/${explorersId}`,
      { hours_per_coachee: 6 },
    )

    await login(page, CLARA.email)
    await gotoClientView(page, `/sandboxes/${sandboxId}`)
    await hideDevtools(page)
    const hours = page.getByTestId('scorecard-hours')
    await expect(hours).toContainText('of 40 h promised')
    await expect(hours.getByTestId('pace-ring')).toBeVisible()
    // …with the bead that marks what was expected by today.
    await expect(hours.getByTestId('pace-ring-expected')).toBeVisible()
    await expect(page.getByTestId('client-headline')).toContainText(
      'received against',
    )
  })

  test('two client hats still mean one page, at the programme scope', async ({
    page,
  }) => {
    // A coachee who is also the client admin: coached here, and reads it all.
    await login(page, RUTH.email)
    await gotoClientView(page, `/sandboxes/${sandboxId}`)
    await expect(page.getByTestId('client-view')).toHaveAttribute(
      'data-scope',
      'all',
    )
    await expect(page.getByTestId('client-group-row')).toHaveCount(3)
    await expect(clientSection(page, 'people')).toContainText(THANDI.name)

    // A supervisor who is also a primary client reads the whole programme too,
    // not just the group she supervises.
    await login(page, INES.email)
    await gotoClientView(page, `/sandboxes/${sandboxId}`)
    await expect(page.getByTestId('client-view')).toHaveAttribute(
      'data-scope',
      'all',
    )
    await expect(page.getByTestId('client-hero')).toContainText(
      '6-month programme',
    )
    await expect(page.getByTestId('client-group-row')).toHaveCount(3)
  })

  test('our side and the coachees keep the cockpit', async ({ page }) => {
    // Marcus coaches this one, so here he gets his working tool…
    await login(page, USERS.marcus.email)
    await page.goto(`/sandboxes/${sandboxId}`)
    await expect(page.getByTestId('sandbox-cockpit')).toBeVisible()
    await expect(page.getByTestId('client-view')).toHaveCount(0)

    // …and on the sandbox where he is the client, he gets the client view.
    await gotoClientView(page, `/sandboxes/${aheadId}`)
    await expect(page.getByTestId('sandbox-cockpit')).toHaveCount(0)

    // A platform admin runs the thing, so they keep the cockpit.
    await login(page, USERS.admin.email)
    await page.goto(`/sandboxes/${sandboxId}`)
    await expect(page.getByTestId('sandbox-cockpit')).toBeVisible()

    // A plain coachee's page is already their own coaching, so it is unchanged.
    await login(page, THANDI.email)
    await page.goto(`/sandboxes/${sandboxId}`)
    await expect(page.getByTestId('sandbox-view')).toHaveAttribute(
      'data-audience',
      'coachee',
    )
    await expect(page.getByTestId('sandbox-cockpit')).toBeVisible()
    await expect(page.getByTestId('client-view')).toHaveCount(0)
  })

  test('the client seals one outcome from Needs you and sends another back', async ({
    page,
  }) => {
    await login(page, CLARA.email)
    await gotoClientView(page, `/sandboxes/${sandboxId}`)
    await hideDevtools(page)

    const nadia = page
      .getByTestId('needs-row')
      .filter({ hasText: NADIA_OUTCOME })
    await nadia.getByTestId('needs-seal').click()
    const dialog = page.getByTestId('decision-dialog')
    await expect(dialog).toContainText('Gold seal this outcome?')
    await dialog.getByTestId('decision-note').fill('This is the right one.')
    await dialog.getByTestId('decision-confirm').click()
    await expect(dialog).toBeHidden()
    await expect(nadia).toHaveCount(0)

    // The board below now reads as sealed, by her.
    const block = page
      .getByTestId('outcome-coachee')
      .filter({ hasText: THANDI.name })
    await expect(block.getByTestId('coachee-outcome-state')).toHaveAttribute(
      'data-state',
      'sealed',
    )
    await expect(block.getByTestId('outcome-row')).toContainText(
      `Gold sealed by ${CLARA.name}`,
    )
    await expect(page.getByTestId('outcomes-summary')).toContainText(
      'gold sealed',
    )

    // Sending one back needs a reason.
    const bruno = page
      .getByTestId('needs-row')
      .filter({ hasText: QUINN_OUTCOME })
    await bruno.getByTestId('needs-changes').click()
    await expect(dialog).toContainText('Request changes')
    await expect(dialog.getByTestId('decision-confirm')).toBeDisabled()
    await dialog
      .getByTestId('decision-note')
      .fill('Say which relationship, and by when.')
    await dialog.getByTestId('decision-confirm').click()
    await expect(dialog).toBeHidden()
    await expect(page.getByTestId('needs-row')).toHaveCount(0)
    await expect(
      page
        .getByTestId('outcome-coachee')
        .filter({ hasText: BRUNO.name })
        .getByTestId('outcome-note'),
    ).toContainText('Say which relationship')

    // She may decide, but she may never reopen what is sealed.
    await expect(page.getByTestId('outcome-reopen')).toHaveCount(0)
    await expect(page.getByTestId('outcome-add')).toHaveCount(0)
  })

  test('every link into a sandbox lands somewhere on this page', async ({
    page,
  }) => {
    await login(page, CLARA.email)
    // These `?tab=` names mean something else on the cockpit — `insights` is
    // its Delivery tab, `groups` is its People tab — so the shared URL parser
    // keeps the raw word and each layout reads it for itself. This table is
    // what proves the cockpit's aliases never reached here.
    for (const [link, section] of [
      ['#outcomes', 'outcomes'],
      ['#timeline', 'timeline'],
      ['#invitations', 'team'],
      ['?tab=insights', 'insights'],
      ['#commitments', 'needs'],
      ['?tab=groups', 'groups'],
    ] as const) {
      await gotoClientView(page, `/sandboxes/${sandboxId}`, link)
      await expect
        .poll(() => inView(page, section), { message: `${link} → #${section}` })
        .toBe('in view')
    }

    // A second link to the same page only changes the hash, which the browser
    // handles without a reload — so the reading has to run again.
    await page.evaluate(() => {
      window.location.hash = '#people'
    })
    await expect.poll(() => inView(page, 'people')).toBe('in view')

    // The commitment deep link opens the panel, and closing it takes the link
    // back out of the URL.
    await page.goto(
      `/sandboxes/${sandboxId}?commitment=${commitmentId}#commitments`,
    )
    await hideDevtools(page)
    const panel = page.getByTestId('commitment-detail-panel')
    await expect(panel).toHaveAttribute('data-open', 'true')
    await expect(panel).toContainText(HANDED)
    await page.keyboard.press('Escape')
    await expect(panel).toHaveAttribute('data-open', 'false')
    await expect(page).not.toHaveURL(/commitment=/)
  })

  test('nothing of ours leaks onto the client page', async ({ page }) => {
    await login(page, CLARA.email)
    await gotoClientView(page, `/sandboxes/${sandboxId}`)
    await hideDevtools(page)
    const view = page.getByTestId('client-view')

    // Our concern about a coachee is ours; so is the setup checklist, the
    // invitation ledger and the proposal link.
    await expect(view).not.toContainText(CONCERN)
    await expect(page.getByTestId('setup-card')).toHaveCount(0)
    await expect(page.getByTestId('invitations-title')).toHaveCount(0)
    await expect(page.getByTestId('links-card')).toHaveCount(0)
    await expect(page.getByTestId('people-table')).toHaveCount(0)

    // The watch list is delivery and windows only: our operational chores and
    // the approvals that live in Needs you never appear as something to watch.
    const watch = clientPanel(page, 'watch')
    const rows = watch.getByTestId('attention-row')
    await expect(rows.first()).toBeVisible()
    const kinds = await rows.evaluateAll(list =>
      list.map(row => row.getAttribute('data-kind')),
    )
    for (const kind of kinds)
      expect([
        'behind',
        'no_session_yet',
        'window_open',
        'window_opening',
      ]).toContain(kind)

    // Learning is here in full — it is their programme's themes, and the
    // backend lets them ask for a fresh read — but it never names anyone.
    await expect(page.getByTestId('learning-panel')).toBeVisible()
    await expect(page.getByTestId('learning-panel')).not.toContainText(
      THANDI.name,
    )
  })

  test('our own preview of the client layout matches it, with no buttons', async ({
    page,
  }) => {
    await login(page, CLARA.email)
    await gotoClientView(page, `/sandboxes/${sandboxId}`)
    await hideDevtools(page)
    const hers = {
      hours: await page.getByTestId('scorecard-hours').innerText(),
      onTrack: await page.getByTestId('scorecard-on-track').innerText(),
      outcomes: await page.getByTestId('scorecard-outcomes').innerText(),
      groups: await texts(page, 'client-group-row'),
      watch: await texts(page, 'attention-row'),
      people: await texts(page, 'person-card'),
    }

    await login(page, USERS.admin.email)
    // Our side is offered the switch from the sandbox's identity card.
    await page.goto(`/sandboxes/${sandboxId}`)
    await expect(page.getByTestId('see-client-view')).toHaveAttribute(
      'href',
      `/sandboxes/${sandboxId}?view=client&from=member`,
    )
    await page.getByTestId('see-client-view').click()
    await page.getByTestId('client-view').waitFor()
    await hideDevtools(page)

    await expect(page.getByTestId('client-preview-banner')).toContainText(
      'shown with your access',
    )
    expect(await page.getByTestId('scorecard-hours').innerText()).toBe(
      hers.hours,
    )
    expect(await page.getByTestId('scorecard-on-track').innerText()).toBe(
      hers.onTrack,
    )
    expect(await page.getByTestId('scorecard-outcomes').innerText()).toBe(
      hers.outcomes,
    )
    expect(await texts(page, 'client-group-row')).toEqual(hers.groups)
    expect(await texts(page, 'attention-row')).toEqual(hers.watch)
    expect(await texts(page, 'person-card')).toEqual(hers.people)

    // The banner promises no actions, so an admin's own rights come off the
    // rows — and the commitments, which are each person's own, stay out.
    await expect(page.getByTestId('outcome-seal')).toHaveCount(0)
    await expect(page.getByTestId('needs-seal')).toHaveCount(0)
    await expect(page.getByTestId('outcome-reopen')).toHaveCount(0)
    await expect(page.getByTestId('outcome-add')).toHaveCount(0)
    await expect(page.getByTestId('needs-commitment')).toHaveCount(0)
    await expect(page.getByTestId('generate-insights')).toHaveCount(0)

    // The way back is where the person came from, on both routes.
    await expect(page.getByTestId('client-preview-back')).toHaveAttribute(
      'href',
      `/sandboxes/${sandboxId}`,
    )
    await page.goto(`/sandboxes/${sandboxId}?view=client&from=admin`)
    await expect(page.getByTestId('client-preview-back')).toHaveAttribute(
      'href',
      `/admin/sandboxes/${sandboxId}`,
    )
  })

  test('a sandbox that has not started says so instead of showing zeroes', async ({
    page,
  }) => {
    await login(page, USERS.marcus.email)
    await gotoClientView(page, `/sandboxes/${aheadId}`)
    await hideDevtools(page)

    await expect(page.getByTestId('client-week')).toContainText('Starts')
    await expect(page.getByTestId('scorecards-waiting')).toContainText(
      'Reporting starts',
    )
    await expect(page.getByTestId('client-scorecards')).toHaveCount(0)
    await expect(page.getByTestId('client-section-insights')).toHaveCount(0)
    await expect(clientSection(page, 'groups')).toContainText(
      'Groups are being set up',
    )
    await expect(clientSection(page, 'people')).toContainText('No coachees yet')
    await expect(clientPanel(page, 'watch')).toContainText(
      'fills in once coaching starts',
    )
    // The milestones and the people to ask are known before anything starts.
    await expect(
      clientPanel(page, 'timeline').getByTestId('timeline-event').first(),
    ).toBeVisible()
    await expect(
      clientPanel(page, 'team').getByTestId('team-contact').first(),
    ).toBeVisible()
  })

  test('the progress chart works by keyboard and the page fits a phone', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await login(page, CLARA.email)
    await gotoClientView(page, `/sandboxes/${sandboxId}`, '?tab=insights')
    await hideDevtools(page)

    await page.getByText('View chart data table', { exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(
      page.getByRole('table', { name: 'Weekly and cumulative delivery' }),
    ).toBeVisible()

    // The period selector is remembered in the URL, as it is on our side.
    await page.getByTestId('progress-period-30d').click()
    await expect(page.getByTestId('progress-period-30d')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page).toHaveURL(/period=30d/)

    for (const width of [1440, 1280, 390]) {
      await page.setViewportSize({ width, height: 900 })
      for (const theme of ['light', 'dark']) {
        await page.evaluate(value => {
          document.documentElement.classList.toggle('dark', value === 'dark')
          document.documentElement.style.colorScheme = value
        }, theme)
        await expect
          .poll(() =>
            page.evaluate(
              () => document.documentElement.scrollWidth <= window.innerWidth,
            ),
          )
          .toBe(true)
      }
    }
    expect(errors).toEqual([])
  })
})
