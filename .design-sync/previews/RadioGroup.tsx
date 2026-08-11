import { Label, RadioGroup, RadioGroupItem } from 'coach-sidekick'

export const SessionType = () => (
  <div className="max-w-sm space-y-3">
    <p className="text-sm font-medium text-ink">Session type</p>
    <RadioGroup defaultValue="one-on-one">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="one-on-one" id="radio-type-one-on-one" />
        <Label htmlFor="radio-type-one-on-one">1-on-1 coaching</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="group" id="radio-type-group" />
        <Label htmlFor="radio-type-group">Group session (Pod)</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="workshop" id="radio-type-workshop" />
        <Label htmlFor="radio-type-workshop">Workshop</Label>
      </div>
    </RadioGroup>
  </div>
)

export const WithDescriptions = () => (
  <div className="max-w-md space-y-3">
    <p className="text-sm font-medium text-ink">Note visibility</p>
    <RadioGroup defaultValue="shared">
      <div className="flex items-start gap-3">
        <RadioGroupItem
          value="private"
          id="radio-visibility-private"
          className="mt-0.5"
        />
        <div className="space-y-1">
          <Label htmlFor="radio-visibility-private">Private</Label>
          <p className="text-sm text-ink-3">Only you can see these notes.</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <RadioGroupItem
          value="shared"
          id="radio-visibility-shared"
          className="mt-0.5"
        />
        <div className="space-y-1">
          <Label htmlFor="radio-visibility-shared">Shared with client</Label>
          <p className="text-sm text-ink-3">
            The client sees these notes in their portal.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <RadioGroupItem
          value="team"
          id="radio-visibility-team"
          className="mt-0.5"
        />
        <div className="space-y-1">
          <Label htmlFor="radio-visibility-team">Team-visible</Label>
          <p className="text-sm text-ink-3">
            Coaches in your workspace can view and comment.
          </p>
        </div>
      </div>
    </RadioGroup>
  </div>
)

export const Horizontal = () => (
  <div className="space-y-3">
    <p className="text-sm font-medium text-ink">Session length</p>
    <RadioGroup defaultValue="45" className="flex gap-6">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="30" id="radio-length-30" />
        <Label htmlFor="radio-length-30">30 min</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="45" id="radio-length-45" />
        <Label htmlFor="radio-length-45">45 min</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="60" id="radio-length-60" />
        <Label htmlFor="radio-length-60">60 min</Label>
      </div>
    </RadioGroup>
  </div>
)

export const Disabled = () => (
  <div className="max-w-sm space-y-3">
    <p className="text-sm font-medium text-ink">
      Recording mode (set by workspace admin)
    </p>
    <RadioGroup defaultValue="audio-video" disabled>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="audio-video" id="radio-recording-av" />
        <Label htmlFor="radio-recording-av">Audio + video</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="audio-only" id="radio-recording-audio" />
        <Label htmlFor="radio-recording-audio">Audio only</Label>
      </div>
    </RadioGroup>
  </div>
)
