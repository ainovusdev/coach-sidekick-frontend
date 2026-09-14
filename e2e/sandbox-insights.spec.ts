import { expect, test, type Page } from '@playwright/test'
import { API, USERS, apiToken, auth, hideDevtools, login } from './helpers'
import type { SandboxAnalytics } from '../src/types/sandbox-analytics'
import type { SandboxInsights } from '../src/types/sandbox-insights'
import type { CoacheeDelivery } from '../src/types/sandbox-delivery'

// API state fixtures exercise the UI without invoking a model or altering review data.
let sandboxId = ''
let viewerId = ''
const groupId = 'c5a52f6c-a2c3-4c15-8750-6c15bc3a52d0'
const coachee: CoacheeDelivery = {
  member_id: 'c5a52f6c-a2c3-4c15-8750-6c15bc3a52d1',
  user_id: 'c5a52f6c-a2c3-4c15-8750-6c15bc3a52d2',
  name: 'Rowan Hale',
  email: 'rowan@example.invalid',
  client_ids: [],
  delivered: {
    sessions: 9,
    minutes: 540,
    hours: 9,
    first_on: '2026-06-03',
    last_on: '2026-09-08',
    next_scheduled_on: null,
    in_flight: 0,
  },
  pace: {
    state: 'on_track',
    expected_sessions: 18,
    expected_by_today: 9,
    delivered_sessions: 9,
    remaining_sessions: 9,
    hours_promised: 18,
    hours_delivered: 9,
    hours_remaining: 9,
    elapsed_fraction: 0.5,
    tolerance: 1,
    variance: 0,
    sentence: 'On track: 9 of 18 hours received.',
  },
}
function analytics(personal = false): SandboxAnalytics {
  return {
    sandbox_id: sandboxId,
    viewer_id: viewerId,
    my_scope: personal ? 'self' : 'all',
    presentation_mode: personal ? 'personal' : 'aggregate',
    dates: {
      period: 'term',
      starts_on: '2026-06-01',
      ends_on: '2026-09-10',
      available: true,
    },
    available_groups: [{ group_id: groupId, display_name: 'Directors' }],
    selected_group_id: null,
    current_contract: {
      as_of: '2026-09-10',
      state: 'on_track',
      hours_received: 45,
      hours_promised: 90,
      expected_hours: 48,
      expectation_available: true,
      coachees_on_track: { count: 4, total: 5 },
      coachees_unmeasurable: 0,
    },
    metrics: {
      sessions_held: 45,
      hours_received: 45,
      participation: { count: 5, total: 5 },
      agreed_outcomes: { count: 3, total: 5 },
    },
    weekly_series: [
      {
        starts_on: '2026-06-01',
        ends_on: '2026-06-07',
        hours_received: 4,
        expected_hours: 5,
        cumulative_hours_received: 4,
        cumulative_expected_hours: 5,
      },
      {
        starts_on: '2026-06-08',
        ends_on: '2026-06-14',
        hours_received: 8,
        expected_hours: 5,
        cumulative_hours_received: 12,
        cumulative_expected_hours: 10,
      },
    ],
    groups: [
      {
        group_id: groupId,
        display_name: 'Directors',
        sessions_held: 45,
        hours_received: 45,
        hours_promised: 90,
        coachees_on_track: { count: 4, total: 5 },
        yet_to_start: 1,
        last_activity_on: '2026-09-08',
        next_activity_on: '2026-09-13',
        state: 'on_track',
        coachees: personal ? [] : [coachee],
      },
    ],
    coaches: [
      {
        user_id: 'coach',
        name: 'Morgan Taylor',
        sessions_held: 45,
        coachees_reached: 5,
      },
    ],
    upcoming: [],
    coverage: {
      sessions_held: 45,
      sessions_with_learning_evidence: 40,
      sessions_with_estimated_duration: 2,
      sessions_missing_date: 0,
      relationships_missing_hours: 0,
      learning_note: 'Recorded participation is not verified attendance.',
    },
    definitions: {
      sessions_held:
        'Distinct completed meetings in the contract window, no later than today.',
    },
  }
}
function insights(
  status: SandboxInsights['status'] = 'never_generated',
  personal = false,
): SandboxInsights {
  return {
    sandbox_id: sandboxId,
    viewer_id: viewerId,
    my_scope: personal ? 'self' : 'all',
    presentation_mode: personal ? 'personal' : 'aggregate',
    dates: analytics().dates,
    selected_group_id: null,
    status,
    run: null,
    result: null,
    generated_at: null,
    stale: status === 'stale',
    can_generate: true,
    ...(['ready', 'stale', 'failed'].includes(status)
      ? {
          generated_at: '2026-09-10T10:00:00Z',
          result: {
            presentation_mode: personal
              ? ('personal' as const)
              : ('aggregate' as const),
            status: 'ready' as const,
            starts_on: '2026-06-01',
            ends_on: '2026-09-10',
            findings: [
              {
                id: 'delegation:working_on',
                theme: 'delegation',
                title: personal
                  ? 'Your delegation practice'
                  : 'Shared delegation work',
                kind: 'working_on' as const,
                description: personal
                  ? 'You discussed delegation as a focus for work.'
                  : 'Participants discussed delegation as a focus for work.',
                sessions: 6,
                coachees: personal ? 1 : 3,
                starts_on: '2026-06-01',
                ends_on: '2026-09-10',
                trend: null,
              },
            ],
            suggestions: [
              {
                theme: 'delegation',
                description:
                  'Discuss one delegation experiment for the next week.',
                outcome_refs: [],
                outcome_note: null,
                destination: 'timeline' as const,
              },
            ],
            coverage: {
              sessions: 6,
              coachees: personal ? 1 : 3,
              minimum_support: personal ? 1 : 3,
            },
            limitation: 'Reported experience, not measured improvement.',
            extraction_version: 'test',
          },
        }
      : {}),
  }
}
async function mockReporting(
  page: Page,
  state: {
    current: SandboxInsights
    personal?: boolean
    posts: number
    gets: string[]
    deny?: boolean
    delayPost?: Promise<void>
    delayGet?: Promise<void>
  },
) {
  await page.route(`**/sandboxes/${sandboxId}/analytics?*`, async route => {
    const query = new URL(route.request().url()).searchParams
    const data = analytics(state.personal)
    data.dates.period = (query.get('period') ||
      'term') as SandboxAnalytics['dates']['period']
    data.selected_group_id = query.get('group_id')
    if (query.get('period') === '30d') data.metrics.sessions_held = 7
    await route.fulfill({
      status: state.deny ? 403 : 200,
      json: state.deny ? { detail: 'forbidden' } : data,
    })
  })
  await page.route(
    new RegExp(`/sandboxes/${sandboxId}/insights(?:[?]|/|$)`),
    async route => {
      if (route.request().method() === 'POST') {
        state.posts++
        if (state.delayPost) await state.delayPost
        const selection = route.request().postDataJSON()
        state.current = {
          ...insights('queued', state.personal),
          dates: { ...analytics().dates, period: selection.period },
          selected_group_id: selection.group_id,
          run: {
            id: 'run',
            status: 'queued',
            progress_done: 0,
            progress_total: 6,
            attempts: 0,
            failure_code: null,
            created_at: '2026-09-10T10:00:00Z',
            completed_at: null,
          },
        }
      } else {
        state.gets.push(route.request().url())
        if (state.delayGet) await state.delayGet
      }
      const query = new URL(route.request().url()).searchParams
      await route.fulfill({
        status: state.deny ? 403 : 200,
        json: state.deny
          ? { detail: 'forbidden' }
          : {
              ...state.current,
              dates: {
                ...state.current.dates,
                period: query.get('period') || state.current.dates.period,
              },
              selected_group_id: query.get('group_id'),
            },
      })
    },
  )
}

