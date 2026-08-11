import { RichTextEditor } from 'coach-sidekick'

// No heading tags: the app CSS has no typography plugin and the toolbar offers
// no heading control, so <h3> renders identically to a paragraph. Bold title
// line instead — the formatting the toolbar can actually produce.
const sessionNotes = `
<p><strong>Session recap — Maya Chen, Jul 15</strong></p>
<p>Maya came in <strong>energized</strong> after presenting the Q3 vision to her board. We spent most of the hour on <em>delegation</em> — she is still reviewing every deliverable her directs produce.</p>
<ul>
  <li>Hand the launch retro to Priya end-to-end</li>
  <li>Block two <u>deep-work mornings</u> per week</li>
  <li>Draft the succession one-pager before Aug 1</li>
</ul>
`

const prepChecklist = `
<p>Prep for tomorrow's session with <strong>Nadia Osei</strong>:</p>
<ol>
  <li>Review last week's commitments (2 of 3 complete)</li>
  <li>Revisit the stakeholder-map exercise</li>
  <li>Ask about the hiring conversation she was avoiding</li>
</ol>
`

export const SessionNotes = () => (
  <div className="w-full max-w-lg">
    <RichTextEditor content={sessionNotes} onChange={() => {}} />
  </div>
)

export const NumberedChecklist = () => (
  <div className="w-full max-w-lg">
    <RichTextEditor
      content={prepChecklist}
      onChange={() => {}}
      minHeight="90px"
    />
  </div>
)

export const EmptyWithPlaceholder = () => (
  <div className="w-full max-w-lg">
    <RichTextEditor
      onChange={() => {}}
      placeholder="Add your prep notes for this session…"
      minHeight="90px"
    />
  </div>
)

export const Disabled = () => (
  <div className="w-full max-w-lg">
    <RichTextEditor
      content="<p>Notes are locked while the AI summary is being generated.</p>"
      disabled
      minHeight="60px"
    />
  </div>
)
