import { ChatMarkdown } from 'coach-sidekick'

const sessionSummary = `## Session summary — Maya Chen

Maya arrived focused on **delegating the Q3 roadmap review**. She named the
fear underneath holding on to it — being seen as replaceable — and reframed
being needed as *a signal to develop others*.

### Key moments

- Named the fear behind keeping the roadmap review
- Committed to a skip-level 1:1 before the offsite
- Asked for direct feedback on her board narrative

### Commitments

| Commitment | Due |
| --- | --- |
| Hand off roadmap review to Dana | Jul 22 |
| Block two deep-work mornings | Jul 25 |
`

export const SessionSummary = () => (
  <div className="w-full max-w-md">
    <ChatMarkdown content={sessionSummary} />
  </div>
)

const coachingReply = `Here's what stood out from the transcript:

1. Maya's energy shifted when the conversation moved to her team's growth
2. She used ownership language — "I built this bottleneck" — without prompting

> "If I'm the only one who can run this review, I haven't built a team.
> I've built a dependency."

You might open the next session by asking what she noticed after the handoff.
`

export const AssistantReply = () => (
  <div className="w-full max-w-md rounded-lg border bg-surface-1 p-4">
    <ChatMarkdown content={coachingReply} />
  </div>
)
