import { expect, test, type Page } from '@playwright/test'
import { login, USERS, hideDevtools } from './helpers'
import type {
  InsightSelection,
  SandboxAnalytics,
} from '../src/types/sandbox-analytics'
import type {
  SandboxEntityDetail,
  SandboxEntityKind,
} from '../src/types/sandbox-details'

const sid = '49b94918-5214-472c-a30e-23498ea06a51'
const client = '49b94918-5214-472c-a30e-23498ea06a52'
const coach = '49b94918-5214-472c-a30e-23498ea06a53'
const group = '49b94918-5214-472c-a30e-23498ea06a54'
const session = '49b94918-5214-472c-a30e-23498ea06a55'
const viewer = '49b94918-5214-472c-a30e-23498ea06a56'
const base = `/sandboxes/${sid}`
function analytics(selection: InsightSelection): SandboxAnalytics {
  return {
    sandbox_id: sid,
    viewer_id: viewer,
    my_scope: 'all',
    presentation_mode: 'aggregate',
    dates: {
      period: selection.period,
      starts_on: '2026-06-01',
      ends_on: '2026-09-11',
      available: true,
    },
    available_groups: [{ group_id: group, display_name: 'Directors' }],
    selected_group_id: selection.group_id,
    current_contract: {
      as_of: '2026-09-11',
      state: 'on_track',
      hours_received: 8,
      hours_promised: 18,
      expected_hours: 9,
      expectation_available: true,
      coachees_on_track: { count: 4, total: 5 },
      coachees_unmeasurable: 0,
    },
    metrics: {
      sessions_held: 8,
      hours_received: 8,
      participation: { count: 5, total: 5 },
      agreed_outcomes: { count: 3, total: 5 },
    },
    weekly_series: [0, 1, 2, 3].map(n => ({
      starts_on: `2026-08-${String(1 + n * 7).padStart(2, '0')}`,
      ends_on: `2026-08-${String(7 + n * 7).padStart(2, '0')}`,
      sessions_held: 2,
      hours_received: 2,
      expected_hours: 2.25,
      cumulative_hours_received: (n + 1) * 2,
      cumulative_expected_hours: (n + 1) * 2.25,
    })),
    groups: [],
    coaches: [
      {
        user_id: coach,
        name: 'Morgan Taylor',
        sessions_held: 8,
        coachees_reached: 5,
      },
    ],
    upcoming: [],
    coverage: {
      sessions_held: 8,
      sessions_with_learning_evidence: 7,
      sessions_with_estimated_duration: 1,
      sessions_missing_date: 0,
      relationships_missing_hours: 0,
      learning_note: 'Recorded participation is not verified attendance.',
    },
    definitions: {
      sessions_held:
        'Distinct completed meetings in the applicable contract window.',
      hours_received: 'Hours credited to participating coachees.',
    },
  }
}
function detail(
  kind: SandboxEntityKind,
  selection: InsightSelection,
  external = false,
  personal = false,
): SandboxEntityDetail {
  const a = analytics(selection)
  if (personal) {
    a.my_scope = 'self'
    a.presentation_mode = 'personal'
  }
  return {
    sandbox_id: sid,
    sandbox_name: 'Meridian leadership coaching',
    viewer_id: viewer,
    my_scope: personal ? 'self' : 'all',
    presentation_mode: personal
      ? 'personal'
      : kind === 'client' && !external
        ? 'named'
        : 'aggregate',
    entity: {
      kind,
      id: kind === 'client' ? client : kind === 'coach' ? coach : group,
      name:
        kind === 'client'
          ? 'Alex Morgan'
          : kind === 'coach'
            ? 'Morgan Taylor'
            : 'Directors',
      subtitle:
        kind === 'client'
          ? 'Coachee · Directors'
          : kind === 'coach'
            ? 'Coach · 5 coaching relationships'
            : 'Leadership coaching · 5 coachees',
      active: true,
    },
    permissions: {
      can_generate_learning: !external || kind !== 'client',
      can_read_named_learning: !external,
      can_raise_concern: !external && !personal,
      can_manage_concerns: !external && !personal,
      can_manage_groups: !external && !personal,
    },
    selection,
    analytics: a,
    portfolio: kind === 'coach' ? a : null,
    relationships: [
      {
        member_id: client,
        user_id: viewer,
        name: 'Alex Morgan',
        group_id: group,
        group_name: 'Directors',
        coach_ids: [coach],
        coach_names: ['Morgan Taylor'],
        starts_on: '2026-06-01',
        ends_on: '2026-12-01',
        hours_received: 8,
        hours_promised: 18,
        state: 'on_track',
        current: true,
        last_activity_on: '2026-09-08',
        next_activity_on: '2026-09-15',
      },
      ...(kind === 'client'
        ? [
            {
              member_id: client,
              user_id: viewer,
              name: 'Alex Morgan',
              group_id: group,
              group_name: 'Previous leaders group',
              coach_ids: [coach],
              coach_names: ['Morgan Taylor'],
              starts_on: '2026-02-01',
              ends_on: '2026-05-31',
              hours_received: 4,
              hours_promised: 12,
              state: 'ended_short' as const,
              current: false,
              last_activity_on: '2026-05-15',
              next_activity_on: null,
            },
          ]
        : []),
    ],
    people: [
      {
        kind: 'coachee',
        member_id: client,
        user_id: viewer,
        name: 'Alex Morgan',
        active: true,
        href: `${base}/clients/${client}`,
      },
      ...(!personal
        ? [
            {
              kind: 'coach',
              member_id: coach,
              user_id: coach,
              name: 'Morgan Taylor',
              active: true,
              href: `${base}/coaches/${coach}`,
            },
          ]
        : []),
    ],
    available_clients: personal
      ? []
      : [
          { member_id: client, user_id: viewer, name: 'Alex Morgan' },
          { member_id: 'second', user_id: 'second', name: 'Sam Reeves' },
        ],
    available_coaches: [
      { user_id: coach, name: 'Morgan Taylor' },
      ...(!personal ? [{ user_id: 'second', name: 'Jordan Ellis' }] : []),
    ],
    outcomes: {
      sandbox_id: sid,
      today: '2026-09-11',
      window: null,
      can_reopen: false,
      max_per_coachee: 2,
      totals: {
        coachees: 1,
        sealed: 1,
        proposed: 0,
        changes_requested: 0,
        drafting: 0,
        none: 0,
      },
      coachees: [],
    },
    attention: [
      {
        id: 'follow-up',
        kind: 'no_next_session',
        severity: 'info',
        headline: 'Review the next coaching steps',
        detail: 'A recorded agreement is ready for discussion.',
        href: `${base}/clients/${client}?tab=outcomes`,
        member_id: client,
      },
    ],
    milestones: [],
    activity: {
      items: [
        {
          id: 'session-one',
          kind: 'session',
          occurred_at: '2026-09-08T10:00:00Z',
          title: 'Coaching session',
          detail: 'Morgan Taylor · Directors',
          status: 'completed',
          session_id: session,
          duration_minutes: 60,
          duration_estimated: false,
        },
      ],
      next_cursor: null,
    },
  }
}
async function mocked(
  page: Page,
  options: { external?: boolean; personal?: boolean; delayed?: boolean } = {},
) {
  const requests = {
    removeConcerns: () => {
      concerns = []
    },
    conflictNext: false,
    generations: [] as InsightSelection[],
    selections: [] as InsightSelection[],
    concernUpdates: [] as Record<string, unknown>[],
    release: () => {},
  }
  let concerns: Record<string, unknown>[] = []
  await page.route(`**/api/v1/sandboxes/${sid}/**`, async route => {
    const url = new URL(route.request().url())
    const pieces = url.pathname.split('/')
    const kind: SandboxEntityKind = pieces.includes('clients')
      ? 'client'
      : pieces.includes('coaches')
        ? 'coach'
        : 'group'
    const selection = {
      period: (url.searchParams.get('period') ??
        'term') as InsightSelection['period'],
      group_id: url.searchParams.get('group_id'),
      subject_member_id: url.searchParams.get('subject_member_id'),
      coach_user_id: url.searchParams.get('coach_user_id'),
      entity_kind: (url.searchParams.get('entity_kind') ??
        kind) as SandboxEntityKind,
    }
    if (
      url.pathname.endsWith('/concerns') &&
      route.request().method() === 'GET'
    )
      return route.fulfill({
        json: {
          items: concerns,
          available_owners: [{ user_id: viewer, name: 'E2E Admin' }],
          can_create: true,
        },
      })
    if (
      url.pathname.includes('/concerns') &&
      route.request().method() !== 'GET'
    ) {
      const input = route.request().postDataJSON()
      requests.concernUpdates.push(input)
      if (requests.conflictNext) {
        requests.conflictNext = false
        concerns = concerns.map(item => ({ ...item, revision: 2 }))
        return route.fulfill({
          status: 409,
          json: { detail: { code: 'stale_revision' } },
        })
      }
      const item = {
        id: 'concern-one',
        sandbox_id: sid,
        ...input,
        revision: 1,
        author_id: viewer,
        owner_id: viewer,
        author_name: 'E2E Admin',
        owner_name: 'E2E Admin',
        status: 'open',
        created_at: '2026-09-11T09:00:00Z',
        updated_at: '2026-09-11T09:00:00Z',
        resolution_note: null,
        resolved_at: null,
        history: [],
        can_edit: true,
        ...(concerns[0] ?? {}),
        ...input,
      }
      concerns = [item]
      return route.fulfill({ json: item })
    }
    if (url.pathname.endsWith('/attributions'))
      return route.fulfill({ json: { items: [] } })
    if (url.pathname.includes('/insights')) {
      const sel =
        route.request().method() === 'POST'
          ? (route.request().postDataJSON() as InsightSelection)
          : selection
      if (route.request().method() === 'POST') requests.generations.push(sel)
      return route.fulfill({
        json: {
          sandbox_id: sid,
          viewer_id: viewer,
          my_scope: options.personal ? 'self' : 'all',
          presentation_mode: options.personal
            ? 'personal'
            : sel.entity_kind === 'client'
              ? 'named'
              : 'aggregate',
          selected_group_id: sel.group_id ?? null,
          selected_subject_member_id: sel.subject_member_id ?? null,
          selected_coach_user_id: sel.coach_user_id ?? null,
          selected_entity_kind: sel.entity_kind ?? null,
          dates: analytics(sel).dates,
          status:
            route.request().method() === 'POST' ? 'queued' : 'never_generated',
          run: null,
          result: null,
          generated_at: null,
          stale: false,
          can_generate: true,
        },
      })
    }
    if (url.pathname.includes('/sessions/'))
      return route.fulfill({
        json: {
          session_id: session,
          label: 'Coaching session',
          status: 'completed',
          started_at: '2026-09-08T10:00:00Z',
          scheduled_for: null,
          coach: { user_id: coach, name: 'Morgan Taylor' },
          participants: [
            { member_id: client, user_id: viewer, name: 'Alex Morgan' },
          ],
          group_ids: [group],
          duration_minutes: 60,
          duration_estimated: false,
          learning_available: !options.external,
          learning_note: options.external
            ? 'Named learning is unavailable in this view.'
            : 'Supported work themes from eligible evidence.',
          learning_fields: options.external
            ? []
            : [
                {
                  label: 'Delegation',
                  text: 'This session contains a supported delegation theme.',
                },
              ],
          full_session_href: options.external ? null : `/sessions/${session}`,
        },
      })
    if (url.pathname.endsWith('/activity'))
      return route.fulfill({
        json: detail(selection.entity_kind, selection).activity,
      })
    requests.selections.push(selection)
    if (options.delayed)
      await new Promise<void>(resolve => {
        requests.release = resolve
      })
    return route.fulfill({
      json: detail(kind, selection, options.external, options.personal),
    })
  })
  return requests
}

