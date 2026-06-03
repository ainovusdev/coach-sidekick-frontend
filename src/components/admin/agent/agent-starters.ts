import type { AgentApiScope } from '@/services/agent-service'

/**
 * Starter prompts and empty-state blurbs for the Sidekick Agent.
 *
 * Shared single source of truth: rendered in the agent's empty state and reused
 * by the "Ask Sidekick" header bar / dashboard cards. Scope-specific — an admin
 * asks across all coaches, a coach about their own clients, a client about
 * themselves. Each set is curated to showcase the agent's range: a quick count,
 * a chart, a qualitative transcript search, and a multi-step evaluation.
 */
export const STARTERS_BY_SCOPE: Record<AgentApiScope, string[]> = {
  admin: [
    'How many active coaches do we have right now?',
    'Plot coaching sessions per week over the last 3 months.',
    'Find the top 5 coaches by avg coaching scores, then quote a moment of strong coaching from each.',
    'Top 5 most common primary goals across all client personas.',
    'Find 3 examples in our transcripts where a coach helps a client reframe a stuck mindset.',
    'Compare average session length for 1-on-1 vs group sessions.',
  ],
  coach: [
    'How many sessions have I run in the last 3 months?',
    'Which of my clients have been most active lately?',
    'Plot my coaching sessions per week over the last 3 months.',
    'Summarize the main goals my clients are working toward.',
    'Find moments in my sessions where I helped a client reframe a stuck mindset.',
    'Which of my clients haven’t had a session in over a month?',
  ],
  client: [
    'How many coaching sessions have I had, by month?',
    'What are the main themes from my recent sessions?',
    'What goals am I currently working toward?',
    'Summarize the action items from my last session.',
    'Find a moment where my coach and I discussed a breakthrough.',
    'How has my engagement changed over time?',
  ],
}

export const EMPTY_STATE_BLURB: Record<AgentApiScope, string> = {
  admin:
    'See coaching trends across the team, which sessions stood out, and how individual coaches are performing.',
  coach:
    'Get a read on how your clients are progressing, the themes coming up across your sessions, and who might need a follow-up.',
  client:
    'Look back on what you covered last session, the goals you’re working toward, and the progress you’re making.',
}
