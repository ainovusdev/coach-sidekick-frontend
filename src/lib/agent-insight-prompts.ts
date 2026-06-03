/**
 * Prompt builders for passive insight cards (`<AgentInsight />`).
 *
 * The UI owns the prompt: each builder bakes today's date plus the relevant
 * coach/client/session identifiers into a single string. That both steers the
 * synthesis and makes the server's per-prompt cache key specific and
 * self-invalidating (the date rolls it daily). Keep the tone plain and
 * coach-outcome focused — these are read at a glance, not technical reports.
 */

// Shared style guardrails appended to every prompt so cards stay short, plain, and
// presentation-safe (the insight endpoint only keeps text, but this also stops the
// model wasting a turn trying to build a chart).
const BASE_STYLE =
  'Reply with only the final result — no preamble, and never narrate how you ' +
  'looked it up. Use plain, everyday language — no jargon, and no mention of ' +
  'databases, SQL, or transcripts. Do not build charts or reports, and do not ' +
  'comment on data quality, missing scores, or pipelines — just coach. If there ' +
  'is genuinely nothing on file yet, say so in one line.'

export interface NextSessionPrepArgs {
  clientName?: string | null
  clientId: string
  dateISO: string
}

// Shared sourcing instruction so the glance card and the deep drill-down stay
// in sync on WHAT to read and how to weight it (recency + the genuinely-next
// session), differing only in output shape.
function prepSources(who: string): string {
  return [
    `First identify our genuinely next session — the soonest scheduled session; if every scheduled session is in the past, use the most recent one.`,
    `Then pull, for ${who} only: their open (not-yet-completed) commitments;`,
    "their most recent post-session “Thrill Form” answers (questionnaire_responses, kind='post_session');",
    "the pre-session questionnaire for that upcoming session (kind='pre_session');",
    'and the recurring themes from our recent conversations.',
    'Weight the most recent session and the upcoming one most heavily — only raise older commitments or themes if they are clearly still live.',
  ].join(' ')
}

/**
 * Coach-facing "prepare for the next session" glance. Pulls the time-sensitive
 * sources (open commitments, latest Thrill Form, upcoming pre-session
 * questionnaire, recent themes), weights recent/next heaviest, and returns a
 * fixed, scannable Open with / Follow up on / Watch for structure with the
 * source attributed inline.
 */
export function nextSessionPrepPrompt({
  clientName,
  clientId,
  dateISO,
}: NextSessionPrepArgs): string {
  const who = clientName
    ? `my client ${clientName} (id ${clientId})`
    : `the client with id ${clientId}`
  return [
    `Today is ${dateISO}. Help me prepare to coach ${who} for our next session.`,
    prepSources(who),
    'Respond in exactly these three short markdown sections, attributing facts in parentheses (e.g. “(May 29 Thrill Form)”):',
    '**Open with** — one specific opening line or question to start the session.',
    '**Follow up on** — 1–3 concrete things to revisit (a commitment, something they asked for or flagged).',
    '**Watch for** — 1–2 patterns or risks to keep an eye on (disengagement, a contradiction, a recurring avoidance).',
    BASE_STYLE,
    'Keep the whole thing under ~130 words.',
  ].join(' ')
}

/**
 * Fuller version of the prep, used by the card's "Open full prep" drill-down —
 * it seeds the agent modal, so it can run longer and invites follow-up chat.
 */
export function nextSessionPrepDeepPrompt({
  clientName,
  clientId,
  dateISO,
}: NextSessionPrepArgs): string {
  const who = clientName
    ? `my client ${clientName} (id ${clientId})`
    : `the client with id ${clientId}`
  return [
    `Today is ${dateISO}. Give me a thorough prep brief to coach ${who} for our next session.`,
    prepSources(who),
    'Walk me through: where we left off, what is still unresolved, how they seem to be feeling, a suggested opening, and the 3–5 specific things to focus on — flagging which commitments are stalled vs. progressing. Attribute facts to their source.',
    BASE_STYLE,
    'End by inviting me to ask for more detail on any thread.',
  ].join(' ')
}

/**
 * Client-facing "Prepare for your next session" card for the client portal
 * dashboard — the client-side mirror of the coach's `nextSessionPrepPrompt`.
 *
 * RLS scopes the agent to the signed-in client, so no identifiers are needed.
 * Pulls the time-sensitive sources (next scheduled session, open commitments,
 * most recent session, anything flagged), weights recent/upcoming heaviest, and
 * returns a short, warm Bring this / Pick up on / Reflect before structure.
 */
export function clientNextSessionPrepPrompt({
  dateISO,
}: {
  dateISO: string
}): string {
  return [
    `Today is ${dateISO}. Help me get ready for my next coaching session.`,
    'Pull from my own data: my next scheduled session if there is one, the commitments I made that are still open, what we focused on in my most recent session, and anything I flagged or asked for last time. Weight my most recent session and the upcoming one most heavily.',
    'Respond in exactly these three short markdown sections, speaking to me directly as "you":',
    '**Bring this** — one specific win, moment, or example worth sharing with my coach.',
    '**Pick up on** — 1–2 open commitments or threads to follow through on or revisit.',
    '**Reflect before** — one question to sit with before we meet.',
    'Be specific and grounded in what I actually did or said — do not invent. If I have no upcoming session on file, say so kindly and still offer one helpful thing to reflect on.',
    BASE_STYLE,
    'Keep it warm and under ~120 words.',
  ].join(' ')
}

/**
 * Client-facing "Your progress" card. Currently unused (the card was removed
 * from the portal) but kept for easy re-add: a sourced, structured read over
 * the client's own goals, recent sessions, and open/completed commitments.
 */
export function clientProgressPrompt({ dateISO }: { dateISO: string }): string {
  return [
    `Today is ${dateISO}. Give me a warm, honest read on how my coaching is going.`,
    'Pull from my own data: my goals and how they are trending, what we focused on in my most recent sessions, the commitments I made (which I have completed and which are still open), and my next scheduled session if there is one. Weight my most recent session and anything coming up most heavily.',
    'Respond in exactly these three short markdown sections, speaking to me directly as "you":',
    '**Your momentum** — one or two genuine signs of progress toward my goals, grounded in something specific I did or said recently.',
    '**Keep going on** — 1–2 open commitments or in-progress things to stay with (encouraging, not nagging).',
    '**Before next time** — one helpful thing to reflect on or notice before my next session.',
    'Be specific and real — celebrate actual progress, but do not invent wins. If there is genuinely little to go on yet, say so kindly and point me at one small next step.',
    BASE_STYLE,
    'Keep the whole thing warm and under ~130 words.',
  ].join(' ')
}
