import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test'
import { API, USERS, apiToken, auth, invitationToken, login } from './helpers'

/**
 * Phase 4 — gold sealing + the notification bell.
 *
 * Fixture "E2E Gold Seal": Marcus coaches Tariq in one group with Dana as
 * supervisor (so Dana is Tariq's approver); Priya coaches Wren in "Leads"
 * with no supervisor (so the primary client, Omar, approves). The term
 * started ten days ago, which puts gold sealing in its open window.
 */
test.describe.configure({ mode: 'serial' })

const NAME = 'E2E Gold Seal'
const ORG = 'PTG'
const TARIQ = { email: 'e2e-tariq-gold@ptg-e2e.com', name: 'Tariq Osei' }
const WREN = { email: 'e2e-wren-gold@ptg-e2e.com', name: 'Wren Adler' }

let sandboxId = ''
let tariqMemberId = ''
let tariqClientId = ''

function localDay(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function termStart(): string {
  const d = new Date()
  d.setDate(d.getDate() - 10)
  return localDay(d)
}

async function api(
  request: APIRequestContext,
  token: string,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
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

function tariqBlock(page: Page) {
  return page.getByTestId('outcome-coachee').filter({ hasText: TARIQ.name })
}

test.describe('Sandboxes — gold sealing', () => {
  test('builds the fixture', async ({ request }) => {
    const token = await apiToken(request, USERS.admin.email)
    const created = await api(request, token, 'post', '/sandboxes/', {
      name: NAME,
      organisation: ORG,
      term_start: termStart(),
      term_months: 6,
    })
    sandboxId = created.sandbox.id
    const marcus = (
      await api(request, token, 'get', '/sandboxes/people/search?q=marcus')
    )[0]
    const priya = (
      await api(request, token, 'get', '/sandboxes/people/search?q=priya')
    )[0]
    await api(request, token, 'post', `/sandboxes/${sandboxId}/members`, {
      side: 'theirs',
      roles: ['primary_client_admin'],
      email: USERS.omar.email,
      name: USERS.omar.name,
    })
    const dana = await api(
      request,
      token,
      'post',
      `/sandboxes/${sandboxId}/members`,
      {
        side: 'theirs',
        roles: ['supervisor'],
        email: USERS.dana.email,
        name: USERS.dana.name,
      },
    )
    await api(request, token, 'post', `/sandboxes/${sandboxId}/groups`, {
      coach_user_ids: [marcus.id],
      coachees: [TARIQ],
      hours_per_coachee: 12,
      supervisor_member_ids: [dana.id],
    })
    await api(request, token, 'post', `/sandboxes/${sandboxId}/groups`, {
      name: 'Leads',
      coach_user_ids: [priya.id],
      coachees: [WREN],
    })

    const outcomes = await api(
      request,
      token,
      'get',
      `/sandboxes/${sandboxId}/outcomes`,
    )
    expect(outcomes.window.state).toBe('current')
    expect(outcomes.totals.coachees).toBe(2)
    const tariq = outcomes.coachees.find(
      (c: { email: string }) => c.email === TARIQ.email,
    )
    tariqMemberId = tariq.member_id
    expect(tariq.approver_names).toEqual([USERS.dana.name])
    const wren = outcomes.coachees.find(
      (c: { email: string }) => c.email === WREN.email,
    )
    expect(wren.approver_names).toEqual([USERS.omar.name])

    // Marcus's client row for Tariq (for the client-profile card later)
    const marcusToken = await apiToken(request, USERS.marcus.email)
    const clients = await api(
      request,
      marcusToken,
      'get',
      `/clients/?search=${encodeURIComponent(TARIQ.email)}&per_page=50`,
    )
    const row = clients.clients.find(
      (c: { email: string | null }) => c.email === TARIQ.email,
    )
    tariqClientId = row.id
  })

  test('the coach proposes an outcome from the cockpit', async ({ page }) => {
    await login(page, USERS.marcus.email)
    await page.goto(`/sandboxes/${sandboxId}#outcomes`)
    const panel = page.getByTestId('outcomes-panel')
    await expect(panel).toBeVisible()
    await expect(panel).toContainText('0 of 1 gold sealed')
    // Marcus coaches one group, so Wren is not his to see
    await expect(panel).not.toContainText(WREN.name)

    const block = tariqBlock(page)
    await expect(block.getByTestId('coachee-outcome-state')).toHaveAttribute(
      'data-state',
      'none',
    )
    await expect(block.getByTestId('outcome-approver')).toContainText(
      `Approver: ${USERS.dana.name}`,
    )
    await block.getByTestId('outcome-add').click()
    const dialog = page.getByTestId('outcome-dialog')
    await expect(dialog).toContainText(
      `Goes to ${USERS.dana.name} for the gold seal`,
    )
    await dialog.getByTestId('outcome-title').fill('Lead the Q4 launch calmly')
    await dialog
      .getByTestId('outcome-measure')
      .fill('Launch ships by 15 Nov with zero escalations to the VP.')
    await dialog.getByTestId('outcome-propose').click()
    await expect(dialog).toBeHidden()

    const row = block.getByTestId('outcome-row')
    await expect(row).toHaveCount(1)
    await expect(row.getByTestId('outcome-status')).toHaveAttribute(
      'data-status',
      'proposed',
    )
    await expect(row).toContainText(`Proposed by ${USERS.marcus.name}`)
    await expect(block.getByTestId('coachee-outcome-state')).toHaveAttribute(
      'data-state',
      'proposed',
    )
    // no approver buttons for the coach
    await expect(row.getByTestId('outcome-seal')).toHaveCount(0)
    await expect(panel.getByTestId('outcomes-summary')).toContainText(
      '1 waiting',
    )
  })

  test('the approver sees it waiting on the dashboard and gold seals it', async ({
    page,
  }) => {
    await login(page, USERS.dana.email)
    await page.goto('/sandboxes')
    await expect(page.getByTestId('stat-outcomes')).toContainText('1')
    const attn = page
      .getByTestId('attention-row')
      .filter({ hasText: TARIQ.name })
      .filter({ hasText: 'gold seal' })
    await expect(attn).toBeVisible()
    await expect(attn).toHaveAttribute('data-kind', 'outcome_awaiting_approval')
    await attn.click()
    await expect(page).toHaveURL(
      new RegExp(`/sandboxes/${sandboxId}#outcomes$`),
    )

    const block = tariqBlock(page)
    const row = block.getByTestId('outcome-row')
    await expect(row.getByTestId('outcome-seal')).toBeVisible()
    await expect(row.getByTestId('outcome-add')).toHaveCount(0)
    await row.getByTestId('outcome-seal').click()
    const dialog = page.getByTestId('decision-dialog')
    await expect(dialog).toContainText('Gold seal this outcome?')
    await dialog
      .getByTestId('decision-note')
      .fill('Looking forward to this one.')
    await dialog.getByTestId('decision-confirm').click()
    await expect(dialog).toBeHidden()
    await expect(row.getByTestId('outcome-status')).toHaveAttribute(
      'data-status',
      'sealed',
    )
    await expect(row).toContainText(`Gold sealed by ${USERS.dana.name}`)
    await expect(block.getByTestId('coachee-outcome-state')).toHaveAttribute(
      'data-state',
      'sealed',
    )
    await expect(page.getByTestId('outcomes-summary')).toContainText(
      '1 of 1 gold sealed',
    )
    // a supervisor cannot reopen
    await expect(row.getByTestId('outcome-reopen')).toHaveCount(0)
  })

  test('the coach is told through the bell and sees it on the client profile', async ({
    page,
  }) => {
    await login(page, USERS.marcus.email)
    const bell = page.getByTestId('notification-bell').first()
    await expect(bell.getByTestId('notification-badge')).toContainText('1')
    await bell.click()
    const popover = page.getByTestId('notification-popover')
    const item = popover
      .getByTestId('notification-item')
      .filter({ hasText: 'gold sealed' })
    await expect(item).toBeVisible()
    await expect(item).toHaveAttribute('data-read', 'false')
    await item.click()
    await expect(page).toHaveURL(
      new RegExp(`/sandboxes/${sandboxId}#outcomes$`),
    )
    await expect(page.getByTestId('outcomes-panel')).toBeVisible()
    await expect(
      page
        .getByTestId('notification-bell')
        .first()
        .getByTestId('notification-badge'),
    ).toHaveCount(0)

    await page.goto(`/clients/${tariqClientId}`)
    const card = page.getByTestId('sandbox-context-card')
    await expect(card).toBeVisible()
    const blockOnCard = card.getByTestId('outcomes-block')
    await expect(
      blockOnCard.getByTestId('coachee-outcome-state'),
    ).toHaveAttribute('data-state', 'sealed')
    await expect(blockOnCard.getByTestId('outcome-row')).toHaveCount(1)
    // one of two slots is used, so the coach may still add a second
    await expect(blockOnCard.getByTestId('outcome-add')).toBeVisible()
  })

  test('changes requested go back to the coach with the reason', async ({
    page,
    request,
  }) => {
    // Marcus drafts a second outcome and proposes it
    const marcus = await apiToken(request, USERS.marcus.email)
    const second = await api(
      request,
      marcus,
      'post',
      `/sandboxes/${sandboxId}/outcomes`,
      {
        member_id: tariqMemberId,
        title: 'Run the weekly review',
        measure: null,
        propose: true,
      },
    )
    expect(second.status).toBe('proposed')

    await login(page, USERS.dana.email)
    await page.goto(`/sandboxes/${sandboxId}#outcomes`)
    const row = tariqBlock(page)
      .getByTestId('outcome-row')
      .filter({ hasText: 'Run the weekly review' })
    await row.getByTestId('outcome-changes').click()
    const dialog = page.getByTestId('decision-dialog')
    await expect(dialog).toContainText('Request changes')
    // the reason is required
    await expect(dialog.getByTestId('decision-confirm')).toBeDisabled()
    await dialog
      .getByTestId('decision-note')
      .fill('Make it measurable — how many reviews, by when?')
    await dialog.getByTestId('decision-confirm').click()
    await expect(dialog).toBeHidden()
    await expect(row.getByTestId('outcome-status')).toHaveAttribute(
      'data-status',
      'changes_requested',
    )
    await expect(row.getByTestId('outcome-note')).toContainText(
      'how many reviews, by when?',
    )
    // the coachee block still reads as sealed (the first outcome is)
    await expect(
      tariqBlock(page).getByTestId('coachee-outcome-state'),
    ).toHaveAttribute('data-state', 'sealed')
  })

  test('the coach edits the sent-back outcome and proposes it again', async ({
    page,
  }) => {
    await login(page, USERS.marcus.email)
    await page.goto('/sandboxes')
    const attn = page
      .getByTestId('attention-row')
      .filter({ hasText: `Changes requested on ${TARIQ.name}` })
    await expect(attn).toHaveAttribute('data-kind', 'outcome_changes_requested')
    await expect(attn).toContainText('how many reviews, by when?')
    await page.goto(`/sandboxes/${sandboxId}#outcomes`)
    const mine = tariqBlock(page)
      .getByTestId('outcome-row')
      .filter({ hasText: 'Run the weekly review' })
    await mine.getByTestId('outcome-edit').click()
    const edit = page.getByTestId('outcome-dialog')
    await expect(edit).toContainText('Edit outcome')
    await edit
      .getByTestId('outcome-measure')
      .fill('Every Friday from October; twelve reviews by the end of the term.')
    await edit.getByTestId('outcome-propose').click()
    await expect(edit).toBeHidden()
    await expect(mine.getByTestId('outcome-status')).toHaveAttribute(
      'data-status',
      'proposed',
    )
    await expect(mine).toContainText('twelve reviews')
    // the limit is two per coachee — no third slot
    await expect(tariqBlock(page).getByTestId('outcome-add')).toHaveCount(0)
  })

  test('the account executive can reopen a sealed outcome with a reason', async ({
    page,
  }) => {
    await login(page, USERS.admin.email)
    await page.goto(`/sandboxes/${sandboxId}#outcomes`)
    const panel = page.getByTestId('outcomes-panel')
    // the admin sees both groups
    await expect(panel.getByTestId('outcome-coachee')).toHaveCount(2)
    const row = tariqBlock(page)
      .getByTestId('outcome-row')
      .filter({ hasText: 'Lead the Q4 launch calmly' })
    await row.getByTestId('outcome-reopen').click()
    const dialog = page.getByTestId('reopen-dialog')
    await expect(dialog.getByTestId('reopen-confirm')).toBeDisabled()
    await dialog
      .getByTestId('reopen-reason')
      .fill('The launch moved to next year — the outcome needs a new date.')
    await dialog.getByTestId('reopen-confirm').click()
    await expect(dialog).toBeHidden()
    await expect(row.getByTestId('outcome-status')).toHaveAttribute(
      'data-status',
      'changes_requested',
    )
    await expect(row.getByTestId('outcome-note')).toContainText(
      'moved to next year',
    )
    await expect(
      tariqBlock(page).getByTestId('coachee-outcome-state'),
    ).toHaveAttribute('data-state', 'proposed')
  })

  test('the coachee proposes their own outcome and sees it on the portal', async ({
    page,
    request,
  }) => {
    const token = await apiToken(request, USERS.admin.email)
    const overview = await api(
      request,
      token,
      'get',
      `/sandboxes/${sandboxId}/overview`,
    )
    const wren = overview.members.find(
      (m: { email: string }) => m.email === WREN.email,
    )
    await api(request, token, 'post', `/sandboxes/${sandboxId}/invitations`, {
      member_ids: [wren.id],
    })
    const accept = await request.post(
      `${API}/sandbox-invitations/accept-signup`,
      {
        data: {
          token: invitationToken(WREN.email).token,
          password: 'Password123!',
          full_name: WREN.name,
        },
      },
    )
    expect(accept.ok()).toBeTruthy()

    await login(page, WREN.email)
    await page.goto('/client-portal/dashboard')
    const note = page.getByTestId('sandbox-note')
    await expect(note).toBeVisible()
    const block = note.getByTestId('outcomes-block')
    await expect(block.getByTestId('coachee-outcome-state')).toHaveAttribute(
      'data-state',
      'none',
    )
    await expect(block.getByTestId('outcome-approver')).toContainText(
      USERS.omar.name,
    )
    await block.getByTestId('outcome-add').click()
    const dialog = page.getByTestId('outcome-dialog')
    await dialog
      .getByTestId('outcome-title')
      .fill('Say no to one meeting a week')
    await dialog.getByTestId('outcome-save').click()
    await expect(dialog).toBeHidden()
    const row = block.getByTestId('outcome-row')
    await expect(row.getByTestId('outcome-status')).toHaveAttribute(
      'data-status',
      'draft',
    )
    await row.getByTestId('outcome-propose-row').click()
    await expect(row.getByTestId('outcome-status')).toHaveAttribute(
      'data-status',
      'proposed',
    )
    await expect(block.getByTestId('coachee-outcome-state')).toHaveAttribute(
      'data-state',
      'proposed',
    )
    // the portal header has the bell too
    await expect(page.getByTestId('notification-bell').first()).toBeVisible()
  })

  test('the primary client admin approves from the minimal chrome', async ({
    page,
  }) => {
    await login(page, USERS.omar.email)
    await page.goto('/sandboxes')
    await expect(page.getByTestId('sandbox-dashboard')).toHaveAttribute(
      'data-persona',
      'client_side',
    )
    // Wren's proposal and Tariq's re-proposed outcome both wait on the client side
    await expect(page.getByTestId('stat-outcomes')).toContainText('2')
    await page.goto(`/sandboxes/${sandboxId}#outcomes`)
    await expect(page.getByTestId('sandbox-view')).toHaveAttribute(
      'data-audience',
      'theirs',
    )
    const wren = page
      .getByTestId('outcome-coachee')
      .filter({ hasText: WREN.name })
    const row = wren.getByTestId('outcome-row')
    await row.getByTestId('outcome-seal').click()
    await page.getByTestId('decision-confirm').click()
    await expect(row.getByTestId('outcome-status')).toHaveAttribute(
      'data-status',
      'sealed',
    )
    // the bell in the minimal header shows the earlier proposal
    const bell = page.getByTestId('notification-bell').first()
    await bell.click()
    await expect(
      page.getByTestId('notification-item').filter({ hasText: WREN.name }),
    ).toBeVisible()
    await page.getByTestId('notifications-read-all').click()
    await expect(bell.getByTestId('notification-badge')).toHaveCount(0)
  })
})