test.describe('Sandbox entity details', () => {
  test('client filters persist, generation stays explicit, sessions open a scoped drawer', async ({
    page,
  }) => {
    const state = await mocked(page)
    await login(page, USERS.admin.email)
    await page.goto(`${base}/clients/${client}`)
    await expect(
      page.getByRole('heading', { name: 'Alex Morgan', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText('Previous coaching relationships', { exact: true }),
    ).toBeVisible()
    await page.getByLabel('Reporting period').selectOption('30d')
    await page.getByLabel('Coach', { exact: true }).selectOption(coach)
    await expect(page).toHaveURL(/period=30d.*coach_user_id=/)
    expect(state.generations).toHaveLength(0)
    await page
      .getByRole('button', { name: 'Generate insights', exact: true })
      .click()
    await expect.poll(() => state.generations.length).toBe(1)
    expect(state.generations[0]).toMatchObject({
      subject_member_id: client,
      coach_user_id: coach,
      entity_kind: 'client',
      period: '30d',
    })
    await page.getByRole('tab', { name: 'Activity', exact: true }).click()
    await page
      .getByRole('button', { name: /Coaching session.*Morgan Taylor/ })
      .click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(
      page.getByText('This session contains a supported delegation theme.'),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Open full session' }),
    ).toHaveAttribute('href', `/sessions/${session}`)
    await page.keyboard.press('Escape')
    await page.reload()
    await expect(page.getByRole('tab', { name: 'Activity' })).toHaveAttribute(
      'data-state',
      'active',
    )
    expect(state.generations).toHaveLength(1)
  })
  test('external client detail exposes delivery and outcomes without named learning or concerns', async ({
    page,
  }) => {
    await mocked(page, { external: true })
    await login(page, USERS.admin.email)
    await page.goto(`${base}/clients/${client}`)
    await expect(
      page.getByRole('heading', { name: 'Alex Morgan', exact: true }),
    ).toBeVisible()
    await expect(page.getByTestId('sandbox-concerns')).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Generate insights' }),
    ).toHaveCount(0)
    await page.getByRole('tab', { name: 'Activity' }).click()
    await page
      .getByRole('button', { name: /Coaching session.*Morgan Taylor/ })
      .click()
    await expect(
      page.getByText('Named learning is unavailable in this view.'),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Open full session' }),
    ).toHaveCount(0)
  })
  test('coach filters retain aggregate mode and chart meetings rather than a coach quota', async ({
    page,
  }) => {
    const state = await mocked(page)
    await login(page, USERS.admin.email)
    await page.goto(`${base}/coaches/${coach}`)
    await expect(
      page.getByRole('heading', { name: 'Morgan Taylor', exact: true }),
    ).toBeVisible()
    await expect(page.getByText('Assigned coachees on track')).toBeVisible()
    await expect(page.getByLabel('Chart view')).toHaveValue('cumulative')
    await page.getByLabel('Coachee', { exact: true }).selectOption(client)
    await page
      .getByRole('button', { name: 'Generate insights', exact: true })
      .click()
    await expect.poll(() => state.generations.length).toBe(1)
    expect(state.generations[0]).toMatchObject({
      entity_kind: 'coach',
      subject_member_id: client,
      coach_user_id: coach,
    })
    await page.getByText('View chart data table', { exact: true }).click()
    await expect(
      page.getByRole('columnheader', { name: 'Cumulative sessions' }),
    ).toBeVisible()
    await expect(
      page.getByRole('columnheader', { name: 'Expected', exact: true }),
    ).toHaveCount(0)
    await page.getByRole('tab', { name: 'Coachees' }).click()
    await expect(
      page.getByRole('link', { name: 'Alex Morgan', exact: true }),
    ).toHaveAttribute('href', `${base}/clients/${client}`)
  })
  test('concerns require recorded text and a resolution note and preserve revisions', async ({
    page,
  }) => {
    const state = await mocked(page)
    await login(page, USERS.admin.email)
    await page.goto(`${base}/groups/${group}`)
    await page
      .getByRole('button', { name: 'Raise a concern', exact: true })
      .click()
    await page
      .getByLabel('Title', { exact: true })
      .fill('Confirm the next session')
    await page
      .getByLabel('What needs attention?')
      .fill('The next agreed session has not been scheduled.')
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Raise concern', exact: true })
      .click()
    await expect(
      page.getByRole('heading', { name: 'Confirm the next session' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Manage concern' }).click()
    await page.getByLabel('Status', { exact: true }).selectOption('resolved')
    await expect(page.getByLabel('Resolution note')).toHaveAttribute(
      'required',
      '',
    )
    await page
      .getByLabel('Resolution note')
      .fill('The coach confirmed a date with the client.')
    await page
      .getByRole('button', { name: 'Save concern', exact: true })
      .click()
    await expect.poll(() => state.concernUpdates.length).toBe(2)
    expect(state.concernUpdates[1]).toMatchObject({
      revision: 1,
      status: 'resolved',
      resolution_note: 'The coach confirmed a date with the client.',
    })
    await page.getByLabel('Show resolved concerns').check()
    await expect(
      page.getByText('Resolution: The coach confirmed a date with the client.'),
    ).toBeVisible()
  })
  test('an open concern is removed when the viewer loses ownership and conflicts refresh the revision', async ({
    page,
  }) => {
    const state = await mocked(page)
    await login(page, USERS.admin.email)
    await page.goto(`${base}/groups/${group}`)
    await page
      .getByRole('button', { name: 'Raise a concern', exact: true })
      .click()
    await page.getByLabel('Title', { exact: true }).fill('Private follow-up')
    await page
      .getByLabel('What needs attention?')
      .fill('This recorded concern belongs to its current owner.')
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Raise concern', exact: true })
      .click()
    await page.getByRole('button', { name: 'Manage concern' }).click()
    state.conflictNext = true
    await page
      .getByRole('button', { name: 'Save concern', exact: true })
      .click()
    await expect(page.getByRole('alert')).toBeVisible()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Manage concern' }).click()
    await page
      .getByRole('button', { name: 'Save concern', exact: true })
      .click()
    await expect.poll(() => state.concernUpdates.length).toBe(3)
    expect(state.concernUpdates[2]).toMatchObject({ revision: 2 })
    await page.getByRole('button', { name: 'Manage concern' }).click()
    state.removeConcerns()
    await page.evaluate(() =>
      window.dispatchEvent(new Event('visibilitychange')),
    )
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(
      page.getByText('This recorded concern belongs to its current owner.'),
    ).toHaveCount(0)
  })
  test('self-scoped group page omits peer options and keeps personal generation', async ({
    page,
  }) => {
    const state = await mocked(page, { personal: true })
    await login(page, USERS.admin.email)
    await page.goto(`${base}/groups/${group}`)
    await expect(
      page.getByRole('heading', { name: 'Your coaching at a glance' }),
    ).toBeVisible()
    await expect(page.getByLabel('Coachee', { exact: true })).toHaveCount(0)
    await expect(page.getByTestId('sandbox-concerns')).toHaveCount(0)
    await page
      .getByRole('button', { name: 'Generate insights', exact: true })
      .click()
    await expect.poll(() => state.generations.length).toBe(1)
    await page.getByRole('tab', { name: 'People' }).click()
    await expect(
      page.getByRole('link', { name: 'Alex Morgan', exact: true }),
    ).toBeVisible()
    await expect(page.getByText('Sam Reeves')).toHaveCount(0)
  })
  test('changing effective viewer closes the session drawer and withholds stale detail', async ({
    page,
  }) => {
    await mocked(page)
    await login(page, USERS.admin.email)
    await page.goto(`${base}/clients/${client}`)
    await page.getByRole('tab', { name: 'Activity' }).click()
    await page
      .getByRole('button', { name: /Coaching session.*Morgan Taylor/ })
      .click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.route(`**/api/v1/sandboxes/${sid}/clients/**`, route =>
      route.fulfill({ status: 404, json: { detail: 'Not found' } }),
    )
    await page.evaluate(() => {
      sessionStorage.setItem('view_as_coach_id', 'other-viewer')
      window.dispatchEvent(new Event('storage'))
    })
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(
      page.getByRole('heading', { name: 'This page is unavailable' }),
    ).toBeVisible()
    await expect(
      page.getByText('This session contains a supported delegation theme.'),
    ).toHaveCount(0)
  })
  test('manual client selection shows a batched sandbox marker and date-aware assignment', async ({
    page,
  }) => {
    const batches: { client_ids: string[]; on_date?: string }[] = []
    await page.route('**/clients/simple*', route =>
      route.fulfill({
        json: {
          clients: [
            { id: client, name: 'Alex Morgan', email: 'alex@example.invalid' },
            {
              id: 'second-client',
              name: 'Sam Reeves',
              email: 'sam@example.invalid',
            },
          ],
          total: 2,
        },
      }),
    )
    await page.route('**/sandboxes/client-contexts', route => {
      const input = route.request().postDataJSON()
      batches.push(input)
      return route.fulfill({
        json: {
          clients: input.client_ids.map((id: string) => ({
            client_id: id,
            contexts:
              id === client
                ? [
                    {
                      sandbox_id: sid,
                      sandbox_name: 'Meridian leadership coaching',
                      group_id: group,
                      group_name: 'Directors',
                      member_id: client,
                      starts_on: '2026-01-01',
                      ends_on: '2027-01-01',
                    },
                  ]
                : [],
          })),
        },
      })
    })
    // Markers are only requested for a viewer who is in a sandbox.
    await page.route('**/sandboxes/mine*', route =>
      route.fulfill({ json: { sandboxes: [], total: 1 } }),
    )
    await login(page, USERS.admin.email)
    await page.goto(`/sessions/create/manual?clientId=${client}`)
    await expect(page.getByTestId('sandbox-assignment-hint')).toContainText(
      'Counts toward Meridian leadership coaching',
    )
    await expect
      .poll(() => batches.some(batch => batch.client_ids.length === 2))
      .toBe(true)
    await expect.poll(() => batches.some(batch => batch.on_date)).toBe(true)
    await page.getByRole('combobox').first().click()
    await expect(
      page.getByRole('option', { name: /Alex Morgan.*Sandbox/ }),
    ).toBeVisible()
  })
  test('ambiguous session assignments stay uncredited until an explicit revisioned choice', async ({
    page,
  }) => {
    await mocked(page)
    let saved: Record<string, unknown> | undefined
    let resolved = false
    const item = () => ({
      id: 'attribution-one',
      session_id: session,
      member_id: client,
      subject_user_id: viewer,
      subject_name: 'Alex Morgan',
      started_on: '2026-09-07',
      scheduled_on: '2026-09-06',
      status: resolved ? 'assigned' : 'needs_review',
      revision: 3,
      group_id: resolved ? group : null,
      client_ids: [client],
      can_resolve: true,
      candidates: [
        {
          sandbox_id: sid,
          sandbox_name: 'Meridian leadership coaching',
          group_id: group,
          group_name: 'Directors',
          member_id: client,
        },
      ],
    })
    await page.route(new RegExp(`/sandboxes/${sid}/attributions`), route => {
      if (route.request().method() === 'PATCH') {
        saved = route.request().postDataJSON()
        resolved = true
        return route.fulfill({ json: item() })
      }
      return route.fulfill({ json: { items: [item()] } })
    })
    await login(page, USERS.admin.email)
    await page.goto(`${base}/groups/${group}`)
    await expect(page.getByTestId('session-attribution')).toContainText(
      'Alex Morgan: Sandbox assignment needs review.',
    )
    await expect(page.getByTestId('session-attribution')).toContainText(
      '7 Sep 2026',
    )
    await expect(page.getByTestId('session-attribution')).toContainText(
      'Choose which agreement should receive this session’s coaching hours.',
    )
    await expect(
      page.getByRole('button', { name: 'Confirm assignment' }),
    ).toBeDisabled()
    await page
      .getByLabel('Count this coaching toward', { exact: true })
      .selectOption(group)
    await page
      .getByLabel('Reason', { exact: true })
      .fill('This was the agreed Directors session.')
    await page.getByRole('button', { name: 'Confirm assignment' }).click()
    await expect
      .poll(() => saved)
      .toMatchObject({
        revision: 3,
        group_id: group,
        exclude: false,
        reason: 'This was the agreed Directors session.',
      })
    await expect(page.getByTestId('session-attribution')).toContainText(
      'Counts toward Meridian leadership coaching · Directors',
    )
    await page.getByRole('button', { name: 'Review assignment' }).click()
    await expect(
      page.getByLabel('Count this coaching toward', { exact: true }),
    ).toHaveValue(group)
  })
  test('all three pages retain usable tabs, charts and layout at review widths in both themes', async ({
    page,
  }) => {
    await mocked(page)
    await login(page, USERS.admin.email)
    for (const kind of ['client', 'coach', 'group'] as const) {
      const path =
        kind === 'client'
          ? `clients/${client}`
          : kind === 'coach'
            ? `coaches/${coach}`
            : `groups/${group}`
      await page.goto(`${base}/${path}`)
      await expect(page.getByTestId('sandbox-entity-detail')).toHaveAttribute(
        'data-kind',
        kind,
      )
      await hideDevtools(page)
      for (const width of [1440, 1280, 390])
        for (const theme of ['light', 'dark']) {
          await page.setViewportSize({ width, height: 1000 })
          await page.evaluate(value => {
            document.documentElement.classList.toggle('dark', value === 'dark')
            document.documentElement.style.colorScheme = value
          }, theme)
          await expect(
            page.getByRole('tab', { name: 'Overview', exact: true }),
          ).toBeVisible()
          await expect
            .poll(() =>
              page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
              ),
            )
            .toBe(true)
          await page.screenshot({
            path: `test-results/entity-${kind}-${width}-${theme}.png`,
            fullPage: true,
          })
        }
    }
  })
})
