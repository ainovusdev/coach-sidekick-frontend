import { Label, Textarea } from 'coach-sidekick'

export const Default = () => (
  <div className="max-w-md">
    <Textarea placeholder="Add your session notes..." />
  </div>
)

export const WithLabel = () => (
  <div className="max-w-md space-y-2">
    <Label htmlFor="textarea-prep-notes">Prep notes</Label>
    <Textarea
      id="textarea-prep-notes"
      defaultValue="Maya wants to revisit the delegation commitments from last week. Check in on the board presentation prep and the two deep-work mornings she blocked."
      rows={4}
    />
    <p className="text-sm text-ink-3">
      Visible to you only — not shared with the client.
    </p>
  </div>
)

export const Disabled = () => (
  <div className="max-w-md space-y-2">
    <Label htmlFor="textarea-summary">Session summary</Label>
    <Textarea
      id="textarea-summary"
      defaultValue="Summary is being generated from the transcript..."
      disabled
      rows={3}
    />
  </div>
)

export const WithError = () => (
  <div className="max-w-md space-y-2">
    <Label htmlFor="textarea-commitment">Commitment</Label>
    <Textarea
      id="textarea-commitment"
      placeholder="What will you commit to before the next session?"
      aria-invalid="true"
      rows={3}
    />
    <p className="text-sm text-vermillion">
      A commitment is required before closing the session.
    </p>
  </div>
)