test.describe.serial('Sandbox delivery and learning', () => {
  test.beforeAll(async ({ request }) => {
    const token = await apiToken(request, USERS.admin.email)
    viewerId = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString(),
    ).sub
    const response = await request.post(`${API}/sandboxes/`, {
      headers: auth(token),
      data: {
        name: 'E2E Insights',
        organisation: 'Insights Workshop',
        term_start: '2026-06-01',
        term_months: 6,
      },
    })
    expect(response.status()).toBe(201)
    sandboxId = (await response.json()).sandbox.id
    await request.post(`${API}/sandboxes/${sandboxId}/members`, {
      headers: auth(token),
      data: {
        side: 'theirs',
        roles: ['primary_client'],
        email: USERS.dana.email,
        name: USERS.dana.name,
      },
    })
  })

  test('deep links and URL filters fetch without generating; Today remains contract to date', async ({
    page,
  }) => {
    const state = { current: insights(), posts: 0, gets: [] as string[] }
    await mockReporting(page, state)
    await login(page, USERS.admin.email)
    await page.goto(`/admin/sandboxes/${sandboxId}?keep=1#insights`)
    await expect(page.getByTestId('sandbox-tab-insights')).toHaveAttribute(
      'data-state',
      'active',
    )
    await expect(page.getByTestId('analytics-sessions')).toContainText('45')
    await page.getByLabel('Reporting period').selectOption('30d')
    await page.getByLabel('Reporting group').selectOption(groupId)
    await expect(page).toHaveURL(/keep=1&period=30d&group_id=/)
    await expect(page.getByTestId('analytics-sessions')).toContainText('7')
    expect(state.posts).toBe(0)
    await page.reload()
    await expect(page.getByLabel('Reporting period')).toHaveValue('30d')
    await expect(page.getByLabel('Reporting group')).toHaveValue(groupId)
    await page.getByTestId('sandbox-tab-today').click()
    await expect(page.getByTestId('analytics-sessions')).toContainText('45')
    expect(state.posts).toBe(0)
  })

  test('group coachees link to their client pages', async ({ page }) => {
    const state = { current: insights(), posts: 0, gets: [] as string[] }
    await mockReporting(page, state)
    await login(page, USERS.admin.email)
    await page.goto(`/admin/sandboxes/${sandboxId}#insights`)
    const group = page.getByTestId('analytics-group')
    await group.getByText('45 sessions held').click()
    const person = group.getByRole('link', { name: 'Rowan Hale' })
    const href = `/sandboxes/${sandboxId}/clients/${coachee.member_id}`
    await expect(person).toHaveAttribute('href', href)
    await person.click()
    await expect(page).toHaveURL(new RegExp(`${href}$`))
  })

  test('explicit generation survives navigation and shares its ready preview', async ({
    page,
  }) => {
    const state = { current: insights(), posts: 0, gets: [] as string[] }
    await mockReporting(page, state)
    await login(page, USERS.admin.email)
    await page.goto(`/admin/sandboxes/${sandboxId}`)
    await page.getByTestId('generate-insights').click()
    await expect(page.getByTestId('insight-state')).toContainText('queued')
    await page.getByTestId('sandbox-tab-insights').click()
    await expect(page.getByTestId('generate-insights')).toBeDisabled()
    expect(state.posts).toBe(1)
    state.current = insights('ready')
    if (state.current.result)
      state.current.result.findings.push({
        ...state.current.result.findings[0],
        id: 'delegation:barrier',
        kind: 'barrier',
      })
    await expect(page.getByTestId('learning-finding').first()).toContainText(
      'Shared delegation work',
    )
    await page.getByTestId('sandbox-tab-today').click()
    await expect(page.getByTestId('learning-preview')).toContainText(
      'Shared delegation work',
    )
    await expect(
      page.getByTestId('learning-preview').getByTestId('learning-finding'),
    ).toHaveCount(1)
    expect(state.posts).toBe(1)
  })

  test('stale and failed results retain evidence; invalidation and access denial remove it', async ({
    page,
  }) => {
    const state = {
      current: insights('stale'),
      posts: 0,
      gets: [] as string[],
      deny: false,
    }
    await mockReporting(page, state)
    await login(page, USERS.admin.email)
    await page.goto(`/admin/sandboxes/${sandboxId}#insights`)
    await expect(page.getByTestId('learning-panel')).toContainText(
      'reporting period or evidence has changed',
    )
    await expect(page.getByTestId('learning-finding')).toBeVisible()
    state.current = insights('failed')
    await page.reload()
    await expect(page.getByTestId('learning-finding')).toBeVisible()
    await expect(page.getByTestId('generate-insights')).toHaveText(
      'Retry insights',
    )
    state.current = insights('invalidated')
    // Even an unexpected invalidated envelope carrying old content must withhold it.
    state.current.result = insights('ready').result
    await page.reload()
    await expect(page.getByTestId('insight-state')).toContainText(
      'no longer match',
    )
    await expect(page.getByTestId('learning-finding')).toHaveCount(0)
    state.deny = true
    await page.reload()
    await expect(page.getByTestId('insights-panel')).toContainText(
      'may no longer be accessible',
    )
    await expect(page.getByTestId('learning-finding')).toHaveCount(0)
    await expect(page.getByTestId('generate-insights')).toHaveCount(0)
  })

  test('personal presentation is server authoritative and never shows peer comparisons', async ({
    page,
  }) => {
    const state = {
      current: insights('ready', true),
      personal: true,
      posts: 0,
      gets: [] as string[],
    }
    await mockReporting(page, state)
    // Mixed-role behavior: admin chrome does not determine presentation mode.
    await login(page, USERS.admin.email)
    await page.goto(`/admin/sandboxes/${sandboxId}#insights`)
    await expect(
      page.getByRole('heading', { name: 'Your coaching and learning' }),
    ).toBeVisible()
    await expect(
      page.getByText('What you have been working on', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText('Your delegation practice', { exact: true }),
    ).toBeVisible()
    await expect(page.getByLabel('Delivery comparisons')).toHaveCount(0)
    await expect(page.getByText('Morgan Taylor')).toHaveCount(0)
    await expect(page.getByText('Shared delegation work')).toHaveCount(0)
    await expect(page.getByText('Ideas for your next session')).toBeVisible()
    await expect(
      page.getByText('Changes you have described', { exact: true }),
    ).toBeVisible()
    await expect(page.getByTestId('learning-panel')).toContainText(
      'does not yet support a finding about reported changes',
    )
    await expect(page.getByTestId('learning-panel')).toContainText(
      'does not yet support a finding about recurring barriers',
    )
    state.current = insights('insufficient_evidence', true)
    await page.reload()
    await expect(page.getByTestId('learning-panel')).toContainText(
      'not enough attributable learning evidence',
    )
    await expect(page.getByTestId('analytics-sessions')).toBeVisible()
  })

  test('a pending request cannot move into another reporting selection', async ({
    page,
  }) => {
    let release = () => {}
    const state = {
      current: insights(),
      posts: 0,
      gets: [] as string[],
      delayPost: new Promise<void>(resolve => {
        release = resolve
      }),
    }
    await mockReporting(page, state)
    await login(page, USERS.admin.email)
    await page.goto(`/admin/sandboxes/${sandboxId}#insights`)
    await page.getByLabel('Reporting period').selectOption('30d')
    await page.getByTestId('generate-insights').click()
    await expect.poll(() => state.posts).toBe(1)
    await page.getByLabel('Reporting period').selectOption('90d')
    await expect(page.getByTestId('generate-insights')).toBeEnabled()
    release()
    await expect(page.getByTestId('insight-state')).toHaveAttribute(
      'data-state',
      'never_generated',
    )
    expect(state.posts).toBe(1)
  })

  test('effective account changes clear the previous narrative while fetching', async ({
    page,
  }) => {
    let release = () => {}
    const state: {
      current: SandboxInsights
      personal: boolean
      posts: number
      gets: string[]
      delayGet?: Promise<void>
    } = { current: insights('ready'), personal: false, posts: 0, gets: [] }
    await mockReporting(page, state)
    await login(page, USERS.admin.email)
    await page.goto(`/admin/sandboxes/${sandboxId}#insights`)
    await expect(page.getByTestId('learning-finding')).toContainText(
      'Shared delegation work',
    )
    state.personal = true
    state.current = insights('ready', true)
    state.delayGet = new Promise<void>(resolve => {
      release = resolve
    })
    await page.evaluate(() => {
      sessionStorage.setItem('view_as_coach_id', 'test-effective-viewer')
      window.dispatchEvent(new Event('storage'))
    })
    await expect(page.getByText('Shared delegation work')).toHaveCount(0)
    await expect(page.getByTestId('learning-panel')).toContainText(
      'Loading learning insights',
    )
    release()
    await expect(page.getByTestId('learning-finding')).toContainText(
      'Your delegation practice',
    )
    await expect(page.getByText('Shared delegation work')).toHaveCount(0)
    expect(state.posts).toBe(0)
  })

  test('charts have a data table and controls work by keyboard at narrow widths', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    const state = { current: insights('ready'), posts: 0, gets: [] as string[] }
    await mockReporting(page, state)
    await login(page, USERS.dana.email)
    await page.goto(`/sandboxes/${sandboxId}#insights`)
    await hideDevtools(page)
    await page.getByText('View chart data table', { exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(
      page.getByRole('table', {
        name: 'Weekly and cumulative coaching hours in the selected period',
      }),
    ).toBeVisible()
    await page.getByLabel('Chart view').selectOption('weekly')
    await expect(
      page.getByRole('img', { name: /Weekly coaching hours/ }),
    ).toBeVisible()
    await page.getByLabel('Compare').selectOption('coaches')
    await expect(
      page.getByRole('table', { name: 'Coach activity' }),
    ).toContainText('Morgan Taylor')
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
        await expect
          .poll(async () => {
            const chart = await page
              .getByRole('img', { name: /Weekly coaching hours/ })
              .boundingBox()
            const svg = await page
              .locator('.recharts-wrapper > svg.recharts-surface')
              .boundingBox()
            return !!chart && !!svg && Math.abs(chart.width - svg.width) <= 1
          })
          .toBe(true)
        const panelBounds = await page
          .getByTestId('insights-panel')
          .boundingBox()
        expect(panelBounds).not.toBeNull()
        expect(panelBounds!.x).toBeGreaterThanOrEqual(0)
        expect(panelBounds!.x + panelBounds!.width).toBeLessThanOrEqual(
          width + 1,
        )
        await page.getByTestId('sandbox-tabs').scrollIntoViewIfNeeded()
        await page.screenshot({
          path: `test-results/insights-${width}-${theme}.png`,
          fullPage: true,
        })
      }
    }
    expect(state.posts).toBe(0)
    expect(errors).toEqual([])
  })
})
